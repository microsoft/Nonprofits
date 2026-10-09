import {
	AssessmentSchema, DISCOVERY_CATEGORIES, InventorySchema, RuleBookSchema, VERSION, VersionSchema,
	type Assessment, type Evidence, type Family, type Finding, type RouteResult,
	type WorkItem, type Phase, type Inventory, type RuleBook,
} from './contracts.js';
import { evaluateCompatibility } from './compatibility.js';
import { classifyComplexity } from './complexity.js';
import { CATALOG_VERSION, DEFAULT_RULES, ROUTES, guideUrl } from './routes.js';
import { normalizePlan, PlanError, summarizeScenario } from './planner.js';
import { selectAnswers } from './scope.js';

const AGE_LIMIT_MS = 7 * 24 * 60 * 60 * 1000;
const RULE_AGE_LIMIT_MS = 365 * 24 * 60 * 60 * 1000;
const BASE_PHASES: Phase[] = ['sandbox', 'validation', 'acceptance', 'production', 'post-cutover'];

function defaultIntent(family: Family): RouteResult['intent'] {
	return ['vm', 've'].includes(family) ? 'replace-with-github' : 'ownership-transition';
}

export function assess(
	input: unknown,
	ruleInput: unknown = DEFAULT_RULES,
	options: { now?: Date } = {},
): Assessment {
	const inventory = InventorySchema.parse(input);
	const rules = RuleBookSchema.parse(ruleInput);
	const now = options.now ?? new Date();
	if (!Number.isFinite(now.getTime())) {
		throw new Error('Assessment clock is invalid.');
	}
	const knownRouteIds = new Set(ROUTES.map(route => route.id));
	if (rules.rates.some(rate => rate.routeIds.some(routeId => !knownRouteIds.has(routeId))
		|| (rate.reviewedAt !== null && (Date.parse(rate.reviewedAt) > now.getTime()
			|| now.getTime() - Date.parse(rate.reviewedAt) > RULE_AGE_LIMIT_MS)))) {
		throw new Error('Reviewed rule applicability or review date is invalid or stale.');
	}
	const { questionnaire: q, discovery } = inventory;
	if (!q.consent.readOnly || !q.consent.categories.includes('solutions')) {
		throw new Error('Read-only assessment consent is required.');
	}
	const findings: Finding[] = [];
	const evidence: Evidence[] = discovery.evidence.map(item =>
		item.status === 'unknown' && /no collection was attempted|not collected/i.test(item.reason)
			? {
				...item,
				source: 'not-collected',
				collectedAt: null,
				collector: 'not-collected',
				reason: 'This category was not collected.',
			}
			: { ...item });
	for (const category of DISCOVERY_CATEGORIES) {
		if (!evidence.some(item => item.id === category)) {
			evidence.push({
				id: category,
				source: 'not-collected',
				status: 'unknown',
				collectedAt: null,
				collector: 'not-collected',
				scope: 'environment',
				inputs: [],
				reason: 'This category was not collected.',
			});
		}
	}
	const routes: RouteResult[] = [];
	const work: WorkItem[] = [];
	const selectedAnswers = selectAnswers(q, discovery);
	const selectedFamilies = new Set(selectedAnswers.map(answer => answer.family));
	const complexityByFamily = new Map(selectedAnswers.map(answer =>
		[answer.family, classifyComplexity(inventory, answer.family)] as const));
	const solutionEvidence = discovery.evidence.find(item => item.id === 'solutions');
	const age = now.getTime() - Date.parse(discovery.collectedAt);
	const complete = solutionEvidence?.status === 'observed' && age >= 0 && age <= AGE_LIMIT_MS
		&& solutionEvidence.collectedAt === discovery.collectedAt;
	const addFinding = (family: Family, code: string, message: string, evidenceIds: string[], blocking = true): void => {
		findings.push({ id: `${family}.${code}`, families: [family], code, message, evidenceIds, blocking });
	};
	for (const answer of selectedAnswers) {
		const route = ROUTES.find(item => item.family === answer.family)!;
		const family = answer.family;
		const source = discovery.solutions.find(item => item.uniqueName.toLowerCase() === route.source.toLowerCase());
		const os = family === 'vm'
			? discovery.solutions.find(item => item.uniqueName.toLowerCase() === route.target.toLowerCase()) : undefined;
		const target = family === 've'
			? undefined
			: q.target.solutions.find(item => item.uniqueName === route.target);
		const compatibility = evaluateCompatibility(route, answer, source, target, os);
		const answerId = `answers.${family}`;
		evidence.push({
			id: answerId, source: 'customer-reported', status: 'observed',
			collectedAt: q.consent.confirmedAt, collector: 'local-questionnaire', scope: family, inputs: [],
			reason: 'Local customer assertions; not independent compatibility verification.',
		});
		const result: RouteResult = {
			family, routeId: route.id, intent: answer.intent ?? defaultIntent(family), compatibility,
			complexity: complexityByFamily.get(family)!,
			status: 'eligible', effortBand: 'review-required', confidence: 'low',
			guide: guideUrl(route, q.target.commit), scenarios: [],
		};
		routes.push(result);
		if (compatibility.status === 'unsupported') {
			result.status = 'unsupported';
			addFinding(family, 'unsupported-route', compatibility.reason, [answerId]);
			continue;
		}
		if (!complete) {
			result.status = 'insufficient-evidence';
			addFinding(family, 'solution-inventory-incomplete',
				'Installed-solution inventory is incomplete, stale, future-dated, or unavailable. Seven days is a provisional freshness limit.',
				solutionEvidence ? ['solutions'] : []);
		}
		if (family !== 've' && !source && !os && complete && q.work.some(item => item.families.includes(family))) {
			result.status = 'insufficient-evidence';
			addFinding(family, 'absent-with-work', 'Declared remediation conflicts with absent installed solution. Reconcile the environment and work scope.', ['solutions', answerId]);
		} else if (family !== 've' && !source && !os && complete) {
			result.status = 'not-installed';
			addFinding(family, 'not-installed', 'The selected solution was not found in the complete solution inventory.', ['solutions'], false);
			continue;
		}
		if (family === 'vm' && os) {
			result.status = 'insufficient-evidence';
			addFinding(family, 'vm-transition-state', source
				? 'AppSource and OS VM coexist. Review partial migration state, controls, and registrations before estimating continuation.'
				: 'OS VM is installed, but solution identity alone does not prove migration completion. Verify controls and registrations.',
			['solutions']);
		}
		if (source && (!source.managed || source.publisher !== route.publisher)) {
			result.status = 'blocked';
			addFinding(family, 'source-identity', 'Managed status or publisher differs from the documented source identity.', ['solutions']);
		}
		const sourceVersion = source ? VersionSchema.safeParse(source.version) : undefined;
		if (sourceVersion && !sourceVersion.success) {
			result.status = 'blocked';
			addFinding(family, 'source-version', 'The installed source version is not a comparable four-part solution version.', ['solutions']);
		}
		if (family !== 've') {
			if (!target || !target.managed || target.publisher !== route.publisher || target.prefix !== route.prefix) {
				result.status = 'blocked';
				addFinding(family, 'target-identity', 'Target managed solution metadata is missing or does not match the candidate route.', [answerId]);
			}
		} else if (answer.veSource !== 'legacy') {
			result.status = 'insufficient-evidence';
			addFinding(family, 've-site-state', 'Confirm the legacy site and Enhanced Data Model destination prerequisites. Solution presence alone does not identify the site state.', [answerId]);
		}
		if (compatibility.status === 'blocked') {
			result.status = 'blocked';
			addFinding(family, 'compatibility-blocked', compatibility.reason, ['solutions', answerId]);
		} else if (compatibility.status === 'investigation-required' && result.status === 'eligible') {
			result.status = 'insufficient-evidence';
			addFinding(family, 'release-mapping-required', compatibility.reason, ['solutions', answerId]);
		}
		for (const prerequisite of route.prerequisites) {
			const prerequisiteRoute = ROUTES.find(item => item.family === prerequisite)!;
			const installed = discovery.solutions.some(item => item.uniqueName === prerequisiteRoute.source || item.uniqueName === prerequisiteRoute.target);
			if (!installed || !selectedFamilies.has(prerequisite)) {
				result.status = 'blocked';
				addFinding(family, `prerequisite-${prerequisite}`,
					`Include and review ${prerequisite} in the same assessment; prerequisite presence alone is not compatibility evidence.`,
					['solutions', answerId]);
			}
		}
		if (compatibility.status === 'already-aligned'
			&& complete
			&& !findings.some(finding => finding.blocking && finding.families.includes(family))) {
			result.status = 'already-at-target';
			addFinding(family, 'already-aligned', compatibility.reason, ['solutions', answerId], false);
			continue;
		}
		const unreviewed = answer.compatibility !== 'reviewed' || answer.dependencies !== 'reviewed'
			|| answer.integrations !== 'reviewed' || answer.validation !== 'ready'
			|| answer.customization === 'unknown' || !answer.basis.trim()
			|| now.getTime() - Date.parse(q.consent.confirmedAt) < 0
			|| now.getTime() - Date.parse(q.consent.confirmedAt) > AGE_LIMIT_MS;
		if (unreviewed) {
			const assumptionEligible = ['likely-standard', 'moderate', 'heavy'].includes(result.complexity.level)
				&& result.compatibility.status === 'candidate-supported';
			if (result.status === 'eligible' && !assumptionEligible) {
				result.status = 'insufficient-evidence';
			}
			addFinding(family, assumptionEligible ? 'assumption-based' : 'review-required',
				assumptionEligible
					? 'The planning range uses bundled likely-standard assumptions because customer/partner review is incomplete.'
					: 'Compatibility, dependency, integration, customization, and validation scope require a documented current local customer/partner review.',
				[answerId, ...(discovery.components ? ['components'] : [])],
				!assumptionEligible);
		}
		if (answer.customization === 'customized' && !q.work.some(item => item.kind === 'customization' && item.families.includes(family))) {
			result.status = 'insufficient-evidence';
			addFinding(family, 'customization-unscoped', 'Customized behavior is declared without scoped remediation work. Partner investigation is required.', [answerId]);
		}
		if (answer.customization === 'standard' && q.work.some(item => item.kind === 'customization' && item.families.includes(family))) {
			result.status = 'insufficient-evidence';
			addFinding(family, 'contradictory-customization', 'Declared standard behavior conflicts with supplied customization work; reconcile the scope.', [answerId]);
		}
	}
	const active = routes.filter(item => !['unsupported', 'not-installed', 'already-at-target'].includes(item.status));
	const activeFamilies = active.map(item => item.family);
	if (active.length > 0) {
		work.push(makeWork(inventory, rules, {
			id: 'shared.preparation', families: activeFamilies, phase: 'preparation',
			environment: 'shared-planning', occurrenceId: 'initial', activity: 'prepare',
			component: 'environment', scenario: 'baseline', dependsOn: [], ruleId: 'shared.preparation',
			evidenceIds: activeFamilies.map(family => `answers.${family}`),
			basis: 'Shared backup/recovery planning, environment preparation, and change coordination.',
		}, complexityByFamily));
	}
	for (const result of active) {
		let previous = 'shared.preparation';
		for (const phase of BASE_PHASES) {
			const id = `${result.family}.${phase}`;
			const prereqs = phase === 'production'
				? ROUTES.find(item => item.family === result.family)!.prerequisites
					.filter(family => activeFamilies.includes(family)).map(family => `${family}.production`)
				: [];
			work.push(makeWork(inventory, rules, {
				id, families: [result.family], phase,
				environment: phase === 'sandbox' || phase === 'validation' || phase === 'acceptance' ? 'sandbox' : q.environment.alias,
				occurrenceId: 'initial', activity: phase, component: result.family, scenario: 'baseline',
				dependsOn: [...new Set([previous, ...prereqs])],
				ruleId: `${result.family}.${phase}`, evidenceIds: ['solutions', `answers.${result.family}`],
				basis: 'Candidate route baseline; target compatibility and timings require review and rehearsal.',
			}, complexityByFamily));
			previous = id;
		}
	}
	for (const request of q.work) {
		const affected = request.families.filter(family => activeFamilies.includes(family));
		if (affected.length === 0) {
			continue;
		}
		const item = makeWork(inventory, rules, {
			id: request.id, families: affected, phase: request.phase, environment: request.environment,
			occurrenceId: request.occurrenceId, activity: request.activity, component: request.component,
			ruleId: request.ruleId, scenario: request.scenario, dependsOn: request.dependsOn, basis: request.basis,
			evidenceIds: affected.map(family => `answers.${family}`),
		}, complexityByFamily);
		if (request.impact === 'unbounded') {
			item.effort = null;
			item.elapsed = null;
			item.execution = null;
			item.downtime = null;
			item.estimateType = null;
			item.appliedRateId = null;
			item.reviewer = null;
			item.reviewedAt = null;
			item.unknownReason = 'Critical remediation impact remains unbounded pending specialist investigation.';
			if (request.scenario === 'assessed') {
				for (const family of affected) {
					addFinding(family, `unbounded-${request.id}`, item.unknownReason, item.evidenceIds);
					const result = routes.find(route => route.family === family)!;
					result.status = 'insufficient-evidence';
				}
			}
		}
		work.push(item);
		// Remediation gates acceptance; an alternative adverse risk does not modify the baseline DAG.
		if (request.scenario === 'assessed') {
			for (const family of affected) {
				const acceptance = work.find(entry => entry.id === `${family}.acceptance`);
				if (acceptance) {
					acceptance.dependsOn.push(item.id);
				}
			}
		}
	}
	// A dependency's unresolved impact is inherited by every selected downstream route.
	for (let pass = 0; pass < routes.length; pass++) {
		for (const result of active) {
			for (const dependency of ROUTES.find(route => route.family === result.family)!.prerequisites) {
				const prerequisite = routes.find(route => route.family === dependency);
				if (prerequisite && !['eligible', 'already-at-target'].includes(prerequisite.status)
					&& !findings.some(finding => finding.id === `${result.family}.blocked-by-${dependency}`)) {
					addFinding(result.family, `blocked-by-${dependency}`, `Unresolved prerequisite ${dependency} prevents a complete dependent estimate.`, [`answers.${dependency}`]);
					if (result.status === 'eligible') {
						result.status = 'blocked';
					}
				}
			}
		}
	}
	let normalized: WorkItem[];
	try {
		normalized = normalizePlan(work);
	} catch (error) {
		if (!(error instanceof PlanError)) {
			throw error;
		}
		normalized = work.map(item => ({
			...item,
			effort: null,
			elapsed: null,
			execution: null,
			downtime: null,
			unknownReason: 'Invalid dependency plan; arithmetic is withheld until references are reconciled.',
		}));
		for (const result of active) {
			result.status = 'blocked';
			addFinding(result.family, 'invalid-plan', error.message, []);
		}
	}
	const scenarios = ['baseline', 'assessed', ...new Set(q.work.filter(item => item.kind === 'risk').map(item => item.scenario).sort())];
	if (scenarios.length === 2) {
		scenarios.push('adverse-unscoped');
	}
	for (const route of routes) {
		const criticalEvidenceComplete = ['solutions', 'components'].every(id =>
			evidence.find(item => item.id === id)?.status === 'observed');
		route.confidence = !['eligible', 'not-installed', 'already-at-target'].includes(route.status)
			? 'not-estimable'
			: rules.status === 'reviewed' && criticalEvidenceComplete ? 'medium' : 'low';
		const blockers = findings.filter(item => item.blocking && item.families.includes(route.family)).map(item => item.message);
		route.scenarios = scenarios.map(scenario => summarizeScenario(normalized, scenario,
			[...blockers, ...(scenario === 'adverse-unscoped'
				&& !['not-installed', 'already-at-target'].includes(route.status)
				? ['Adverse risks have not been scoped.'] : [])],
			route.family));
		const assessed = route.scenarios.find(item => item.id === 'assessed');
		route.effortBand = ['already-at-target', 'not-installed'].includes(route.status)
			? 'none'
			: route.status !== 'eligible' || !assessed?.total
				? 'review-required'
				: assessed.total.max <= 80 ? 'low'
					: assessed.total.max <= 200 ? 'medium' : 'high';
	}
	const allAbsent = routes.every(route => route.status === 'not-installed');
	const allResolvedWithoutMigration = routes.length > 0
		&& routes.every(route => ['not-installed', 'already-at-target'].includes(route.status));
	const combined = scenarios.map(scenario => summarizeScenario(normalized, scenario, [
		...findings.filter(item => item.blocking).map(item => item.message),
		...(scenario === 'adverse-unscoped' && active.length > 0 ? ['Adverse risks have not been scoped.'] : []),
	]));
	const assessedCombined = combined.find(item => item.id === 'assessed');
	const assessmentComplete = !findings.some(item => item.blocking) && assessedCombined?.total != null;
	return AssessmentSchema.parse({
		schemaVersion: '1.0', toolVersion: VERSION, routeCatalogVersion: CATALOG_VERSION,
		rulesVersion: rules.version, assessmentId: q.assessmentId, assessedAt: now.toISOString(),
		environment: q.environment.alias,
		environmentProfile: {
			type: q.environment.type ?? 'unknown',
			region: q.environment.region ?? 'unknown',
			managedEnvironment: q.environment.managedEnvironment ?? 'unknown',
			accessRestriction: q.environment.accessRestriction ?? 'unknown',
			dataverseVersion: discovery.environment?.dataverseVersion ?? null,
		},
		installedSolutions: discovery.solutions.filter(solution => selectedAnswers.some(answer => {
			const route = ROUTES.find(item => item.family === answer.family)!;
			return [route.source, route.target].some(name => name.toLowerCase() === solution.uniqueName.toLowerCase());
		})).map(({ solutionId: _solutionId, ...solution }) => solution),
		discoverySummary: {
			components: discovery.components ?? null,
			dependencies: discovery.dependencies ?? null,
			integrations: discovery.integrations ?? null,
			counts: discovery.counts ?? null,
			sites: discovery.sites ?? null,
		},
		portalProfile: (() => {
			const ve = selectedAnswers.find(answer => answer.family === 've');
			return {
				source: ve?.veSource ?? 'not-applicable',
				authenticationProviders: ve?.veAuthenticationProviders ?? 'unknown',
				languages: ve?.veLanguages ?? null,
				customJourneys: ve?.veCustomJourneys ?? 'unknown',
			};
		})(),
		operations: q.operations ?? null,
		consent: q.consent, target: q.target,
		status: allAbsent ? 'no-relevant-solutions'
			: allResolvedWithoutMigration || assessmentComplete ? 'complete' : 'partial',
		limitations: [
			'Planning output, not a migration approval or guarantee. Validate compatibility and timing with the implementation partner.',
			'Bundled numeric ranges are uncalibrated engineering assumptions, not measured averages or statistical percentiles.',
			'Component overlap, dependency references, integration registrations, counts, and site totals are bounded metadata signals; they do not prove behavioral compatibility or absence of undiscoverable dependencies.',
			'Environment type, region, Managed Environment state, access restriction, and questionnaire answers are customer assertions unless separately marked as observed.',
			'Customer answers remain assertions. CLI execution verifies target manifests and guides against the pinned public Git commit; direct library callers must perform equivalent verification.',
			'Elapsed time, execution duration, and downtime use assumption or reviewed ranges until representative rehearsal and scheduling validation replace them.',
			'No migration, deployment, backup, permission change, or business-data retrieval was performed.',
		],
		evidence, findings, routes, workItems: normalized, combined,
	});
}

