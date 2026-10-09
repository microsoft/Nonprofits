import type { Complexity, Family, Inventory } from './contracts.js';

export interface ComplexityResult {
	level: Complexity;
	reasons: string[];
	evidenceIds: string[];
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
	const work = inventory.questionnaire.work.filter(item => item.families.includes(family));
	if (family === 've' && answer.veSource !== 'legacy') {
		return {
			level: 'unknown',
			reasons: ['The Volunteer Engagement source site state is not established.'],
			evidenceIds: [`answers.${family}`, 'sites'],
		};
	}
	const unbounded = work.filter(item => item.impact === 'unbounded');
	if (unbounded.length > 0) {
		return {
			level: 'unbounded',
			reasons: ['One or more declared remediation or risk items have unbounded impact.'],
			evidenceIds: [`answers.${family}`],
		};
	}
	const boundedCustom = work.filter(item => item.impact === 'bounded'
		&& ['customization', 'integration'].includes(item.kind));
	const overlap = inventory.discovery.components?.overlappingUnmanagedComponents ?? 0;
	const hasCustomizationAndIntegration = boundedCustom.some(item => item.kind === 'customization')
		&& boundedCustom.some(item => item.kind === 'integration');
	if (answer.customization === 'customized' || boundedCustom.length > 0 || overlap > 0) {
		const heavy = boundedCustom.length >= 3 || hasCustomizationAndIntegration || overlap > 10;
		return {
			level: heavy ? 'heavy' : 'moderate',
			reasons: [
				answer.customization === 'customized'
					? 'Customer review declares customized behavior.'
					: 'Observed or scoped work contradicts a standard-only classification.',
				...(boundedCustom.length ? [`${boundedCustom.length} bounded customization/integration work item(s) are scoped.`] : []),
				...(overlap ? [`${overlap} unmanaged component overlap signal(s) were observed across selected solutions.`] : []),
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
			reasons: ['Current customer/partner review declares standard behavior and no contradictory scoped work was provided.'],
			evidenceIds: [`answers.${family}`, ...(inventory.discovery.components ? ['components'] : [])],
		};
	}
	const componentEvidence = inventory.discovery.evidence.find(item => item.id === 'components');
	const noContradictoryWork = ['unknown', 'standard'].includes(answer.customization) && work.length === 0;
	if (noContradictoryWork && componentEvidence?.status === 'observed'
		&& inventory.discovery.components?.overlappingUnmanagedComponents === 0) {
		return {
			level: 'likely-standard',
			reasons: [
				'No unmanaged overlap with selected solution components was observed.',
				'No customer-specific remediation work is declared.',
				'This is an assumption-based classification; external and dynamic dependencies may still exist.',
			],
			evidenceIds: ['components', `answers.${family}`],
		};
	}
	return {
		level: 'unknown',
		reasons: ['Critical compatibility, customization, dependency, integration, or validation scope remains unknown.'],
		evidenceIds: [`answers.${family}`],
	};
}
