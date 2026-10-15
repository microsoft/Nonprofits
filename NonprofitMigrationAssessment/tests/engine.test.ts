import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assess } from '../src/engine.js';
import { FAMILIES, InventorySchema, QuestionnaireSchema, type Family } from '../src/contracts.js';
import { compareVersions } from '../src/routes.js';
import { renderMarkdown } from '../src/report.js';
import { inventory, NOW } from './fixtures.js';

function observeComponents(input: ReturnType<typeof inventory>, overlap: number): void {
	input.discovery.components = {
		relevantSolutions: 1,
		relevantComponents: 25,
		componentTypes: [],
		unmanagedSolutions: 1,
		analyzedUnmanagedSolutions: 1,
		overlappingUnmanagedComponents: overlap,
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
		reason: 'Synthetic component evidence.',
	});
}

test('assessment produces relative effort only and never numeric hour ranges', () => {
	const result = assess(inventory([...FAMILIES]), { now: NOW });
	const serialized = JSON.stringify(result);
	for (const forbidden of ['person-hours', '"effort":', '"elapsed":', '"execution":', '"downtime":', '"workItems":', '"combined":', '"scenarios":', '"rulesVersion":']) {
		assert.equal(serialized.includes(forbidden), false, forbidden);
	}
	assert.equal(result.status, 'complete');
});

test('standard mixed environment rates same-identity products low and replacements medium', () => {
	const result = assess(inventory([...FAMILIES]), { now: NOW });
	assert.equal(result.routes.length, 6);
	assert.equal(result.routes.every(item => item.status === 'eligible'), true);
	assert.deepEqual(result.routes.map(item => [item.family, item.effortBand]), [
		['cdm', 'low'],
		['fundraising', 'low'],
		['grants', 'low'],
		['outcomes', 'low'],
		['vm', 'medium'],
		['ve', 'medium'],
	]);
	assert.equal(result.routes.every(item => item.compatibility.status === 'candidate-supported'), true);
	assert.equal(result.routes.every(item => item.complexity.level === 'standard'), true);
	assert.equal(result.routes.every(item => item.confidence === 'low'), true);
});

test('observed no-overlap evidence yields a likely-standard rating without reviewer gating', () => {
	const input = inventory(['cdm']);
	const answer = input.questionnaire.answers[0]!;
	answer.compatibility = 'unknown';
	answer.customization = 'unknown';
	answer.dependencies = 'unknown';
	answer.integrations = 'unknown';
	answer.validation = 'unknown';
	observeComponents(input, 0);
	const result = assess(input, { now: NOW });
	const route = result.routes[0]!;
	assert.equal(route.complexity.level, 'likely-standard');
	assert.equal(route.status, 'eligible');
	assert.equal(route.effortBand, 'low');
	assert.equal(route.confidence, 'medium');
	assert.ok(result.findings.some(item => item.code === 'evidence-based' && !item.blocking));
	const markdown = renderMarkdown(result);
	assert.ok(markdown.includes('## Technical appendix'));
	assert.ok(markdown.includes('come from fixed rules'));
});

for (const family of ['cdm', 'fundraising', 'grants', 'outcomes'] as Family[]) {
	test(`customized ${family} is medium and opaque ${family} requires review`, () => {
		const input = inventory(family === 'cdm' ? ['cdm'] : ['cdm', family]);
		input.questionnaire.answers.find(item => item.family === family)!.customization = 'customized';
		const customized = assess(input, { now: NOW }).routes.find(item => item.family === family)!;
		assert.equal(customized.complexity.level, 'moderate');
		assert.equal(customized.effortBand, 'medium');
		input.questionnaire.answers.find(item => item.family === family)!.customization = 'opaque';
		const opaque = assess(input, { now: NOW });
		const route = opaque.routes.find(item => item.family === family)!;
		assert.equal(route.complexity.level, 'unbounded');
		assert.equal(route.effortBand, 'review-required');
		assert.ok(opaque.findings.some(item => item.code === 'opaque-customization'));
	});
}

test('many overlapping changes make a product high effort', () => {
	const input = inventory(['cdm', 'vm']);
	observeComponents(input, 11);
	const result = assess(input, { now: NOW });
	assert.ok(result.routes.every(route => route.complexity.level === 'heavy' && route.effortBand === 'high'));
});

