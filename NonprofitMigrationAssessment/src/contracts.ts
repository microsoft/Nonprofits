import { z } from 'zod';

export const VERSION = '0.6.0';
export const SUPPORTED_INVENTORY_VERSIONS = [VERSION] as const;
export const FAMILIES = ['cdm', 'fundraising', 'grants', 'outcomes', 'vm', 've'] as const;
export const FamilySchema = z.enum(FAMILIES);
export type Family = z.infer<typeof FamilySchema>;
export const DISCOVERY_CATEGORIES = [
	'environment', 'solutions', 'components', 'dependencies', 'integrations', 'counts', 'sites',
] as const;
export const DiscoveryCategorySchema = z.enum(DISCOVERY_CATEGORIES);
export type DiscoveryCategory = z.infer<typeof DiscoveryCategorySchema>;
export const IdentifierSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/);
export const TimestampSchema = z.iso.datetime();
export const GuidSchema = z.string().regex(
	/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
);
export const VersionSchema = z.string().regex(/^\d+\.\d+\.\d+\.\d+$/);
export const ObservedVersionSchema = z.string().trim().min(1).max(100)
	.regex(/^[a-zA-Z0-9._-]+$/);
export const EvidenceStatusSchema = z.enum([
	'observed', 'confirmed-absent', 'unknown', 'access-denied', 'partial', 'not-applicable', 'error',
]);
export const EvidenceSchema = z.strictObject({
	id: IdentifierSchema,
	source: z.enum(['observed', 'customer-reported', 'derived', 'not-collected']),
	status: EvidenceStatusSchema,
	collectedAt: TimestampSchema.nullable(),
	collector: IdentifierSchema,
	scope: IdentifierSchema,
	inputs: z.array(IdentifierSchema),
	reason: z.string().max(300),
}).superRefine((value, ctx) => {
	if (value.source === 'not-collected' && value.collectedAt !== null) {
		ctx.addIssue({ code: 'custom', message: 'Uncollected evidence cannot have a collection timestamp', path: ['collectedAt'] });
	}
	if (value.source !== 'not-collected' && value.collectedAt === null) {
		ctx.addIssue({ code: 'custom', message: 'Collected evidence requires a timestamp', path: ['collectedAt'] });
	}
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const SolutionSchema = z.strictObject({
	solutionId: GuidSchema.optional(),
	uniqueName: IdentifierSchema,
	version: ObservedVersionSchema,
	managed: z.boolean(),
	publisher: IdentifierSchema,
	publisherPrefix: z.string().regex(/^[a-zA-Z0-9_]{0,30}$/),
});
export const TargetSolutionSchema = z.strictObject({
	uniqueName: IdentifierSchema,
	version: VersionSchema,
	managed: z.boolean(),
	publisher: IdentifierSchema,
	prefix: z.string().regex(/^[a-zA-Z0-9_]{1,30}$/),
});
export type Solution = z.infer<typeof SolutionSchema>;

const CountMetricSchema = z.number().int().nonnegative();
export const EnvironmentObservationSchema = z.strictObject({
	dataverseVersion: ObservedVersionSchema,
	name: z.string().trim().min(1).max(200).optional(),
});
export const ComponentSummarySchema = z.strictObject({
	relevantSolutions: CountMetricSchema,
	relevantComponents: CountMetricSchema,
	componentTypes: z.array(z.strictObject({
		type: z.number().int().nonnegative(),
		count: CountMetricSchema,
	})),
	unmanagedSolutions: CountMetricSchema,
	analyzedUnmanagedSolutions: CountMetricSchema,
	overlappingUnmanagedComponents: CountMetricSchema,
	productSummaries: z.array(z.strictObject({
		uniqueName: IdentifierSchema,
		componentCount: CountMetricSchema,
		overlappingCustomizationComponents: CountMetricSchema,
		customizationSolutions: z.array(IdentifierSchema),
	})).optional(),
	customizationCandidates: z.array(z.strictObject({
		uniqueName: IdentifierSchema,
		managed: z.boolean(),
		publisher: IdentifierSchema,
		componentCount: CountMetricSchema,
		componentTypes: z.array(z.strictObject({
			type: z.number().int().nonnegative(),
			count: CountMetricSchema,
		})),
		overlaps: z.array(z.strictObject({
			productUniqueName: IdentifierSchema,
			componentCount: CountMetricSchema,
		})),
	})).optional(),
	customizationComponents: z.array(z.strictObject({
		type: z.number().int().nonnegative(),
		objectId: GuidSchema,
		name: z.string().trim().min(1).max(200),
		nameSource: z.enum(['observed', 'identifier']),
		customizationSolutions: z.array(IdentifierSchema).min(1),
		productUniqueNames: z.array(IdentifierSchema).min(1),
	})).optional(),
	layerCustomizations: z.array(z.strictObject({
		productUniqueNames: z.array(IdentifierSchema).min(1),
		table: IdentifierSchema.nullable(),
		tableDisplayName: z.string().trim().min(1).max(200).nullable(),
		type: z.number().int().nonnegative(),
		objectId: GuidSchema,
		name: z.string().trim().min(1).max(200),
		displayName: z.string().trim().min(1).max(200).nullable(),
		change: z.enum(['added', 'modified', 'unknown']),
		layer: z.enum(['active', 'managed-solution']),
		solutions: z.array(IdentifierSchema),
		relatedTable: z.string().trim().min(1).max(200).nullable(),
	})).max(1_000).optional(),
	layerScan: z.strictObject({
		status: z.enum(['complete', 'partial', 'unavailable']),
		productTables: CountMetricSchema,
		checkedTables: CountMetricSchema,
		solutionTables: CountMetricSchema,
		checkedSolutionTables: CountMetricSchema,
	}).optional(),
	truncated: z.boolean(),
});
export const DependencySummarySchema = z.strictObject({
	checkedComponents: CountMetricSchema,
	dependentReferences: CountMetricSchema,
	scope: z.literal('direct-customization-overlaps').optional(),
	candidateComponents: CountMetricSchema.optional(),
	edges: z.array(z.strictObject({
		requiredComponent: z.strictObject({
			type: z.number().int().nonnegative(),
			objectId: GuidSchema,
			name: z.string().trim().min(1).max(200),
		}),
		dependentComponent: z.strictObject({
			type: z.number().int().nonnegative(),
			objectId: GuidSchema,
			name: z.string().trim().min(1).max(200).nullable(),
		}),
		dependencyType: z.number().int().nonnegative(),
	})).max(2_000).optional(),
	truncated: z.boolean(),
});
export const IntegrationSummarySchema = z.strictObject({
	workflows: CountMetricSchema.nullable(),
	connectionReferences: CountMetricSchema.nullable(),
	pluginAssemblies: CountMetricSchema.nullable(),
	pluginSteps: CountMetricSchema.nullable(),
	scope: z.literal('selected-products-and-overlapping-customizations').optional(),
	scopedSolutions: CountMetricSchema.optional(),
	automations: z.array(z.strictObject({
		kind: z.enum(['plugin-step', 'process', 'cloud-flow']),
		name: z.string().trim().min(1).max(200),
		detail: z.string().trim().min(1).max(200),
		tables: z.array(IdentifierSchema).min(1),
		tableDisplayNames: z.array(z.string().trim().min(1).max(200)),
		productUniqueNames: z.array(IdentifierSchema).min(1),
		layer: z.enum(['active', 'managed-solution']),
		solution: IdentifierSchema.nullable(),
		enabled: z.boolean().nullable(),
	})).max(500).optional(),
	automationScan: z.strictObject({
		status: z.enum(['complete', 'partial', 'unavailable']),
		tables: CountMetricSchema,
		cloudFlows: CountMetricSchema,
		checkedCloudFlows: CountMetricSchema,
	}).optional(),
	truncated: z.boolean(),
});
export const CountSummarySchema = z.strictObject({
	tables: z.array(z.strictObject({
		logicalName: IdentifierSchema,
		count: CountMetricSchema,
		accuracy: z.literal('snapshot-within-24-hours'),
		products: z.array(IdentifierSchema).optional(),
	})),
	truncated: z.boolean(),
});
export const SiteSummarySchema = z.strictObject({
	legacySites: CountMetricSchema.nullable(),
	enhancedSites: CountMetricSchema.nullable(),
	truncated: z.boolean(),
});

export const DiscoverySchema = z.strictObject({
	collectedAt: TimestampSchema,
	solutions: z.array(SolutionSchema),
	environment: EnvironmentObservationSchema.optional(),
	components: ComponentSummarySchema.optional(),
	dependencies: DependencySummarySchema.optional(),
	integrations: IntegrationSummarySchema.optional(),
	counts: CountSummarySchema.optional(),
	sites: SiteSummarySchema.optional(),
	evidence: z.array(EvidenceSchema),
}).superRefine((value, ctx) => {
	for (const field of ['solutions', 'evidence'] as const) {
		const keys = field === 'solutions'
			? value.solutions.map(item => item.uniqueName.toLowerCase())
			: value.evidence.map(item => item.id);
		if (new Set(keys).size !== keys.length) {
			ctx.addIssue({ code: 'custom', message: 'Duplicate inventory identifiers', path: [field] });
		}
	}
	if (value.evidence.some(item => item.id.startsWith('answers.'))) {
		ctx.addIssue({ code: 'custom', message: 'Discovery cannot use questionnaire evidence identifiers', path: ['evidence'] });
	}
});
export type Discovery = z.infer<typeof DiscoverySchema>;

const RouteAnswerSchema = z.strictObject({
	family: FamilySchema,
	scope: z.enum(['auto', 'include', 'exclude']).optional(),
	destination: z.enum(['github-same-environment', 'cross-environment', 'other']),
	intent: z.enum([
		'confirm-alignment', 'ownership-transition', 'apply-github-release', 'replace-with-github',
	]).optional(),
	compatibility: z.enum(['unknown', 'reviewed']),
	customization: z.enum(['unknown', 'standard', 'customized', 'opaque']),
	dependencies: z.enum(['unknown', 'reviewed']),
	integrations: z.enum(['unknown', 'reviewed']),
	validation: z.enum(['unknown', 'ready']),
	veSource: z.enum(['unknown', 'legacy', 'target', 'not-applicable']),
	veAuthenticationProviders: z.enum(['unknown', 'none', 'single', 'multiple']).optional(),
	veLanguages: z.number().int().min(1).max(100).nullable().optional(),
	veCustomJourneys: z.enum(['unknown', 'none', 'present']).optional(),
	// Local customer assertions are deliberately distinct from collector observations.
	basis: z.string().max(300),
});
export const TargetSchema = z.strictObject({
	repository: z.literal('https://github.com/microsoft/Nonprofits'),
	commit: z.string().regex(/^[a-f0-9]{40}$/),
	source: z.literal('pinned-public-git-checkout'),
	files: z.array(z.strictObject({
		path: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,299}$/)
			.refine(path => !path.split('/').includes('..'), 'Target evidence path cannot traverse'),
		sha256: z.string().regex(/^[a-f0-9]{64}$/),
	})).min(1),
	solutions: z.array(TargetSolutionSchema),
}).superRefine((value, ctx) => {
	const paths = value.files.map(item => item.path);
	if (new Set(paths).size !== paths.length) {
		ctx.addIssue({ code: 'custom', message: 'Duplicate target evidence path', path: ['files'] });
	}
});

