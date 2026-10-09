import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assess } from '../src/engine.js';
import { FAMILIES, InventorySchema, QuestionnaireSchema, RangeSchema, RuleBookSchema, type Family } from '../src/contracts.js';
import { compareVersions, DEFAULT_RULES } from '../src/routes.js';
import { renderMarkdown } from '../src/report.js';
import { customization, inventory, NOW, rules } from './fixtures.js';

test('default rules provide clearly labeled conservative engineering assumptions', () => {
	const result = assess(inventory(), DEFAULT_RULES, { now: NOW });
	assert.equal(result.status, 'complete');
	assert.deepEqual(result.combined.find(item => item.id === 'assessed')!.total,
		{ min: 46, max: 92, unit: 'person-hours' });
	assert.equal(result.routes[0]!.effortBand, 'medium');
	assert.equal(result.workItems.every(item => item.estimateType === 'uncalibrated-assumption'
		&& item.reviewer === null), true);
	assert.equal(result.routes[0]!.confidence, 'low');
});

test('observed no-overlap evidence yields a likely-standard assumption range without reviewer gating', () => {
	const input = inventory(['cdm']);
	const answer = input.questionnaire.answers[0]!;
	answer.compatibility = 'unknown';
	answer.customization = 'unknown';
	answer.dependencies = 'unknown';
	answer.integrations = 'unknown';
	answer.validation = 'unknown';
	input.discovery.components = {
		relevantSolutions: 1,
		relevantComponents: 25,
		componentTypes: [],
		unmanagedSolutions: 1,
		analyzedUnmanagedSolutions: 1,
		overlappingUnmanagedComponents: 0,
		truncated: false,
	};
	input.discovery.evidence.push({
		id: 'components',
		source: 'derived',
		status: 'observed',
		collectedAt: NOW.toISOString(),
		collector: 'synthetic',
		scope: 'environment',
		inputs: ['solutions'],
		reason: 'Synthetic no-overlap evidence.',
	});
	const result = assess(input, DEFAULT_RULES, { now: NOW });
	const route = result.routes[0]!;
	assert.equal(route.complexity.level, 'likely-standard');
	assert.equal(route.status, 'eligible');
	assert.deepEqual(route.scenarios.find(item => item.id === 'assessed')!.total,
		{ min: 46, max: 92, unit: 'person-hours' });
	assert.ok(result.findings.some(item => item.code === 'assumption-based' && !item.blocking));
	const markdown = renderMarkdown(result);
	assert.ok(markdown.includes('## Dependencies and estimation assumptions'));
	assert.ok(markdown.includes('Bundled uncalibrated engineering assumptions'));
});

test('standard mixed environment has six routes and one shared preparation occurrence', () => {
	const result = assess(inventory([...FAMILIES]), rules(), { now: NOW });
	assert.equal(result.routes.length, 6);
	assert.equal(result.routes.every(item => item.status === 'eligible'), true);
	assert.deepEqual(result.routes.map(item => [item.family, item.effortBand]), [
		['cdm', 'low'],
		['fundraising', 'low'],
		['grants', 'low'],
		['outcomes', 'low'],
		['vm', 'low'],
		['ve', 'low'],
	]);
	assert.equal(result.routes.every(item => item.compatibility.status === 'candidate-supported'), true);
	assert.equal(result.routes.every(item => item.complexity.level === 'standard'), true);
	assert.equal(result.workItems.filter(item => item.id === 'shared.preparation').length, 1);
	assert.deepEqual(result.combined.find(item => item.id === 'assessed')!.total, { min: 31, max: 62, unit: 'person-hours' });
	assert.ok(result.combined.find(item => item.id === 'assessed')!.elapsed);
	assert.ok(result.combined.find(item => item.id === 'assessed')!.execution);
	assert.ok(result.combined.find(item => item.id === 'assessed')!.downtime);
	assert.ok(result.workItems.every(item => item.estimateType === 'provisional-typical'
		&& item.reviewer === 'Synthetic Test Reviewer'));
	assert.equal(result.combined.find(item => item.id === 'adverse-unscoped')!.total, null);
	assert.ok(result.workItems.find(item => item.id === 've.production')!.dependsOn.includes('vm.production'));
});