test('unresolved CDM propagates to VM and VE', () => {
	const input = inventory(['cdm', 'vm', 've']);
	input.questionnaire.answers[0]!.customization = 'opaque';
	const result = assess(input, { now: NOW });
	assert.ok(result.findings.some(item => item.id === 'vm.blocked-by-cdm'));
	assert.ok(result.findings.some(item => item.id === 've.blocked-by-vm'));
	assert.ok(result.routes.every(route => route.effortBand === 'review-required'));
});

test('unsupported destination requires review and leaves the assessment partial', () => {
	const input = inventory(['cdm', 'vm']);
	input.questionnaire.answers[1]!.destination = 'cross-environment';
	const result = assess(input, { now: NOW });
	assert.equal(result.routes[1]!.status, 'unsupported');
	assert.equal(result.routes[1]!.effortBand, 'review-required');
	assert.equal(result.routes[0]!.effortBand, 'low');
	assert.equal(result.status, 'partial');
});

test('complete absence is distinct from denied inventory', () => {
	const input = inventory();
	input.discovery.solutions = [];
	const absent = assess(input, { now: NOW });
	assert.equal(absent.status, 'no-relevant-solutions');
	assert.equal(absent.routes[0]!.status, 'not-installed');
	assert.equal(absent.routes[0]!.effortBand, 'none');
	input.discovery.evidence[0]!.status = 'access-denied';
	const denied = assess(input, { now: NOW });
	assert.equal(denied.status, 'partial');
	assert.equal(denied.routes[0]!.status, 'insufficient-evidence');
	assert.equal(denied.routes[0]!.effortBand, 'review-required');
});

test('lower target version or wrong publisher blocks compatibility', () => {
	const input = inventory();
	input.questionnaire.target.solutions[0]!.version = '1.0.0.0';
	const blocked = assess(input, { now: NOW });
	assert.ok(blocked.findings.some(item => item.code === 'compatibility-blocked'));
	assert.ok(renderMarkdown(blocked).includes('| Review required |'));
	input.questionnaire.target.solutions[0]!.publisher = 'unrecognized';
	assert.ok(assess(input, { now: NOW }).findings.some(item => item.code === 'target-identity'));
	assert.equal(compareVersions('1.0.0.100', '1.0.0.99'), 1);
});

test('shared publisher current prefix does not invalidate source identity', () => {
	const input = inventory(['cdm', 'fundraising', 'grants', 'outcomes', 'vm']);
	for (const solution of input.discovery.solutions) {
		if (solution.publisher === 'microsofttechforsocialimpact') {
			solution.publisherPrefix = 'sioutc';
		}
	}
	const result = assess(input, { now: NOW });
	assert.equal(result.findings.some(item => item.code === 'source-identity'), false);
});

test('assessment report inventory excludes unrelated platform solutions', () => {
	const input = inventory(['cdm']);
	input.discovery.solutions.push({
		uniqueName: 'UnrelatedPlatformSolution', version: '5.0', managed: true,
		publisher: 'MicrosoftCorporation', publisherPrefix: '',
	});
	const result = assess(input, { now: NOW });
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
	const result = assess(input, { now: NOW });
	assert.deepEqual(result.routes.map(route => route.family), ['cdm', 'fundraising', 'grants', 'outcomes', 'vm']);
});

test('automatic scope excludes VE when legacy capability is absent and enhanced count is zero', () => {
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
	const result = assess(input, { now: NOW });
	assert.equal(result.routes.some(route => route.family === 've'), false);
});

test('automatic scope keeps VE visible when site metadata access is denied', () => {
	const input = inventory(['cdm', 'vm', 've']);
	const ve = input.questionnaire.answers.find(answer => answer.family === 've')!;
	ve.scope = 'auto';
	ve.veSource = 'unknown';
	input.discovery.evidence.push({
		id: 'sites',
		source: 'observed',
		status: 'access-denied',
		collectedAt: NOW.toISOString(),
		collector: 'synthetic',
		scope: 'environment',
		inputs: [],
		reason: 'Synthetic denied site evidence.',
	});
	const result = assess(input, { now: NOW });
	assert.equal(result.routes.some(route => route.family === 've'), true);
	assert.equal(result.routes.find(route => route.family === 've')!.status, 'insufficient-evidence');
});