export const ComplexitySchema = z.enum(['likely-standard', 'standard', 'moderate', 'heavy', 'unbounded', 'unknown']);
export type Complexity = z.infer<typeof ComplexitySchema>;
export const EffortBandSchema = z.enum(['none', 'low', 'medium', 'high', 'review-required']);
export type EffortBand = z.infer<typeof EffortBandSchema>;

export const OperationalReviewSchema = z.strictObject({
	ownerAvailability: z.enum(['available', 'unavailable', 'unknown']),
	sandboxAndTests: z.enum(['ready', 'partial', 'unavailable', 'unknown']),
	reviewedAt: TimestampSchema,
});

export const QuestionnaireSchema = z.strictObject({
	schemaVersion: z.literal('1.0'),
	assessmentId: IdentifierSchema,
	environment: z.strictObject({
		alias: IdentifierSchema,
		url: z.url(),
		type: z.enum(['production', 'sandbox', 'trial', 'developer', 'unknown']).optional(),
		region: z.string().trim().min(1).max(100).optional(),
		managedEnvironment: z.enum(['yes', 'no', 'unknown']).optional(),
		accessRestriction: z.enum(['security-group', 'unrestricted', 'unknown']).optional(),
	}),
	consent: z.strictObject({
		readOnly: z.boolean(),
		confirmedAt: TimestampSchema,
		categories: z.array(DiscoveryCategorySchema).min(1)
			.refine(value => new Set(value).size === value.length, 'Duplicate discovery category'),
	}),
	target: TargetSchema,
	answers: z.array(RouteAnswerSchema).min(1),
	operations: OperationalReviewSchema.optional(),
}).superRefine((value, ctx) => {
	const families = value.answers.map(item => item.family);
	if (new Set(families).size !== families.length) {
		ctx.addIssue({ code: 'custom', message: 'Duplicate family answers', path: ['answers'] });
	}
	const names = value.target.solutions.map(item => item.uniqueName);
	if (new Set(names).size !== names.length) {
		ctx.addIssue({ code: 'custom', message: 'Duplicate target identity', path: ['target', 'solutions'] });
	}
});
export type Questionnaire = z.infer<typeof QuestionnaireSchema>;
export const InventorySchema = z.strictObject({
	schemaVersion: z.literal('1.0'),
	toolVersion: z.enum(SUPPORTED_INVENTORY_VERSIONS),
	questionnaire: QuestionnaireSchema,
	discovery: DiscoverySchema,
});
export type Inventory = z.infer<typeof InventorySchema>;