for (const family of ['cdm', 'fundraising', 'grants', 'outcomes'] as Family[]) {
	for (const impact of ['bounded', 'unbounded'] as const) {
		test(`customized ${family}: ${impact} partner-layer / removed-component / integration impact`, () => {
			const input = inventory(family === 'cdm' ? ['cdm'] : ['cdm', family]);
			input.questionnaire.answers.find(item => item.family === family)!.customization = 'customized';
			input.questionnaire.work.push(customization([family], { impact }));
			input.questionnaire.work.push(customization([family], {
				id: 'integration-work', kind: 'integration', phase: 'integration', component: 'external-contract',
				activity: 'integration-review', ruleId: 'integration', impact,
			}));
			input.questionnaire.work.push(customization([family], {
				id: 'risk-retest', kind: 'risk', phase: 'validation', occurrenceId: 'second',
				activity: 'regression', component: 'shared-business-journey', ruleId: 'risk', scenario: 'extra-rehearsal',
			}));
			const result = assess(input, rules(), { now: NOW });
			const route = result.routes.find(item => item.family === family)!;
			const total = route.scenarios.find(item => item.id === 'assessed')!.total;
			if (impact === 'bounded') {
				assert.ok(total);
				assert.equal(route.scenarios.find(item => item.id === 'extra-rehearsal')!.total!.min, total.min + 1);
			} else {
				assert.equal(total, null);
				assert.equal(result.combined.find(item => item.id === 'assessed')!.total, null);
				assert.ok(result.findings.some(item => item.code === 'unbounded-custom-work'));
			}
		});
	}
}

test('shared customized CDM/template work is counted once while per-app validation remains', () => {
	const input = inventory(['cdm', 'fundraising', 'grants', 'outcomes']);
	input.questionnaire.answers.forEach(item => { item.customization = 'customized'; });
	input.questionnaire.work = [customization(['cdm', 'fundraising', 'grants', 'outcomes'])];
	const result = assess(input, rules(), { now: NOW });
	assert.equal(result.combined.find(item => item.id === 'assessed')!.total!.min, 22);
	assert.equal(result.workItems.filter(item => item.phase === 'validation').length, 4);
	input.questionnaire.work[0]!.impact = 'unbounded';
	const unknown = assess(input, rules(), { now: NOW });
	assert.ok(unknown.routes.every(route => route.scenarios.find(item => item.id === 'assessed')!.total === null));
});

test('critical unbounded CDM work propagates to VM and VE', () => {
	const input = inventory(['cdm', 'vm', 've']);
	input.questionnaire.answers[0]!.customization = 'customized';
	input.questionnaire.work.push(customization(['cdm'], { impact: 'unbounded' }));
	const result = assess(input, rules(), { now: NOW });
	assert.ok(result.findings.some(item => item.id === 'vm.blocked-by-cdm'));
	assert.ok(result.findings.some(item => item.id === 've.blocked-by-vm'));
	assert.ok(result.routes.every(route => route.scenarios.find(item => item.id === 'assessed')!.total === null));
});

test('customized VM/VE requires scoped work and keeps opaque work unknown', () => {
	const input = inventory(['cdm', 'vm', 've']);
	for (const answer of input.questionnaire.answers.filter(item => item.family !== 'cdm')) {
		answer.customization = 'customized';
	}
	const missing = assess(input, rules(), { now: NOW });
	assert.equal(missing.findings.filter(item => item.code === 'customization-unscoped').length, 2);
	input.questionnaire.work.push(customization(['vm', 've'], { impact: 'unbounded' }));
	assert.equal(assess(input, rules(), { now: NOW }).combined.find(item => item.id === 'assessed')!.total, null);
});