test('alignment intent produces no migration effort for equivalent releases', () => {
	const input = inventory(['cdm']);
	const answer = input.questionnaire.answers[0]!;
	answer.intent = 'confirm-alignment';
	input.discovery.solutions[0]!.version = '3.1.3.4';
	input.questionnaire.target.solutions[0]!.version = '3.1.3.4';
	const result = assess(input, { now: NOW });
	assert.equal(result.status, 'complete');
	assert.equal(result.routes[0]!.status, 'already-at-target');
	assert.equal(result.routes[0]!.effortBand, 'none');
	const markdown = renderMarkdown(result);
	assert.ok(markdown.includes('No migration required'));
	assert.ok(markdown.includes('| No migration required | High | None | Not applicable |'));
});

test('already-aligned CDM satisfies the Volunteer Management prerequisite', () => {
	const input = inventory(['cdm', 'vm']);
	const cdm = input.questionnaire.answers.find(answer => answer.family === 'cdm')!;
	cdm.intent = 'confirm-alignment';
	input.discovery.solutions.find(solution => solution.uniqueName === 'NonprofitCore')!.version = '3.1.3.4';
	input.questionnaire.target.solutions.find(solution => solution.uniqueName === 'NonprofitCore')!.version = '3.1.3.4';
	const result = assess(input, { now: NOW });
	assert.equal(result.routes.find(route => route.family === 'cdm')!.status, 'already-at-target');
	const vm = result.routes.find(route => route.family === 'vm')!;
	assert.equal(vm.status, 'eligible');
	assert.equal(vm.effortBand, 'medium');
	assert.equal(result.findings.some(finding => finding.id === 'vm.blocked-by-cdm'), false);
});

test('matching solution version does not mean already-at-target', () => {
	const input = inventory();
	input.questionnaire.target.solutions[0]!.version = input.discovery.solutions[0]!.version;
	assert.notEqual(assess(input, { now: NOW }).routes[0]!.status, 'already-at-target');
});

test('VM coexistence requires a continuation investigation', () => {
	const input = inventory(['cdm', 'vm']);
	const target = input.questionnaire.target.solutions.find(item => item.uniqueName === 'volunteermanagementos')!;
	input.discovery.solutions.push({
		uniqueName: target.uniqueName, version: target.version, managed: target.managed,
		publisher: target.publisher, publisherPrefix: target.prefix,
	});
	const result = assess(input, { now: NOW });
	assert.ok(result.findings.some(item => item.code === 'vm-transition-state'));
	assert.equal(result.routes.find(route => route.family === 'vm')!.status, 'insufficient-evidence');
});

test('missing dependency selection blocks dependent route', () => {
	const input = inventory(['vm']);
	assert.ok(assess(input, { now: NOW }).findings.some(item => item.code === 'prerequisite-cdm'));
});

test('stale, partial, or future-dated inventory requires review', () => {
	for (const timestamp of ['2026-08-01T12:00:00.000Z', '2026-10-01T12:00:00.000Z']) {
		const input = inventory();
		input.discovery.collectedAt = timestamp;
		assert.equal(assess(input, { now: NOW }).routes[0]!.effortBand, 'review-required');
	}
	const input = inventory();
	input.discovery.evidence[0]!.status = 'partial';
	assert.equal(assess(input, { now: NOW }).routes[0]!.effortBand, 'review-required');
});

test('old or future-dated customer review cannot establish a rating', () => {
	for (const date of ['2026-01-01T00:00:00.000Z', '2027-01-01T00:00:00.000Z']) {
		const input = inventory();
		input.questionnaire.consent.confirmedAt = date;
		assert.equal(assess(input, { now: NOW }).routes[0]!.effortBand, 'review-required');
	}
});

test('strict input contract rejects unknown fields, legacy work items, and duplicate IDs', () => {
	assert.equal(InventorySchema.safeParse({ ...inventory(), accessToken: 'SECRET-CANARY' }).success, false);
	const legacy = inventory();
	assert.equal(QuestionnaireSchema.safeParse({ ...legacy.questionnaire, work: [] }).success, false);
	const input = inventory();
	input.questionnaire.answers.push(input.questionnaire.answers[0]!);
	assert.equal(QuestionnaireSchema.safeParse(input.questionnaire).success, false);
	const spoofed = inventory();
	spoofed.discovery.evidence[0]!.id = 'answers.cdm';
	assert.equal(InventorySchema.safeParse(spoofed).success, false);
});

test('no consent fails before any assessment', () => {
	const input = inventory();
	input.questionnaire.consent.readOnly = false;
	assert.throws(() => assess(input, { now: NOW }), /consent/);
});

