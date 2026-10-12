import { type Assessment, type Family, type Finding } from './contracts.js';
import { guideUrl, ROUTES } from './routes.js';
import { isMicrosoftFirstPartyPublisher } from './publishers.js';

const FAMILY_NAMES: Record<Family, string> = {
	cdm: 'CDM for Nonprofits',
	fundraising: 'Fundraising',
	grants: 'Grant Management',
	outcomes: 'Outcome Management',
	vm: 'Volunteer Management',
	ve: 'Volunteer Engagement',
};

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
		return 'Installed and GitHub versions match the approved release mapping. Regression-test overlapping customizations.';
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

function cautionMessage(finding: Finding): string {
	return finding.code === 'assumption-based'
		? 'The effort rating is provisional and uses bundled assumptions; validate it with the customer and implementation partner.'
		: finding.message;
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

function recommendation(report: Assessment, route: Assessment['routes'][number]): string {
	if (route.status === 'already-at-target') {
		return customizationSignal(report, route.family).includes('overlapping component')
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

function absentSupportedProducts(report: Assessment, solutionInventoryAvailable: boolean): string[] {
	if (!solutionInventoryAvailable) {
		return [];
	}
	const selected = new Set(report.routes.map(route => route.family));
	const absent = ROUTES
		.filter(route => route.family !== 've' && !selected.has(route.family))
		.map(route => FAMILY_NAMES[route.family]);
	const sites = report.discoverySummary.sites;
	const sitesObserved = ['observed', 'partial'].includes(
		report.evidence.find(item => item.id === 'sites')?.status ?? '',
	);
	if (!selected.has('ve') && sitesObserved && sites
		&& [null, 0].includes(sites.legacySites) && [null, 0].includes(sites.enhancedSites)) {
		absent.push(FAMILY_NAMES.ve);
	}
	return absent;
}

function migrationSequence(report: Assessment): string[] {
	return report.routes.map(route => {
		const product = FAMILY_NAMES[route.family];
		if (route.status === 'already-at-target') {
			return `No migration for **${product}**. Regression-test the overlapping customizations.`;
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

function customerProductRows(
	report: Assessment,
	solutionInventoryAvailable: boolean,
	absentProducts: string[],
): string[] {
	return ROUTES.map(definition => {
		const route = report.routes.find(item => item.family === definition.family);
		if (route) {
			return `| ${text(FAMILY_NAMES[route.family])} | ${sourceVersion(report, route.family)} | ${targetVersion(report, route.family)} | ${text(recommendation(report, route))} | ${decisionConfidence(report, route)} | ${effortDisplay(route)} | ${effortConfidence(route)} | [Guide](${route.guide}) |`;
		}
		const absent = absentProducts.includes(FAMILY_NAMES[definition.family]);
		const installed = absent ? 'Not detected' : definition.family === 've' ? siteStatus(report)
			: solutionInventoryAvailable ? 'Not detected' : 'Status unavailable';
		const decision = absent ? 'No migration required — product not detected' : 'Confirm product presence';
		return `| ${text(FAMILY_NAMES[definition.family])} | ${installed} | ${targetVersion(report, definition.family)} | ${decision} | ${absent ? 'High' : 'Low'} | ${absent ? 'None' : 'Review required'} | ${absent ? 'Not applicable' : 'Not estimable'} | [Guide](${guideUrl(definition, report.target.commit)}) |`;
	});
}

function nextActions(
	report: Assessment,
	interruptionRisk: boolean | null,
): string[] {
	const actions: string[] = [];
	const alignedWithOverlap = report.routes
		.filter(route => route.status === 'already-at-target'
			&& customizationSignal(report, route.family).includes('overlapping component'))
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
		actions.push('Identify which workflows, connection references, and plug-ins belong to the nonprofit migration scope and assign owners.');
	}
	if (interruptionRisk) {
		const constraint = report.operations?.maxInterruptionHours === 0
			? 'requested zero-interruption target'
			: 'stated interruption limit';
		actions.push(`Agree a cutover approach because the ${constraint} is not supported by the current assumptions.`);
	}
	return [...new Set(actions)];
}

export function renderMarkdown(report: Assessment): string {
	const component = report.discoverySummary.components;
	const dependency = report.discoverySummary.dependencies;
	const findings = groupedFindings(report);
	const assessed = report.combined.find(item => item.id === 'assessed');
	const customizationCandidates = component?.customizationCandidates?.filter(item =>
		!isMicrosoftFirstPartyPublisher(item.publisher) && item.componentCount > 0) ?? [];
	const solutionInventoryAvailable = ['observed', 'partial'].includes(
		report.evidence.find(item => item.id === 'solutions')?.status ?? 'unknown',
	);
	const absentProducts = absentSupportedProducts(report, solutionInventoryAvailable);
	const nonBlockingFindings = report.findings.filter(item => !item.blocking
		&& !['already-aligned', 'not-installed'].includes(item.code));
	const interruptionRisk = report.operations?.maxInterruptionHours !== null
		&& report.operations?.maxInterruptionHours !== undefined
		&& assessed?.downtime !== null
		&& assessed?.downtime !== undefined
		&& assessed.downtime.max > report.operations.maxInterruptionHours;
	const accessLimited = report.evidence.some(item => item.status === 'access-denied');
	const solutionEvidenceDate = report.evidence.find(item => item.id === 'solutions')?.collectedAt;
	const actions = nextActions(report, interruptionRisk);
	const productRows = customerProductRows(report, solutionInventoryAvailable, absentProducts);
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
			`| Components checked | ${dependency.checkedComponents} | Deterministic bounded sample of supported-product components |`,
			`| Dependent references returned | ${dependency.dependentReferences} | Total references returned by sampled lookups; not a list of unique dependency edges |`,
			`| Coverage | ${dependency.truncated ? 'Partial — collection limit reached' : 'Bounded sample completed'} | ${dependency.truncated ? 'More dependencies may exist' : 'Dynamic or undiscoverable dependencies may still exist'} |`,
			'',
			'> This assessment does not retain individual source-to-target dependency records. Use a solution-aware technical review when exact dependency names are required.',
		] : ['Dependency metadata was not available.']),
		'',
		'### Environment-wide technical signals',
		'',
		'These counts describe the environment. They are not all automatically part of the nonprofit migration scope.',
		'',
		'| Signal | Result |',
		'| --- | --- |',
		'| Product-scoped workflows and connection references | Not yet attributed; environment-wide counts remain in the detailed JSON |',
		'| Product-scoped plug-in assemblies and steps | Not yet attributed; environment-wide counts remain in the detailed JSON |',
		`| Relevant tables counted | ${report.discoverySummary.counts?.tables.length ?? 'Not available'}${report.discoverySummary.counts?.truncated ? ' (partial)' : ''} |`,
		`| Volunteer Engagement sites | ${text(siteStatus(report))} |`,
		'',
		'### Assessment cautions',
		'',
		...(findings.length ? findings.map((item, index) =>
			`${index + 1}. **${item.families.map(family => text(FAMILY_NAMES[family])).join(', ')}:** ${text(item.message)} ${text(item.action)}`)
			: ['No blocking route findings were produced.']),
		...nonBlockingFindings.map(finding =>
			`- **${finding.families.map(family => text(FAMILY_NAMES[family])).join(', ')}:** ${text(cautionMessage(finding))}`),
		...(report.evidence.filter(item => item.status === 'partial').map(item =>
			`- **${text(item.id)}:** ${text(item.reason)}`)),
		'',
		'### Metric definitions',
		'',
		'| Metric | Meaning |',
		'| --- | --- |',
		'| Decision | What the customer should do for the product. |',
		'| Decision confidence | How certain the observed product version or site evidence makes that decision. |',
		'| Provisional effort | Relative migration work: None, Low, Medium, or High. It is not a time estimate. |',
		'| Effort confidence | How reliable the effort rating is. It does not describe confidence in the installed version. |',
		'',
		'## Notes',
		'',
		...(accessLimited ? ['- Some metadata could not be read. The result may be incomplete until access is reviewed.'] : []),
		'- Bundled uncalibrated engineering assumptions determine the effort rating; it is not a commitment.',
		'- Direct overlap does not prove every dynamic dependency or custom behavior.',
		'- Validate migration decisions with the implementation partner and a representative sandbox.',
		'- Detailed ranges, evidence, hashes, and technical reasons remain in the local JSON file.',
		'',
	];
	return output.join('\n');
}
