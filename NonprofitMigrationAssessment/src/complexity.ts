import type { Complexity, Family, Inventory } from './contracts.js';
import { ROUTES } from './routes.js';

export interface ComplexityResult {
	level: Complexity;
	reasons: string[];
	evidenceIds: string[];
}

type Components = NonNullable<Inventory['discovery']['components']>;
type LayerItem = NonNullable<Components['layerCustomizations']>[number];
type Automation = NonNullable<NonNullable<Inventory['discovery']['integrations']>['automations']>[number];

export const HEAVY_CUSTOMIZATION_COUNT = 10;
const MAX_REASON_GROUPS = 4;
const COMPONENT_NOUNS: Record<number, [string, string]> = {
	1: ['table definition', 'table definitions'],
	2: ['column', 'columns'],
	9: ['choice', 'choices'],
	10: ['relationship', 'relationships'],
	26: ['view', 'views'],
	29: ['workflow', 'workflows'],
	59: ['chart', 'charts'],
	60: ['form', 'forms'],
	61: ['web resource', 'web resources'],
	62: ['site map', 'site maps'],
	80: ['app', 'apps'],
	91: ['plug-in assembly', 'plug-in assemblies'],
	92: ['plug-in step', 'plug-in steps'],
};
const AUTOMATION_NOUNS: Record<Automation['kind'], [string, string]> = {
	'plugin-step': ['plug-in step', 'plug-in steps'],
	process: ['process', 'processes'],
	'cloud-flow': ['cloud flow', 'cloud flows'],
};

export interface FamilyEvidence {
	items: LayerItem[];
	automations: Automation[];
	named: boolean;
}

// Named evidence comes from the solution layer scan; without it the older overlap count is the only signal.
export function familyEvidence(inventory: Inventory, family: Family): FamilyEvidence {
	const route = ROUTES.find(item => item.family === family)!;
	const owned = (products: string[]): boolean => products.some(name => [route.source, route.target].includes(name));
	return {
		items: (inventory.discovery.components?.layerCustomizations ?? []).filter(item => owned(item.productUniqueNames)),
		automations: (inventory.discovery.integrations?.automations ?? []).filter(item => owned(item.productUniqueNames)),
		named: inventory.discovery.components?.layerScan !== undefined,
	};
}

function tableList(names: string[]): string {
	const distinct = [...new Set(names)].sort((left, right) => left.localeCompare(right, 'en'));
	return distinct.length > 3
		? `${distinct.slice(0, 3).join(', ')}, and ${distinct.length - 3} more`
		: distinct.join(', ');
}

function location(layer: 'active' | 'managed-solution', solution: string | null | undefined): string {
	return layer === 'active' ? 'directly in this environment' : `by ${solution ?? 'an unidentified solution'}`;
}

export function customizationReasons(evidence: FamilyEvidence): string[] {
	const groups = new Map<string, { count: number; noun: [string, string]; verb: string; where: string; tables: string[] }>();
	const addGroup = (key: string, noun: [string, string], verb: string, where: string, tables: string[]): void => {
		const group = groups.get(key) ?? { count: 0, noun, verb, where, tables: [] };
		group.count++;
		group.tables.push(...tables);
		groups.set(key, group);
	};
	for (const item of evidence.items) {
		const verb = item.change === 'added' ? 'added' : item.change === 'modified' ? 'changed' : 'added or changed';
		const where = location(item.layer, item.solutions[0]);
		addGroup(`c|${item.layer}|${item.layer === 'active' ? '' : item.solutions[0]}|${verb}|${item.type}`,
			COMPONENT_NOUNS[item.type] ?? ['component', 'components'], verb, where,
			item.table ? [item.tableDisplayName ?? item.table] : []);
	}
	for (const automation of evidence.automations) {
		addGroup(`a|${automation.layer}|${automation.solution ?? ''}|${automation.kind}`,
			AUTOMATION_NOUNS[automation.kind], 'registered', location(automation.layer, automation.solution),
			automation.tableDisplayNames);
	}
	const sentences = [...groups.values()]
		.sort((left, right) => right.count - left.count || left.noun[0].localeCompare(right.noun[0], 'en'))
		.map(group => `${group.count} ${group.noun[group.count === 1 ? 0 : 1]} ${group.verb} ${group.where}${group.tables.length ? ` on ${tableList(group.tables)}` : ''}.`);
	return sentences.length > MAX_REASON_GROUPS
		? [...sentences.slice(0, MAX_REASON_GROUPS), `${sentences.length - MAX_REASON_GROUPS} more group(s) are listed in Customizations in Microsoft nonprofit solutions.`]
		: sentences;
}

