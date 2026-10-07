import assert from 'node:assert/strict';
import test from 'node:test';
import { assess } from '../src/engine.js';
import { renderMarkdown } from '../src/report.js';
import { applyLocalReview } from '../src/review.js';
import { DEFAULT_RULES } from '../src/routes.js';
import { inventory, NOW } from './fixtures.js';

const cleanReview = {
	customization: 'none',
	integrations: 'none',
	ownerAvailability: 'available',
	sandboxAndTests: 'ready',
	maxInterruptionHours: 4,
	reviewedAt: NOW.toISOString(),
} as const;

function alignCdm(input: ReturnType<typeof inventory>): void {
	const answer = input.questionnaire.answers.find(item => item.family === 'cdm')!;
	answer.intent = 'confirm-alignment';
	input.discovery.solutions.find(solution => solution.uniqueName === 'NonprofitCore')!.version = '3.1.3.4';
	input.questionnaire.target.solutions.find(solution => solution.uniqueName === 'NonprofitCore')!.version = '3.1.3.4';
}

test('representative standard scenario aligns CDM and estimates VM', () => {
	const input = inventory(['cdm', 'vm']);
	alignCdm(input);
	const result = assess(applyLocalReview(input, cleanReview), DEFAULT_RULES, { now: NOW });
	assert.equal(result.routes.find(route => route.family === 'cdm')!.status, 'already-at-target');
	assert.equal(result.routes.find(route => route.family === 'vm')!.status, 'eligible');
	assert.deepEqual(result.combined.find(item => item.id === 'assessed')!.total,
		{ min: 96, max: 192, unit: 'person-hours' });
});

test('representative bounded mixed scenario shares one remediation occurrence', () => {
	const input = inventory(['cdm', 'vm']);
	const reviewed = applyLocalReview(input, {
		...cleanReview,
		customization: 'bounded',
		integrations: 'bounded',
	});
	const result = assess(reviewed, DEFAULT_RULES, { now: NOW });
	assert.equal(result.workItems.filter(item => item.id === 'review.customization').length, 1);
	assert.equal(result.workItems.find(item => item.id === 'review.customization')!.families.length, 2);
	assert.ok(result.combined.find(item => item.id === 'assessed')!.total);
});

test('representative opaque scenario withholds the complete result', () => {
	const input = inventory(['cdm', 'vm']);
	const reviewed = applyLocalReview(input, {
		...cleanReview,
		customization: 'bounded',
		ownerAvailability: 'unavailable',
	});
	const result = assess(reviewed, DEFAULT_RULES, { now: NOW });
	assert.equal(result.combined.find(item => item.id === 'assessed')!.total, null);
	assert.ok(result.findings.some(item => item.code.startsWith('unbounded-')));
});

test('representative VE scenario scopes auth, language, and journey work', () => {
	const input = inventory(['cdm', 'vm', 've']);
	alignCdm(input);
	const reviewed = applyLocalReview(input, {
		...cleanReview,
		ve: {
			source: 'legacy',
			authenticationProviders: 'multiple',
			languages: 3,
			customJourneys: 'present',
		},
	});
	const result = assess(reviewed, DEFAULT_RULES, { now: NOW });
	assert.equal(result.routes.find(route => route.family === 've')!.complexity.level, 'heavy');
	assert.ok(result.workItems.some(item => item.id === 'review.ve-journeys'));
	assert.ok(result.workItems.some(item => item.id === 'review.ve-configuration'));
	assert.ok(result.routes.find(route => route.family === 've')!
		.scenarios.find(item => item.id === 'assessed')!.total);
});

test('representative denied-access scenario remains unknown rather than standard', () => {
	const input = inventory(['cdm']);
	const answer = input.questionnaire.answers[0]!;
	answer.compatibility = 'unknown';
	answer.customization = 'unknown';
	answer.dependencies = 'unknown';
	answer.integrations = 'unknown';
	answer.validation = 'unknown';
	input.discovery.evidence.push({
		id: 'components',
		source: 'observed',
		status: 'access-denied',
		collectedAt: NOW.toISOString(),
		collector: 'synthetic',
		scope: 'environment',
		inputs: [],
		reason: 'Synthetic constrained-account denial.',
	});
	const result = assess(input, DEFAULT_RULES, { now: NOW });
	assert.equal(result.routes[0]!.complexity.level, 'unknown');
	assert.equal(result.routes[0]!.status, 'insufficient-evidence');
	assert.equal(result.combined.find(item => item.id === 'assessed')!.total, null);
	assert.ok(renderMarkdown(result).includes('access-denied'));
});
