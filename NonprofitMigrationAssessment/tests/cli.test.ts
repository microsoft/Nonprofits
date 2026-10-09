import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { InventorySchema } from '../src/contracts.js';
import { assess } from '../src/engine.js';
import { createRuleReviewDraft } from '../src/rule-review.js';
import { DEFAULT_RULES } from '../src/routes.js';
import { writeLocalBundle } from '../src/storage.js';
import { inventory, NOW } from './fixtures.js';
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
	assert.ok((await readFile(join(output, 'rules-review.json'), 'utf8')).includes('provisional-typical'));
	assert.ok((await readFile(join(output, 'rules-review.schema.json'), 'utf8')).includes('reviewedAt'));
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
	const report = JSON.parse(await readFile(join(output, 'assessment.json'), 'utf8')) as {
		status: string;
		workItems: { estimateType: string | null }[];
		combined: { id: string; total: unknown }[];
	};
	assert.equal(report.status, 'complete');
	assert.ok(report.combined.filter(item => item.id !== 'adverse-unscoped').every(item => item.total !== null));
	assert.equal(report.combined.find(item => item.id === 'adverse-unscoped')!.total, null);
	assert.ok(report.workItems.every(item => item.estimateType === 'uncalibrated-assumption'));
	const markdown = await readFile(join(output, 'assessment.md'), 'utf8');
	assert.ok(markdown.includes('## What is installed and what should you do?'));
	assert.ok(markdown.includes('## Environment details'));
	assert.ok(markdown.includes('Unavailable'));
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

test('finalize-rules converts only a completed local expert review', async t => {
	const root = await mkdtemp(join(tmpdir(), 'nma-rules-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const draft = createRuleReviewDraft();
	draft.version = 'synthetic-reviewed-v1';
	for (const rate of draft.rates) {
		rate.effort = { min: 1, max: 2, unit: 'person-hours' };
		rate.elapsed = { min: 1, max: 2, unit: 'hours' };
		rate.execution = rate.workId.endsWith('.production')
			? { min: 0.5, max: 1, unit: 'hours' }
			: null;
		rate.downtime = rate.workId.endsWith('.production')
			? { min: 0, max: 0.5, unit: 'hours' }
			: null;
		rate.basis = 'Synthetic CLI fixture only.';
		rate.limitations = ['Not a migration estimate.'];
		rate.reviewer = 'Synthetic Reviewer';
		rate.reviewedAt = '2026-09-29T12:00:00.000Z';
	}
	const input = join(root, 'rules-review.json');
	await writeFile(input, JSON.stringify(draft));
	const output = join(root, 'reviewed');
	const run = spawnSync(process.execPath, [
		CLI, 'finalize-rules', '--input', input, '--output', output,
	], { encoding: 'utf8' });
	assert.equal(run.status, 0, run.stderr);
	const rules = JSON.parse(await readFile(join(output, 'rules.json'), 'utf8')) as {
		status: string;
		rates: { reviewer: string }[];
	};
	assert.equal(rules.status, 'reviewed');
	assert.equal(rules.rates.length, 102);
	assert.ok(rules.rates.every(rate => rate.reviewer === 'Synthetic Reviewer'));
});

test('calibrate writes a local estimate-versus-rehearsal comparison', async t => {
	const root = await mkdtemp(join(tmpdir(), 'nma-calibrate-'));
	t.after(() => rm(root, { recursive: true, force: true }));
	const assessment = assess(inventory(['cdm']), DEFAULT_RULES, { now: NOW });
	const assessmentPath = join(root, 'assessment.json');
	const rehearsalPath = join(root, 'rehearsal.json');
	await writeFile(assessmentPath, JSON.stringify(assessment));
	await writeFile(rehearsalPath, JSON.stringify({
		assessmentId: assessment.assessmentId,
		scenario: 'assessed',
		observedAt: NOW.toISOString(),
		effort: { value: 60, unit: 'person-hours' },
		elapsed: { value: 100, unit: 'hours' },
		execution: { value: 3, unit: 'hours' },
		downtime: { value: 1, unit: 'hours' },
		notes: 'Synthetic CLI calibration fixture.',
	}));
	const output = join(root, 'calibration');
	const run = spawnSync(process.execPath, [
		CLI, 'calibrate', '--input', assessmentPath, '--rehearsal', rehearsalPath, '--output', output,
	], { encoding: 'utf8' });
	assert.equal(run.status, 0, run.stderr);
	assert.ok(run.stdout.includes('Local calibration written'));
	assert.ok((await readFile(join(output, 'calibration.md'), 'utf8')).includes('| effort | 46-92 person-hours | 60 | within |'));
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
});

test('template roundtrip does not loosen strict inventory validation', () => {
	assert.deepEqual(InventorySchema.parse(inventory()), inventory());
});
