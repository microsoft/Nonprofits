import { z } from 'zod';
import {
	InventorySchema, TimestampSchema, type Family, type Inventory, type WorkRequest,
} from './contracts.js';
import { selectAnswers } from './scope.js';

const ScopeAnswerSchema = z.enum(['none', 'bounded', 'opaque', 'unknown']);
export const LocalReviewSchema = z.strictObject({
	customization: ScopeAnswerSchema,
	integrations: ScopeAnswerSchema,
	ownerAvailability: z.enum(['available', 'unavailable', 'unknown']),
	sandboxAndTests: z.enum(['ready', 'partial', 'unavailable', 'unknown']),
	maxInterruptionHours: z.number().finite().nonnegative().max(168).nullable(),
	reviewedAt: TimestampSchema,
	ve: z.strictObject({
		source: z.enum(['unknown', 'legacy', 'target']),
		authenticationProviders: z.enum(['unknown', 'none', 'single', 'multiple']),
		languages: z.number().int().min(1).max(100).nullable(),
		customJourneys: z.enum(['unknown', 'none', 'present']),
	}).optional(),
});
export type LocalReview = z.infer<typeof LocalReviewSchema>;

function migrationFamilies(inventory: Inventory): Family[] {
	return selectAnswers(inventory.questionnaire, inventory.discovery)
		.filter(answer => (answer.intent ?? (['vm', 've'].includes(answer.family)
			? 'replace-with-github'
			: 'ownership-transition')) !== 'confirm-alignment')
		.map(answer => answer.family);
}

function work(
	id: string,
	families: Family[],
	kind: 'customization' | 'integration',
	impact: 'bounded' | 'unbounded',
	basis: string,
): WorkRequest {
	return {
		id,
		families,
		kind,
		phase: kind,
		environment: 'sandbox',
		occurrenceId: 'guided-review',
		activity: 'remediate',
		component: kind === 'customization' ? 'selected-product-customizations' : 'selected-product-integrations',
		ruleId: kind === 'customization' ? 'custom' : 'integration',
		scenario: 'assessed',
		dependsOn: [],
		impact,
		basis,
	};
}

export function applyLocalReview(input: unknown, reviewInput: unknown): Inventory {
	const inventory = structuredClone(InventorySchema.parse(input));
	const review = LocalReviewSchema.parse(reviewInput);
	const selected = selectAnswers(inventory.questionnaire, inventory.discovery);
	const families = migrationFamilies(inventory);
	const ownerMakesOpaque = review.ownerAvailability === 'unavailable';
	inventory.questionnaire.work = inventory.questionnaire.work.filter(item =>
		!['review.customization', 'review.integration', 'review.ve-journeys', 'review.ve-configuration'].includes(item.id));

	for (const answer of selected) {
		answer.customization = review.customization === 'none' ? 'standard'
			: review.customization === 'unknown' ? 'unknown' : 'customized';
		answer.integrations = ['none', 'bounded'].includes(review.integrations) ? 'reviewed' : 'unknown';
		answer.validation = review.sandboxAndTests === 'ready' ? 'ready' : 'unknown';
		answer.basis = `Local guided review: customization ${review.customization}; integrations ${review.integrations}; owner ${review.ownerAvailability}; sandbox/tests ${review.sandboxAndTests}.`;
		if (answer.family === 've' && review.ve) {
			answer.veSource = review.ve.source;
			answer.veAuthenticationProviders = review.ve.authenticationProviders;
			answer.veLanguages = review.ve.languages;
			answer.veCustomJourneys = review.ve.customJourneys;
			if (review.ve.customJourneys === 'present') {
				answer.customization = 'customized';
			}
			if (review.ve.authenticationProviders === 'multiple' || (review.ve.languages ?? 0) > 1) {
				answer.integrations = 'reviewed';
			}
		}
	}
	if (families.length > 0 && ['bounded', 'opaque'].includes(review.customization)) {
		const impact = review.customization === 'opaque' || ownerMakesOpaque ? 'unbounded' : 'bounded';
		inventory.questionnaire.work.push(work(
			'review.customization',
			families,
			'customization',
			impact,
			`Guided review classified selected-product customization as ${review.customization}; owner availability ${review.ownerAvailability}.`,
		));
	}
	if (families.length > 0 && ['bounded', 'opaque'].includes(review.integrations)) {
		const impact = review.integrations === 'opaque' || ownerMakesOpaque ? 'unbounded' : 'bounded';
		inventory.questionnaire.work.push(work(
			'review.integration',
			families,
			'integration',
			impact,
			`Guided review classified selected-product integrations as ${review.integrations}; owner availability ${review.ownerAvailability}.`,
		));
	}
	if (families.includes('ve') && review.ve?.customJourneys === 'present') {
		inventory.questionnaire.work.push(work(
			'review.ve-journeys',
			['ve'],
			'customization',
			ownerMakesOpaque ? 'unbounded' : 'bounded',
			'Guided VE review identified business-critical custom journeys requiring preservation and regression validation.',
		));
	}
	if (families.includes('ve') && review.ve
		&& (review.ve.authenticationProviders === 'multiple' || (review.ve.languages ?? 0) > 1)) {
		inventory.questionnaire.work.push(work(
			'review.ve-configuration',
			['ve'],
			'integration',
			ownerMakesOpaque ? 'unbounded' : 'bounded',
			'Guided VE review identified multiple authentication providers or languages requiring configuration and validation.',
		));
	}
	inventory.questionnaire.operations = {
		ownerAvailability: review.ownerAvailability,
		sandboxAndTests: review.sandboxAndTests,
		maxInterruptionHours: review.maxInterruptionHours,
		reviewedAt: review.reviewedAt,
	};
	return InventorySchema.parse(inventory);
}
