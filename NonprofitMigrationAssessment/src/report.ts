import { type Assessment, type Family, type Finding } from './contracts.js';
import { FAMILY_NAMES, ROUTES } from './routes.js';
import { isMicrosoftFirstPartyPublisher } from './publishers.js';

function text(value: string): string {
	return value.replace(/[&<>|`\\[\]*_]/g, character => `&#${character.charCodeAt(0)};`)
		.replace(/[\r\n\u0000-\u001f]/g, ' ');
}

function sourceVersion(report: Assessment, family: Family): string {
	const route = ROUTES.find(item => item.family === family)!;
	const solution = report.installedSolutions.find(item =>
		[route.source, route.target].some(name => name.toLowerCase() === item.uniqueName.toLowerCase()));
	return solution ? `${text(solution.uniqueName)} ${text(solution.version)}` : family === 've' ? siteStatus(report) : 'Not installed';
}

function targetVersion(report: Assessment, family: Family): string {
	const route = ROUTES.find(item => item.family === family)!;
	const target = report.target.solutions.find(item => item.uniqueName === route.target);
	return target ? `${text(target.uniqueName)} ${text(target.version)}` : family === 've' ? 'Portal-EDM site' : 'Target metadata unavailable';
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
		'not-estimable': 'Not estimable',
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
		return 'Not estimable';
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
	if (route.status === 'already-at-target') {
		return `Installed and GitHub versions match the approved release mapping. ${hasCustomizations(report, route.family)
			? `Regression-test customizations: ${customizationSignal(report, route.family)}.`
			: 'No customizations were found on this product\'s components.'}`;
	}
	const overlap = customizationSignal(report, route.family);
	if (route.family === 've') {
		return `${siteStatus(report)}. Effort applies only if a legacy site must be migrated.`;
	}
	if (route.family === 'vm' && route.status === 'eligible') {
		return `Legacy Volunteer Management must be replaced by a different GitHub solution. ${overlap}.`;
	}
	return `${recommendation(report, route)}. ${overlap}.`;
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
		: sites.legacySites === 0 ? 'No legacy site observed' : `${sites.legacySites} legacy site(s) observed`;
	const enhanced = sites.enhancedSites === null
		? 'no enhanced site capability detected'
		: sites.enhancedSites === 0 ? 'no enhanced site observed' : `${sites.enhancedSites} enhanced site(s) observed`;
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
		return componentCount > 0 ? 'Not captured in this inventory' : 'No components';
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
		? familyLayerCustomizations(report, family).length > 0
		: customizationSignal(report, family).includes('overlapping component');
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
		return 'Verify whether VM migration is complete';
	}
	return route.status === 'unsupported' ? 'Route not supported' : 'Review before migration';
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
		const items = familyLayerCustomizations(report, family);
		if (items.length) {
			const added = items.filter(item => item.change === 'added').length;
			const changed = items.filter(item => item.change === 'modified').length;
			return `${items.length} named customization(s) found (${added} added, ${changed} changed); see Customizations in Microsoft nonprofit solutions`;
		}
		if (report.discoverySummary.components.layerScan.status === 'complete') {
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
		return `${count} overlapping component(s) from ${matching.map(item => text(item.solution)).join(', ')}`;
	}
	const summary = report.discoverySummary.components?.productSummaries?.find(item =>
		[route.source, route.target].includes(item.uniqueName));
	if (!summary && candidates.length === 0) {
		return family === 've' ? 'See site review' : 'Not available';
	}
	return 'No direct component overlap found';
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

function layerCoverage(scan: NonNullable<NonNullable<Assessment['discoverySummary']['components']>['layerScan']>): string {
	if (scan.status === 'unavailable') {
		return 'Solution layer details were not available, so changes made directly in this environment are not listed. Only components shared with custom or partner solutions are shown.';
	}
	const coverage = `Checked ${scan.checkedTables} of ${scan.productTables} nonprofit tables for unmanaged changes and ${scan.checkedSolutionTables} of ${scan.solutionTables} tables extended by custom or partner solutions.`;
	return scan.status === 'partial'
		? `${coverage} Some checks did not complete or reached a safety limit, so more changes may exist.`
		: coverage;
}

function layerCustomizationSection(report: Assessment, dependencyCounts: Map<string, number>): string[] {
	const component = report.discoverySummary.components!;
	const scan = component.layerScan!;
	const checked = new Set((component.customizationComponents ?? []).map(item => item.objectId.toLowerCase()));
	const families = report.routes
		.filter(route => route.status !== 'not-installed')
		.map(route => route.family);
	const output = [
		'## Customizations in Microsoft nonprofit solutions',
		'',
		'Each row is a change layered on top of a Microsoft nonprofit solution component, or a new column, relationship, view, or form added to a nonprofit table. Plan to retest, recreate, or confirm each change against the GitHub version.',
		'',
		`**Coverage:** ${layerCoverage(scan)}`,
		'',
	];
	for (const family of families) {
		const items = [...familyLayerCustomizations(report, family)].sort((left, right) =>
			(left.tableDisplayName ?? left.table ?? '').localeCompare(right.tableDisplayName ?? right.table ?? '', 'en')
			|| left.type - right.type
			|| (left.displayName ?? left.name).localeCompare(right.displayName ?? right.name, 'en')
			|| left.layer.localeCompare(right.layer, 'en'));
		output.push(`### ${text(FAMILY_NAMES[family])}`, '');
		if (!items.length) {
			output.push(scan.status === 'complete'
				? 'No customizations were found on this product\'s components.'
				: 'No customizations were found within the checked scope.', '');
			continue;
		}
		const added = items.filter(item => item.change === 'added').length;
		const changed = items.filter(item => item.change === 'modified').length;
		output.push(
			`**Summary:** ${items.length} customization(s): ${added} added, ${changed} changed${items.length - added - changed ? `, ${items.length - added - changed} added or changed` : ''}.`,
			'',
			'| Table | Component | Type | Change | Where the change lives | Dependents found |',
			'| --- | --- | --- | --- | --- | --- |',
			...items.map(item => {
				const table = item.table
					? item.tableDisplayName ? `${text(item.tableDisplayName)} (${text(item.table)})` : text(item.table)
					: [2, 10, 26, 59, 60].includes(item.type) ? 'Table not identified' : 'Not table-specific';
				const name = item.type === 1
					? 'Table properties'
					: item.displayName && item.displayName !== item.name
						? `${text(item.displayName)} (${text(item.name)})`
						: text(item.name);
				const related = item.relatedTable && item.relatedTable !== item.tableDisplayName
					? `; related table: ${text(item.relatedTable)}`
					: '';
				const dependents = checked.has(item.objectId.toLowerCase())
					? String(dependencyCounts.get(item.objectId.toLowerCase()) ?? 0)
					: 'Not checked';
				return `| ${table} | ${name}${related} | ${singularComponentType(item.type)} | ${layerChange(item)} | ${layerLocation(report, item)} | ${dependents} |`;
			}),
			'',
		);
	}
	return output;
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
			return `Confirm whether **${product}** is applicable (${siteStatus(report)}). If migration is chosen, perform it after CDM for Nonprofits and Volunteer Management.`;
		}
		const prerequisite = dependencies(route.family);
		return `${recommendation(report, route)} for **${product}**${prerequisite === 'None' ? '' : ` after ${prerequisite}`}, then validate its customizations and integrations.`;
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
		actions.push(`Rehearse the ${FAMILY_NAMES[route.family]} migration in the representative sandbox and validate its customizations and integrations.`);
	}
	const ve = report.routes.find(route => route.family === 've');
	if (ve && decisionConfidence(report, ve) === 'Low') {
		actions.push('Confirm whether a legacy Volunteer Engagement site exists before including it in migration scope.');
	}
	if (report.evidence.find(item => item.id === 'dependencies')?.status === 'partial') {
		actions.push('Complete a named dependency review for the components in migration scope.');
	}
	if (report.evidence.find(item => item.id === 'integrations')?.status === 'partial') {
		actions.push(report.discoverySummary.integrations?.scope === 'selected-products-and-overlapping-customizations'
			? 'Review the scoped workflows, connection references, and plug-ins and assign owners.'
			: 'Identify which workflows, connection references, and plug-ins belong to the nonprofit migration scope and assign owners.');
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
		'> The assessment only reads metadata and does not change the environment.',
		'> This report was generated by an AI-assisted assessment skill. Decisions and effort are rule-based, not AI estimates. Validate the findings before taking any action.',
		'',
		'## Executive decision',
		'',
		'| Property | Value |',
		'| --- | --- |',
		`| Environment name | ${text(report.environment)} |`,
		`| URL | ${text(report.environmentUrl)} |`,
		`| Dataverse version | ${text(report.environmentProfile.dataverseVersion ?? 'Not available')} |`,
		`| Evidence collected | ${text(solutionEvidenceDate?.slice(0, 10) ?? 'Not available')} |`,
		`| Solutions inventoried | ${report.environmentProfile.solutionInventoryCount ?? 'Not available'} |`,
		`| Recommendation | ${text(executiveRecommendation(report))} |`,
		`| Provisional overall effort | ${overallEffort(report)} |`,
		`| Overall effort confidence | ${overallEffortConfidence(report)} |`,
		'',
		'## Supported nonprofit products and recommendations',
		'',
		'Decision confidence describes certainty in the action. Effort confidence describes only the reliability of the relative effort rating.',
		'',
		'| Product | Installed solution / version | GitHub target / version | Decision | Decision confidence | Provisional effort | Effort confidence | GitHub |',
		'| --- | --- | --- | --- | --- | --- | --- | --- |',
		...productRows,
		'',
		'### Why these effort ratings?',
		'',
		'| Product | Provisional effort | Effort confidence | Why |',
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
		'## Customization solutions',
		'',
		...(!solutionInventoryAvailable
			? ['Customization inventory is unavailable because installed solutions could not be read.']
			: customizationCandidates.length ? [
			`**Summary:** ${customizationCandidates.length} custom or partner solution(s); ${customizationCandidates.filter(item => !item.managed).length} unmanaged; ${customizationCandidates.filter(item => item.overlaps.length > 0).length} with direct supported-product overlap.`,
			'',
			'| Solution | Type | Publisher | Components | Component details | Affects supported products | Why review it? |',
			'| --- | --- | --- | --- | --- | --- | --- |',
			...customizationCandidates.map(item => {
				const affects = item.overlaps.length
					? item.overlaps.map(overlap => `${text(overlap.productUniqueName)} (${overlap.componentCount})`).join(', ')
					: 'No direct overlap found';
				const review = item.overlaps.length
					? 'Direct overlap found; validate behavior and deployment order'
					: 'No direct overlap found; confirm dynamic dependencies separately';
				return `| ${text(item.uniqueName)} | ${item.managed ? 'Managed' : 'Unmanaged'} | ${text(item.publisher)} | ${item.componentCount} | ${componentBreakdown(item.componentTypes, item.componentCount)} | ${affects} | ${review} |`;
			}),
			...(component?.truncated ? ['', `> **Partial scan:** ${customizationCandidates.length} custom or partner solution candidates are shown. At least one collection limit was reached, so additional solutions or components may exist.`] : []),
			] : ['No custom or partner solution candidates were identified within the bounded collection scope.']),
		'',
		...(!component?.layerScan && customizationComponents.length ? [
			'### Named customization overlap components',
			'',
			'| Component | Type | Custom solution | Affects product | Dependent references |',
			'| --- | --- | --- | --- | --- |',
			...customizationComponents.map(item =>
				`| ${text(item.name)}${item.nameSource === 'identifier' ? ' (identifier)' : ''} | ${componentType(item.type)} | ${item.customizationSolutions.map(text).join(', ')} | ${item.productUniqueNames.map(name => text(productName(name))).join(', ')} | ${dependencyCounts.get(item.objectId.toLowerCase()) ?? 0} |`),
			'',
			'Individual dependency edges, stable component IDs, and unresolved dependent-component identifiers remain in the detailed JSON.',
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
		'### Observed environment dependency signal',
		'',
		...(dependency ? [
			'| Signal | Result | What it means |',
			'| --- | --- | --- |',
			...(dependency.scope === 'direct-customization-overlaps' ? [
				`| Direct customization-overlap components found | ${dependency.candidateComponents ?? 'Not available'} | Components shared by an installed nonprofit solution and a custom/partner solution |`,
				`| Overlap components checked | ${dependency.checkedComponents} | Dependency lookup was limited to the observed overlap components |`,
			] : [
				`| Components checked | ${dependency.checkedComponents} | Deterministic bounded sample of supported-product components |`,
			]),
			`| Dependent references returned | ${dependency.dependentReferences} | Total references returned by ${dependency.scope === 'direct-customization-overlaps' ? 'overlap-component' : 'sampled'} lookups; not a list of unique dependency edges |`,
			`| Coverage | ${dependency.truncated ? 'Partial — safety cap reached' : dependency.scope === 'direct-customization-overlaps' ? 'Complete for observed direct overlaps' : 'Bounded sample completed'} | ${dependency.truncated ? 'Some observed overlap components were not checked' : 'Dynamic or undiscoverable dependencies can still exist'} |`,
			'',
			'> Individual dependency edges and stable component IDs are retained in the optional partner JSON. The customer report summarizes per-component reference counts.',
		] : ['Dependency metadata was not available.']),
		'',
		'### Scoped technical signals',
		'',
		'Integration counts are limited to installed nonprofit solutions and custom solutions that directly overlap them. Relevant table counts use the same selected-product component evidence.',
		'',
		'| Signal | Result |',
		'| --- | --- |',
		...(report.discoverySummary.integrations?.scope === 'selected-products-and-overlapping-customizations' ? [
			`| Scoped solutions | ${report.discoverySummary.integrations.scopedSolutions ?? 'Not available'} installed product and overlapping customization solutions |`,
			`| Scoped workflows | ${report.discoverySummary.integrations.workflows ?? 'Not available'} |`,
			`| Scoped connection references | ${report.discoverySummary.integrations.connectionReferences ?? 'Not available'} |`,
			`| Scoped plug-in assemblies | ${report.discoverySummary.integrations.pluginAssemblies ?? 'Not available'} |`,
			`| Scoped plug-in steps | ${report.discoverySummary.integrations.pluginSteps ?? 'Not available'} |`,
		] : [
			'| Product-scoped workflows and connection references | Not yet attributed; environment-wide counts remain in the detailed JSON |',
			'| Product-scoped plug-in assemblies and steps | Not yet attributed; environment-wide counts remain in the detailed JSON |',
		]),
		`| Relevant tables counted | ${report.discoverySummary.counts?.tables.length ?? 'Not available'}${report.discoverySummary.counts?.truncated ? ' (partial)' : ''} |`,
		...(report.routes.some(route => route.family === 've')
			? [`| Volunteer Engagement sites | ${text(siteStatus(report))} |`]
			: []),
		'',
		'### Related data volumes',
		'',
		...(dataVolumes.length ? [
			'Largest non-empty related tables from the bounded snapshot count:',
			'',
			'| Table | Related product | Snapshot rows |',
			'| --- | --- | --- |',
			...dataVolumes.map(table =>
				`| ${text(table.logicalName)} | ${table.products?.length ? table.products.map(name => text(productName(name))).join(', ') : 'Not attributed'} | ${table.count} |`),
		] : ['No non-empty related table counts were available.']),
		'',
		'### Assessment cautions',
		'',
		...(findings.length ? findings.map((item, index) =>
			`${index + 1}. **${item.families.map(family => text(FAMILY_NAMES[family])).join(', ')}:** ${text(item.message)} ${text(item.action)}`)
			: ['No blocking route findings were produced.']),
		...nonBlockingFindings.map(finding =>
			`- **${finding.families.map(family => text(FAMILY_NAMES[family])).join(', ')}:** ${text(finding.message)}`),
		...(report.evidence.filter(item => item.status === 'partial').map(item =>
			`- **${text(item.id)}:** ${text(item.reason)}`)),
		'',
		'### Metric definitions',
		'',
		'| Metric | Meaning |',
		'| --- | --- |',
		'| Decision | What the customer should do for the product. |',
		'| Decision confidence | How certain the observed product version or site evidence makes that decision. |',
		'| Provisional effort | Relative migration work: None, Low, Medium, or High. It isn\'t a time, cost, or downtime estimate. |',
		'| Effort confidence | How reliable the effort rating is. It does not describe confidence in the installed version. |',
		'',
		'## Notes',
		'',
		...(accessLimited ? ['- Some metadata could not be read. The result may be incomplete until access is reviewed.'] : []),
		'- Effort ratings are relative and rule-based. They aren\'t commitments or time estimates.',
		'- Direct overlap does not prove every dynamic dependency or custom behavior.',
		'- Validate migration decisions with the implementation partner and a representative sandbox.',
		'- Detailed evidence, hashes, and technical reasons remain in the optional partner JSON.',
		'',
	];
	return output.join('\n');
}