function heavyRules(evidence: FamilyEvidence, family: Family): string[] {
	const total = evidence.items.length + evidence.automations.length;
	const solutions = new Set([
		...evidence.items.filter(item => item.layer === 'managed-solution').flatMap(item => item.solutions),
		...evidence.automations.flatMap(item => item.layer === 'managed-solution' && item.solution ? [item.solution] : []),
	]);
	const replaced = ['vm', 've'].includes(family)
		? evidence.items.filter(item => item.type === 10 && item.change !== 'modified').length + evidence.automations.length
		: 0;
	return [
		...(total > HEAVY_CUSTOMIZATION_COUNT ? [`more than ${HEAVY_CUSTOMIZATION_COUNT} named customizations (${total})`] : []),
		...(solutions.size >= 2 ? [`changes from ${solutions.size} partner or custom solutions (${[...solutions].sort((left, right) => left.localeCompare(right, 'en')).join(', ')})`] : []),
		...(replaced ? [`${replaced} custom relationship(s) or automation(s) use tables that this migration replaces and must be rebuilt`] : []),
	];
}
export function classifyComplexity(inventory: Inventory, family: Family): ComplexityResult {
	const answer = inventory.questionnaire.answers.find(item => item.family === family);
	if (!answer) {
		return {
			level: 'unknown',
			reasons: ['No route answer was supplied.'],
			evidenceIds: [],
		};
	}
	if (family === 've' && answer.veSource !== 'legacy') {
		return {
			level: 'unknown',
			reasons: ['The Volunteer Engagement source site state is not established.'],
			evidenceIds: [`answers.${family}`, 'sites'],
		};
	}
	if (answer.customization === 'opaque') {
		return {
			level: 'unbounded',
			reasons: ['Customizations or integrations exist, but their owner or impact is unknown.'],
			evidenceIds: [`answers.${family}`],
		};
	}
	const evidence = familyEvidence(inventory, family);
	const customJourneys = family === 've' && answer.veCustomJourneys === 'present';
	const namedTotal = evidence.items.length + evidence.automations.length;
	if (evidence.named && namedTotal > 0) {
		const rules = [
			...heavyRules(evidence, family),
			...(answer.customization === 'customized' && customJourneys ? ['business-critical custom site journeys must be preserved'] : []),
		];
		return {
			level: rules.length ? 'heavy' : 'moderate',
			reasons: [
				rules.length
					? `Heavy because of ${rules.join('; ')}.`
					: `Moderate because ${namedTotal} named customization(s) must be retested or recreated and no heavy rule applies.`,
				...customizationReasons(evidence),
			],
			evidenceIds: [
				`answers.${family}`,
				'components',
				...(evidence.automations.length ? ['integrations'] : []),
			],
		};
	}
	const overlap = evidence.named ? 0 : inventory.discovery.components?.overlappingUnmanagedComponents ?? 0;
	if (answer.customization === 'customized' || overlap > 0) {
		const heavy = overlap > HEAVY_CUSTOMIZATION_COUNT || (answer.customization === 'customized' && customJourneys);
		return {
			level: heavy ? 'heavy' : 'moderate',
			reasons: [
				...(answer.customization === 'customized' ? ['Customizations affecting this product were identified.'] : []),
				...(overlap ? [`${overlap} unmanaged change(s) overlap nonprofit solution components.`] : []),
				...(customJourneys ? ['Business-critical custom site journeys must be preserved.'] : []),
			],
			evidenceIds: [
				`answers.${family}`,
				...(overlap ? ['components'] : []),
			],
		};
	}
	const reviewed = answer.compatibility === 'reviewed'
		&& answer.dependencies === 'reviewed'
		&& answer.integrations === 'reviewed'
		&& answer.validation === 'ready'
		&& answer.customization === 'standard'
		&& answer.basis.trim().length > 0;
	if (reviewed) {
		return {
			level: 'standard',
			reasons: ['A customer or partner review confirmed standard behavior.'],
			evidenceIds: [`answers.${family}`, ...(inventory.discovery.components ? ['components'] : [])],
		};
	}
	const componentEvidence = inventory.discovery.evidence.find(item => item.id === 'components');
	const automationScan = inventory.discovery.integrations?.automationScan;
	const noCustomizationsFound = ['unknown', 'standard'].includes(answer.customization)
		&& componentEvidence?.status === 'observed' && overlap === 0;
	// Inventories collected before automation discovery have no scan; a failed or capped scan can hide automation.
	if (noCustomizationsFound && automationScan && automationScan.status !== 'complete') {
		return {
			level: 'unknown',
			reasons: ['Plug-in steps, processes, or cloud flows on this product\'s tables couldn\'t all be checked.'],
			evidenceIds: ['components', 'integrations', `answers.${family}`],
		};
	}
	if (noCustomizationsFound) {
		return {
			level: 'likely-standard',
			reasons: [
				'No customizations were found on this product\'s components.',
				'External and dynamic dependencies may still exist.',
			],
			evidenceIds: ['components', `answers.${family}`],
		};
	}
	return {
		level: 'unknown',
		reasons: ['Customization, dependency, or integration scope is still unknown.'],
		evidenceIds: [`answers.${family}`],
	};
}