export interface Finding {
	id: string;
	families: Family[];
	code: string;
	message: string;
	evidenceIds: string[];
	blocking: boolean;
}
export type RouteStatus = 'eligible' | 'blocked' | 'unsupported' | 'insufficient-evidence' | 'already-at-target' | 'not-installed';
export interface RouteResult {
	family: Family;
	routeId: string;
	intent: NonNullable<Questionnaire['answers'][number]['intent']>;
	compatibility: {
		status: 'already-aligned' | 'candidate-supported' | 'blocked' | 'investigation-required' | 'unsupported';
		catalogVersion: string;
		reason: string;
	};
	complexity: {
		level: Complexity;
		reasons: string[];
		evidenceIds: string[];
	};
	status: RouteStatus;
	effortBand: EffortBand;
	confidence: 'low' | 'medium' | 'not-estimable';
	guide: string;
}
export interface Assessment {
	schemaVersion: '1.0';
	toolVersion: string;
	routeCatalogVersion: string;
	assessmentId: string;
	assessedAt: string;
	environment: string;
	environmentUrl: string;
	environmentProfile: {
		type: 'production' | 'sandbox' | 'trial' | 'developer' | 'unknown';
		region: string;
		managedEnvironment: 'yes' | 'no' | 'unknown';
		accessRestriction: 'security-group' | 'unrestricted' | 'unknown';
		dataverseVersion: string | null;
		solutionInventoryCount: number | null;
	};
	installedSolutions: Solution[];
	discoverySummary: {
		components: z.infer<typeof ComponentSummarySchema> | null;
		dependencies: z.infer<typeof DependencySummarySchema> | null;
		integrations: z.infer<typeof IntegrationSummarySchema> | null;
		counts: z.infer<typeof CountSummarySchema> | null;
		sites: z.infer<typeof SiteSummarySchema> | null;
	};
	portalProfile: {
		source: 'unknown' | 'legacy' | 'target' | 'not-applicable';
		authenticationProviders: 'unknown' | 'none' | 'single' | 'multiple';
		languages: number | null;
		customJourneys: 'unknown' | 'none' | 'present';
	};
	operations: z.infer<typeof OperationalReviewSchema> | null;
	consent: Questionnaire['consent'];
	target: Questionnaire['target'];
	status: 'complete' | 'partial' | 'no-relevant-solutions';
	limitations: string[];
	evidence: Evidence[];
	findings: Finding[];
	routes: RouteResult[];
}

