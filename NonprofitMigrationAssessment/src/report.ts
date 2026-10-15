import { type Assessment, type Family, type Finding } from './contracts.js';
import { plural } from './complexity.js';
import { FAMILY_NAMES, ROUTES } from './routes.js';
import { isMicrosoftFirstPartyPublisher } from './publishers.js';

function text(value: string): string {
	return value.replace(/[&<>|`\\[\]*_]/g, character => `&#${character.charCodeAt(0)};`)
		.replace(/[\r\n\u0000-\u001f]/g, ' ');
}

const EVIDENCE_NAMES: Record<string, string> = {
	environment: 'Environment details',
	solutions: 'Installed solutions',
	components: 'Customizations',
	dependencies: 'Dependencies',
	integrations: 'Plug-ins, processes, and flows',
	counts: 'Record counts',
	sites: 'Websites',
};

function sourceVersion(report: Assessment, family: Family): string {
	const route = ROUTES.find(item => item.family === family)!;
	const solution = report.installedSolutions.find(item =>
		[route.source, route.target].some(name => name.toLowerCase() === item.uniqueName.toLowerCase()));
	return solution ? `${text(solution.uniqueName)} ${text(solution.version)}` : family === 've' ? siteStatus(report) : 'Not installed';
}

function targetVersion(report: Assessment, family: Family): string {
	const route = ROUTES.find(item => item.family === family)!;
	const target = report.target.solutions.find(item => item.uniqueName === route.target);
	return target ? `${text(target.uniqueName)} ${text(target.version)}` : family === 've' ? 'Portal-EDM site' : 'GitHub version not available';
}

function effortBand(value: Assessment['routes'][number]['effortBand']): string {
	return {
		none: 'None',
		low: 'Low',
		medium: 'Medium',
		high: 'High',
		'review-required': 'Review required',
	}[value];
}

function effortSummary(route: Assessment['routes'][number]): string {
	if (route.effortBand !== 'review-required') {
		return effortBand(route.effortBand);
	}
	return 'Review required';
}

function effortDisplay(route: Assessment['routes'][number]): string {
	const effort = effortSummary(route);
	return route.family === 've' && !['None', 'Review required'].includes(effort)
		? `${effort} if migration is chosen`
		: effort;
}

function confidence(value: Assessment['routes'][number]['confidence']): string {
	return {
		low: 'Low',
		medium: 'Medium',
		'not-estimable': 'Not yet rated',
	}[value];
}

function effortConfidence(route: Assessment['routes'][number]): string {
	return route.effortBand === 'none' ? 'Not applicable' : confidence(route.confidence);
}

function overallEffortConfidence(report: Assessment): string {
	const migrationRoutes = report.routes.filter(route => route.effortBand !== 'none');
	if (migrationRoutes.length === 0) {
		return 'Not applicable';
	}
	if (migrationRoutes.some(route => route.confidence === 'not-estimable')) {
		return 'Not yet rated';
	}
	return migrationRoutes.some(route => route.confidence === 'low') ? 'Low' : 'Medium';
}

function decisionConfidence(report: Assessment, route: Assessment['routes'][number]): string {
	const solutionsObserved = report.evidence.find(item => item.id === 'solutions')?.status === 'observed';
	if (route.family === 've') {
		const sitesObserved = report.evidence.find(item => item.id === 'sites')?.status === 'observed';
		return sitesObserved && report.discoverySummary.sites?.legacySites !== null ? 'High' : 'Low';
	}
	if (solutionsObserved && ['already-at-target', 'not-installed'].includes(route.status)) {
		return 'High';
	}
	if (solutionsObserved && route.status === 'eligible') {
		return 'High';
	}
	return route.status === 'insufficient-evidence' ? 'Low' : 'Medium';
}

function planningBasis(report: Assessment, route: Assessment['routes'][number]): string {
	const named = report.discoverySummary.components?.layerScan !== undefined;
	const evidence = named
		? route.complexity.reasons.join(' ')
		: `${customizationSignal(report, route.family)}.`;
	if (route.status === 'already-at-target') {
		// Effort is None for aligned products, so only the concrete evidence is shown, not the complexity rule.
		const regression = named
			? route.complexity.reasons.filter(reason => !/^(Heavy|Moderate) because/.test(reason)).join(' ')
			: evidence;
		return `The installed version matches a GitHub release, so no migration is needed. ${hasCustomizations(report, route.family)
			? `Regression-test these customizations: ${regression}`
			: named && !scopeComplete(report)
				? 'No customizations were found within the checked scope.'
				: 'No customizations were found on this product\'s components.'}`;
	}
	if (route.family === 've') {
		return `${siteStatus(report)}. Effort applies only if a legacy site must be migrated.${named && hasCustomizations(report, route.family) ? ` ${evidence}` : ''}`;
	}
	if (route.family === 'vm' && route.status === 'eligible') {
		return `Legacy Volunteer Management must be replaced by a different GitHub solution. ${evidence}`;
	}
	return `${recommendation(report, route)}. ${evidence}`;
}

function overallEffort(report: Assessment): string {
	const values = report.routes.map(route => route.effortBand);
	if (values.includes('review-required')) {
		return 'Review required';
	}
	if (values.includes('high')) {
		return 'High';
	}
	if (values.includes('medium')) {
		return 'Medium';
	}
	if (values.includes('low')) {
		return 'Low';
	}
	return 'None';
}

function siteStatus(report: Assessment): string {
	const evidence = report.evidence.find(item => item.id === 'sites');
	const sites = report.discoverySummary.sites;
	if (!sites || !evidence || !['observed', 'partial'].includes(evidence.status)) {
		return 'Site status unavailable';
	}
	const legacy = sites.legacySites === null
		? 'No legacy site capability detected'
		: sites.legacySites === 0 ? 'No legacy site observed' : `${plural(sites.legacySites, 'legacy site')} observed`;
	const enhanced = sites.enhancedSites === null
		? 'no enhanced site capability detected'
		: sites.enhancedSites === 0 ? 'no enhanced site observed' : `${plural(sites.enhancedSites, 'enhanced site')} observed`;
	return `${legacy}; ${enhanced}`;
}

function componentType(type: number): string {
	return {
		1: 'Tables',
		2: 'Columns',
		9: 'Choices',
		10: 'Relationships',
		20: 'Security roles',
		26: 'Views',
		29: 'Workflows/flows',
		60: 'Forms',
		61: 'Scripts/web resources',
		62: 'Site maps',
		66: 'Custom controls',
		80: 'Apps',
		90: 'Plug-in types',
		91: 'Plug-in assemblies',
		92: 'Plug-in steps',
		371: 'Connection references',
		380: 'Environment variable definitions',
		381: 'Environment variable values',
	}[type] ?? 'Other platform components';
}

function componentBreakdown(
	types: Array<{ type: number; count: number }>,
	componentCount: number,
): string {
	if (!types.length) {
		return componentCount > 0 ? 'Not recorded' : 'No components';
	}
	const totals = new Map<string, number>();
	for (const item of types) {
		const label = componentType(item.type);
		totals.set(label, (totals.get(label) ?? 0) + item.count);
	}
	return [...totals].map(([label, count]) => `${label}: ${count}`).join(', ');
}

function hasCustomizations(report: Assessment, family: Family): boolean {
	return report.discoverySummary.components?.layerScan
		? familyLayerCustomizations(report, family).length + familyAutomations(report, family).length > 0
		: customizationSignal(report, family).includes(' changed by ');
}

function recommendation(report: Assessment, route: Assessment['routes'][number]): string {
	if (route.status === 'already-at-target') {
		return hasCustomizations(report, route.family)
			? 'No migration required; regression test customizations'
			: 'No migration required';
	}
	if (route.status === 'not-installed') {
		return 'No action — not installed';
	}
	if (route.status === 'eligible') {
		if (route.family === 've' && report.discoverySummary.sites?.legacySites === null) {
			return 'Confirm whether migration is needed';
		}
		return route.intent === 'ownership-transition' ? 'Optional ownership transition'
			: route.intent === 'apply-github-release' ? 'Update to GitHub release'
				: 'Migration to GitHub solution is recommended';
	}
	if (route.family === 'vm' && route.compatibility.status === 'investigation-required') {
		return 'Check whether the Volunteer Management migration is finished';
	}
	return route.status === 'unsupported' ? 'Not supported by this assessment' : 'Review before migration';
}

function dependencies(family: Family): string {
	const route = ROUTES.find(item => item.family === family)!;
	return route.prerequisites.length
		? route.prerequisites.map(item => FAMILY_NAMES[item]).join(', ')
		: 'None';
}

function customizationSignal(report: Assessment, family: Family): string {
	const route = ROUTES.find(item => item.family === family)!;
	if (report.discoverySummary.components?.layerScan) {
		const total = familyLayerCustomizations(report, family).length + familyAutomations(report, family).length;
		if (total) {
			return `${plural(total, 'named customization')} found; see Customizations in Microsoft nonprofit solutions`;
		}
		if (scopeComplete(report)) {
			return 'No customizations found on this product\'s components';
		}
	}
	const candidates = report.discoverySummary.components?.customizationCandidates
		?.filter(item => !isMicrosoftFirstPartyPublisher(item.publisher)) ?? [];
	const matching = candidates.flatMap(item => item.overlaps
		.filter(overlap => [route.source, route.target].includes(overlap.productUniqueName))
		.map(overlap => ({ solution: item.uniqueName, count: overlap.componentCount })));
	if (matching.length > 0) {
		const count = matching.reduce((total, item) => total + item.count, 0);
		return `${plural(count, 'nonprofit component')} changed by ${matching.map(item => text(item.solution)).join(', ')}`;
	}
	const summary = report.discoverySummary.components?.productSummaries?.find(item =>
		[route.source, route.target].includes(item.uniqueName));
	if (!summary && candidates.length === 0) {
		return family === 've' ? 'See site review' : 'Customizations weren\'t checked';
	}
	return 'No nonprofit components are changed by custom or partner solutions';
}

function productName(uniqueName: string): string {
	const route = ROUTES.find(item => [item.source, item.target].includes(uniqueName));
	return route ? FAMILY_NAMES[route.family] : uniqueName;
}

type LayerCustomization = NonNullable<NonNullable<Assessment['discoverySummary']['components']>['layerCustomizations']>[number];

function singularComponentType(type: number): string {
	return {
		1: 'Table definition',
		2: 'Column',
		9: 'Choice',
		10: 'Relationship',
		20: 'Security role',
		26: 'View',
		29: 'Workflow/flow',
		59: 'Chart',
		60: 'Form',
		61: 'Script/web resource',
		62: 'Site map',
		66: 'Custom control',
		80: 'App',
		91: 'Plug-in assembly',
		92: 'Plug-in step',
		371: 'Connection reference',
		380: 'Environment variable',
	}[type] ?? 'Other component';
}

function familyLayerCustomizations(report: Assessment, family: Family): LayerCustomization[] {
	const route = ROUTES.find(item => item.family === family)!;
	return (report.discoverySummary.components?.layerCustomizations ?? []).filter(item =>
		item.productUniqueNames.some(name => [route.source, route.target].includes(name)));
}

function layerLocation(report: Assessment, item: LayerCustomization): string {
	if (item.layer === 'active') {
		return item.solutions.length
			? `Unmanaged change in this environment; also in ${item.solutions.map(text).join(', ')}`
			: 'Unmanaged change in this environment';
	}
	const solution = item.solutions[0] ?? '';
	const publisher = report.discoverySummary.components?.customizationCandidates
		?.find(candidate => candidate.uniqueName === solution)?.publisher;
	return `Managed solution ${text(solution)}${publisher ? ` (${text(publisher)})` : ''}`;
}

function layerChange(item: LayerCustomization): string {
	return item.change === 'added' ? 'Added' : item.change === 'modified' ? 'Changed' : 'Added or changed';
}

type Automation = NonNullable<NonNullable<Assessment['discoverySummary']['integrations']>['automations']>[number];

function scopeComplete(report: Assessment): boolean {
	const automation = report.discoverySummary.integrations?.automationScan;
	return report.discoverySummary.components?.layerScan?.status === 'complete'
		&& (!automation || automation.status === 'complete');
}

function familyAutomations(report: Assessment, family: Family): Automation[] {
	const route = ROUTES.find(item => item.family === family)!;
	return (report.discoverySummary.integrations?.automations ?? []).filter(item =>
		item.productUniqueNames.some(name => [route.source, route.target].includes(name)));
}

function automationLocation(report: Assessment, item: Automation): string {
	if (item.layer === 'active') {
		return 'Unmanaged change in this environment';
	}
	if (!item.solution) {
		return 'Solution not identified';
	}
	const publisher = report.installedSolutions.find(solution => solution.uniqueName === item.solution)?.publisher
		?? report.discoverySummary.components?.customizationCandidates
			?.find(candidate => candidate.uniqueName === item.solution)?.publisher;
	return `Solution ${text(item.solution)}${publisher ? ` (${text(publisher)})` : ''}`;
}

function layerCoverage(report: Assessment): string {
	const scan = report.discoverySummary.components!.layerScan!;
	const automation = report.discoverySummary.integrations?.automationScan;
	const automationCoverage = !automation ? ''
		: automation.status === 'unavailable'
			? ' Plug-in steps, processes, and cloud flows on nonprofit tables could not be listed.'
			: ` Checked plug-in steps and processes on ${automation.tables} nonprofit tables and ${automation.checkedCloudFlows} of ${automation.cloudFlows} non-Microsoft cloud flows.`;
	if (scan.status === 'unavailable') {
		return `Solution layer details were not available, so changes made directly in this environment are not listed. Only components that custom or partner solutions change are shown.${automationCoverage}`;
	}
	const coverage = `Checked ${scan.checkedTables} of ${scan.productTables} nonprofit tables for unmanaged changes and ${scan.checkedSolutionTables} of ${scan.solutionTables} tables extended by custom or partner solutions.${automationCoverage}`;
	return scan.status === 'partial' || automation?.status === 'partial'
		? `${coverage} Some checks did not complete or reached a safety limit, so more changes may exist.`
		: coverage;
}

function dependentsCell(report: Assessment, objectId: string, edgeCounts: Map<string, number>): string {
	const id = objectId.toLowerCase();
	const counted = report.discoverySummary.dependencies?.components;
	if (counted) {
		const entry = counted.find(item => item.objectId.toLowerCase() === id);
		return !entry ? 'Not checked' : entry.complete ? String(entry.dependents) : `At least ${entry.dependents}`;
	}
	// Older inventories only checked components shared with custom or partner solutions.
	const checked = (report.discoverySummary.components?.customizationComponents ?? [])
		.some(item => item.objectId.toLowerCase() === id);
	return checked ? String(edgeCounts.get(id) ?? 0) : 'Not checked';
}

function layerCustomizationSection(report: Assessment, dependencyCounts: Map<string, number>): string[] {
	const families = report.routes
		.filter(route => route.status !== 'not-installed')
		.map(route => route.family);
	const output = [
		'## Customizations in Microsoft nonprofit solutions',
		'',
		'Each row is a change layered on top of a Microsoft nonprofit solution component, a new column, relationship, view, or form on a nonprofit table, or a plug-in step, process, or cloud flow that runs on a nonprofit table. Plan to retest, recreate, or confirm each change against the GitHub version.',
		'',
		`**Coverage:** ${layerCoverage(report)}`,
		'',
	];
	for (const family of families) {
		const rows = [
			...familyLayerCustomizations(report, family).map(item => ({
				sort: `${item.tableDisplayName ?? item.table ?? ''}|${String(item.type).padStart(5, '0')}|${item.displayName ?? item.name}|${item.layer}`,
				change: item.change,
				cells: [
					item.table
						? item.tableDisplayName ? `${text(item.tableDisplayName)} (${text(item.table)})` : text(item.table)
						: [2, 10, 26, 59, 60].includes(item.type) ? 'Table not identified' : 'Not table-specific',
					`${item.type === 1
						? 'Table properties'
						: item.displayName && item.displayName !== item.name
							? `${text(item.displayName)} (${text(item.name)})`
							: text(item.name)}${item.relatedTable && item.relatedTable !== item.tableDisplayName
						? `; related table: ${text(item.relatedTable)}`
						: ''}`,
					singularComponentType(item.type),
					layerChange(item),
					layerLocation(report, item),
					dependentsCell(report, item.objectId, dependencyCounts),
				],
			})),
			...familyAutomations(report, family).map(item => ({
				sort: `${item.tableDisplayNames[0] ?? ''}|99999|${item.name}|${item.layer}`,
				change: 'added' as const,
				cells: [
					item.tableDisplayNames.map(text).join(', '),
					`${text(item.name)}${item.kind === 'plugin-step' ? ` (${text(item.detail)})` : ''}${item.enabled === false ? ' — turned off' : ''}`,
					item.kind === 'plugin-step' ? 'Plug-in step' : item.kind === 'cloud-flow' ? 'Cloud flow' : text(item.detail),
					'Added',
					automationLocation(report, item),
					'Not applicable',
				],
			})),
		].sort((left, right) => left.sort.localeCompare(right.sort, 'en'));
		output.push(`### ${text(FAMILY_NAMES[family])}`, '');
		if (!rows.length) {
			output.push(scopeComplete(report)
				? 'No customizations were found on this product\'s components.'
				: 'No customizations were found within the checked scope.', '');
			continue;
		}
		const added = rows.filter(row => row.change === 'added').length;
		const changed = rows.filter(row => row.change === 'modified').length;
		output.push(
			`**Summary:** ${plural(rows.length, 'customization')}: ${added} added, ${changed} changed${rows.length - added - changed ? `, ${rows.length - added - changed} added or changed` : ''}.`,
			'',
			'| Table | Component | Type | Change | Where the change lives | Dependents found |',
			'| --- | --- | --- | --- | --- | --- |',
			...rows.map(row => `| ${row.cells.join(' | ')} |`),
			'',
		);
	}
	return output;
}
function actionFor(finding: Finding): string {
	if (finding.code === 'target-version' || finding.code === 'compatibility-blocked') {
		return 'Choose a supported GitHub version, then run the assessment again.';
	}
	if (finding.code === 'release-mapping-required') {
		return 'Confirm which GitHub release matches your installed version, or decide whether to keep the current version or update.';
	}
	if (finding.code === 'review-required') {
		return 'Ask your implementation partner to do this review.';
	}
	if (finding.code === 've-site-state') {
		return 'Check the legacy site, whether the enhanced data model is ready, and the site\'s languages and sign-in providers.';
	}
	if (finding.code.startsWith('blocked-by-') || finding.code.startsWith('prerequisite-')) {
		return 'Resolve that product first.';
	}
	if (finding.code.includes('inventory')) {
		return 'Run the read-only assessment again with an account that can read the environment.';
	}
	return 'Resolve this with your implementation partner before planning the migration.';
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

function dependencyDiagram(report: Assessment): string[] {
	const included = new Set(report.routes.map(route => route.family));
	const classes = new Map<string, Family[]>();
	const nodes = report.routes.map(route => {
		const className = ['already-at-target', 'not-installed'].includes(route.status)
			? 'ready'
			: ['blocked', 'unsupported'].includes(route.status) ? 'blocked' : 'review';
		classes.set(className, [...(classes.get(className) ?? []), route.family]);
		return `  ${route.family}["${FAMILY_NAMES[route.family]}<br/>${effortDisplay(route)}"]`;
	});
	const edges = report.routes.flatMap(route => {
		const definition = ROUTES.find(item => item.family === route.family)!;
		return definition.prerequisites
			.filter(prerequisite => included.has(prerequisite))
			.map(prerequisite => `  ${prerequisite} --> ${route.family}`);
	});
	const assignments = [...classes.entries()]
		.map(([className, families]) => `  class ${families.join(',')} ${className}`);
	return [
		'```mermaid',
		'flowchart LR',
		...nodes,
		...edges,
		'  classDef ready fill:#dff6dd,stroke:#107c10,color:#242424',
		'  classDef review fill:#fff4ce,stroke:#8a6d1d,color:#242424',
		'  classDef blocked fill:#fde7e9,stroke:#a4262c,color:#242424',
		...assignments,
		'```',
	];
}

function migrationSequence(report: Assessment): string[] {
	return report.routes.map(route => {
		const product = FAMILY_NAMES[route.family];
		if (route.status === 'already-at-target') {
			return hasCustomizations(report, route.family)
				? `No migration for **${product}**. Regression-test its customizations.`
				: `No migration for **${product}**.`;
		}
		if (route.status === 'not-installed') {
			return `No migration for **${product}** because it was not detected.`;
		}
		if (route.family === 've') {
			return `Confirm whether **${product}** needs migration (${siteStatus(report)}). If migration is chosen, perform it after CDM for Nonprofits and Volunteer Management.`;
		}
		const prerequisite = dependencies(route.family);
		return `${recommendation(report, route)} for **${product}**${prerequisite === 'None' ? '' : ` after ${prerequisite}`}, then check its customizations and integrations.`;
	});
}

function executiveRecommendation(report: Assessment): string {
	const aligned = report.routes
		.filter(route => route.status === 'already-at-target')
		.map(route => FAMILY_NAMES[route.family]);
	const confirm = report.routes
		.filter(route => route.family === 've' && decisionConfidence(report, route) === 'Low')
		.map(route => FAMILY_NAMES[route.family]);
	const migrate = report.routes
		.filter(route => route.status === 'eligible' && !confirm.includes(FAMILY_NAMES[route.family]))
		.map(route => FAMILY_NAMES[route.family]);
	const parts = [
		migrate.length ? `Migration is recommended for ${migrate.join(' and ')}.` : '',
		confirm.length ? `Confirm whether ${confirm.join(' and ')} is present before planning migration.` : '',
		aligned.length ? `No migration is required for ${aligned.join(' and ')}.` : '',
	].filter(Boolean);
	return parts.length ? parts.join(' ') : 'Review the product decisions below.';
}

function customerProductRows(report: Assessment): string[] {
	return report.routes.map(route =>
		`| ${text(FAMILY_NAMES[route.family])} | ${sourceVersion(report, route.family)} | ${targetVersion(report, route.family)} | ${text(recommendation(report, route))} | ${decisionConfidence(report, route)} | ${effortDisplay(route)} | ${effortConfidence(route)} | [Guide](${route.guide}) |`);
}

function nextActions(report: Assessment): string[] {
	const actions: string[] = [];
	const alignedWithOverlap = report.routes
		.filter(route => route.status === 'already-at-target' && hasCustomizations(report, route.family))
		.map(route => FAMILY_NAMES[route.family]);
	if (alignedWithOverlap.length) {
		actions.push(`Regression-test the customizations affecting ${alignedWithOverlap.join(' and ')}; no product migration is required.`);
	}
	for (const route of report.routes.filter(item => item.status === 'eligible' && item.family !== 've')) {
		actions.push(`Rehearse the ${FAMILY_NAMES[route.family]} migration in a test (sandbox) environment that matches production, and check its customizations and integrations.`);
	}
	const ve = report.routes.find(route => route.family === 've');
	if (ve && decisionConfidence(report, ve) === 'Low') {
		actions.push('Confirm whether a legacy Volunteer Engagement site exists before including it in migration scope.');
	}
	if (report.evidence.find(item => item.id === 'dependencies')?.status === 'partial') {
		actions.push('Review the remaining dependencies of the components being migrated; the automatic check reached a safety limit.');
	}
	if (report.evidence.find(item => item.id === 'integrations')?.status === 'partial') {
		actions.push(report.discoverySummary.integrations?.scope === 'selected-products-and-overlapping-customizations'
			? 'Review the listed workflows, connection references, and plug-ins and assign an owner for each.'
			: 'Identify which workflows, connection references, and plug-ins are part of the nonprofit migration and assign an owner for each.');
	}
	return [...new Set(actions)];
}

export function renderMarkdown(report: Assessment): string {
	const component = report.discoverySummary.components;
	const dependency = report.discoverySummary.dependencies;
	const findings = groupedFindings(report);
	const customizationCandidates = component?.customizationCandidates?.filter(item =>
		!isMicrosoftFirstPartyPublisher(item.publisher) && item.componentCount > 0) ?? [];
	const customizationComponents = component?.customizationComponents ?? [];
	const dependencyCounts = new Map<string, number>();
	for (const edge of dependency?.edges ?? []) {
		const id = edge.requiredComponent.objectId.toLowerCase();
		dependencyCounts.set(id, (dependencyCounts.get(id) ?? 0) + 1);
	}
	const dataVolumes = [...(report.discoverySummary.counts?.tables ?? [])]
		.filter(table => table.count > 0)
		.sort((left, right) => right.count - left.count || left.logicalName.localeCompare(right.logicalName, 'en'))
		.slice(0, 10);
	const solutionInventoryAvailable = ['observed', 'partial'].includes(
		report.evidence.find(item => item.id === 'solutions')?.status ?? 'unknown',
	);
	const nonBlockingFindings = report.findings.filter(item => !item.blocking
		&& !['already-aligned', 'not-installed'].includes(item.code));
	const accessLimited = report.evidence.some(item => item.status === 'access-denied');
	const solutionEvidenceDate = report.evidence.find(item => item.id === 'solutions')?.collectedAt;
	const actions = nextActions(report);
	const productRows = customerProductRows(report);
	const output = [
		'# Nonprofit migration assessment',
		'',
		'> This report summarizes installed nonprofit products, customizations, dependencies, and recommended next steps.',
		'> The assessment only reads configuration details, such as solutions, tables, and forms, plus record counts. It doesn\'t change the environment.',
		'> This report was generated by an AI-assisted assessment skill. Decisions and effort ratings come from fixed rules, not AI estimates. Check the findings before taking any action.',
		'',
		'## Executive decision',
		'',
		'| Property | Value |',
		'| --- | --- |',
		`| Environment name | ${text(report.environment)} |`,
		`| URL | ${text(report.environmentUrl)} |`,
		`| Dataverse version | ${text(report.environmentProfile.dataverseVersion ?? 'Not available')} |`,
		`| Assessment date | ${text(solutionEvidenceDate?.slice(0, 10) ?? 'Not available')} |`,
		`| Solutions found | ${report.environmentProfile.solutionInventoryCount ?? 'Not available'} |`,
		`| Recommendation | ${text(executiveRecommendation(report))} |`,
		`| Expected overall effort | ${overallEffort(report)} |`,
		`| Overall effort confidence | ${overallEffortConfidence(report)} |`,
		'',
		'## Supported nonprofit products and recommendations',
		'',
		'Decision confidence shows how sure the assessment is about what to do. Effort confidence shows how reliable the effort rating is.',
		'',
		'| Product | Installed solution / version | GitHub solution / version | Decision | Decision confidence | Expected effort | Effort confidence | GitHub |',
		'| --- | --- | --- | --- | --- | --- | --- | --- |',
		...productRows,
		'',
		'### Why these effort ratings?',
		'',
		'| Product | Expected effort | Effort confidence | Why |',
		'| --- | --- | --- | --- |',
		...report.routes.map(route => {
			return `| ${text(FAMILY_NAMES[route.family])} | ${effortDisplay(route)} | ${effortConfidence(route)} | ${text(planningBasis(report, route))} |`;
		}),
		'',
		'## What to do next',
		'',
		...(actions.length ? actions.map(action => `- [ ] ${action}`) : ['- [x] No migration actions were identified.']),
		'',
		...(component?.layerScan ? layerCustomizationSection(report, dependencyCounts) : []),
		'## Custom and partner solutions',
		'',
		...(!solutionInventoryAvailable
			? ['Custom and partner solutions can\'t be listed because the installed solutions couldn\'t be read.']
			: customizationCandidates.length ? [
			`**Summary:** ${plural(customizationCandidates.length, 'custom or partner solution')}; ${customizationCandidates.filter(item => !item.managed).length} unmanaged; ${customizationCandidates.filter(item => item.overlaps.length > 0).length} change nonprofit solution components.`,
			'',
			'| Solution | Type | Publisher | Components | Component details | Nonprofit products it changes | Why review it? |',
			'| --- | --- | --- | --- | --- | --- | --- |',
			...customizationCandidates.map(item => {
				const affects = item.overlaps.length
					? item.overlaps.map(overlap => `${text(productName(overlap.productUniqueName))} (${overlap.componentCount})`).join(', ')
					: 'None directly';
				const review = item.overlaps.length
					? 'It changes nonprofit components; test it and plan the order in which solutions are imported'
					: 'It doesn\'t change nonprofit components directly; check whether its code or flows use them';
				return `| ${text(item.uniqueName)} | ${item.managed ? 'Managed' : 'Unmanaged'} | ${text(item.publisher)} | ${item.componentCount} | ${componentBreakdown(item.componentTypes, item.componentCount)} | ${affects} | ${review} |`;
			}),
			...(component?.truncated ? ['', `> **Partial check:** ${customizationCandidates.length} custom or partner solutions are shown. A safety limit was reached, so more solutions or components may exist.`] : []),
			] : ['No custom or partner solutions were found within the checked scope.']),
		'',
		...(!component?.layerScan && customizationComponents.length ? [
			'### Components changed by custom or partner solutions',
			'',
			'| Component | Type | Custom solution | Nonprofit product | Components that use it |',
			'| --- | --- | --- | --- | --- |',
			...customizationComponents.map(item =>
				`| ${text(item.name)}${item.nameSource === 'identifier' ? ' (name not available)' : ''} | ${componentType(item.type)} | ${item.customizationSolutions.map(text).join(', ')} | ${item.productUniqueNames.map(name => text(productName(name))).join(', ')} | ${dependencyCounts.get(item.objectId.toLowerCase()) ?? 0} |`),
			'',
			'The detailed JSON file lists each dependency and component ID.',
			'',
		] : []),
		'## Technical appendix',
		'',
		'### Migration order',
		'',
		...dependencyDiagram(report),
		'',
		'The arrows show the recommended migration order, not every Dataverse component dependency.',
		'',
		'| Product | Depends on |',
		'| --- | --- |',
		...report.routes.map(route => {
			const definition = ROUTES.find(item => item.family === route.family)!;
			const prerequisites = definition.prerequisites.length
				? definition.prerequisites.map(family => text(FAMILY_NAMES[family])).join(', ')
				: 'None';
			return `| ${text(FAMILY_NAMES[route.family])} | ${prerequisites} |`;
		}),
		'',
		'### Recommended sequence',
		'',
		...migrationSequence(report).map((step, index) => `${index + 1}. ${step}`),
		'',
		'### Dependencies found',
		'',
		...(dependency ? [
			'| Check | Result | What it means |',
			'| --- | --- | --- |',
			...(dependency.scope === 'named-customizations' ? [
				`| Customizations checked for dependencies | ${dependency.checkedComponents} of ${dependency.candidateComponents ?? dependency.checkedComponents} | Each listed customization is checked, up to 150 |`,
				`| Components that use them | ${(dependency.components ?? []).reduce((total, item) => total + item.dependents, 0)} | For example, forms or views that show a custom column; each customization's count is in the Dependents found column |`,
			] : dependency.scope === 'direct-customization-overlaps' ? [
				`| Components changed by custom or partner solutions | ${dependency.candidateComponents ?? 'Not available'} | Nonprofit solution components that a custom or partner solution also changes |`,
				`| Components checked for dependencies | ${dependency.checkedComponents} | Only these components were checked |`,
				`| References found | ${dependency.dependentReferences} | Other components that use the checked components; the same component can be counted more than once |`,
			] : [
				`| Components checked for dependencies | ${dependency.checkedComponents} | A fixed sample of nonprofit solution components |`,
				`| References found | ${dependency.dependentReferences} | Other components that use the checked components; the same component can be counted more than once |`,
			]),
			`| Completeness | ${dependency.truncated ? 'Partial — a safety limit was reached' : dependency.scope === 'named-customizations' ? 'All listed customizations were checked' : dependency.scope === 'direct-customization-overlaps' ? 'All changed components were checked' : 'The sample was checked'} | ${dependency.truncated ? 'Some components weren\'t fully checked' : 'Code, flows, or external systems can still depend on components without Dataverse recording it'} |`,
			'',
			'> The detailed JSON file lists each dependency and component ID.',
		] : ['Dependency details weren\'t available.']),
		'',
		'### Automation and data in scope',
		'',
		'These counts include only the installed nonprofit solutions and the custom or partner solutions that change them.',
		'',
		'| Item | Count |',
		'| --- | --- |',
		...(report.discoverySummary.integrations?.scope === 'selected-products-and-overlapping-customizations' ? [
			`| Solutions counted | ${report.discoverySummary.integrations.scopedSolutions ?? 'Not available'} |`,
			`| Workflows | ${report.discoverySummary.integrations.workflows ?? 'Not available'} |`,
			`| Connection references | ${report.discoverySummary.integrations.connectionReferences ?? 'Not available'} |`,
			`| Plug-in assemblies | ${report.discoverySummary.integrations.pluginAssemblies ?? 'Not available'} |`,
			`| Plug-in steps | ${report.discoverySummary.integrations.pluginSteps ?? 'Not available'} |`,
		] : [
			'| Workflows and connection references per product | Not available; environment-wide totals are in the detailed JSON |',
			'| Plug-in assemblies and steps per product | Not available; environment-wide totals are in the detailed JSON |',
		]),
		`| Nonprofit tables with record counts | ${report.discoverySummary.counts?.tables.length ?? 'Not available'}${report.discoverySummary.counts?.truncated ? ' (partial)' : ''} |`,
		...(report.routes.some(route => route.family === 've')
			? [`| Volunteer Engagement sites | ${text(siteStatus(report))} |`]
			: []),
		'',
		'### Related data volumes',
		'',
		...(dataVolumes.length ? [
			'Largest tables created by nonprofit solutions, by record count. Dataverse refreshes these counts about once a day, so they can be up to a day old.',
			'',
			'| Table | Product | Records (approximate) |',
			'| --- | --- | --- |',
			...dataVolumes.map(table =>
				`| ${text(table.logicalName)} | ${table.products?.length ? table.products.map(name => text(productName(name))).join(', ') : 'Not assigned'} | ${table.count} |`),
		] : ['No record counts were available for nonprofit tables.']),
		'',
		'### Assessment cautions',
		'',
		...(findings.length ? findings.map((item, index) =>
			`${index + 1}. **${item.families.map(family => text(FAMILY_NAMES[family])).join(', ')}:** ${text(item.message)} ${text(item.action)}`)
			: ['Nothing blocks the recommended actions.']),
		...nonBlockingFindings.map(finding =>
			`- **${finding.families.map(family => text(FAMILY_NAMES[family])).join(', ')}:** ${text(finding.message)}`),
		...(report.evidence.filter(item => item.status === 'partial').map(item =>
			`- **${text(EVIDENCE_NAMES[item.id] ?? item.id)}:** ${text(item.reason)}`)),
		'',
		'### Metric definitions',
		'',
		'| Metric | Meaning |',
		'| --- | --- |',
		'| Decision | What to do for the product. |',
		'| Decision confidence | How sure the assessment is about the decision, based on the installed versions and sites it found. |',
		'| Expected effort | Relative migration work: None, Low, Medium, or High. It isn\'t a time, cost, or downtime estimate. |',
		'| Effort confidence | How reliable the effort rating is, based on how much of the environment could be checked. |',
		'',
		'## Notes',
		'',
		...(accessLimited ? ['- Some configuration details couldn\'t be read. The result may be incomplete until access is reviewed.'] : []),
		'- Effort ratings are relative and come from fixed rules. They aren\'t commitments or time estimates.',
		'- The assessment can\'t see every dependency, such as code, flows, or external systems that refer to components by name.',
		'- Confirm migration decisions with your implementation partner and a test (sandbox) environment that matches production.',
		'- Your implementation partner can get full technical detail by running the assessment with `--partner-json`.',
		'',
	];
	return output.join('\n');
}
