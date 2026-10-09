import assert from 'node:assert/strict';
import test from 'node:test';
import { assess } from '../src/engine.js';
import { applyLocalReview } from '../src/review.js';
import { renderMarkdown } from '../src/report.js';
import { DEFAULT_RULES } from '../src/routes.js';
import { inventory, NOW } from './fixtures.js';

function review(overrides: Record<string, unknown> = {}) {
	return {
		customization: 'none',
		integrations: 'none',
		ownerAvailability: 'available',
		sandboxAndTests: 'ready',
		maxInterruptionHours: 2,
		reviewedAt: NOW.toISOString(),
		...overrides,
	};
}

test('short local review records operational readiness without inventing custom work', () => {
	const input = inventory(['cdm', 'vm']);
	input.questionnaire.answers.find(answer => answer.family === 'cdm')!.intent = 'confirm-alignment';
	input.discovery.solutions.find(solution => solution.uniqueName === 'NonprofitCore')!.version = '3.1.3.4';
	input.questionnaire.target.solutions.find(solution => solution.uniqueName === 'NonprofitCore')!.version = '3.1.3.4';
	const reviewed = applyLocalReview(input, review());
	assert.deepEqual(reviewed.questionnaire.operations, {
		ownerAvailability: 'available',
		sandboxAndTests: 'ready',
		maxInterruptionHours: 2,
		reviewedAt: NOW.toISOString(),
	});
	assert.equal(reviewed.questionnaire.work.length, 0);
	const result = assess(reviewed, DEFAULT_RULES, { now: NOW });
	assert.equal(result.routes.find(route => route.family === 'cdm')!.status, 'already-at-target');
	assert.deepEqual(result.combined.find(item => item.id === 'assessed')!.total,
		{ min: 96, max: 192, unit: 'person-hours' });
	assert.ok(renderMarkdown(result).includes('may exceed the stated interruption limit'));
});

test('bounded review creates scoped heavy remediation and a complete assumed range', () => {
	const input = inventory(['cdm', 'vm']);
	input.questionnaire.answers.find(answer => answer.family === 'cdm')!.intent = 'confirm-alignment';
	input.discovery.solutions.find(solution => solution.uniqueName === 'NonprofitCore')!.version = '3.1.3.4';
	input.questionnaire.target.solutions.find(solution => solution.uniqueName === 'NonprofitCore')!.version = '3.1.3.4';
	const reviewed = applyLocalReview(input, review({
		customization: 'bounded',
		integrations: 'bounded',
		sandboxAndTests: 'partial',
	}));
	assert.deepEqual(reviewed.questionnaire.work.map(item => [item.id, item.families, item.impact]), [
		['review.customization', ['vm'], 'bounded'],
		['review.integration', ['vm'], 'bounded'],
	]);
	const result = assess(reviewed, DEFAULT_RULES, { now: NOW });
	assert.equal(result.routes.find(route => route.family === 'vm')!.complexity.level, 'heavy');
	assert.ok(result.combined.find(item => item.id === 'assessed')!.total);
});

test('bounded migration review does not create remediation for alignment-only products', () => {
	const input = inventory(['cdm', 'vm']);
	input.questionnaire.answers.find(answer => answer.family === 'cdm')!.intent = 'confirm-alignment';
	input.discovery.solutions.find(solution => solution.uniqueName === 'NonprofitCore')!.version = '3.1.3.4';
	input.questionnaire.target.solutions.find(solution => solution.uniqueName === 'NonprofitCore')!.version = '3.1.3.4';
	const reviewed = applyLocalReview(input, review({ customization: 'bounded' }));
	assert.deepEqual(reviewed.questionnaire.work[0]!.families, ['vm']);
	const result = assess(reviewed, DEFAULT_RULES, { now: NOW });
	assert.equal(result.findings.some(item => item.id === 'cdm.customization-unscoped'), false);
});

test('opaque or ownerless work remains unbounded', () => {
	const input = inventory(['vm']);
	const reviewed = applyLocalReview(input, review({
		customization: 'bounded',
		ownerAvailability: 'unavailable',
	}));
	assert.equal(reviewed.questionnaire.work[0]!.impact, 'unbounded');
	const result = assess(reviewed, DEFAULT_RULES, { now: NOW });
	assert.equal(result.combined.find(item => item.id === 'assessed')!.total, null);
	assert.equal(result.routes[0]!.complexity.level, 'unbounded');
});

test('conditional VE review records only safe planning categories', () => {
	const input = inventory(['cdm', 'vm', 've']);
	const reviewed = applyLocalReview(input, review({
		ve: {
			source: 'legacy',
			authenticationProviders: 'multiple',
			languages: 3,
			customJourneys: 'present',
		},
	}));
	const ve = reviewed.questionnaire.answers.find(answer => answer.family === 've')!;
	assert.equal(ve.veSource, 'legacy');
	assert.equal(ve.veAuthenticationProviders, 'multiple');
	assert.equal(ve.veLanguages, 3);
	assert.equal(ve.veCustomJourneys, 'present');
	assert.deepEqual(reviewed.questionnaire.work.map(item => item.id),
		['review.ve-journeys', 'review.ve-configuration']);
	const result = assess(reviewed, DEFAULT_RULES, { now: NOW });
	assert.equal(result.routes.find(route => route.family === 've')!.complexity.level, 'heavy');
	assert.ok(result.routes.find(route => route.family === 've')!
		.scenarios.find(item => item.id === 'assessed')!.total);
});
