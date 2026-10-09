import { z } from 'zod';

export const VERSION = '0.5.0';
export const SUPPORTED_INVENTORY_VERSIONS = ['0.1.0', '0.2.0', '0.3.0', '0.4.0', VERSION] as const;
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
	truncated: z.boolean(),
});
export const DependencySummarySchema = z.strictObject({
	checkedComponents: CountMetricSchema,
	dependentReferences: CountMetricSchema,
	truncated: z.boolean(),
});
export const IntegrationSummarySchema = z.strictObject({
	workflows: CountMetricSchema.nullable(),
	connectionReferences: CountMetricSchema.nullable(),
	pluginAssemblies: CountMetricSchema.nullable(),
	pluginSteps: CountMetricSchema.nullable(),
	truncated: z.boolean(),
});
export const CountSummarySchema = z.strictObject({
	tables: z.array(z.strictObject({
		logicalName: IdentifierSchema,
		count: CountMetricSchema,
		accuracy: z.literal('snapshot-within-24-hours'),
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
	customization: z.enum(['unknown', 'standard', 'customized']),
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

export const PHASES = [
	'investigation', 'preparation', 'sandbox', 'customization', 'integration',
	'validation', 'acceptance', 'production', 'post-cutover',
] as const;
export const PhaseSchema = z.enum(PHASES);
export type Phase = z.infer<typeof PhaseSchema>;
export const RangeSchema = z.strictObject({
	min: z.number().finite().nonnegative(),
	max: z.number().finite().nonnegative(),
	unit: z.literal('person-hours'),
}).refine(value => value.min <= value.max, 'Range minimum exceeds maximum');
export type EffortRange = z.infer<typeof RangeSchema>;
export const DurationRangeSchema = z.strictObject({
	min: z.number().finite().nonnegative(),
	max: z.number().finite().nonnegative(),
	unit: z.literal('hours'),
}).refine(value => value.min <= value.max, 'Range minimum exceeds maximum');
export type DurationRange = z.infer<typeof DurationRangeSchema>;
export const ComplexitySchema = z.enum(['likely-standard', 'standard', 'moderate', 'heavy', 'unbounded', 'unknown']);
export type Complexity = z.infer<typeof ComplexitySchema>;
export const EffortBandSchema = z.enum(['none', 'low', 'medium', 'high', 'review-required']);
export type EffortBand = z.infer<typeof EffortBandSchema>;

export const WorkRequestSchema = z.strictObject({
	id: IdentifierSchema,
	families: z.array(FamilySchema).min(1),
	kind: z.enum(['customization', 'integration', 'risk']),
	phase: PhaseSchema,
	environment: IdentifierSchema,
	occurrenceId: IdentifierSchema,
	activity: IdentifierSchema,
	component: IdentifierSchema,
	ruleId: IdentifierSchema,
	scenario: IdentifierSchema,
	dependsOn: z.array(IdentifierSchema),
	impact: z.enum(['bounded', 'unbounded']),
	basis: z.string().min(1).max(300),
});
export type WorkRequest = z.infer<typeof WorkRequestSchema>;

export const OperationalReviewSchema = z.strictObject({
	ownerAvailability: z.enum(['available', 'unavailable', 'unknown']),
	sandboxAndTests: z.enum(['ready', 'partial', 'unavailable', 'unknown']),
	maxInterruptionHours: z.number().finite().nonnegative().max(168).nullable(),
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
	work: z.array(WorkRequestSchema),
}).superRefine((value, ctx) => {
	const families = value.answers.map(item => item.family);
	if (new Set(families).size !== families.length) {
		ctx.addIssue({ code: 'custom', message: 'Duplicate family answers', path: ['answers'] });
	}
	const names = value.target.solutions.map(item => item.uniqueName);
	if (new Set(names).size !== names.length) {
		ctx.addIssue({ code: 'custom', message: 'Duplicate target identity', path: ['target', 'solutions'] });
	}
	const ids = value.work.map(item => item.id);
	if (new Set(ids).size !== ids.length) {
		ctx.addIssue({ code: 'custom', message: 'Duplicate work identifier', path: ['work'] });
	}
	for (const item of value.work) {
		if (['shared.preparation', ...FAMILIES.flatMap(family => PHASES.map(phase => `${family}.${phase}`))].includes(item.id)) {
			ctx.addIssue({ code: 'custom', message: 'Work identifier is reserved for generated baseline work', path: ['work'] });
		}
		if (new Set(item.families).size !== item.families.length
			|| item.families.some(family => !families.includes(family))) {
			ctx.addIssue({ code: 'custom', message: 'Work scope must reference distinct selected families', path: ['work'] });
		}
		if (item.kind !== 'risk' && item.scenario !== 'assessed') {
			ctx.addIssue({ code: 'custom', message: 'Remediation must be in the assessed scenario', path: ['work'] });
		}
		if (item.kind === 'risk' && ['baseline', 'assessed'].includes(item.scenario)) {
			ctx.addIssue({ code: 'custom', message: 'Risk requires a named adverse scenario', path: ['work'] });
		}
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

export const RuleBookSchema = z.strictObject({
	version: IdentifierSchema,
	status: z.enum(['assumed', 'reviewed']),
	rates: z.array(z.strictObject({
		id: IdentifierSchema,
		workId: IdentifierSchema,
		families: z.array(FamilySchema).min(1),
		routeIds: z.array(IdentifierSchema).min(1),
		complexities: z.array(ComplexitySchema).min(1),
		effort: RangeSchema,
		elapsed: DurationRangeSchema.nullable(),
		execution: DurationRangeSchema.nullable(),
		downtime: DurationRangeSchema.nullable(),
		estimateType: z.enum(['uncalibrated-assumption', 'provisional-typical']),
		basis: z.string().min(1).max(300),
		limitations: z.array(z.string().min(1).max(300)).min(1),
		reviewer: z.string().trim().min(1).max(100).nullable(),
		reviewedAt: TimestampSchema.nullable(),
		reviewed: z.boolean(),
	})),
}).superRefine((value, ctx) => {
	const ids = value.rates.map(rate => rate.id);
	if (new Set(ids).size !== ids.length) {
		ctx.addIssue({ code: 'custom', message: 'Duplicate rule identifiers', path: ['rates'] });
	}
	for (const [index, rate] of value.rates.entries()) {
		if (new Set(rate.families).size !== rate.families.length
			|| new Set(rate.routeIds).size !== rate.routeIds.length
			|| new Set(rate.complexities).size !== rate.complexities.length) {
			ctx.addIssue({ code: 'custom', message: 'Rule applicability values must be distinct', path: ['rates', index] });
		}
		const reviewed = value.status === 'reviewed' && rate.estimateType === 'provisional-typical'
			&& rate.reviewed && rate.reviewer !== null && rate.reviewedAt !== null;
		const assumed = value.status === 'assumed' && rate.estimateType === 'uncalibrated-assumption'
			&& !rate.reviewed && rate.reviewer === null && rate.reviewedAt === null;
		if (!reviewed && !assumed) {
			ctx.addIssue({ code: 'custom', message: 'Rule provenance must match rulebook status', path: ['rates', index] });
		}
	}
});
export type RuleBook = z.infer<typeof RuleBookSchema>;
export const RuleReviewDraftSchema = z.strictObject({
	version: IdentifierSchema,
	estimateType: z.literal('provisional-typical'),
	rates: z.array(z.strictObject({
		id: IdentifierSchema,
		workId: IdentifierSchema,
		families: z.array(FamilySchema).min(1),
		routeIds: z.array(IdentifierSchema).min(1),
		complexity: z.enum(['standard', 'moderate', 'heavy']),
		effort: RangeSchema.nullable(),
		elapsed: DurationRangeSchema.nullable(),
		execution: DurationRangeSchema.nullable(),
		downtime: DurationRangeSchema.nullable(),
		basis: z.string().max(300),
		limitations: z.array(z.string().max(300)),
		reviewer: z.string().max(100),
		reviewedAt: TimestampSchema.nullable(),
	})),
});
export type RuleReviewDraft = z.infer<typeof RuleReviewDraftSchema>;

export interface Finding {
	id: string;
	families: Family[];
	code: string;
	message: string;
	evidenceIds: string[];
	blocking: boolean;
}
export interface WorkItem {
	id: string;
	families: Family[];
	phase: Phase;
	environment: string;
	occurrenceId: string;
	activity: string;
	component: string;
	ownerRole: string;
	scenario: string;
	dependsOn: string[];
	ruleId: string;
	appliedRateId: string | null;
	ruleVersion: string;
	basis: string;
	evidenceIds: string[];
	effort: EffortRange | null;
	elapsed: DurationRange | null;
	execution: DurationRange | null;
	downtime: DurationRange | null;
	estimateType: 'uncalibrated-assumption' | 'provisional-typical' | null;
	reviewer: string | null;
	reviewedAt: string | null;
	limitations: string[];
	unknownReason: string | null;
}
export interface ScenarioEstimate {
	id: string;
	workItemIds: string[];
	knownSubtotal: EffortRange;
	total: EffortRange | null;
	excludedWorkItemIds: string[];
	reasons: string[];
	elapsed: DurationRange | null;
	execution: DurationRange | null;
	downtime: DurationRange | null;
	timingReason: string;
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
	scenarios: ScenarioEstimate[];
}
export interface Assessment {
	schemaVersion: '1.0';
	toolVersion: string;
	routeCatalogVersion: string;
	rulesVersion: string;
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
	workItems: WorkItem[];
	combined: ScenarioEstimate[];
}

const FindingSchema: z.ZodType<Finding> = z.strictObject({
	id: z.string(), families: z.array(FamilySchema), code: z.string(), message: z.string(),
	evidenceIds: z.array(z.string()), blocking: z.boolean(),
});
const WorkItemSchema: z.ZodType<WorkItem> = z.strictObject({
	id: z.string(), families: z.array(FamilySchema), phase: PhaseSchema,
	environment: z.string(), occurrenceId: z.string(), activity: z.string(), component: z.string(),
	ownerRole: z.string(), scenario: z.string(), dependsOn: z.array(z.string()),
	ruleId: z.string(), appliedRateId: z.string().nullable(),
	ruleVersion: z.string(), basis: z.string(), evidenceIds: z.array(z.string()),
	effort: RangeSchema.nullable(),
	elapsed: DurationRangeSchema.nullable(), execution: DurationRangeSchema.nullable(),
	downtime: DurationRangeSchema.nullable(),
	estimateType: z.enum(['uncalibrated-assumption', 'provisional-typical']).nullable(),
	reviewer: z.string().nullable(), reviewedAt: TimestampSchema.nullable(),
	limitations: z.array(z.string()), unknownReason: z.string().nullable(),
});
const ScenarioSchema: z.ZodType<ScenarioEstimate> = z.strictObject({
	id: z.string(), workItemIds: z.array(z.string()), knownSubtotal: RangeSchema,
	total: RangeSchema.nullable(), excludedWorkItemIds: z.array(z.string()), reasons: z.array(z.string()),
	elapsed: DurationRangeSchema.nullable(), execution: DurationRangeSchema.nullable(),
	downtime: DurationRangeSchema.nullable(), timingReason: z.string(),
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
	confidence: z.enum(['low', 'medium', 'not-estimable']), guide: z.url(), scenarios: z.array(ScenarioSchema),
});
export const AssessmentSchema: z.ZodType<Assessment> = z.strictObject({
	schemaVersion: z.literal('1.0'), toolVersion: z.string(), routeCatalogVersion: z.string(),
	rulesVersion: z.string(), assessmentId: z.string(), assessedAt: TimestampSchema,
	environment: z.string(), environmentUrl: z.url(),
	environmentProfile: z.strictObject({
		type: z.enum(['production', 'sandbox', 'trial', 'developer', 'unknown']),
		region: z.string(),
		managedEnvironment: z.enum(['yes', 'no', 'unknown']),
		accessRestriction: z.enum(['security-group', 'unrestricted', 'unknown']),
		dataverseVersion: ObservedVersionSchema.nullable(),
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
	routes: z.array(RouteResultSchema), workItems: z.array(WorkItemSchema), combined: z.array(ScenarioSchema),
});