test('unsupported destination has no numeric route total and blocks complete combined plan', () => {
	const input = inventory(['cdm', 'vm']);
	input.questionnaire.answers[1]!.destination = 'cross-environment';
	const result = assess(input, rules(), { now: NOW });
	assert.equal(result.routes[1]!.status, 'unsupported');
	assert.equal(result.routes[1]!.scenarios.every(item => item.total === null), true);
	assert.equal(result.combined.every(item => item.total === null), true);
	assert.ok(result.routes[0]!.scenarios.find(item => item.id === 'assessed')!.total);
});

test('complete absence is distinct from denied inventory', () => {
	const input = inventory();
	input.discovery.solutions = [];
	const absent = assess(input, rules(), { now: NOW });
	assert.equal(absent.status, 'no-relevant-solutions');
	assert.equal(absent.routes[0]!.status, 'not-installed');
	input.discovery.evidence[0]!.status = 'access-denied';
	const denied = assess(input, rules(), { now: NOW });
	assert.equal(denied.status, 'partial');
	assert.equal(denied.routes[0]!.status, 'insufficient-evidence');
	assert.equal(denied.combined[0]!.total, null);
});

test('lower target version or wrong publisher blocks compatibility', () => {
	const input = inventory();
	input.questionnaire.target.solutions[0]!.version = '1.0.0.0';
	assert.ok(assess(input, rules(), { now: NOW }).findings.some(item => item.code === 'compatibility-blocked'));
	const assumed = assess(input, DEFAULT_RULES, { now: NOW });
	assert.ok(renderMarkdown(assumed).includes('Review required (Medium known)'));
	input.questionnaire.target.solutions[0]!.publisher = 'unrecognized';
	assert.ok(assess(input, rules(), { now: NOW }).findings.some(item => item.code === 'target-identity'));
	assert.equal(compareVersions('1.0.0.100', '1.0.0.99'), 1);
});

test('shared publisher current prefix does not invalidate source identity', () => {
	const input = inventory(['cdm', 'fundraising', 'grants', 'outcomes', 'vm']);
	for (const solution of input.discovery.solutions) {
		if (solution.publisher === 'microsofttechforsocialimpact') {
			solution.publisherPrefix = 'sioutc';
		}
	}
	const result = assess(input, rules(), { now: NOW });
	assert.equal(result.findings.some(item => item.code === 'source-identity'), false);
});

test('assessment report inventory excludes unrelated platform solutions', () => {
	const input = inventory(['cdm']);
	input.discovery.solutions.push({
		uniqueName: 'UnrelatedPlatformSolution', version: '5.0', managed: true,
		publisher: 'MicrosoftCorporation', publisherPrefix: '',
	});
	const result = assess(input, rules(), { now: NOW });
	assert.deepEqual(result.installedSolutions.map(item => item.uniqueName), ['NonprofitCore']);
});

test('automatic scope includes installed products and excludes unconfirmed VE', () => {
	const input = inventory([...FAMILIES]);
	for (const answer of input.questionnaire.answers) {
		answer.scope = 'auto';
		answer.intent = ['vm', 've'].includes(answer.family)
			? 'replace-with-github'
			: 'ownership-transition';
		if (answer.family === 've') {
			answer.veSource = 'unknown';
		}
	}
	input.discovery.sites = { legacySites: 0, enhancedSites: 0, truncated: false };
	input.discovery.evidence.push({
		id: 'sites',
		source: 'observed',
		status: 'observed',
		collectedAt: NOW.toISOString(),
		collector: 'synthetic',
		scope: 'environment',
		inputs: [],
		reason: 'Synthetic complete site absence.',
	});
	const result = assess(input, rules(), { now: NOW });
	assert.deepEqual(result.routes.map(route => route.family), ['cdm', 'fundraising', 'grants', 'outcomes', 'vm']);
});