function makeWork(
	inventory: Inventory,
	rules: RuleBook,
	input: Omit<WorkItem,
		'effort' | 'elapsed' | 'execution' | 'downtime' | 'estimateType' | 'reviewer' | 'reviewedAt'
		| 'limitations' | 'unknownReason' | 'appliedRateId' | 'ruleVersion' | 'ownerRole'>,
	complexityByFamily: Map<Family, RouteResult['complexity']>,
): WorkItem {
	const routeIds = input.families.map(family => ROUTES.find(route => route.family === family)!.id);
	const rate = rules.rates.find(item => item.workId === input.ruleId
		&& input.families.every(family => item.families.includes(family))
		&& routeIds.every(routeId => item.routeIds.includes(routeId))
		&& input.families.every(family => item.complexities.includes(complexityByFamily.get(family)!.level)));
	return {
		...input,
		ownerRole: input.phase === 'acceptance' ? 'customer-acceptance-owner' : 'migration-partner',
		appliedRateId: rate?.id ?? null,
		ruleVersion: rules.version,
		effort: rate ? { ...rate.effort } : null,
		elapsed: rate?.elapsed ? { ...rate.elapsed } : null,
		execution: rate?.execution ? { ...rate.execution } : null,
		downtime: rate?.downtime ? { ...rate.downtime } : null,
		estimateType: rate?.estimateType ?? null,
		reviewer: rate?.reviewer ?? null,
		reviewedAt: rate?.reviewedAt ?? null,
		limitations: rate ? [...rate.limitations] : [],
		unknownReason: rate ? null : 'No reviewed applicable timing rule; obtain a partner estimate or rehearsal measurement.',
		basis: `${input.basis}${rate ? ` Rate basis: ${rate.basis}` : ''} Target: ${inventory.questionnaire.target.commit}.`,
	};
}