test('same inputs reproduce results and Markdown escapes component names', () => {
	const input = inventory();
	input.discovery.components = {
		relevantSolutions: 1,
		relevantComponents: 1,
		componentTypes: [],
		unmanagedSolutions: 1,
		analyzedUnmanagedSolutions: 1,
		overlappingUnmanagedComponents: 1,
		customizationComponents: [{
			type: 60,
			objectId: '11111111-1111-4111-8111-111111111111',
			name: '<script>alert(1)</script> [unsafe](https://example.com)',
			nameSource: 'observed',
			customizationSolutions: ['CustomerCustom'],
			productUniqueNames: ['NonprofitCore'],
		}],
		truncated: false,
	};
	const first = assess(input, { now: NOW });
	assert.deepEqual(first, assess(input, { now: NOW }));
	const markdown = renderMarkdown(first);
	assert.ok(markdown.includes('## Notes'));
	assert.ok(!markdown.includes('<script>'));
	assert.ok(!markdown.includes('[unsafe]('));
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
			componentTypes: [{ type: 60, count: 1 }, { type: 61, count: 2 }],
			overlaps: [{ productUniqueName: 'NonprofitCore', componentCount: 1 }],
		}],
		truncated: false,
	};
	const result = assess(input, { now: NOW });
	const markdown = renderMarkdown(result);
	assert.ok(markdown.includes('## Supported nonprofit products and recommendations'));
	assert.ok(markdown.includes('## Custom and partner solutions'));
	assert.ok(markdown.includes('## Executive decision'));
	assert.ok(markdown.includes('generated by an AI-assisted assessment skill'));
	assert.ok(markdown.includes('| Expected overall effort |'));
	assert.ok(markdown.includes('| Overall effort confidence |'));
	assert.ok(markdown.includes('## What to do next'));
	assert.ok(markdown.includes('## Supported nonprofit products and recommendations'));
	assert.ok(markdown.includes('| Decision confidence |'));
	assert.ok(markdown.includes('| Effort confidence |'));
	assert.ok(markdown.includes('### Why these effort ratings?'));
	assert.ok(markdown.includes('```mermaid'));
	assert.ok(markdown.includes('### Migration order'));
	assert.ok(markdown.includes('### Recommended sequence'));
	assert.ok(markdown.includes('### Dependencies found'));
	assert.ok(markdown.includes('### Automation and data in scope'));
	assert.ok(markdown.includes('| Plug-in assemblies and steps per product | Not available'));
	assert.ok(!markdown.includes('| Plug-in steps |'));
	assert.ok(markdown.includes('### Metric definitions'));
	assert.ok(markdown.includes('NonprofitCore 2.0.0.0'));
	assert.ok(markdown.includes('NonprofitCore 3.0.0.0'));
	assert.ok(markdown.includes('| CustomerCustom | Unmanaged | Customer | 3 | Forms: 1, Scripts/web resources: 2 | CDM for Nonprofits (1) | It changes nonprofit components; test it and plan the order in which solutions are imported |'));
	assert.ok(markdown.includes('| High | Medium | Low | [Guide]('));
	assert.ok(markdown.includes('running the assessment with `--partner-json`'));
	assert.ok(!markdown.includes('person-hours'));
	assert.ok(!markdown.includes('0-0 person-hours'));
	assert.ok(!markdown.includes('### shared.preparation'));
	assert.ok(markdown.split('\n').length < 180);
});

test('customer Markdown distinguishes missing customization detail from no components', () => {
	const input = inventory();
	input.questionnaire.target.solutions[0]!.publisher = 'unrecognized';
	input.discovery.components = {
		relevantSolutions: 1,
		relevantComponents: 10,
		componentTypes: [],
		unmanagedSolutions: 1,
		analyzedUnmanagedSolutions: 1,
		overlappingUnmanagedComponents: 1,
		productSummaries: [],
		customizationCandidates: [{
			uniqueName: 'LegacyCustomerCustom',
			managed: false,
			publisher: 'Customer',
			componentCount: 2,
			componentTypes: [],
			overlaps: [{ productUniqueName: 'NonprofitCore', componentCount: 1 }],
		}],
		truncated: true,
	};
	input.discovery.dependencies = {
		checkedComponents: 25,
		dependentReferences: 809,
		truncated: true,
	};
	const markdown = renderMarkdown(assess(input, { now: NOW }));
	assert.ok(markdown.includes('Not recorded'));
	assert.ok(markdown.includes('| Components checked for dependencies | 25 | A fixed sample'));
	assert.ok(markdown.includes('| References found | 809 |'));
	assert.ok(markdown.includes('Partial — a safety limit was reached'));
	assert.ok(markdown.includes('more solutions or components may exist'));
	assert.ok(markdown.includes('### Assessment cautions'));
	assert.ok(markdown.includes('The GitHub version of this solution couldn\'t be found'));
});

