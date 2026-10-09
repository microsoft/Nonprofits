import { type Assessment, type Family, type Finding } from './contracts.js';
import { ROUTES } from './routes.js';
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
	return solution ? `${text(solution.uniqueName)} ${text(solution.version)}` : family === 've' ? 'Site not observed' : 'Not installed';
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
	}[type] ?? `Other (${type})`;
}

function componentBreakdown(
	types: Array<{ type: number; count: number }>,
	componentCount: number,
): string {
	return types.length
		? types.map(item => `${componentType(item.type)}: ${item.count}`).join(', ')
		: componentCount > 0 ? 'Not captured in this inventory' : 'No components';
}

function recommendation(route: Assessment['routes'][number]): string {
	if (route.status === 'already-at-target') {
		return 'No action — already aligned';
	}
	if (route.status === 'not-installed') {
		return 'No action — not installed';
	}
	if (route.status === 'eligible') {
		return route.intent === 'ownership-transition' ? 'Optional ownership transition'
			: route.intent === 'apply-github-release' ? 'Update to GitHub release'
				: 'Migrate to GitHub solution';
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
		return `  ${route.family}["${FAMILY_NAMES[route.family]}<br/>${effortSummary(route)}"]`;
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

export function renderMarkdown(report: Assessment): string {
	const component = report.discoverySummary.components;
	const dependency = report.discoverySummary.dependencies;
	const findings = groupedFindings(report);
	const assessed = report.combined.find(item => item.id === 'assessed');
	const noMigrationRequired = report.routes.length > 0
		&& report.routes.every(route => ['already-at-target', 'not-installed'].includes(route.status));
	const customizationCandidates = component?.customizationCandidates?.filter(item =>
		!isMicrosoftFirstPartyPublisher(item.publisher) && item.componentCount > 0) ?? [];
	const solutionInventoryAvailable = ['observed', 'partial'].includes(
		report.evidence.find(item => item.id === 'solutions')?.status ?? 'unknown',
	);
	const interruptionRisk = report.operations?.maxInterruptionHours !== null
		&& report.operations?.maxInterruptionHours !== undefined
		&& assessed?.downtime
		&& assessed.downtime.max > report.operations.maxInterruptionHours;
	const accessLimited = report.evidence.some(item => item.status === 'access-denied');
	const output = [
		'# Nonprofit migration assessment',
		'',
		'> This report summarizes installed nonprofit products, customizations, dependencies, and recommended next steps.',
		'> The assessment only reads metadata and does not change the environment.',
		'',
		'## Environment',
		'',
		'| Property | Value |',
		'| --- | --- |',
		`| Name | ${text(report.environment)} |`,
		`| URL | ${text(report.environmentUrl)} |`,
		`| Dataverse version | ${text(report.environmentProfile.dataverseVersion ?? 'Not available')} |`,
		`| Overall recommendation | ${noMigrationRequired ? 'No migration required' : findings.length ? 'Review identified items before migration' : 'Migration planning available'} |`,
		`| Overall effort | ${overallEffort(report)} |`,
		'',
		'## What is installed and what should you do?',
		'',
		'| Product | Installed solution / version | GitHub target / version | Customization signal | Depends on | Recommended action | Effort | GitHub |',
		'| --- | --- | --- | --- | --- | --- | --- | --- |',
		...report.routes.map(route =>
			`| ${text(FAMILY_NAMES[route.family])} | ${sourceVersion(report, route.family)} | ${targetVersion(report, route.family)} | ${customizationSignal(report, route.family)} | ${text(dependencies(route.family))} | ${text(recommendation(route))} | ${effortSummary(route)} | [Guide](${route.guide}) |`),
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
			...(component?.truncated ? ['', '> Collection limits were reached. Additional customization solutions or components may exist.'] : []),
			] : ['No custom or partner solution candidates were identified within the bounded collection scope.']),
		'',
		'## Priority blockers and next actions',
		'',
		...(findings.length ? [
			'Resolve the blockers from top to bottom. Dependency blockers clear only after their prerequisite product is resolved.',
			'',
			'| # | Scope | Type | Blocker | Required action |',
			'| --- | --- | --- | --- | --- |',
			...findings.map((item, index) => `| ${index + 1} | ${item.families.map(family => text(FAMILY_NAMES[family])).join(', ')} | ${item.derived ? 'Dependency' : 'Direct'} | ${text(item.message)} | ${text(item.action)} |`),
		] : ['No blocking findings were produced. Review limitations before migration approval.']),
		'',
		'## Dependencies',
		'',
		'### Product migration order',
		'',
		...dependencyDiagram(report),
		'',
		'The arrows show required migration order, not every Dataverse component dependency.',
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
		'## Notes',
		'',
		...(accessLimited ? ['- Some metadata could not be read. The result may be incomplete until access is reviewed.'] : []),
		...(interruptionRisk ? ['- The estimated downtime may exceed the stated interruption limit. Plan a rehearsal or cutover mitigation.'] : []),
		'- Bundled uncalibrated engineering assumptions determine the effort rating; it is not a commitment.',
		'- Direct overlap does not prove every dynamic dependency or custom behavior.',
		'- Validate migration decisions with the implementation partner and a representative sandbox.',
		'- Detailed ranges, evidence, hashes, and technical reasons remain in the local JSON file.',
		'',
	];
	return output.join('\n');
}