const FindingSchema: z.ZodType<Finding> = z.strictObject({
	id: z.string(), families: z.array(FamilySchema), code: z.string(), message: z.string(),
	evidenceIds: z.array(z.string()), blocking: z.boolean(),
});
const RouteResultSchema: z.ZodType<RouteResult> = z.strictObject({
	family: FamilySchema, routeId: z.string(),
	intent: z.enum(['confirm-alignment', 'ownership-transition', 'apply-github-release', 'replace-with-github']),
	compatibility: z.strictObject({
		status: z.enum(['already-aligned', 'candidate-supported', 'blocked', 'investigation-required', 'unsupported']),
		catalogVersion: z.string(),
		reason: z.string(),
	}),
	complexity: z.strictObject({
		level: ComplexitySchema,
		reasons: z.array(z.string()),
		evidenceIds: z.array(z.string()),
	}),
	status: z.enum(['eligible', 'blocked', 'unsupported', 'insufficient-evidence', 'already-at-target', 'not-installed']),
	effortBand: EffortBandSchema,
	confidence: z.enum(['low', 'medium', 'not-estimable']), guide: z.url(),
});
export const AssessmentSchema: z.ZodType<Assessment> = z.strictObject({
	schemaVersion: z.literal('1.0'), toolVersion: z.string(), routeCatalogVersion: z.string(),
	assessmentId: z.string(), assessedAt: TimestampSchema,
	environment: z.string(), environmentUrl: z.url(),
	environmentProfile: z.strictObject({
		type: z.enum(['production', 'sandbox', 'trial', 'developer', 'unknown']),
		region: z.string(),
		managedEnvironment: z.enum(['yes', 'no', 'unknown']),
		accessRestriction: z.enum(['security-group', 'unrestricted', 'unknown']),
		dataverseVersion: ObservedVersionSchema.nullable(),
		solutionInventoryCount: CountMetricSchema.nullable(),
	}),
	installedSolutions: z.array(SolutionSchema),
	discoverySummary: z.strictObject({
		components: ComponentSummarySchema.nullable(),
		dependencies: DependencySummarySchema.nullable(),
		integrations: IntegrationSummarySchema.nullable(),
		counts: CountSummarySchema.nullable(),
		sites: SiteSummarySchema.nullable(),
	}),
	portalProfile: z.strictObject({
		source: z.enum(['unknown', 'legacy', 'target', 'not-applicable']),
		authenticationProviders: z.enum(['unknown', 'none', 'single', 'multiple']),
		languages: z.number().int().min(1).max(100).nullable(),
		customJourneys: z.enum(['unknown', 'none', 'present']),
	}),
	operations: OperationalReviewSchema.nullable(),
	consent: QuestionnaireSchema.shape.consent, target: TargetSchema,
	status: z.enum(['complete', 'partial', 'no-relevant-solutions']),
	limitations: z.array(z.string()), evidence: z.array(EvidenceSchema), findings: z.array(FindingSchema),
	routes: z.array(RouteResultSchema),
});