test('customer Markdown omits products not detected from every table', () => {
	const input = inventory(['cdm', 've']);
	const ve = input.questionnaire.answers.find(answer => answer.family === 've')!;
	ve.scope = 'auto';
	input.discovery.solutions.push({
		uniqueName: 'UnrelatedPlatformSolution',
		version: '1.0.0.0',
		managed: true,
		publisher: 'Platform',
		publisherPrefix: 'platform',
	});
	input.discovery.sites = { legacySites: null, enhancedSites: 0, truncated: false };
	input.discovery.evidence.push({
		id: 'sites',
		source: 'observed',
		status: 'observed',
		collectedAt: NOW.toISOString(),
		collector: 'synthetic',
		scope: 'environment',
		inputs: [],
		reason: 'Synthetic site evidence.',
	});
	const markdown = renderMarkdown(assess(input, { now: NOW }));
	assert.ok(markdown.includes('| Solutions found | 2 |'));
	assert.ok(!markdown.includes('| Fundraising |'));
	assert.ok(!markdown.includes('| Grant Management |'));
	assert.ok(!markdown.includes('| Outcome Management |'));
	assert.ok(!markdown.includes('| Volunteer Management |'));
	assert.ok(!markdown.includes('| Volunteer Engagement |'));
	assert.ok(!markdown.includes('Volunteer Engagement sites'));
	assert.ok(!markdown.includes('Confirm whether migration is needed'));
	assert.ok(!markdown.includes('Site not observed'));
});

test('customer Markdown lists named customizations per Microsoft solution with layer and coverage', () => {
	const input = inventory(['cdm', 'vm']);
	observeComponents(input, 0);
	const components = input.discovery.components!;
	components.customizationCandidates = [{
		uniqueName: 'PartnerManaged',
		managed: true,
		publisher: 'PartnerPublisher',
		componentCount: 2,
		componentTypes: [],
		overlaps: [],
	}];
	const base = { productUniqueNames: ['NonprofitCore'], displayName: null, relatedTable: null, solutions: [] as string[] };
	components.layerCustomizations = [{
		...base,
		table: 'msnfp_transaction',
		tableDisplayName: 'Transaction',
		type: 2,
		objectId: '21212121-2121-4121-8121-212121212121',
		name: 'cnto_legacyreceiptnumber',
		displayName: 'Legacy Receipt Number',
		change: 'added',
		layer: 'active',
	}, {
		...base,
		table: 'msnfp_transaction',
		tableDisplayName: 'Transaction',
		type: 60,
		objectId: '23232323-2323-4323-8323-232323232323',
		name: 'Transaction <main>',
		change: 'modified',
		layer: 'managed-solution',
		solutions: ['PartnerManaged'],
	}, {
		...base,
		table: 'sifund_appeal',
		tableDisplayName: 'Appeal',
		type: 10,
		objectId: '24242424-2424-4424-8424-242424242424',
		name: 'cnto_AppealId_sifund_appeal',
		displayName: 'cnto_AppealId_sifund_appeal',
		change: 'added',
		layer: 'active',
		solutions: ['CustomerCustom'],
		relatedTable: 'Donor Event',
	}];
	components.layerScan = {
		status: 'complete',
		productTables: 90,
		checkedTables: 90,
		solutionTables: 5,
		checkedSolutionTables: 5,
	};
	input.discovery.dependencies = {
		checkedComponents: 2,
		dependentReferences: 9,
		scope: 'named-customizations',
		candidateComponents: 3,
		components: [
			{ type: 2, objectId: '21212121-2121-4121-8121-212121212121', dependents: 2, complete: true },
			{ type: 60, objectId: '23232323-2323-4323-8323-232323232323', dependents: 5, complete: false },
		],
		truncated: true,
	};
	const result = assess(input, { now: NOW });
	const dependentsMarkdown = renderMarkdown(result);
	assert.ok(dependentsMarkdown.includes('| Unmanaged change in this environment | 2 |'));
	assert.ok(dependentsMarkdown.includes('| Managed solution PartnerManaged (PartnerPublisher) | At least 5 |'));
	assert.ok(dependentsMarkdown.includes('; related table: Donor Event | Relationship | Added | Unmanaged change in this environment; also in CustomerCustom | Not checked |'));
	assert.ok(dependentsMarkdown.includes('| Customizations checked for dependencies | 2 of 3 |'));
	assert.ok(dependentsMarkdown.includes('| Components that use them | 7 |'));
	const cdm = result.routes.find(route => route.family === 'cdm')!;
	const vm = result.routes.find(route => route.family === 'vm')!;
	assert.equal(cdm.complexity.level, 'moderate');
	assert.deepEqual(cdm.complexity.reasons, [
		'Moderate because 3 named customizations must be retested or recreated and no heavy rule applies.',
		'1 column added directly in this environment on Transaction.',
		'1 form changed by PartnerManaged on Transaction.',
		'1 relationship added directly in this environment on Appeal.',
	]);
	assert.ok(!['moderate', 'heavy'].includes(vm.complexity.level));
	const markdown = renderMarkdown(result);
	assert.ok(markdown.indexOf('## Customizations in Microsoft nonprofit solutions') < markdown.indexOf('## Custom and partner solutions'));
	assert.ok(markdown.includes('**Coverage:** Checked 90 of 90 nonprofit tables for unmanaged changes and 5 of 5 tables extended by custom or partner solutions.'));
	assert.ok(markdown.includes('**Summary:** 3 customizations: 2 added, 1 changed.'));
	assert.ok(markdown.includes('| Transaction (msnfp&#95;transaction) | Legacy Receipt Number (cnto&#95;legacyreceiptnumber) | Column | Added | Unmanaged change in this environment | 2 |'));
	assert.ok(markdown.includes('| Form | Changed | Managed solution PartnerManaged (PartnerPublisher) |'));
	assert.ok(markdown.includes('related table: Donor Event | Relationship | Added | Unmanaged change in this environment; also in CustomerCustom |'));
	assert.ok(markdown.includes('Transaction &#60;main&#62;'));
	assert.ok(!markdown.includes('<main>'));
	assert.ok(markdown.includes('No customizations were found on this product\'s components.'));
	assert.ok(markdown.includes('no heavy rule applies. 1 column added directly in this environment on Transaction. 1 form changed by PartnerManaged on Transaction.'));
	assert.ok(!markdown.includes('### Components changed by custom or partner solutions'));
});

