import { z } from 'zod';
import {
	InventorySchema, TimestampSchema, type Family, type Inventory,
} from './contracts.js';
import { familyEvidence } from './complexity.js';
import { selectAnswers } from './scope.js';

const ScopeAnswerSchema = z.enum(['none', 'bounded', 'opaque', 'unknown']);
export const LocalReviewSchema = z.strictObject({
	customization: ScopeAnswerSchema,
	integrations: ScopeAnswerSchema,
	ownerAvailability: z.enum(['available', 'unavailable', 'unknown']),
	sandboxAndTests: z.enum(['ready', 'partial', 'unavailable', 'unknown']),
	reviewedAt: TimestampSchema,
	ve: z.strictObject({
		source: z.enum(['unknown', 'legacy', 'target']),
		authenticationProviders: z.enum(['unknown', 'none', 'single', 'multiple']),
		languages: z.number().int().min(1).max(100).nullable(),
		customJourneys: z.enum(['unknown', 'none', 'present']),
	}).optional(),
});
export type LocalReview = z.infer<typeof LocalReviewSchema>;

export function deriveLocalReview(input: unknown, now = new Date()): LocalReview {
	const inventory = InventorySchema.parse(input);
	const componentEvidence = inventory.discovery.evidence.find(item => item.id === 'components');
	const integrationEvidence = inventory.discovery.evidence.find(item => item.id === 'integrations');
	const overlaps = (inventory.discovery.components?.customizationCandidates
		?.some(solution => solution.overlaps.length > 0) ?? false)
		|| (inventory.discovery.components?.layerCustomizations?.length ?? 0) > 0;
	const integrationCount = inventory.discovery.integrations
		? [
			inventory.discovery.integrations.workflows,
			inventory.discovery.integrations.connectionReferences,
			inventory.discovery.integrations.pluginAssemblies,
			inventory.discovery.integrations.pluginSteps,
		].reduce<number>((total, value) => total + (value ?? 0), 0)
		: null;
	const selected = selectAnswers(inventory.questionnaire, inventory.discovery);
	const veSelected = selected.some(answer => answer.family === 've');
	const sites = inventory.discovery.sites;
	return LocalReviewSchema.parse({
		customization: ['observed', 'partial'].includes(componentEvidence?.status ?? '')
			? overlaps ? 'bounded' : 'none'
			: 'unknown',
		integrations: ['observed', 'partial'].includes(integrationEvidence?.status ?? '')
			? (integrationCount ?? 0) > 0 || (inventory.discovery.integrations?.automations?.length ?? 0) > 0 ? 'bounded' : 'none'
			: 'unknown',
		ownerAvailability: 'unknown',
		sandboxAndTests: 'unknown',
		reviewedAt: now.toISOString(),
		...(veSelected ? {
			ve: {
				source: (sites?.legacySites ?? 0) > 0 ? 'legacy'
					: (sites?.enhancedSites ?? 0) > 0 ? 'target'
						: 'unknown',
				authenticationProviders: 'unknown',
				languages: null,
				customJourneys: 'unknown',
			},
		} : {}),
	});
}

function migrationFamilies(inventory: Inventory): Family[] {
	return selectAnswers(inventory.questionnaire, inventory.discovery)
		.filter(answer => (answer.intent ?? (['vm', 've'].includes(answer.family)
			? 'replace-with-github'
			: 'ownership-transition')) !== 'confirm-alignment')
		.map(answer => answer.family);
}

export function applyLocalReview(input: unknown, reviewInput: unknown): Inventory {
	const inventory = structuredClone(InventorySchema.parse(input));
	const review = LocalReviewSchema.parse(reviewInput);
	const selected = selectAnswers(inventory.questionnaire, inventory.discovery);
	const migrationSet = new Set(migrationFamilies(inventory));
	const ownerUnavailable = review.ownerAvailability === 'unavailable';
	const opaque = review.customization === 'opaque' || review.integrations === 'opaque'
		|| (ownerUnavailable && (review.customization === 'bounded' || review.integrations === 'bounded'));

	for (const answer of selected) {
		if (migrationSet.has(answer.family)) {
			const evidence = familyEvidence(inventory, answer.family);
			// With named layer evidence, only products whose own components were customized are marked customized.
			const familyBounded = evidence.named
				? evidence.items.length + evidence.automations.length > 0
				: review.customization === 'bounded' || review.integrations === 'bounded';
			answer.customization = opaque ? 'opaque'
				: (review.customization === 'bounded' || review.integrations === 'bounded') && familyBounded ? 'customized'
					: review.customization === 'none' || (evidence.named && review.customization === 'bounded') ? 'standard'
						: 'unknown';
			answer.integrations = ['none', 'bounded'].includes(review.integrations) ? 'reviewed' : 'unknown';
			answer.validation = review.sandboxAndTests === 'ready' ? 'ready' : 'unknown';
		}
		answer.basis = `Local guided review: customization ${review.customization}; integrations ${review.integrations}; owner ${review.ownerAvailability}; sandbox/tests ${review.sandboxAndTests}.`;
		if (answer.family === 've' && review.ve) {
			answer.veSource = review.ve.source;
			answer.veAuthenticationProviders = review.ve.authenticationProviders;
			answer.veLanguages = review.ve.languages;
			answer.veCustomJourneys = review.ve.customJourneys;
			if (review.ve.customJourneys === 'present' && answer.customization !== 'opaque') {
				answer.customization = 'customized';
			}
		}
	}
	inventory.questionnaire.operations = {
		ownerAvailability: review.ownerAvailability,
		sandboxAndTests: review.sandboxAndTests,
		reviewedAt: review.reviewedAt,
	};
	return InventorySchema.parse(inventory);
}