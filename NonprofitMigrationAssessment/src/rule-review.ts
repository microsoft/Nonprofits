import {
	FAMILIES, RuleBookSchema, RuleReviewDraftSchema,
	type Complexity, type Family, type RuleBook, type RuleReviewDraft,
} from './contracts.js';
import { ROUTES } from './routes.js';

const BASE_PHASES = ['sandbox', 'validation', 'acceptance', 'production', 'post-cutover'] as const;
const COMPLEXITIES = ['standard', 'moderate', 'heavy'] as const satisfies readonly Complexity[];

interface WorkTemplate {
	workId: string;
	families: Family[];
	routeIds: string[];
}

export function createRuleReviewDraft(): RuleReviewDraft {
	const templates: WorkTemplate[] = [
		{
			workId: 'shared.preparation',
			families: [...FAMILIES],
			routeIds: ROUTES.map(route => route.id),
		},
		...ROUTES.flatMap(route => BASE_PHASES.map(phase => ({
			workId: `${route.family}.${phase}`,
			families: [route.family],
			routeIds: [route.id],
		}))),
		...['custom', 'integration', 'risk'].map(workId => ({
			workId,
			families: [...FAMILIES],
			routeIds: ROUTES.map(route => route.id),
		})),
	];
	return RuleReviewDraftSchema.parse({
		version: 'provisional-typical-review-draft',
		estimateType: 'provisional-typical',
		rates: templates.flatMap(template => COMPLEXITIES.map(complexity => ({
			id: `${template.workId}.${complexity}`,
			workId: template.workId,
			families: template.families,
			routeIds: template.routeIds,
			complexity,
			effort: null,
			elapsed: null,
			execution: null,
			downtime: null,
			basis: '',
			limitations: [],
			reviewer: '',
			reviewedAt: null,
		}))),
	});
}

export function finalizeRuleReviewDraft(input: unknown): RuleBook {
	const draft = RuleReviewDraftSchema.parse(input);
	for (const rate of draft.rates) {
		const production = rate.workId.endsWith('.production');
		if (!rate.effort || !rate.elapsed || !rate.basis.trim() || rate.limitations.length === 0
			|| !rate.reviewer.trim() || !rate.reviewedAt
			|| (production && (!rate.execution || !rate.downtime))) {
			throw new Error('Every reviewed rate requires effort, elapsed time, basis, limitations, reviewer, review date, and production timing where applicable.');
		}
	}
	return RuleBookSchema.parse({
		version: draft.version,
		status: 'reviewed',
		rates: draft.rates.map(rate => ({
			id: rate.id,
			workId: rate.workId,
			families: rate.families,
			routeIds: rate.routeIds,
			complexities: [rate.complexity],
			effort: rate.effort!,
			elapsed: rate.elapsed!,
			execution: rate.execution,
			downtime: rate.downtime,
			estimateType: draft.estimateType,
			basis: rate.basis,
			limitations: rate.limitations,
			reviewer: rate.reviewer,
			reviewedAt: rate.reviewedAt!,
			reviewed: true,
		})),
	});
}
