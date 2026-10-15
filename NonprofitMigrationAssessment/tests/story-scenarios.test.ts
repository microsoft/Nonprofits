import assert from 'node:assert/strict';
import test from 'node:test';
import { assess } from '../src/engine.js';
import { renderMarkdown } from '../src/report.js';
import { applyLocalReview } from '../src/review.js';
import { inventory, NOW } from './fixtures.js';

const cleanReview = {
	customization: 'none',
	integrations: 'none',
	ownerAvailability: 'available',
	sandboxAndTests: 'ready',
	reviewedAt: NOW.toISOString(),
} as const;

function alignCdm(input: ReturnType<typeof inventory>): void {
	const answer = input.questionnaire.answers.find(item => item.family === 'cdm')!;
	answer.intent = 'confirm-alignment';
	input.discovery.solutions.find(solution => solution.uniqueName === 'NonprofitCore')!.version = '3.1.3.4';
	input.questionnaire.target.solutions.find(solution => solution.uniqueName === 'NonprofitCore')!.version = '3.1.3.4';
}

test('representative standard scenario aligns CDM and rates VM medium', () => {
	const input = inventory(['cdm', 'vm']);
	alignCdm(input);
	const result = assess(applyLocalReview(input, cleanReview), { now: NOW, releaseCatalogApproved: true });
	assert.equal(result.routes.find(route => route.family === 'cdm')!.effortBand, 'none');
	const vm = result.routes.find(route => route.family === 'vm')!;
	assert.equal(vm.status, 'eligible');
	assert.equal(vm.effortBand, 'medium');
});

test('representative bounded mixed scenario rates both products from one review', () => {
	const input = inventory(['cdm', 'vm']);
	const result = assess(applyLocalReview(input, {
		...cleanReview,
		customization: 'bounded',
		integrations: 'bounded',
	}), { now: NOW });
	assert.deepEqual(result.routes.map(route => [route.family, route.effortBand]), [['cdm', 'medium'], ['vm', 'high']]);
});

test('representative opaque scenario withholds the rating', () => {
	const input = inventory(['cdm', 'vm']);
	const result = assess(applyLocalReview(input, {
		...cleanReview,
		customization: 'bounded',
		ownerAvailability: 'unavailable',
	}), { now: NOW });
	assert.ok(result.routes.every(route => route.effortBand === 'review-required'));
	assert.ok(result.findings.some(item => item.code === 'opaque-customization'));
});

test('representative VE scenario with custom journeys is high effort', () => {
	const input = inventory(['cdm', 'vm', 've']);
	alignCdm(input);
	const result = assess(applyLocalReview(input, {
		...cleanReview,
		ve: {
			source: 'legacy',
			authenticationProviders: 'multiple',
			languages: 3,
			customJourneys: 'present',
		},
	}), { now: NOW, releaseCatalogApproved: true });
	const ve = result.routes.find(route => route.family === 've')!;
	assert.equal(ve.complexity.level, 'heavy');
	assert.equal(ve.effortBand, 'high');
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
	const result = assess(input, { now: NOW });
	assert.equal(result.routes[0]!.complexity.level, 'unknown');
	assert.equal(result.routes[0]!.status, 'insufficient-evidence');
	assert.equal(result.routes[0]!.effortBand, 'review-required');
	assert.ok(renderMarkdown(result).includes('Some configuration details couldn\'t be read'));
});