test('automatic scope keeps VE visible when site absence cannot be confirmed', () => {
	const input = inventory(['cdm', 'vm', 've']);
	const ve = input.questionnaire.answers.find(answer => answer.family === 've')!;
	ve.scope = 'auto';
	ve.veSource = 'unknown';
	input.discovery.sites = { legacySites: null, enhancedSites: 0, truncated: false };
	input.discovery.evidence.push({
		id: 'sites',
		source: 'observed',
		status: 'observed',
		collectedAt: NOW.toISOString(),
		collector: 'synthetic',
		scope: 'environment',
		inputs: [],
		reason: 'Legacy capability unavailable.',
	});
	const result = assess(input, DEFAULT_RULES, { now: NOW });
	assert.equal(result.routes.some(route => route.family === 've'), true);
	assert.equal(result.routes.find(route => route.family === 've')!.status, 'insufficient-evidence');
});

test('alignment intent produces no migration work for equivalent releases', () => {
	const input = inventory(['cdm']);
	const answer = input.questionnaire.answers[0]!;
	answer.intent = 'confirm-alignment';
	input.discovery.solutions[0]!.version = '3.1.3.4';
	input.questionnaire.target.solutions[0]!.version = '3.1.3.4';
	const result = assess(input, DEFAULT_RULES, { now: NOW });
	assert.equal(result.status, 'complete');
	assert.equal(result.routes[0]!.status, 'already-at-target');
	assert.equal(result.routes[0]!.effortBand, 'none');
	assert.deepEqual(result.routes[0]!.scenarios.find(item => item.id === 'assessed')!.total,
		{ min: 0, max: 0, unit: 'person-hours' });
	assert.equal(result.workItems.length, 0);
	assert.ok(renderMarkdown(result).includes('No migration required'));
});

test('already-aligned CDM satisfies the Volunteer Management prerequisite', () => {
	const input = inventory(['cdm', 'vm']);
	const cdm = input.questionnaire.answers.find(answer => answer.family === 'cdm')!;
	cdm.intent = 'confirm-alignment';
	input.discovery.solutions.find(solution => solution.uniqueName === 'NonprofitCore')!.version = '3.1.3.4';
	input.questionnaire.target.solutions.find(solution => solution.uniqueName === 'NonprofitCore')!.version = '3.1.3.4';
	const result = assess(input, DEFAULT_RULES, { now: NOW });
	assert.equal(result.routes.find(route => route.family === 'cdm')!.status, 'already-at-target');
	assert.equal(result.routes.find(route => route.family === 'vm')!.status, 'eligible');
	assert.equal(result.findings.some(finding => finding.id === 'vm.blocked-by-cdm'), false);
	assert.deepEqual(result.combined.find(item => item.id === 'assessed')!.total,
		{ min: 96, max: 192, unit: 'person-hours' });
});

test('matching solution version does not mean already-at-target', () => {
	const input = inventory();
	input.questionnaire.target.solutions[0]!.version = input.discovery.solutions[0]!.version;
	assert.notEqual(assess(input, rules(), { now: NOW }).routes[0]!.status, 'already-at-target');
});

test('VM coexistence requires a continuation investigation', () => {
	const input = inventory(['cdm', 'vm']);
	const target = input.questionnaire.target.solutions.find(item => item.uniqueName === 'volunteermanagementos')!;
	input.discovery.solutions.push({
		uniqueName: target.uniqueName, version: target.version, managed: target.managed,
		publisher: target.publisher, publisherPrefix: target.prefix,
	});
	const result = assess(input, rules(), { now: NOW });
	assert.ok(result.findings.some(item => item.code === 'vm-transition-state'));
	assert.equal(result.routes.find(route => route.family === 'vm')!.status, 'insufficient-evidence');
});

test('missing dependency selection blocks dependent route', () => {
	const input = inventory(['vm']);
	assert.ok(assess(input, rules(), { now: NOW }).findings.some(item => item.code === 'prerequisite-cdm'));
});

