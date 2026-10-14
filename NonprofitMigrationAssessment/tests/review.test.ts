import assert from 'node:assert/strict';
import test from 'node:test';
import { assess } from '../src/engine.js';
import { applyLocalReview, deriveLocalReview } from '../src/review.js';
import { inventory, NOW } from './fixtures.js';

function review(overrides: Record<string, unknown> = {}) {
	return {
		customization: 'none',
		integrations: 'none',
		ownerAvailability: 'available',
		sandboxAndTests: 'ready',
		reviewedAt: NOW.toISOString(),
		...overrides,
	};
}

function alignCdm(input: ReturnType<typeof inventory>): void {
	input.questionnaire.answers.find(answer => answer.family === 'cdm')!.intent = 'confirm-alignment';
	input.discovery.solutions.find(solution => solution.uniqueName === 'NonprofitCore')!.version = '3.1.3.4';
	input.questionnaire.target.solutions.find(solution => solution.uniqueName === 'NonprofitCore')!.version = '3.1.3.4';
}

test('short local review records operational readiness', () => {
	const input = inventory(['cdm', 'vm']);
	alignCdm(input);
	const reviewed = applyLocalReview(input, review());
	assert.deepEqual(reviewed.questionnaire.operations, {
		ownerAvailability: 'available',
		sandboxAndTests: 'ready',
		reviewedAt: NOW.toISOString(),
	});
	const result = assess(reviewed, { now: NOW });
	assert.equal(result.routes.find(route => route.family === 'cdm')!.status, 'already-at-target');
	assert.equal(result.routes.find(route => route.family === 'vm')!.effortBand, 'medium');
});

test('evidence-derived review scopes customization without customer planning answers', () => {
	const input = inventory(['cdm', 'vm']);
	input.discovery.components = {
		relevantSolutions: 2,
		relevantComponents: 10,
		componentTypes: [],
		unmanagedSolutions: 1,
		analyzedUnmanagedSolutions: 1,
		overlappingUnmanagedComponents: 1,
		productSummaries: [],
		customizationCandidates: [{
			uniqueName: 'CustomerCustom',
			managed: false,
			publisher: 'Customer',
			componentCount: 1,
			componentTypes: [],
			overlaps: [{ productUniqueName: 'VolunteerManagement', componentCount: 1 }],
		}],
		truncated: false,
	};
	input.discovery.integrations = {
		workflows: 1,
		connectionReferences: 0,
		pluginAssemblies: 0,
		pluginSteps: 0,
		scope: 'selected-products-and-overlapping-customizations',
		scopedSolutions: 3,
		truncated: false,
	};
	input.discovery.evidence.push({
		id: 'components', source: 'derived', status: 'observed', collectedAt: NOW.toISOString(),
		collector: 'synthetic', scope: 'environment', inputs: ['solutions'], reason: 'Synthetic components.',
	}, {
		id: 'integrations', source: 'derived', status: 'observed', collectedAt: NOW.toISOString(),
		collector: 'synthetic', scope: 'environment', inputs: ['components'], reason: 'Synthetic integrations.',
	});
	assert.deepEqual(deriveLocalReview(input, NOW), {
		customization: 'bounded',
		integrations: 'bounded',
		ownerAvailability: 'unknown',
		sandboxAndTests: 'unknown',
		reviewedAt: NOW.toISOString(),
	});
});

test('bounded review marks migration products customized and raises replacement effort', () => {
	const input = inventory(['cdm', 'vm']);
	alignCdm(input);
	const reviewed = applyLocalReview(input, review({ customization: 'bounded', integrations: 'bounded' }));
	assert.equal(reviewed.questionnaire.answers.find(answer => answer.family === 'vm')!.customization, 'customized');
	assert.equal(reviewed.questionnaire.answers.find(answer => answer.family === 'cdm')!.customization, 'standard');
	const vm = assess(reviewed, { now: NOW }).routes.find(route => route.family === 'vm')!;
	assert.equal(vm.complexity.level, 'moderate');
	assert.equal(vm.effortBand, 'high');
});

test('opaque or ownerless customization requires review', () => {
	const input = inventory(['vm']);
	const reviewed = applyLocalReview(input, review({
		customization: 'bounded',
		ownerAvailability: 'unavailable',
	}));
	assert.equal(reviewed.questionnaire.answers[0]!.customization, 'opaque');
	const route = assess(reviewed, { now: NOW }).routes[0]!;
	assert.equal(route.complexity.level, 'unbounded');
	assert.equal(route.effortBand, 'review-required');
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
	assert.equal(ve.customization, 'customized');
	const route = assess(reviewed, { now: NOW }).routes.find(item => item.family === 've')!;
	assert.equal(route.complexity.level, 'heavy');
	assert.equal(route.effortBand, 'high');
});