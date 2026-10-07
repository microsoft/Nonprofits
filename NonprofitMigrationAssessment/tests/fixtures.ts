import { FAMILIES, VERSION, type Family, type Inventory, type RuleBook, type WorkRequest } from '../src/contracts.js';
import { ROUTES } from '../src/routes.js';

export const NOW = new Date('2026-09-29T12:00:00.000Z');
export const TEST_COMMIT = '1234567890abcdef1234567890abcdef12345678';

export function inventory(families: Family[] = ['cdm']): Inventory {
	const routes = ROUTES.filter(route => families.includes(route.family));
	return {
		schemaVersion: '1.0', toolVersion: VERSION,
		questionnaire: {
			schemaVersion: '1.0', assessmentId: 'synthetic-test',
			environment: { alias: 'test-production', url: 'https://synthetic.crm.dynamics.com' },
			consent: { readOnly: true, confirmedAt: NOW.toISOString(), categories: ['solutions'] },
			target: {
				repository: 'https://github.com/microsoft/Nonprofits', commit: TEST_COMMIT,
				source: 'pinned-public-git-checkout',
				files: [{ path: 'synthetic/target.json', sha256: 'a'.repeat(64) }],
				solutions: routes.filter(route => route.family !== 've').map(route => ({
					uniqueName: route.target, version: '3.0.0.0', managed: true,
					publisher: route.publisher, prefix: route.prefix,
				})),
			},
			answers: families.map(family => ({
				family, destination: 'github-same-environment', compatibility: 'reviewed',
				customization: 'standard', dependencies: 'reviewed', integrations: 'reviewed',
				validation: 'ready', veSource: family === 've' ? 'legacy' : 'not-applicable',
				basis: 'SYNTHETIC TEST ONLY: assertions are not migration validation evidence.',
			})),
			work: [],
		},
		discovery: {
			collectedAt: NOW.toISOString(),
			solutions: routes.filter(route => route.family !== 've').map(route => ({
				uniqueName: route.source, version: '2.0.0.0', managed: true,
				publisher: route.publisher, publisherPrefix: route.prefix,
			})),
			evidence: [{
				id: 'solutions', source: 'observed', status: 'observed', collectedAt: NOW.toISOString(),
				collector: 'synthetic', scope: 'environment', inputs: [], reason: 'Synthetic fixture.',
			}],
		},
	};
}

export function rules(): RuleBook {
	const ids = ['shared.preparation', 'custom', 'integration', 'risk',
		...FAMILIES.flatMap(family => ['sandbox', 'validation', 'acceptance', 'production', 'post-cutover'].map(phase => `${family}.${phase}`))];
	return {
		version: 'synthetic-tests', status: 'reviewed',
		rates: ids.map(id => ({
			id,
			workId: id,
			families: [...FAMILIES],
			routeIds: ROUTES.map(route => route.id),
			complexities: ['standard', 'moderate', 'heavy', 'unbounded', 'unknown'],
			effort: { min: 1, max: 2, unit: 'person-hours' },
			elapsed: { min: 1, max: 2, unit: 'hours' },
			execution: id.endsWith('.production') ? { min: 0.5, max: 1, unit: 'hours' } : null,
			downtime: id.endsWith('.production') ? { min: 0, max: 0.5, unit: 'hours' } : null,
			estimateType: 'provisional-typical',
			basis: 'SYNTHETIC ARITHMETIC FIXTURE, NOT A REAL MIGRATION RATE.',
			limitations: ['Synthetic test fixture only.'],
			reviewer: 'Synthetic Test Reviewer',
			reviewedAt: NOW.toISOString(),
			reviewed: true,
		})),
	};
}

export function customization(families: Family[], overrides: Partial<WorkRequest> = {}): WorkRequest {
	return {
		id: 'custom-work', families, kind: 'customization', phase: 'customization',
		environment: 'sandbox', occurrenceId: 'initial', activity: 'remediate', component: 'partner-component',
		ruleId: 'custom', scenario: 'assessed', dependsOn: [], impact: 'bounded',
		basis: 'Synthetic partner layer/removal/dependency remediation; not an actual customer.',
		...overrides,
	};
}