test('aligned products ask for regression tests only when named customizations exist', () => {
	const input = inventory(['cdm']);
	input.questionnaire.answers[0]!.intent = 'confirm-alignment';
	input.discovery.solutions[0]!.version = '3.1.3.4';
	input.questionnaire.target.solutions[0]!.version = '3.1.3.4';
	observeComponents(input, 0);
	input.discovery.components!.layerScan = {
		status: 'complete',
		productTables: 1,
		checkedTables: 1,
		solutionTables: 0,
		checkedSolutionTables: 0,
	};
	input.discovery.components!.layerCustomizations = [];
	const clean = renderMarkdown(assess(input, { now: NOW }));
	assert.ok(clean.includes('| No migration required | High | None |'));
	assert.ok(clean.includes('No customizations were found on this product\'s components.'));
	assert.ok(clean.includes('1. No migration for **CDM for Nonprofits**.\n'));
	assert.ok(!clean.includes('Regression-test'));
	input.discovery.integrations = {
		workflows: 0, connectionReferences: 0, pluginAssemblies: 0, pluginSteps: 0, automations: [],
		automationScan: { status: 'unavailable', tables: 1, cloudFlows: 0, checkedCloudFlows: 0 },
		truncated: false,
	};
	const unscanned = renderMarkdown(assess(input, { now: NOW }));
	assert.ok(unscanned.includes('No customizations were found within the checked scope.'));
	assert.ok(!unscanned.includes('No customizations were found on this product'));
	delete input.discovery.integrations;
	input.discovery.components!.layerCustomizations = [{
		productUniqueNames: ['NonprofitCore'],
		table: 'msnfp_transaction',
		tableDisplayName: 'Transaction',
		type: 60,
		objectId: '25252525-2525-4525-8525-252525252525',
		name: 'Transaction',
		displayName: null,
		change: 'modified',
		layer: 'active',
		solutions: [],
		relatedTable: null,
	}];
	const customized = renderMarkdown(assess(input, { now: NOW }));
	assert.ok(customized.includes('| No migration required; regression test customizations | High | None |'));
	assert.ok(customized.includes('Regression-test these customizations: 1 form changed directly in this environment on Transaction. |'));
	assert.ok(customized.includes('Regression-test the customizations affecting CDM for Nonprofits'));
	assert.ok(customized.includes('No migration for **CDM for Nonprofits**. Regression-test its customizations.'));
});