test('stale, partial, or future-dated inventory cannot produce complete totals', () => {
	for (const timestamp of ['2026-08-01T12:00:00.000Z', '2026-10-01T12:00:00.000Z']) {
		const input = inventory();
		input.discovery.collectedAt = timestamp;
		assert.equal(assess(input, rules(), { now: NOW }).combined[0]!.total, null);
	}
	const input = inventory();
	input.discovery.evidence[0]!.status = 'partial';
	assert.equal(assess(input, rules(), { now: NOW }).combined[0]!.total, null);
});

test('strict input contract rejects unknown fields, invalid ranges and duplicate IDs', () => {
	assert.equal(InventorySchema.safeParse({ ...inventory(), accessToken: 'SECRET-CANARY' }).success, false);
	assert.equal(RangeSchema.safeParse({ min: 3, max: 2, unit: 'person-hours' }).success, false);
	const ruleBook = rules();
	ruleBook.status = 'assumed';
	assert.equal(RuleBookSchema.safeParse(ruleBook).success, false);
	const input = inventory();
	input.questionnaire.answers.push(input.questionnaire.answers[0]!);
	assert.equal(QuestionnaireSchema.safeParse(input.questionnaire).success, false);
});

test('no consent fails before any assessment', () => {
	const input = inventory();
	input.questionnaire.consent.readOnly = false;
	assert.throws(() => assess(input, rules(), { now: NOW }), /consent/);
});

test('stale or unknown-route numeric rules fail before producing estimates', () => {
	const stale = rules();
	for (const rate of stale.rates) {
		rate.reviewedAt = '2024-01-01T00:00:00.000Z';
	}
	assert.throws(() => assess(inventory(), stale, { now: NOW }), /invalid or stale/);
	const unknownRoute = rules();
	unknownRoute.rates[0]!.routeIds = ['unknown-route'];
	assert.throws(() => assess(inventory(), unknownRoute, { now: NOW }), /invalid or stale/);
});

test('cyclic work dependencies report an invalid-plan blocker', () => {
	const input = inventory();
	input.questionnaire.answers[0]!.customization = 'customized';
	input.questionnaire.work.push(customization(['cdm'], { dependsOn: ['cdm.acceptance'] }));
	const result = assess(input, rules(), { now: NOW });
	assert.ok(result.findings.some(item => item.code === 'invalid-plan'));
	assert.equal(result.combined[0]!.total, null);
});

test('alternative adverse scenarios are independent, not summed', () => {
	const input = inventory();
	input.questionnaire.work.push(customization(['cdm'], {
		id: 'risk-a', kind: 'risk', scenario: 'risk-a', occurrenceId: 'risk-a', ruleId: 'risk',
	}));
	input.questionnaire.work.push(customization(['cdm'], {
		id: 'risk-b', kind: 'risk', scenario: 'risk-b', occurrenceId: 'risk-b', ruleId: 'risk',
	}));
	const result = assess(input, rules(), { now: NOW });
	assert.equal(result.combined.find(item => item.id === 'assessed')!.total!.min, 6);
	assert.equal(result.combined.find(item => item.id === 'risk-a')!.total!.min, 7);
	assert.equal(result.combined.find(item => item.id === 'risk-b')!.total!.min, 7);
});

test('same inputs reproduce findings/estimates and Markdown escapes customer text', () => {
	const input = inventory();
	input.questionnaire.answers[0]!.customization = 'customized';
	input.questionnaire.work.push(customization(['cdm'], { basis: '<script>alert(1)</script> [unsafe](https://example.com)' }));
	const first = assess(input, rules(), { now: NOW });
	assert.deepEqual(first, assess(input, rules(), { now: NOW }));
	const markdown = renderMarkdown(first);
	assert.ok(markdown.includes('Unavailable'));
	assert.ok(!markdown.includes('<script>'));
	assert.ok(!markdown.includes('[unsafe]('));
	assert.deepEqual(first.combined[0]!.elapsed, { min: 6, max: 12, unit: 'hours' });
	assert.deepEqual(first.combined[0]!.downtime, { min: 0, max: 0.5, unit: 'hours' });
});

