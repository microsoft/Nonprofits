import {
	AssessmentSchema, DISCOVERY_CATEGORIES, InventorySchema, VERSION, VersionSchema,
	type Assessment, type Complexity, type EffortBand, type Evidence, type Family, type Finding, type RouteResult,
} from './contracts.js';
import { DRAFT_MAPPING_REASON, evaluateCompatibility } from './compatibility.js';
import { classifyComplexity } from './complexity.js';
import { CATALOG_VERSION, FAMILY_NAMES, ROUTES, guideUrl } from './routes.js';
import { selectAnswers } from './scope.js';

const AGE_LIMIT_MS = 7 * 24 * 60 * 60 * 1000;

function defaultIntent(family: Family): RouteResult['intent'] {
	return ['vm', 've'].includes(family) ? 'replace-with-github' : 'ownership-transition';
}

// Relative effort is a deterministic rule over route type and complexity; it is never a time estimate.
function relativeEffort(family: Family, complexity: Complexity): EffortBand {
	if (['unknown', 'unbounded'].includes(complexity)) {
		return 'review-required';
	}
	const replacement = family === 'vm' || family === 've';
	if (complexity === 'heavy') {
		return 'high';
	}
	if (complexity === 'moderate') {
		return replacement ? 'high' : 'medium';
	}
	return replacement ? 'medium' : 'low';
}