function layerItem(product: string, overrides: Record<string, unknown> = {}) {
	return {
		productUniqueNames: [product],
		table: 'msnfp_transaction',
		tableDisplayName: 'Transaction',
		type: 2,
		objectId: '33333333-3333-4333-8333-333333333333',
		name: 'cnto_column',
		displayName: 'Column',
		change: 'added' as const,
		layer: 'active' as const,
		solutions: [] as string[],
		relatedTable: null,
		...overrides,
	};
}

function withLayers(input: ReturnType<typeof inventory>, items: ReturnType<typeof layerItem>[]): void {
	observeComponents(input, 0);
	input.discovery.components!.layerCustomizations = items;
	input.discovery.components!.layerScan = {
		status: 'complete', productTables: 5, checkedTables: 5, solutionTables: 0, checkedSolutionTables: 0,
	};
}

test('rubric rates more than ten named customizations heavy with a concrete reason', () => {
	const input = inventory(['cdm']);
	withLayers(input, Array.from({ length: 11 }, (_, index) => layerItem('NonprofitCore', {
		objectId: `33333333-3333-4333-8333-${String(index).padStart(12, '0')}`,
		name: `cnto_column${index}`,
		displayName: `Column ${index}`,
		tableDisplayName: index < 6 ? 'Transaction' : 'Appeal',
	})));
	const route = assess(input, { now: NOW }).routes[0]!;
	assert.equal(route.complexity.level, 'heavy');
	assert.equal(route.effortBand, 'high');
	assert.deepEqual(route.complexity.reasons, [
		'Heavy because of more than 10 named customizations (11).',
		'11 columns added directly in this environment on Appeal, Transaction.',
	]);
});

test('rubric rates changes from two partner solutions heavy', () => {
	const input = inventory(['cdm', 'fundraising']);
	withLayers(input, [
		layerItem('SocialImpactFundraising', { layer: 'managed-solution', solutions: ['Partner_A'], type: 60, change: 'modified', name: 'Main' }),
		layerItem('SocialImpactFundraising', { layer: 'managed-solution', solutions: ['PartnerB'], objectId: '34343434-3434-4434-8434-343434343434' }),
	]);
	const routes = assess(input, { now: NOW }).routes;
	const fundraising = routes.find(route => route.family === 'fundraising')!;
	assert.equal(fundraising.complexity.level, 'heavy');
	assert.ok(fundraising.complexity.reasons.includes('1 form changed by Partner_A on Transaction.'));
	assert.ok(fundraising.complexity.reasons.includes('Heavy because of changes from 2 partner or custom solutions (Partner_A, PartnerB).'));
	const markdown = renderMarkdown(assess(input, { now: NOW }));
	assert.ok(markdown.includes('(Partner&#95;A, PartnerB)'));
	assert.ok(!markdown.includes('&#38;#95;'));
	assert.equal(routes.find(route => route.family === 'cdm')!.complexity.level, 'standard');
});

test('rubric rates automation on Volunteer Management tables heavy because the tables are replaced', () => {
	const input = inventory(['cdm', 'vm']);
	withLayers(input, [layerItem('NonprofitCore')]);
	input.discovery.integrations = {
		workflows: 0,
		connectionReferences: 0,
		pluginAssemblies: 0,
		pluginSteps: 0,
		automations: [{
			kind: 'plugin-step',
			name: 'Contoso: audit Participation status change',
			detail: 'Update, post-operation, asynchronous',
			tables: ['msnfp_participation'],
			tableDisplayNames: ['Participation'],
			productUniqueNames: ['VolunteerManagement'],
			layer: 'active',
			solution: null,
			enabled: true,
		}],
		automationScan: { status: 'complete', tables: 5, cloudFlows: 0, checkedCloudFlows: 0 },
		truncated: false,
	};
	const result = assess(input, { now: NOW });
	const vm = result.routes.find(route => route.family === 'vm')!;
	assert.equal(vm.complexity.level, 'heavy');
	assert.equal(vm.effortBand, 'high');
	assert.deepEqual(vm.complexity.reasons, [
		'Heavy because of 1 custom relationship or automation uses tables that this migration replaces and must be rebuilt.',
		'1 plug-in step registered directly in this environment on Participation.',
	]);
	const cdm = result.routes.find(route => route.family === 'cdm')!;
	assert.equal(cdm.complexity.level, 'moderate');
	assert.equal(cdm.effortBand, 'medium');
	const markdown = renderMarkdown(result);
	assert.ok(markdown.includes('| Participation | Contoso: audit Participation status change (Update, post-operation, asynchronous) | Plug-in step | Added | Unmanaged change in this environment | Not applicable |'));
	assert.ok(markdown.includes('Legacy Volunteer Management must be replaced by a different GitHub solution. Heavy because of 1 custom relationship or automation uses tables that this migration replaces and must be rebuilt. 1 plug-in step registered directly in this environment on Participation.'));
});

