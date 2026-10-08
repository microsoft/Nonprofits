import {
	DISCOVERY_CATEGORIES,
	type Assessment, type DurationRange, type EffortRange, type Family, type Finding, type Phase, type ScenarioEstimate,
} from './contracts.js';
import { ROUTES } from './routes.js';

const FAMILY_NAMES: Record<Family, string> = {
	cdm: 'CDM for Nonprofits',
	fundraising: 'Fundraising',
	grants: 'Grant Management',
	outcomes: 'Outcome Management',
	vm: 'Volunteer Management',
	ve: 'Volunteer Engagement',
};

const PHASE_NAMES: Partial<Record<Phase, string>> = {
	investigation: 'Investigation',
	preparation: 'Preparation',
	sandbox: 'Sandbox migration',
	customization: 'Customization remediation',
	integration: 'Integration remediation',
	validation: 'Validation',
	acceptance: 'Acceptance and rehearsal',
	production: 'Production execution',
	'post-cutover': 'Post-cutover',
};

function text(value: string): string {
	return value.replace(/[&<>|`\\[\]*_]/g, character => `&#${character.charCodeAt(0)};`)
		.replace(/[\r\n\u0000-\u001f]/g, ' ');
}

function range(value: EffortRange | null, excluded = 0): string {
	if (!value) {
		return 'Unavailable';
	}
	if (value.min === 0 && value.max === 0 && excluded > 0) {
		return 'None quantified';
	}
	return `${value.min}-${value.max} person-hours`;
}

function estimate(value: ScenarioEstimate): string {
	if (value.total) {
		return range(value.total);
	}
	if (value.knownSubtotal.min > 0 || value.knownSubtotal.max > 0) {
		return `${range(value.knownSubtotal)} known; incomplete`;
	}
	return 'Unavailable';
}

function observed(value: number | null | undefined, suffix = ''): string {
	return value === null || value === undefined ? 'Not available' : `${value}${suffix}`;
}

function duration(value: DurationRange | null): string {
	return value ? `${value.min}-${value.max} hours` : 'Not available';
}

function sourceVersion(report: Assessment, family: Family): string {
	const route = ROUTES.find(item => item.family === family)!;
	const solution = report.installedSolutions.find(item =>
		[route.source, route.target].some(name => name.toLowerCase() === item.uniqueName.toLowerCase()));
	return solution ? `${text(solution.uniqueName)} ${text(solution.version)}` : family === 've' ? 'Site not observed' : 'Not installed';
}

function targetVersion(report: Assessment, family: Family): string {
	const route = ROUTES.find(item => item.family === family)!;
	const target = report.target.solutions.find(item => item.uniqueName === route.target);
	return target ? `${text(target.uniqueName)} ${text(target.version)}` : family === 've' ? 'Portal-EDM site' : 'Target metadata unavailable';
}

function actionFor(finding: Finding): string {
	if (finding.code === 'target-version' || finding.code === 'compatibility-blocked') {
		return 'Publish or select a supported GitHub target version, then reassess.';
	}
	if (finding.code === 'release-mapping-required') {
		return 'Confirm the PPAC-to-GitHub release mapping or choose an ownership/update intent.';
	}
	if (finding.code === 'review-required') {
		return 'Review compatibility, customizations, dependencies, integrations, and validation scope.';
	}
	if (finding.code === 've-site-state') {
		return 'Inspect the legacy site, enhanced-model destination, languages, and authentication configuration.';
	}
	if (finding.code.startsWith('blocked-by-') || finding.code.startsWith('prerequisite-')) {
		return 'Resolve the prerequisite route first.';
	}
	if (finding.code.includes('inventory')) {
		return 'Repeat the approved read-only collection with sufficient access.';
	}
	return 'Resolve the finding with the customer and migration partner before estimating.';
}

function priority(finding: Finding): number {
	if (finding.code === 'target-version' || finding.code === 'compatibility-blocked'
		|| finding.code === 'source-identity' || finding.code === 'target-identity') {
		return 0;
	}
	if (finding.code === 've-site-state' || finding.code === 'review-required') {
		return 1;
	}
	if (finding.code.startsWith('blocked-by-') || finding.code.startsWith('prerequisite-')) {
		return 3;
	}
	return 2;
}

function groupedFindings(report: Assessment): {
	families: Family[];
	message: string;
	action: string;
	derived: boolean;
}[] {
	const groups = new Map<string, {
		families: Family[];
		message: string;
		action: string;
		derived: boolean;
		order: number;
	}>();
	for (const finding of report.findings.filter(item => item.blocking)) {
		const action = actionFor(finding);
		const key = `${finding.message}\u0000${action}`;
		const existing = groups.get(key);
		if (existing) {
			existing.families.push(...finding.families.filter(family => !existing.families.includes(family)));
			existing.order = Math.min(existing.order, priority(finding));
		} else {
			groups.set(key, {
				families: [...finding.families],
				message: finding.message,
				action,
				derived: finding.code.startsWith('blocked-by-') || finding.code.startsWith('prerequisite-'),
				order: priority(finding),
			});
		}
	}
	return [...groups.values()]
		.sort((left, right) => left.order - right.order || Number(left.derived) - Number(right.derived))
		.map(({ order: _order, ...item }) => item);
}

function assessedScenario(report: Assessment): ScenarioEstimate {
	return report.combined.find(item => item.id === 'assessed') ?? report.combined[0]!;
}

function phaseRows(report: Assessment): string[] {
	const scenario = assessedScenario(report);
	const included = new Set(scenario.workItemIds);
	const phases = new Map<Phase, { total: number; estimated: number; min: number; max: number }>();
	for (const item of report.workItems.filter(work => included.has(work.id))) {
		const current = phases.get(item.phase) ?? { total: 0, estimated: 0, min: 0, max: 0 };
		current.total++;
		if (item.effort) {
			current.estimated++;
			current.min += item.effort.min;
			current.max += item.effort.max;
		}
		phases.set(item.phase, current);
	}
	return [...phases.entries()].map(([phase, value]) =>
		`| ${text(PHASE_NAMES[phase] ?? phase)} | ${value.total} | ${value.estimated} | ${
			value.estimated === value.total && value.total > 0
				? `${value.min}-${value.max} person-hours`
				: value.estimated > 0 ? `${value.min}-${value.max} known; incomplete` : 'Not quantified'
		} |`);
}

function scenarioRows(report: Assessment): string[] {
	return report.combined.map(item =>
		`| ${text(item.id)} | ${range(item.knownSubtotal)} | ${range(item.total, item.excludedWorkItemIds.length)} | ${item.excludedWorkItemIds.length} | ${duration(item.elapsed)} | ${duration(item.execution)} | ${duration(item.downtime)} |`);
}

export function renderMarkdown(report: Assessment): string {
	const assessment = assessedScenario(report);
	const blocking = report.findings.filter(item => item.blocking);
	const categories = DISCOVERY_CATEGORIES
		.map(category => report.evidence.find(item => item.id === category))
		.filter(item => item !== undefined);
	const observedCategories = categories.filter(item =>
		['observed', 'confirmed-absent', 'partial', 'not-applicable'].includes(item.status)).length;
	const component = report.discoverySummary.components;
	const integrations = report.discoverySummary.integrations;
	const counts = report.discoverySummary.counts;
	const sites = report.discoverySummary.sites;
	const totalRelevantRows = counts?.tables.reduce((sum, item) => sum + item.count, 0);
	const findings = groupedFindings(report);
	const noMigrationRequired = report.routes.length > 0
		&& report.routes.every(route => ['already-at-target', 'not-installed'].includes(route.status));
	const estimateItems = report.workItems.filter(item => item.estimateType !== null);
	const reviewedEstimateItems = estimateItems.filter(item => item.estimateType === 'provisional-typical');
	const assumedEstimateItems = estimateItems.filter(item => item.estimateType === 'uncalibrated-assumption');
	const reviewers = [...new Set(reviewedEstimateItems
		.filter(item => item.reviewer)
		.map(item => `${item.reviewer} (${item.reviewedAt})`))];
	const estimateBasis = reviewedEstimateItems.length
		? `Provisional typical planning ranges; ${reviewedEstimateItems.length} work items; reviewer(s): ${reviewers.map(text).join(', ')}`
		: assumedEstimateItems.length
			? `Bundled uncalibrated engineering assumptions; ${assumedEstimateItems.length} work items; validate with a migration partner and rehearsal`
			: 'No numeric rules applied';
	const confidence = report.routes.some(route => route.confidence === 'not-estimable')
		? 'Unavailable'
		: report.routes.every(route => route.confidence === 'medium') ? 'Medium' : 'Low';
	const componentResult = component
		? `${component.relevantComponents} across ${component.relevantSolutions} solutions`
		: 'Not collected';
	const overlapResult = component
		? `${component.overlappingUnmanagedComponents} components; ${component.unmanagedSolutions} unmanaged solutions`
		: 'Not collected';
	const dependencyResult = report.discoverySummary.dependencies
		? `${report.discoverySummary.dependencies.dependentReferences} references from ${report.discoverySummary.dependencies.checkedComponents} checked components`
		: 'Not collected';
	const integrationResult = integrations
		? `Workflows ${observed(integrations.workflows)}; connection references ${observed(integrations.connectionReferences)}; plug-in assemblies ${observed(integrations.pluginAssemblies)}; steps ${observed(integrations.pluginSteps)}${integrations.truncated ? '; partial' : ''}`
		: 'Not collected';
	const siteResult = sites
		? `Legacy ${observed(sites.legacySites)}; enhanced ${observed(sites.enhancedSites)}${sites.truncated ? '; partial' : ''}; source ${text(report.portalProfile.source)}; auth ${text(report.portalProfile.authenticationProviders)}; languages ${observed(report.portalProfile.languages)}; custom journeys ${text(report.portalProfile.customJourneys)}`
		: `Not collected; customer source ${text(report.portalProfile.source)}, auth ${text(report.portalProfile.authenticationProviders)}, languages ${observed(report.portalProfile.languages)}, custom journeys ${text(report.portalProfile.customJourneys)}`;
	const operationsResult = report.operations
		? `Owner ${text(report.operations.ownerAvailability)}; sandbox/tests ${text(report.operations.sandboxAndTests)}; maximum interruption ${report.operations.maxInterruptionHours === null ? 'unknown' : `${report.operations.maxInterruptionHours} hours`}`
		: 'Not reviewed';
	const interruptionWarning = report.operations?.maxInterruptionHours !== null
		&& report.operations?.maxInterruptionHours !== undefined
		&& assessment.downtime
		&& assessment.downtime.max > report.operations.maxInterruptionHours
		? `- The estimated downtime upper bound (${assessment.downtime.max} hours) exceeds the reviewed maximum interruption (${report.operations.maxInterruptionHours} hours); add rehearsal or cutover mitigation before approval.`
		: null;
	const output = [
		'# Nonprofit migration assessment',
		'',
		'> Read-only planning assessment. No migration or environment change was performed.',
		'> Effort and timing are planning ranges only when every required item is quantified.',
		'',
		'## Decision summary',
		'',
		`**${noMigrationRequired ? 'No migration required' : assessment.total ? 'Planning range available' : 'Complete planning range unavailable'}** for **${text(report.environment)}**. `
			+ `${findings.length} blocker group${findings.length === 1 ? '' : 's'} (${blocking.length} route findings) remain; `
			+ `${observedCategories} of ${categories.length} discovery categories produced usable evidence.`,
		'',
		'| Result | Value |',
		'| --- | --- |',
		`| Assessment status | ${text(report.status)} |`,
		`| Selected solution families | ${report.routes.length} |`,
		`| Relevant installed solutions | ${report.installedSolutions.length} |`,
		`| Assessed effort | ${estimate(assessment)} |`,
		`| Assessed elapsed time | ${duration(assessment.elapsed)} |`,
		`| Production execution / downtime | ${duration(assessment.execution)} / ${duration(assessment.downtime)} |`,
		`| Estimate basis | ${estimateBasis} |`,
		`| Confidence | ${confidence} |`,
		'',
		'## Environment summary',
		'',
		'| Property | Result | Evidence |',
		'| --- | --- | --- |',
		`| Environment | ${text(report.environment)} | Customer-provided alias |`,
		`| Type / region | ${text(report.environmentProfile.type)} / ${text(report.environmentProfile.region)} | Customer-provided |`,
		`| Dataverse version | ${text(report.environmentProfile.dataverseVersion ?? 'Not collected')} | Read-only environment metadata |`,
		`| Managed Environment / access restriction | ${text(report.environmentProfile.managedEnvironment)} / ${text(report.environmentProfile.accessRestriction)} | Customer-provided |`,
		`| Relevant components | ${componentResult} | Component metadata |`,
		`| Unmanaged overlap signals | ${overlapResult} | Component metadata; signal only |`,
		`| Dependencies | ${dependencyResult} | Bounded dependency inspection |`,
		`| Automation / integrations | ${integrationResult} | Environment-wide counts |`,
		`| Relevant data scale | ${counts ? `${counts.tables.length} tables; ${observed(totalRelevantRows)} snapshot rows${counts.truncated ? '; partial' : ''}` : 'Not collected'} | Aggregate counts only; no records read |`,
		`| Power Pages | ${siteResult} | Site counts plus customer-provided configuration |`,
		`| Operational readiness | ${operationsResult} | Local guided review |`,
		'',
		'## Migration readiness',
		'',
		'| Family | Installed source | GitHub target | Compatibility | Complexity | Route status | Typical effort | Main blocker |',
		'| --- | --- | --- | --- | --- | --- | --- | --- |',
		...report.routes.map(route => {
			const blocker = report.findings.find(item => item.blocking && item.families.includes(route.family));
			const scenario = route.scenarios.find(item => item.id === 'assessed') ?? route.scenarios[0]!;
			const effort = route.status === 'already-at-target' ? 'No migration work' : estimate(scenario);
			return `| ${text(FAMILY_NAMES[route.family])} | ${sourceVersion(report, route.family)} | ${targetVersion(report, route.family)} | ${text(route.compatibility.status)} | ${text(route.complexity.level)} | ${text(route.status)} | ${effort} | ${blocker ? text(blocker.message) : 'None identified'} |`;
		}),
		'',
		'`Eligible` means assessable against the documented route, not approved for production migration.',
		'',
		'## Priority blockers and next actions',
		'',
		...(findings.length ? [
			'| Scope | Finding | Required action |',
			'| --- | --- | --- |',
			...findings.map(item => `| ${item.families.map(family => text(FAMILY_NAMES[family])).join(', ')}${item.derived ? ' (derived)' : ''} | ${text(item.message)} | ${text(item.action)} |`),
		] : ['No blocking findings were produced. Review limitations before migration approval.']),
		'',
		'## Evidence coverage',
		'',
		'| Category | Source | Status | Meaning |',
		'| --- | --- | --- | --- |',
		...categories.map(item => `| ${text(item.id)} | ${item.source === 'not-collected' ? '—' : text(item.source)} | ${text(item.status)} | ${text(item.reason)} |`),
		'',
		'Customer questionnaire answers are assertions, not independent compatibility verification.',
		'',
		'## Dependencies and estimation assumptions',
		'',
		'| Family | Required route prerequisites | Planning treatment |',
		'| --- | --- | --- |',
		...report.routes.map(route => {
			const definition = ROUTES.find(item => item.family === route.family)!;
			const prerequisites = definition.prerequisites.length
				? definition.prerequisites.map(family => text(FAMILY_NAMES[family])).join(', ')
				: 'None';
			const treatment = route.status === 'eligible'
				? 'Included in dependency-ordered plan'
				: route.status === 'already-at-target'
					? 'Already aligned; no migration work'
					: 'Range remains incomplete while route blockers apply';
			return `| ${text(FAMILY_NAMES[route.family])} | ${prerequisites} | ${treatment} |`;
		}),
		'',
		`- Discovery observed ${observed(report.discoverySummary.dependencies?.dependentReferences)} dependent references from ${observed(report.discoverySummary.dependencies?.checkedComponents)} checked components; this bounded signal doesn't attribute every dependency to a migration route.`,
		'- `likely-standard` assumes no material customer override when no unmanaged overlap or declared remediation is found; external and dynamic dependencies can still widen the range.',
		'- Bundled defaults are conservative engineering assumptions, not measured averages, commitments, or Microsoft-certified estimates.',
		'- Shared preparation is counted once. CDM precedes dependent template apps and VM; VM precedes VE.',
		...(interruptionWarning ? [interruptionWarning] : []),
		'',
		'## Combined migration plan',
		'',
		'| Scenario | Known planning subtotal | Complete effort | Unquantified items | Elapsed time | Production execution | Potential downtime |',
		'| --- | --- | --- | --- | --- | --- | --- |',
		...scenarioRows(report),
		'',
		'Unknown work is not zero. Alternative adverse scenarios must not be added together.',
		'',
		'| Phase | Work items | Quantified items | Effort |',
		'| --- | --- | --- | --- |',
		...phaseRows(report),
		'',
		'## Public guidance',
		'',
		...report.routes.map(route =>
			`- ${text(FAMILY_NAMES[route.family])}: [migration guide](${route.guide})`),
		`- Target source: \`microsoft/Nonprofits\` commit \`${text(report.target.commit)}\`; ${report.target.files.length} files verified by SHA-256.`,
		'',
		'## Limitations and handoff',
		'',
		...report.limitations.map(item => `- ${text(item)}`),
		'- Resolve primary blockers before derived prerequisite blockers.',
		'- Re-run discovery after environment or target changes.',
		'- Rehearse in a separately authorized representative sandbox before scheduling production.',
		'- Review and minimize this local report before optional sharing. Never attach secrets or business records.',
		'',
		'Detailed evidence, hashes, work-item dependencies, and scenario reasons remain in the local `assessment.json` file.',
		'',
	];
	return output.join('\n');
}