export function assess(input: unknown, options: { now?: Date; releaseCatalogApproved?: boolean } = {}): Assessment {
	const inventory = InventorySchema.parse(input);
	const now = options.now ?? new Date();
	if (!Number.isFinite(now.getTime())) {
		throw new Error('Assessment clock is invalid.');
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
	const selectedAnswers = selectAnswers(q, discovery);
	const selectedFamilies = new Set(selectedAnswers.map(answer => answer.family));
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
		const compatibility = evaluateCompatibility(route, answer, source, target, os, options.releaseCatalogApproved);
		const answerId = `answers.${family}`;
		evidence.push({
			id: answerId, source: 'customer-reported', status: 'observed',
			collectedAt: q.consent.confirmedAt, collector: 'local-questionnaire', scope: family, inputs: [],
			reason: 'Answers from the local customer or partner review; not checked independently.',
		});
		const result: RouteResult = {
			family, routeId: route.id, intent: answer.intent ?? defaultIntent(family), compatibility,
			complexity: classifyComplexity(inventory, family),
			status: 'eligible', effortBand: 'review-required', confidence: 'low',
			guide: guideUrl(route, q.target.commit),
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
				'The list of installed solutions is incomplete, more than seven days old, or couldn\'t be read.',
				solutionEvidence ? ['solutions'] : []);
		}
		if (family !== 've' && !source && !os && complete) {
			result.status = 'not-installed';
			addFinding(family, 'not-installed', 'This product isn\'t installed in the environment.', ['solutions'], false);
			continue;
		}
		if (family === 'vm' && os) {
			result.status = 'insufficient-evidence';
			addFinding(family, 'vm-transition-state', source
				? 'Both the original and the GitHub Volunteer Management solutions are installed. Check how far the migration got, including controls and plug-in registrations, before planning the rest.'
				: 'The GitHub Volunteer Management solution is installed, but that alone doesn\'t show the migration is finished. Check controls and plug-in registrations.',
			['solutions']);
		}
		if (source && (!source.managed || source.publisher !== route.publisher)) {
			result.status = 'blocked';
			addFinding(family, 'source-identity', 'The installed solution isn\'t the managed Microsoft version that the migration guide expects.', ['solutions']);
		}
		const sourceVersion = source ? VersionSchema.safeParse(source.version) : undefined;
		if (sourceVersion && !sourceVersion.success) {
			result.status = 'blocked';
			addFinding(family, 'source-version', 'The installed version number isn\'t in the expected four-part format, so it can\'t be compared.', ['solutions']);
		}
		if (family !== 've') {
			if (!target || !target.managed || target.publisher !== route.publisher || target.prefix !== route.prefix) {
				result.status = 'blocked';
				addFinding(family, 'target-identity', 'The GitHub version of this solution couldn\'t be found or doesn\'t match the migration guide.', [answerId]);
			}
		} else if (answer.veSource !== 'legacy') {
			result.status = 'insufficient-evidence';
			addFinding(family, 've-site-state', 'Confirm whether a legacy Volunteer Engagement site exists and whether the enhanced data model is ready. The installed solution alone doesn\'t show this.', [answerId]);
		}
		if (compatibility.status === 'blocked') {
			result.status = 'blocked';
			addFinding(family, 'compatibility-blocked', compatibility.reason, ['solutions', answerId]);
		} else if (compatibility.status === 'investigation-required' && result.status === 'eligible') {
			result.status = 'insufficient-evidence';
			addFinding(family, compatibility.reason === DRAFT_MAPPING_REASON ? 'release-mapping-unapproved' : 'release-mapping-required',
				compatibility.reason, ['solutions', answerId]);
		}
		for (const prerequisite of route.prerequisites) {
			const prerequisiteRoute = ROUTES.find(item => item.family === prerequisite)!;
			const installed = discovery.solutions.some(item => item.uniqueName === prerequisiteRoute.source || item.uniqueName === prerequisiteRoute.target);
			if (!installed || !selectedFamilies.has(prerequisite)) {
				result.status = 'blocked';
				addFinding(family, `prerequisite-${prerequisite}`,
					`Also assess ${FAMILY_NAMES[prerequisite]}, because this product depends on it.`,
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
		// The draft-mapping caution already says what to confirm, so the generic review caution would only repeat it.
		if (unreviewed && compatibility.reason !== DRAFT_MAPPING_REASON) {
			const evidenceBased = ['likely-standard', 'moderate', 'heavy'].includes(result.complexity.level)
				&& result.compatibility.status === 'candidate-supported';
			if (result.status === 'eligible' && !evidenceBased) {
				result.status = 'insufficient-evidence';
			}
			addFinding(family, evidenceBased ? 'evidence-based' : 'review-required',
				evidenceBased
					? 'The rating is based on the environment\'s configuration and hasn\'t been confirmed by a customer or partner review.'
					: 'A current customer or partner review is needed to confirm compatibility, customizations, dependencies, integrations, and testing before this product can be rated.',
				[answerId, ...(discovery.components ? ['components'] : [])],
				!evidenceBased);
		}
		if (result.complexity.level === 'unbounded' && result.status === 'eligible') {
			result.status = 'insufficient-evidence';
			addFinding(family, 'opaque-customization',
				'Customizations or integrations exist, but nobody knows who owns them or what they do. Ask a specialist to investigate before planning.',
				[answerId]);
		}
	}
	const active = routes.filter(item => !['unsupported', 'not-installed', 'already-at-target'].includes(item.status));
	// A prerequisite whose only blocker is the draft release mapping is installed at the GitHub version, which is what dependents need.
	const prerequisiteSatisfied = (route: RouteResult): boolean => {
		if (['eligible', 'already-at-target'].includes(route.status)) {
			return true;
		}
		const blockers = findings.filter(finding => finding.blocking && finding.families.includes(route.family));
		return blockers.length > 0 && blockers.every(finding => finding.code === 'release-mapping-unapproved');
	};
	// An unresolved prerequisite is inherited by every selected downstream route.
	for (let pass = 0; pass < routes.length; pass++) {
		for (const result of active) {
			for (const dependency of ROUTES.find(route => route.family === result.family)!.prerequisites) {
				const prerequisite = routes.find(route => route.family === dependency);
				if (prerequisite && !prerequisiteSatisfied(prerequisite)
					&& !findings.some(finding => finding.id === `${result.family}.blocked-by-${dependency}`)) {
					addFinding(result.family, `blocked-by-${dependency}`,
						`${FAMILY_NAMES[dependency]} still needs review, and this product depends on it.`,
						[`answers.${dependency}`]);
					if (result.status === 'eligible') {
						result.status = 'blocked';
					}
				}
			}
		}
	}
	const criticalEvidenceComplete = ['solutions', 'components'].every(id =>
		evidence.find(item => item.id === id)?.status === 'observed');
	for (const route of routes) {
		route.confidence = !['eligible', 'not-installed', 'already-at-target'].includes(route.status)
			? 'not-estimable'
			: criticalEvidenceComplete ? 'medium' : 'low';
		route.effortBand = ['already-at-target', 'not-installed'].includes(route.status)
			? 'none'
			: route.status !== 'eligible'
				? 'review-required'
				: relativeEffort(route.family, route.complexity.level);
	}
	const allAbsent = routes.every(route => route.status === 'not-installed');
	const assessmentComplete = !findings.some(item => item.blocking);
	return AssessmentSchema.parse({
		schemaVersion: '1.0', toolVersion: VERSION, routeCatalogVersion: CATALOG_VERSION,
		assessmentId: q.assessmentId, assessedAt: now.toISOString(),
		environment: discovery.environment?.name ?? q.environment.alias,
		environmentUrl: q.environment.url,
		environmentProfile: {
			type: q.environment.type ?? 'unknown',
			region: q.environment.region ?? 'unknown',
			managedEnvironment: q.environment.managedEnvironment ?? 'unknown',
			accessRestriction: q.environment.accessRestriction ?? 'unknown',
			dataverseVersion: discovery.environment?.dataverseVersion ?? null,
			solutionInventoryCount: ['observed', 'partial'].includes(
				discovery.evidence.find(item => item.id === 'solutions')?.status ?? '',
			) ? discovery.solutions.length : null,
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
		status: allAbsent ? 'no-relevant-solutions' : assessmentComplete ? 'complete' : 'partial',
		limitations: [
			'Planning output, not a migration approval or guarantee. Validate decisions with the implementation partner.',
			'Effort ratings are relative (None, Low, Medium, High) and rule-based. They aren\'t time, cost, or downtime estimates.',
			'Customizations, dependencies, plug-ins, processes, flows, and counts come from configuration details. They don\'t prove that everything works the same after migration, and some dependencies can\'t be detected.',
			'Environment type, region, Managed Environment state, access restriction, and review answers come from the customer or partner unless marked as observed.',
			'CLI execution verifies target manifests and guides against the pinned public Git commit; direct library callers must perform equivalent verification.',
			'No migration, deployment, backup, permission change, or business-data retrieval was performed.',
		],
		evidence, findings, routes,
	});
}