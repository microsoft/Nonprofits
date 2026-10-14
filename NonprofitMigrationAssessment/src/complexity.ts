import type { Complexity, Family, Inventory } from './contracts.js';
import { ROUTES } from './routes.js';

export interface ComplexityResult {
	level: Complexity;
	reasons: string[];
	evidenceIds: string[];
}

function customizationCount(inventory: Inventory, family: Family): number {
	const components = inventory.discovery.components;
	if (!components?.layerScan) {
		return components?.overlappingUnmanagedComponents ?? 0;
	}
	const route = ROUTES.find(item => item.family === family)!;
	return (components.layerCustomizations ?? []).filter(item =>
		item.productUniqueNames.some(name => [route.source, route.target].includes(name))).length;
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
	const overlap = customizationCount(inventory, family);
	const customJourneys = family === 've' && answer.veCustomJourneys === 'present';
	if (answer.customization === 'customized' || overlap > 0) {
		const heavy = overlap > 10 || (answer.customization === 'customized' && customJourneys);
		return {
			level: heavy ? 'heavy' : 'moderate',
			reasons: [
				...(answer.customization === 'customized' ? ['Customizations affecting this product were identified.'] : []),
				...(overlap ? [`${overlap} customization(s) were found on this product's components.`] : []),
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
	if (['unknown', 'standard'].includes(answer.customization) && componentEvidence?.status === 'observed'
		&& overlap === 0) {
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