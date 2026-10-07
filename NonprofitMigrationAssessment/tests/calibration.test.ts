import assert from 'node:assert/strict';
import test from 'node:test';
import { calibrateAssessment, renderCalibrationMarkdown } from '../src/calibration.js';
import { assess } from '../src/engine.js';
import { DEFAULT_RULES } from '../src/routes.js';
import { inventory, NOW } from './fixtures.js';

test('calibration compares observed rehearsal values with assessed ranges', () => {
	const assessment = assess(inventory(['cdm']), DEFAULT_RULES, { now: NOW });
	const result = calibrateAssessment(assessment, {
		assessmentId: assessment.assessmentId,
		scenario: 'assessed',
		observedAt: NOW.toISOString(),
		effort: { value: 60, unit: 'person-hours' },
		elapsed: { value: 100, unit: 'hours' },
		execution: { value: 3, unit: 'hours' },
		downtime: { value: 1, unit: 'hours' },
		notes: 'Synthetic rehearsal only.',
	});
	assert.equal(result.comparisons.effort.status, 'within');
	assert.equal(result.comparisons.elapsed.status, 'within');
	assert.equal(result.comparisons.execution.status, 'within');
	assert.equal(result.comparisons.downtime.status, 'within');
	assert.ok(renderCalibrationMarkdown(result).includes('| effort | 46-92 person-hours | 60 | within |'));
});

test('calibration reports misses and unavailable metrics without changing estimates', () => {
	const assessment = assess(inventory(['cdm']), DEFAULT_RULES, { now: NOW });
	const result = calibrateAssessment(assessment, {
		assessmentId: assessment.assessmentId,
		scenario: 'adverse-unscoped',
		observedAt: NOW.toISOString(),
		effort: { value: 120, unit: 'person-hours' },
		elapsed: null,
		execution: null,
		downtime: null,
		notes: '',
	});
	assert.equal(result.comparisons.effort.status, 'not-comparable');
	assert.equal(result.comparisons.elapsed.status, 'not-observed');
	assert.throws(() => calibrateAssessment(assessment, {
		assessmentId: 'other',
		scenario: 'assessed',
		observedAt: NOW.toISOString(),
		effort: { value: 1, unit: 'person-hours' },
		elapsed: null,
		execution: null,
		downtime: null,
		notes: '',
	}), /identifier/);
});

test('calibration Markdown escapes untrusted local labels and notes', () => {
	const assessment = assess(inventory(['cdm']), DEFAULT_RULES, { now: NOW });
	const result = calibrateAssessment(assessment, {
		assessmentId: assessment.assessmentId,
		scenario: 'assessed',
		observedAt: NOW.toISOString(),
		effort: { value: 60, unit: 'person-hours' },
		elapsed: null,
		execution: null,
		downtime: null,
		notes: '<script>alert(1)</script> | unsafe',
	});
	const markdown = renderCalibrationMarkdown(result);
	assert.ok(!markdown.includes('<script>'));
	assert.ok(!markdown.includes('| unsafe'));
});
