import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { InventorySchema } from '../src/contracts.js';
import { writeLocalBundle, writeLocalFile } from '../src/storage.js';
import { inventory } from './fixtures.js';
import { createPublicRepository } from './repository-fixture.js';

const CLI = fileURLToPath(new URL('./cli-runner.js', import.meta.url));

test('init generates local draft/schema files without consent and refuses overwrite', async t => {
	const root = await mkdtemp(join(tmpdir(), 'nma-cli-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const repository = await createPublicRepository(root);
	const output = join(root, 'init');
	const run = spawnSync(process.execPath, [CLI, 'init', '--repository', repository.path, '--output', output], { encoding: 'utf8' });
	assert.equal(run.status, 0, run.stderr);
	const draft = JSON.parse(await readFile(join(output, 'questionnaire.json'), 'utf8')) as {
		consent: { readOnly: boolean };
		target: { commit: string; files: unknown[]; solutions: unknown[] };
	};
	assert.equal(draft.consent.readOnly, false);
	assert.equal(draft.target.commit, repository.commit);
	assert.equal(draft.target.files.length, 9);
	assert.equal(draft.target.solutions.length, 5);
	await assert.rejects(() => readFile(join(output, 'rules.json'), 'utf8'));
	assert.ok((await readFile(join(output, 'inventory.schema.json'), 'utf8')).includes('additionalProperties'));
	const repeat = spawnSync(process.execPath, [CLI, 'init', '--repository', repository.path, '--output', output], { encoding: 'utf8' });
	assert.equal(repeat.status, 1);
	assert.ok(repeat.stderr.includes('ASSESSMENT_FAILED'));
});

test('offline CLI produces both reports without emitting inventory or questionnaire values', async t => {
	const root = await mkdtemp(join(tmpdir(), 'nma-offline-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const repository = await createPublicRepository(root);
	const source = inventory();
	const now = new Date().toISOString();
	source.questionnaire.consent.confirmedAt = now;
	source.discovery.collectedAt = now;
	for (const item of source.discovery.evidence) {
		if (item.collectedAt !== null) {
			item.collectedAt = now;
		}
	}
	source.questionnaire.target = repository.target;
	source.questionnaire.answers[0]!.basis = 'CUSTOMER-QUESTIONNAIRE-CANARY';
	source.discovery.environment = {
		name: 'Customer Environment',
		dataverseVersion: '9.2.0.0',
	};
	const input = join(root, 'inventory.json');
	await writeFile(input, JSON.stringify(source));
	const output = join(root, 'report');
	const run = spawnSync(process.execPath, [
		CLI, 'assess', '--repository', repository.path, '--input', input, '--output', output,
	], { encoding: 'utf8' });
	assert.equal(run.status, 0, run.stderr);
	const prefix = 'Local assessment written: ';
	assert.equal(run.stdout.startsWith(prefix), true);
	assert.equal(await realpath(run.stdout.trim().slice(prefix.length)), await realpath(output));
	assert.ok(!`${run.stdout}${run.stderr}`.includes('CUSTOMER-QUESTIONNAIRE-CANARY'));
	const report = JSON.parse(await readFile(join(output, 'assessment-customer-environment.json'), 'utf8')) as {
		status: string;
		routes: { effortBand: string }[];
	};
	assert.equal(report.status, 'complete');
	assert.equal(report.routes[0]!.effortBand, 'low');
	const markdown = await readFile(join(output, 'assessment-customer-environment.md'), 'utf8');
	assert.ok(markdown.includes('## Supported nonprofit products and recommendations'));
	assert.ok(markdown.includes('## Executive decision'));
	assert.ok(markdown.includes('| Environment name | Customer Environment |'));
	assert.ok(markdown.includes('| URL | https://synthetic.crm.dynamics.com |'));
});

test('collection refuses non-TTY invocation before contacting an environment', async t => {
	const root = await mkdtemp(join(tmpdir(), 'nma-refusal-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const repository = await createPublicRepository(root);
	const path = join(root, 'questionnaire.json');
	const questionnaire = inventory().questionnaire;
	questionnaire.target = repository.target;
	await writeFile(path, JSON.stringify(questionnaire));
	const run = spawnSync(process.execPath, [
		CLI, 'collect', '--repository', repository.path, '--input', path, '--output', join(root, 'inventory'),
	], { encoding: 'utf8' });
	assert.equal(run.status, 1);
	assert.ok(run.stderr.includes('ASSESSMENT_FAILED'));
	assert.equal(run.stdout, '');
});

test('local configuration refuses non-TTY invocation', async t => {
	const root = await mkdtemp(join(tmpdir(), 'nma-configure-refusal-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const repository = await createPublicRepository(root);
	const path = join(root, 'questionnaire.json');
	const questionnaire = inventory().questionnaire;
	questionnaire.target = repository.target;
	await writeFile(path, JSON.stringify(questionnaire));
	const run = spawnSync(process.execPath, [
		CLI, 'configure', '--repository', repository.path, '--input', path, '--output', join(root, 'configured'),
	], { encoding: 'utf8' });
	assert.equal(run.status, 1);
	assert.ok(run.stderr.includes('ASSESSMENT_FAILED'));
	assert.equal(run.stdout, '');
});

test('local guided review refuses non-TTY invocation', async t => {
	const root = await mkdtemp(join(tmpdir(), 'nma-review-refusal-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const repository = await createPublicRepository(root);
	const source = inventory();
	source.questionnaire.target = repository.target;
	const input = join(root, 'inventory.json');
	await writeFile(input, JSON.stringify(source));
	const run = spawnSync(process.execPath, [
		CLI, 'review', '--repository', repository.path, '--input', input, '--output', join(root, 'reviewed'),
	], { encoding: 'utf8' });
	assert.equal(run.status, 1);
	assert.ok(run.stderr.includes('ASSESSMENT_FAILED'));
	assert.equal(run.stdout, '');
});

test('single-run customer workflow refuses non-TTY invocation before creating output', async t => {
	const root = await mkdtemp(join(tmpdir(), 'nma-run-refusal-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const repository = await createPublicRepository(root);
	const output = join(root, 'visible-output');
	const run = spawnSync(process.execPath, [
		CLI, 'run', '--repository', repository.path, '--output', output,
	], { encoding: 'utf8' });
	assert.equal(run.status, 1);
	assert.ok(run.stderr.includes('ASSESSMENT_FAILED'));
	await assert.rejects(() => realpath(output));
});

test('schema failure and invalid JSON never echo sensitive input', async t => {
	const root = await mkdtemp(join(tmpdir(), 'nma-invalid-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const repository = await createPublicRepository(root);
	const path = join(root, 'inventory.json');
	await writeFile(path, JSON.stringify({ ...inventory(), password: 'SECRET-CANARY' }));
	const run = spawnSync(process.execPath, [
		CLI, 'assess', '--repository', repository.path, '--input', path, '--output', join(root, 'report'),
	], { encoding: 'utf8' });
	assert.equal(run.status, 1);
	assert.ok(run.stderr.includes('INPUT_INVALID'));
	assert.ok(!`${run.stdout}${run.stderr}`.includes('SECRET-CANARY'));
	await writeFile(path, '{"SECRET-CANARY"');
	const invalid = spawnSync(process.execPath, [
		CLI, 'assess', '--repository', repository.path, '--input', path, '--output', join(root, 'report'),
	], { encoding: 'utf8' });
	assert.equal(invalid.status, 1);
	assert.ok(!invalid.stderr.includes('SECRET-CANARY'));
});

test('output refuses Git trees, relative paths, traversal names and collisions', async t => {
	const root = await mkdtemp(join(tmpdir(), 'nma-storage-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	await mkdir(join(root, '.git'));
	await assert.rejects(() => writeLocalBundle(join(root, 'report'), { 'report.md': 'test' }));
	await assert.rejects(() => writeLocalBundle('relative', { 'report.md': 'test' }));
	await rm(join(root, '.git'), { recursive: true });
	await assert.rejects(() => writeLocalBundle(join(root, 'report'), { '..': 'test' }));
	await writeLocalBundle(join(root, 'report'), { 'report.md': 'test' });
	await assert.rejects(() => writeLocalBundle(join(root, 'report'), { 'report.md': 'replacement' }));
	assert.equal(await readFile(join(root, 'report', 'report.md'), 'utf8'), 'test');
	const visible = join(root, 'nonprofit-assessment-synthetic-20260929.md');
	await writeLocalFile(visible, 'visible report');
	await assert.rejects(() => writeLocalFile(visible, 'replacement'));
	await assert.rejects(() => writeLocalFile(join(root, 'unsupported.txt'), 'test'));
	assert.equal(await readFile(visible, 'utf8'), 'visible report');
});

test('template roundtrip does not loosen strict inventory validation', () => {
	assert.deepEqual(InventorySchema.parse(inventory()), inventory());
});
