import type { Discovery, Questionnaire } from './contracts.js';
import { ROUTES } from './routes.js';

export function selectAnswers(
	questionnaire: Questionnaire,
	discovery: Discovery,
): Questionnaire['answers'] {
	return questionnaire.answers.filter(answer => {
		if (answer.scope === 'include' || answer.scope === undefined) {
			return true;
		}
		if (answer.scope === 'exclude') {
			return false;
		}
		const route = ROUTES.find(item => item.family === answer.family)!;
		if (answer.family === 've') {
			if (answer.veSource === 'legacy' || answer.veSource === 'target'
				|| (discovery.sites?.legacySites ?? 0) > 0
				|| (discovery.sites?.enhancedSites ?? 0) > 0) {
				return true;
			}
			const siteEvidence = discovery.evidence.find(item => item.id === 'sites');
			const absenceConfirmed = siteEvidence?.status === 'observed'
				&& discovery.sites?.legacySites === 0
				&& discovery.sites.enhancedSites === 0;
			return !absenceConfirmed;
		}
		return discovery.solutions.some(solution =>
			[route.source, route.target].some(name =>
				name.toLowerCase() === solution.uniqueName.toLowerCase()));
	});
}