test('an incomplete plug-in, process, and flow scan requires review instead of a standard rating', () => {
	const input = inventory(['cdm', 'vm']);
	for (const answer of input.questionnaire.answers) {
		answer.compatibility = 'unknown';
		answer.customization = 'unknown';
		answer.validation = 'unknown';
	}
	observeComponents(input, 0);
	input.discovery.components!.layerCustomizations = [];
	input.discovery.components!.layerScan = {
		status: 'complete', productTables: 5, checkedTables: 5, solutionTables: 0, checkedSolutionTables: 0,
	};
	input.discovery.integrations = {
		workflows: 0, connectionReferences: 0, pluginAssemblies: 0, pluginSteps: 0, automations: [],
		automationScan: { status: 'unavailable', tables: 5, cloudFlows: 0, checkedCloudFlows: 0 },
		truncated: false,
	};
	const vm = assess(input, { now: NOW }).routes.find(route => route.family === 'vm')!;
	assert.equal(vm.complexity.level, 'unknown');
	assert.equal(vm.effortBand, 'review-required');
	assert.deepEqual(vm.complexity.reasons, ['Plug-in steps, processes, or cloud flows on this product\'s tables couldn\'t all be checked.']);
	input.discovery.integrations.automationScan!.status = 'complete';
	assert.equal(assess(input, { now: NOW }).routes.find(route => route.family === 'vm')!.complexity.level, 'likely-standard');
});

test('customer Markdown uses plain language in every report scenario', () => {
	const banned = /\b(adverse|unscoped|assertions?|derived prerequisite|evidence coverage|candidate-supported|candidate routes?|eligible|route findings?|provisional|inventor(y|ied)|snapshot|dependency edges|hashes|scoped|investigation-required|already-at-target|ownership-transition|not-estimable|metadata signals?|bounded|overlap)\b/i;
	const healthy = inventory([...FAMILIES]);
	const blocked = inventory();
	blocked.questionnaire.target.solutions[0]!.publisher = 'unrecognized';
	const unreviewed = inventory(['cdm', 'vm']);
	for (const answer of unreviewed.questionnaire.answers) {
		answer.compatibility = 'unknown';
		answer.customization = 'unknown';
		answer.validation = 'unknown';
	}
	unreviewed.discovery.evidence.push({
		id: 'counts', source: 'derived', status: 'access-denied', collectedAt: NOW.toISOString(),
		collector: 'synthetic', scope: 'environment', inputs: [], reason: 'Synthetic denial.',
	});
	const opaque = inventory(['cdm']);
	opaque.questionnaire.answers[0]!.customization = 'opaque';
	const partial = inventory(['cdm', 'fundraising']);
	observeComponents(partial, 2);
	partial.discovery.components!.truncated = true;
	partial.discovery.components!.customizationCandidates = [{
		uniqueName: 'CustomerCustom', managed: false, publisher: 'Customer', componentCount: 2,
		componentTypes: [], overlaps: [{ productUniqueName: 'NonprofitCore', componentCount: 2 }],
	}];
	partial.discovery.dependencies = { checkedComponents: 2, dependentReferences: 5, truncated: true };
	partial.discovery.evidence.push({
		id: 'dependencies', source: 'derived', status: 'partial', collectedAt: NOW.toISOString(),
		collector: 'synthetic', scope: 'environment', inputs: ['components'],
		reason: 'A safety limit was reached before every changed component could be checked for dependencies.',
	});
	for (const [name, input] of Object.entries({ healthy, blocked, unreviewed, opaque, partial })) {
		const markdown = renderMarkdown(assess(input, { now: NOW }));
		const line = markdown.split('\n').find(item => banned.test(item));
		assert.equal(line, undefined, `${name}: ${line}`);
	}
});