test('customer Markdown is concise, shows source-to-target versions, and never renders unknown as zero', () => {
	const input = inventory([...FAMILIES]);
	input.discovery.components = {
		relevantSolutions: 5,
		relevantComponents: 100,
		componentTypes: [],
		unmanagedSolutions: 1,
		analyzedUnmanagedSolutions: 1,
		overlappingUnmanagedComponents: 1,
		productSummaries: [{
			uniqueName: 'NonprofitCore',
			componentCount: 20,
			overlappingCustomizationComponents: 1,
			customizationSolutions: ['CustomerCustom'],
		}],
		customizationCandidates: [{
			uniqueName: 'CustomerCustom',
			managed: false,
			publisher: 'Customer',
			componentCount: 3,
			overlaps: [{ productUniqueName: 'NonprofitCore', componentCount: 1 }],
		}],
		truncated: false,
	};
	const result = assess(input, DEFAULT_RULES, { now: NOW });
	const markdown = renderMarkdown(result);
	assert.ok(markdown.includes('## What is installed and what should you do?'));
	assert.ok(markdown.includes('## Customization solutions'));
	assert.ok(markdown.includes('## Environment details'));
	assert.ok(markdown.includes('NonprofitCore 2.0.0.0'));
	assert.ok(markdown.includes('NonprofitCore 3.0.0.0'));
	assert.ok(markdown.includes('| CustomerCustom | Unmanaged | Customer | 3 | NonprofitCore (1) |'));
	assert.ok(markdown.includes('| Medium | [Guide]('));
	assert.ok(markdown.includes('Detailed evidence, hashes, work-item dependencies'));
	assert.ok(!markdown.includes('0-0 person-hours'));
	assert.ok(!markdown.includes('### shared.preparation'));
	assert.ok(markdown.split('\n').length < 180);
});

test('declared work for an absent solution is a scope conflict, not a zero-work success', () => {
	const input = inventory();
	input.discovery.solutions = [];
	input.questionnaire.answers[0]!.customization = 'customized';
	input.questionnaire.work.push(customization(['cdm']));
	const result = assess(input, rules(), { now: NOW });
	assert.equal(result.status, 'partial');
	assert.ok(result.findings.some(item => item.code === 'absent-with-work'));
	assert.equal(result.combined[0]!.total, null);
});

test('old or future-dated customer review cannot establish a complete effort range', () => {
	for (const date of ['2026-01-01T00:00:00.000Z', '2027-01-01T00:00:00.000Z']) {
		const input = inventory();
		input.questionnaire.consent.confirmedAt = date;
		assert.equal(assess(input, rules(), { now: NOW }).combined[0]!.total, null);
	}
});

test('reserved evidence and baseline work IDs cannot be spoofed', () => {
	const input = inventory();
	input.discovery.evidence[0]!.id = 'answers.cdm';
	assert.equal(InventorySchema.safeParse(input).success, false);
	const other = inventory();
	other.questionnaire.work.push(customization(['cdm'], { id: 'cdm.production' }));
	assert.equal(InventorySchema.safeParse(other).success, false);
});

test('invalid dependency plans withhold even known-subtotal arithmetic', () => {
	const input = inventory();
	input.questionnaire.answers[0]!.customization = 'customized';
	input.questionnaire.work.push(customization(['cdm'], { dependsOn: ['missing'] }));
	const result = assess(input, rules(), { now: NOW });
	assert.equal(result.combined[0]!.total, null);
	assert.equal(result.combined[0]!.knownSubtotal.min, 0);
	assert.ok(result.workItems.every(item => item.effort === null));
});
