import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { FAMILIES } from '../src/contracts.js';
import { assess } from '../src/engine.js';
import { resolvePublicTarget, verifyPublicTarget } from '../src/target.js';
import { inventory, NOW, rules } from './fixtures.js';
import { createPublicRepository } from './repository-fixture.js';

const LOCAL_TARGET = { refreshRemote: false } as const;
const LOCAL_TEST_TARGET = { allowLocalRevision: true, refreshRemote: false } as const;

function git(repository: string, args: string[]): void {
	const result = spawnSync('git', ['-C', repository, ...args], { encoding: 'utf8', windowsHide: true });
	assert.equal(result.status, 0, result.stderr);
}

test('public target is derived from pinned manifests and guides', async t => {
	const root = await mkdtemp(join(tmpdir(), 'nma-target-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const repository = await createPublicRepository(root);
	const target = await resolvePublicTarget(repository.path, undefined, LOCAL_TARGET);
	assert.equal(target.repository, 'https://github.com/microsoft/Nonprofits');
	assert.equal(target.source, 'pinned-public-git-checkout');
	assert.equal(target.commit, repository.commit);
	assert.equal(target.files.length, 9);
	assert.equal(target.solutions.length, 5);
	assert.deepEqual(target.solutions.map(item => [item.uniqueName, item.version]), [
		['NonprofitCore', '3.1.3.4'],
		['SocialImpactFundraising', '1.0.3.1'],
		['SocialImpactGrants', '1.0.3.1'],
		['SocialImpactOutcomes', '1.0.3.1'],
		['volunteermanagementos', '1.1.3.0'],
	]);
	assert.ok(target.files.every(item => /^[a-f0-9]{64}$/.test(item.sha256)));
});

test('target verification rejects changed provenance and accepts a historical pinned commit', async t => {
	const root = await mkdtemp(join(tmpdir(), 'nma-target-pin-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const repository = await createPublicRepository(root);
	await verifyPublicTarget(repository.path, repository.target, LOCAL_TARGET);
	const changed = structuredClone(repository.target);
	changed.files[0]!.sha256 = 'b'.repeat(64);
	await assert.rejects(() => verifyPublicTarget(repository.path, changed, LOCAL_TARGET));
	await writeFile(join(repository.path, 'Documents', 'ppac-to-github-migration.md'), '# New guide revision\n');
	git(repository.path, ['add', '.']);
	git(repository.path, ['-c', 'user.name=Synthetic Test', '-c', 'user.email=test@example.invalid',
		'commit', '-m', 'Change guide']);
	await verifyPublicTarget(repository.path, repository.target, LOCAL_TARGET);
});

test('production target rejects an unpushed local commit unless test mode is explicit', async t => {
	const root = await mkdtemp(join(tmpdir(), 'nma-target-reachability-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const repository = await createPublicRepository(root);
	await writeFile(join(repository.path, 'Documents', 'ppac-to-github-migration.md'), '# Local-only revision\n');
	git(repository.path, ['add', '.']);
	git(repository.path, ['-c', 'user.name=Synthetic Test', '-c', 'user.email=test@example.invalid',
		'commit', '-m', 'Local-only revision']);
	await assert.rejects(() => resolvePublicTarget(repository.path, 'HEAD', LOCAL_TARGET), /reachable/);
	const local = await resolvePublicTarget(repository.path, 'HEAD', LOCAL_TEST_TARGET);
	assert.notEqual(local.commit, repository.commit);
});

test('wrong origin and dirty checkout fail closed', async t => {
	const root = await mkdtemp(join(tmpdir(), 'nma-target-refusal-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const repository = await createPublicRepository(root);
	git(repository.path, ['remote', 'set-url', 'origin', 'https://github.com/example/NotNonprofits.git']);
	await assert.rejects(() => resolvePublicTarget(repository.path));
	git(repository.path, ['remote', 'set-url', 'origin', 'https://github.com/microsoft/Nonprofits.git']);
	await writeFile(join(repository.path, 'untracked.txt'), 'dirty');
	await assert.rejects(() => resolvePublicTarget(repository.path));
});

test('future higher GitHub manifest versions remove version-order blockers', async t => {
	const root = await mkdtemp(join(tmpdir(), 'nma-target-future-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const repository = await createPublicRepository(root, {
		NonprofitCore: '3.1.3.5',
		SocialImpactFundraising: '1.0.3.4',
		SocialImpactGrants: '1.0.3.4',
		SocialImpactOutcomes: '1.0.3.4',
		volunteermanagementos: '1.2.3.4',
	});
	const input = inventory([...FAMILIES]);
	input.questionnaire.target = repository.target;
	const installedVersions = new Map([
		['NonprofitCore', '3.1.3.4'],
		['SocialImpactFundraising', '1.0.3.3'],
		['SocialImpactGrants', '1.0.3.3'],
		['SocialImpactOutcomes', '1.0.3.3'],
		['VolunteerManagement', '1.2.3.3'],
	]);
	for (const solution of input.discovery.solutions) {
		solution.version = installedVersions.get(solution.uniqueName) ?? solution.version;
	}

	const result = assess(input, rules(), { now: NOW });

	assert.equal(result.findings.some(item => item.code === 'target-version'), false);
	assert.equal(result.routes.every(route => route.status === 'eligible'), true);
});
