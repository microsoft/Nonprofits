import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { WorkItem } from '../src/contracts.js';
import { normalizePlan, summarizeScenario } from '../src/planner.js';

function work(overrides: Partial<WorkItem> = {}): WorkItem {
	return {
		id: 'rehearsal', families: ['cdm'], phase: 'sandbox', environment: 'sandbox',
		occurrenceId: 'first', activity: 'upgrade', component: 'cdm', ownerRole: 'partner',
		scenario: 'baseline', dependsOn: [], ruleId: 'test', appliedRateId: 'test.standard', ruleVersion: 'synthetic',
		basis: 'Synthetic arithmetic only.', evidenceIds: ['solutions'],
		effort: { min: 2, max: 3, unit: 'person-hours' },
		elapsed: { min: 1, max: 2, unit: 'hours' },
		execution: { min: 0.5, max: 1, unit: 'hours' },
		downtime: { min: 0, max: 0.5, unit: 'hours' },
		estimateType: 'provisional-typical',
		reviewer: 'Synthetic Reviewer',
		reviewedAt: '2026-09-29T12:00:00.000Z',
		limitations: ['Synthetic fixture only.'],
		unknownReason: null,
		...overrides,
	};
}

test('T21: shared CDM references count once, second rehearsal counts separately', () => {
	const plan = normalizePlan([
		work(),
		work({ id: 'fundraising-reference', families: ['fundraising'] }),
		work({ id: 'grants-reference', families: ['grants'] }),
		work({ id: 'second-rehearsal', occurrenceId: 'second', scenario: 'extra-rehearsal', dependsOn: ['fundraising-reference'] }),
	]);
	assert.equal(plan.length, 2);
	assert.equal(plan[1]!.dependsOn[0], 'rehearsal');
	assert.deepEqual(plan[0]!.families, ['cdm', 'fundraising', 'grants']);
	assert.equal(summarizeScenario(plan, 'assessed', []).total!.min, 2);
	assert.equal(summarizeScenario(plan, 'extra-rehearsal', []).total!.min, 4);
});

test('same occurrence with conflicting rate is rejected rather than undercounted', () => {
	assert.throws(() => normalizePlan([
		work(), work({ id: 'other', effort: { min: 1, max: 1, unit: 'person-hours' } }),
	]));
});

test('missing/cyclic references and dependencies on mutually exclusive scenarios are blocked', () => {
	assert.throws(() => normalizePlan([work({ dependsOn: ['missing'] })]));
	assert.throws(() => normalizePlan([work({ dependsOn: ['rehearsal'] })]));
	assert.throws(() => normalizePlan([
		work({ scenario: 'risk-a', dependsOn: ['other'] }),
		work({ id: 'other', scenario: 'risk-b', occurrenceId: 'other' }),
	]));
});

test('unbounded work leaves a known subtotal but no complete total', () => {
	const plan = normalizePlan([work(), work({
		id: 'opaque', occurrenceId: 'opaque', effort: null, unknownReason: 'Partner scope unknown.',
	})]);
	const report = summarizeScenario(plan, 'assessed', []);
	assert.equal(report.knownSubtotal.min, 2);
	assert.equal(report.total, null);
	assert.deepEqual(report.excludedWorkItemIds, ['opaque']);
});

test('reviewed timing rules calculate critical-path elapsed and production windows', () => {
	const plan = normalizePlan([
		work({ id: 'prepare', phase: 'preparation', execution: null, downtime: null }),
		work({
			id: 'production-a', phase: 'production', occurrenceId: 'production-a',
			dependsOn: ['prepare'],
		}),
		work({
			id: 'production-b', phase: 'production', occurrenceId: 'production-b',
			dependsOn: ['prepare'],
		}),
	]);
	const report = summarizeScenario(plan, 'assessed', []);
	assert.deepEqual(report.elapsed, { min: 2, max: 4, unit: 'hours' });
	assert.deepEqual(report.execution, { min: 1, max: 2, unit: 'hours' });
	assert.deepEqual(report.downtime, { min: 0, max: 1, unit: 'hours' });
});
