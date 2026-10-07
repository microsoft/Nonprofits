import { readFileSync } from 'node:fs';
import { z } from 'zod';
import {
	FAMILIES, FamilySchema, type Complexity, type DurationRange, type EffortRange, type Family, type RuleBook,
} from './contracts.js';

export const CATALOG_VERSION = 'candidate-0.1';
const PUBLIC_ROOT = 'https://github.com/microsoft/Nonprofits/blob/';
export interface Route {
	family: Family;
	id: string;
	source: string;
	target: string;
	publisher: string;
	prefix: string;
	prerequisites: Family[];
	guidePath: string;
}
const template = {
	publisher: 'microsofttechforsocialimpact',
	prerequisites: ['cdm'] as Family[],
	guidePath: 'Documents/ppac-to-github-migration.md',
};
export const ROUTES: readonly Route[] = [
	{ family: 'cdm', id: 'cdm-in-place', source: 'NonprofitCore', target: 'NonprofitCore',
		publisher: 'microsoftdynamics365nonprofitaccelerator', prefix: 'msnfp',
		prerequisites: [], guidePath: template.guidePath },
	{ ...template, family: 'fundraising', id: 'fundraising-in-place',
		source: 'SocialImpactFundraising', target: 'SocialImpactFundraising', prefix: 'sifund' },
	{ ...template, family: 'grants', id: 'grants-in-place',
		source: 'SocialImpactGrants', target: 'SocialImpactGrants', prefix: 'signt' },
	{ ...template, family: 'outcomes', id: 'outcomes-in-place',
		source: 'SocialImpactOutcomes', target: 'SocialImpactOutcomes', prefix: 'sioutc' },
	{ ...template, family: 'vm', id: 'vm-side-by-side',
		source: 'VolunteerManagement', target: 'volunteermanagementos', prefix: 'msnfp',
		guidePath: 'VolunteerManagement/MIGRATION.md' },
	{ ...template, family: 've', id: 've-legacy-to-spa',
		source: 'VolunteerEngagement', target: 'Portal-EDM', prefix: 'msnfp',
		prerequisites: ['cdm', 'vm'], guidePath: 'VolunteerEngagement/MIGRATION.md' },
];
export function guideUrl(route: Route, commit: string): string {
	return `${PUBLIC_ROOT}${commit}/${route.guidePath}`;
}
export function compareVersions(left: string, right: string): number {
	const a = left.split('.').map(BigInt);
	const b = right.split('.').map(BigInt);
	for (let i = 0; i < 4; i++) {
		if (a[i]! !== b[i]!) {
			return a[i]! < b[i]! ? -1 : 1;
		}
	}
	return 0;
}
const PairSchema = z.tuple([z.number().finite().nonnegative(), z.number().finite().nonnegative()])
	.refine(value => value[0] <= value[1]);
const AssumptionSchema = z.strictObject({
	effort: PairSchema,
	elapsed: PairSchema,
	execution: PairSchema.optional(),
	downtime: PairSchema.optional(),
});
type Assumption = z.infer<typeof AssumptionSchema>;
const AssumptionCatalogSchema = z.strictObject({
	schemaVersion: z.literal('1.0'),
	version: z.string().min(1),
	status: z.literal('assumed'),
	owner: z.string().min(1),
	basis: z.string().min(1),
	limitations: z.array(z.string().min(1)).min(1),
	sharedPreparation: AssumptionSchema,
	routes: z.record(FamilySchema, z.record(z.string(), AssumptionSchema)),
	scopedWork: z.strictObject({
		customization: z.strictObject({
			moderate: AssumptionSchema,
			heavy: AssumptionSchema,
		}),
		integration: z.strictObject({
			moderate: AssumptionSchema,
			heavy: AssumptionSchema,
		}),
		risk: z.strictObject({
			bounded: AssumptionSchema,
		}),
	}),
});
const assumptionCatalog = AssumptionCatalogSchema.parse(JSON.parse(readFileSync(
	new URL('../../catalog/assumptions.json', import.meta.url),
	'utf8',
)) as unknown);

const ASSUMED_COMPLEXITIES: Complexity[] = ['likely-standard', 'standard', 'moderate', 'heavy'];
const SHARED_COMPLEXITIES: Complexity[] = [...ASSUMED_COMPLEXITIES, 'unknown'];
const effort = ([min, max]: [number, number]): EffortRange => ({ min, max, unit: 'person-hours' });
const duration = (value: [number, number] | undefined): DurationRange | null =>
	value === undefined ? null : { min: value[0], max: value[1], unit: 'hours' };

const baselineRates: RuleBook['rates'] = ROUTES.flatMap(route =>
	Object.entries(assumptionCatalog.routes[route.family]).map(([phase, value]) => ({
		id: `${route.family}.${phase}.assumed`,
		workId: `${route.family}.${phase}`,
		families: [route.family],
		routeIds: [route.id],
		complexities: ASSUMED_COMPLEXITIES,
		effort: effort(value.effort),
		elapsed: duration(value.elapsed),
		execution: duration(value.execution),
		downtime: duration(value.downtime),
		estimateType: 'uncalibrated-assumption' as const,
		basis: assumptionCatalog.basis,
		limitations: assumptionCatalog.limitations,
		reviewer: null,
		reviewedAt: null,
		reviewed: false,
	})));

const scopedRate = (
	workId: 'custom' | 'integration' | 'risk',
	complexities: Complexity[],
	value: Assumption,
	suffix: string,
): RuleBook['rates'][number] => ({
	id: `${workId}.${suffix}.assumed`,
	workId,
	families: [...FAMILIES],
	routeIds: ROUTES.map(route => route.id),
	complexities,
	effort: effort(value.effort),
	elapsed: duration(value.elapsed),
	execution: null,
	downtime: null,
	estimateType: 'uncalibrated-assumption',
	basis: 'Conservative engineering allowance for one explicitly scoped work occurrence; not measured migration data.',
	limitations: ['One occurrence only; opaque or unbounded work must remain unestimated.'],
	reviewer: null,
	reviewedAt: null,
	reviewed: false,
});

export const DEFAULT_RULES: RuleBook = {
	version: assumptionCatalog.version,
	status: 'assumed',
	rates: [
		{
			id: 'shared.preparation.assumed',
			workId: 'shared.preparation',
			families: [...FAMILIES],
			routeIds: ROUTES.map(route => route.id),
			complexities: SHARED_COMPLEXITIES,
			effort: effort(assumptionCatalog.sharedPreparation.effort),
			elapsed: duration(assumptionCatalog.sharedPreparation.elapsed),
			execution: null,
			downtime: null,
			estimateType: 'uncalibrated-assumption',
			basis: assumptionCatalog.basis,
			limitations: assumptionCatalog.limitations,
			reviewer: null,
			reviewedAt: null,
			reviewed: false,
		},
		...baselineRates,
		scopedRate('custom', ['moderate'], assumptionCatalog.scopedWork.customization.moderate, 'moderate'),
		scopedRate('custom', ['heavy'], assumptionCatalog.scopedWork.customization.heavy, 'heavy'),
		scopedRate('integration', ['moderate'], assumptionCatalog.scopedWork.integration.moderate, 'moderate'),
		scopedRate('integration', ['heavy'], assumptionCatalog.scopedWork.integration.heavy, 'heavy'),
		scopedRate('risk', ASSUMED_COMPLEXITIES, assumptionCatalog.scopedWork.risk.bounded, 'bounded'),
	],
};
