import type { Family } from './contracts.js';

export const CATALOG_VERSION = 'candidate-0.1';

export const FAMILY_NAMES: Record<Family, string> = {
	cdm: 'CDM for Nonprofits',
	fundraising: 'Fundraising',
	grants: 'Grant Management',
	outcomes: 'Outcome Management',
	vm: 'Volunteer Management',
	ve: 'Volunteer Engagement',
};
const PUBLIC_ROOT = 'https://github.com/microsoft/Nonprofits/blob/';
export interface Route {
	family: Family;
	id: string;
	source: string;
	target: string;
	publisher: string;
	prefix: string;
	prerequisites: Family[];
	guidePath: string;
}
const template = {
	publisher: 'microsofttechforsocialimpact',
	prerequisites: ['cdm'] as Family[],
	guidePath: 'Documents/ppac-to-github-migration.md',
};
export const ROUTES: readonly Route[] = [
	{ family: 'cdm', id: 'cdm-in-place', source: 'NonprofitCore', target: 'NonprofitCore',
		publisher: 'microsoftdynamics365nonprofitaccelerator', prefix: 'msnfp',
		prerequisites: [], guidePath: template.guidePath },
	{ ...template, family: 'fundraising', id: 'fundraising-in-place',
		source: 'SocialImpactFundraising', target: 'SocialImpactFundraising', prefix: 'sifund' },
	{ ...template, family: 'grants', id: 'grants-in-place',
		source: 'SocialImpactGrants', target: 'SocialImpactGrants', prefix: 'signt' },
	{ ...template, family: 'outcomes', id: 'outcomes-in-place',
		source: 'SocialImpactOutcomes', target: 'SocialImpactOutcomes', prefix: 'sioutc' },
	{ ...template, family: 'vm', id: 'vm-side-by-side',
		source: 'VolunteerManagement', target: 'volunteermanagementos', prefix: 'msnfp',
		guidePath: 'VolunteerManagement/MIGRATION.md' },
	{ ...template, family: 've', id: 've-legacy-to-spa',
		source: 'VolunteerEngagement', target: 'Portal-EDM', prefix: 'msnfp',
		prerequisites: ['cdm', 'vm'], guidePath: 'VolunteerEngagement/MIGRATION.md' },
];
export function guideUrl(route: Route, commit: string): string {
	return `${PUBLIC_ROOT}${commit}/${route.guidePath}`;
}
export function compareVersions(left: string, right: string): number {
	const a = left.split('.').map(BigInt);
	const b = right.split('.').map(BigInt);
	for (let i = 0; i < 4; i++) {
		if (a[i]! !== b[i]!) {
			return a[i]! < b[i]! ? -1 : 1;
		}
	}
	return 0;
}
