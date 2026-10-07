import assert from 'node:assert/strict';
import test from 'node:test';
import { finalizeRuleReviewDraft, createRuleReviewDraft } from '../src/rule-review.js';

test('rule review draft covers every baseline work item and complexity band', () => {
	const draft = createRuleReviewDraft();
	assert.equal(draft.rates.length, 102);
	assert.equal(new Set(draft.rates.map(rate => rate.id)).size, draft.rates.length);
	assert.deepEqual(new Set(draft.rates.map(rate => rate.complexity)),
		new Set(['standard', 'moderate', 'heavy']));
	assert.throws(() => finalizeRuleReviewDraft(draft), /Every reviewed rate requires/);
});

test('completed expert review draft becomes a strict reviewed rulebook', () => {
	const draft = createRuleReviewDraft();
	draft.version = 'reviewed-typical-v1';
	for (const rate of draft.rates) {
		rate.effort = { min: 1, max: 2, unit: 'person-hours' };
		rate.elapsed = { min: 1, max: 2, unit: 'hours' };
		rate.execution = rate.workId.endsWith('.production')
			? { min: 0.5, max: 1, unit: 'hours' }
			: null;
		rate.downtime = rate.workId.endsWith('.production')
			? { min: 0, max: 0.5, unit: 'hours' }
			: null;
		rate.basis = 'Synthetic completed review fixture; not a real estimate.';
		rate.limitations = ['Synthetic fixture only.'];
		rate.reviewer = 'Synthetic Reviewer';
		rate.reviewedAt = '2026-09-29T12:00:00.000Z';
	}
	const rules = finalizeRuleReviewDraft(draft);
	assert.equal(rules.status, 'reviewed');
	assert.equal(rules.rates.length, 102);
	assert.deepEqual(rules.rates[0]!.complexities, ['standard']);
	assert.equal(rules.rates[0]!.estimateType, 'provisional-typical');
	assert.equal(rules.rates.find(rate => rate.workId === 'cdm.production'
		&& rate.complexities.includes('standard'))!.downtime!.max, 0.5);
});
