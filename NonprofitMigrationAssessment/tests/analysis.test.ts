import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateCompatibility } from '../src/compatibility.js';
import { classifyComplexity } from '../src/complexity.js';
import { ROUTES } from '../src/routes.js';
import { customization, inventory, NOW } from './fixtures.js';

test('compatibility catalog separates version blockers from candidate routes', () => {
	const input = inventory(['cdm']);
	const route = ROUTES.find(item => item.family === 'cdm')!;
	const answer = input.questionnaire.answers[0]!;
	const source = input.discovery.solutions[0]!;
	const target = input.questionnaire.target.solutions[0]!;
	assert.equal(evaluateCompatibility(route, answer, source, target, undefined).status, 'candidate-supported');
	target.version = '1.0.0.0';
	const blocked = evaluateCompatibility(route, answer, source, target, undefined);
	assert.equal(blocked.status, 'blocked');
	assert.match(blocked.reason, /lower/);
});

test('reviewed same-release mappings report alignment without migration', () => {
	const input = inventory(['cdm']);
	const route = ROUTES.find(item => item.family === 'cdm')!;
	const answer = input.questionnaire.answers[0]!;
	const source = input.discovery.solutions[0]!;
	const target = input.questionnaire.target.solutions[0]!;
	answer.intent = 'confirm-alignment';
	source.version = '3.1.3.4';
	target.version = '3.1.3.4';
	const result = evaluateCompatibility(route, answer, source, target, undefined);
	assert.equal(result.status, 'already-aligned');
	assert.match(result.reason, /no product or data migration/i);
});

test('same versions outside the reviewed catalog require release mapping', () => {
	const input = inventory(['cdm', 'fundraising']);
	const route = ROUTES.find(item => item.family === 'fundraising')!;
	const answer = input.questionnaire.answers.find(item => item.family === 'fundraising')!;
	const source = input.discovery.solutions.find(solution => solution.uniqueName === route.source)!;
	const target = input.questionnaire.target.solutions.find(solution => solution.uniqueName === route.target)!;
	answer.intent = 'confirm-alignment';
	source.version = '1.0.3.3';
	target.version = '1.0.3.3';
	assert.equal(evaluateCompatibility(route, answer, source, target, undefined).status, 'investigation-required');
});

test('compatibility catalog identifies VM coexistence and unknown VE source state', () => {
	const vm = inventory(['cdm', 'vm']);
	const vmRoute = ROUTES.find(item => item.family === 'vm')!;
	const vmAnswer = vm.questionnaire.answers.find(item => item.family === 'vm')!;
	const vmSource = vm.discovery.solutions.find(item => item.uniqueName === vmRoute.source)!;
	const vmTarget = vm.questionnaire.target.solutions.find(item => item.uniqueName === vmRoute.target)!;
	const installedTarget = {
		uniqueName: vmTarget.uniqueName,
		version: vmTarget.version,
		managed: true,
		publisher: vmTarget.publisher,
		publisherPrefix: vmTarget.prefix,
	};
	assert.equal(evaluateCompatibility(vmRoute, vmAnswer, vmSource, vmTarget, installedTarget).status,
		'investigation-required');

	const ve = inventory(['cdm', 'vm', 've']);
	const veRoute = ROUTES.find(item => item.family === 've')!;
	const veAnswer = ve.questionnaire.answers.find(item => item.family === 've')!;
	veAnswer.veSource = 'unknown';
	assert.equal(evaluateCompatibility(veRoute, veAnswer, undefined, undefined, undefined).status,
		'investigation-required');
});

test('complexity classification is deterministic and unknown is never standard', () => {
	const standard = inventory(['cdm']);
	assert.equal(classifyComplexity(standard, 'cdm').level, 'standard');

	const unknown = inventory(['cdm']);
	unknown.questionnaire.answers[0]!.dependencies = 'unknown';
	assert.equal(classifyComplexity(unknown, 'cdm').level, 'unknown');

	const likely = inventory(['cdm']);
	likely.questionnaire.answers[0]!.compatibility = 'unknown';
	likely.questionnaire.answers[0]!.customization = 'unknown';
	likely.questionnaire.answers[0]!.dependencies = 'unknown';
	likely.questionnaire.answers[0]!.integrations = 'unknown';
	likely.questionnaire.answers[0]!.validation = 'unknown';
	likely.discovery.components = {
		relevantSolutions: 1,
		relevantComponents: 10,
		componentTypes: [],
		unmanagedSolutions: 1,
		analyzedUnmanagedSolutions: 1,
		overlappingUnmanagedComponents: 0,
		truncated: false,
	};
	likely.discovery.evidence.push({
		id: 'components',
		source: 'derived',
		status: 'observed',
		collectedAt: NOW.toISOString(),
		collector: 'synthetic',
		scope: 'environment',
		inputs: ['solutions'],
		reason: 'Synthetic no-overlap evidence.',
	});
	assert.equal(classifyComplexity(likely, 'cdm').level, 'likely-standard');

	const moderate = inventory(['cdm']);
	moderate.questionnaire.answers[0]!.customization = 'customized';
	moderate.questionnaire.work.push(customization(['cdm']));
	assert.equal(classifyComplexity(moderate, 'cdm').level, 'moderate');

	const heavy = inventory(['cdm']);
	heavy.questionnaire.answers[0]!.customization = 'customized';
	heavy.questionnaire.work.push(
		customization(['cdm']),
		customization(['cdm'], {
			id: 'integration-work',
			kind: 'integration',
			phase: 'integration',
			occurrenceId: 'integration',
			activity: 'adapt',
			component: 'external-contract',
			ruleId: 'integration',
		}),
	);
	assert.equal(classifyComplexity(heavy, 'cdm').level, 'heavy');

	const unbounded = inventory(['cdm']);
	unbounded.questionnaire.answers[0]!.customization = 'customized';
	unbounded.questionnaire.work.push(customization(['cdm'], { impact: 'unbounded' }));
	assert.equal(classifyComplexity(unbounded, 'cdm').level, 'unbounded');
});
