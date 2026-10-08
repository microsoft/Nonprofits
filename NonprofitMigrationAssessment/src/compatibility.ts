import { readFileSync } from 'node:fs';
import { z } from 'zod';
import type { Family, Questionnaire, Solution } from './contracts.js';
import type { Route } from './routes.js';
import { compareVersions } from './routes.js';

const CompatibilityCatalogSchema = z.strictObject({
	schemaVersion: z.literal('1.0'),
	version: z.string().min(1),
	status: z.enum(['candidate', 'approved']),
	owner: z.string().min(1),
	basis: z.string().min(1),
	equivalentReleases: z.array(z.strictObject({
		family: z.enum(['cdm', 'fundraising', 'grants', 'outcomes', 'vm', 've']),
		installed: z.string().regex(/^\d+\.\d+\.\d+\.\d+$/),
		target: z.string().regex(/^\d+\.\d+\.\d+\.\d+$/),
		basis: z.string().min(1),
	})),
	excludedFamilies: z.array(z.strictObject({
		family: z.enum(['vm', 've']),
		reason: z.string().min(1),
	})),
});
const compatibilityCatalog = CompatibilityCatalogSchema.parse(JSON.parse(readFileSync(
	new URL('../../catalog/release-equivalence.json', import.meta.url),
	'utf8',
)) as unknown);
export const COMPATIBILITY_CATALOG_VERSION = compatibilityCatalog.version;

export interface CompatibilityDecision {
	status: 'already-aligned' | 'candidate-supported' | 'blocked' | 'investigation-required' | 'unsupported';
	catalogVersion: string;
	reason: string;
}

function defaultIntent(route: Route): NonNullable<Questionnaire['answers'][number]['intent']> {
	return route.source === route.target ? 'ownership-transition' : 'replace-with-github';
}

function isEquivalentRelease(family: Family, installed: string, target: string): boolean {
	return compatibilityCatalog.equivalentReleases.some(pair =>
		pair.family === family && pair.installed === installed && pair.target === target);
}

export function evaluateCompatibility(
	route: Route,
	answer: Questionnaire['answers'][number],
	source: Solution | undefined,
	target: Questionnaire['target']['solutions'][number] | undefined,
	installedTarget: Solution | undefined,
): CompatibilityDecision {
	const decision = (
		status: CompatibilityDecision['status'],
		reason: string,
	): CompatibilityDecision => ({ status, catalogVersion: COMPATIBILITY_CATALOG_VERSION, reason });
	const intent = answer.intent ?? defaultIntent(route);

	if (answer.destination !== 'github-same-environment') {
		return decision('unsupported', 'The candidate catalog covers only the documented GitHub same-environment destination.');
	}
	if (route.family === 've') {
		if (intent !== 'replace-with-github') {
			return decision('unsupported', 'Volunteer Engagement supports the documented legacy-site to Portal-EDM replacement intent.');
		}
		return answer.veSource === 'legacy'
			? decision('candidate-supported', 'The declared legacy-site to Portal-EDM route matches the candidate public guide.')
			: decision('investigation-required', 'The source site model and destination prerequisites are not established.');
	}
	if (!source && !installedTarget) {
		return decision('investigation-required', 'No source or target solution identity is available for compatibility evaluation.');
	}
	if (!target) {
		return decision('blocked', 'Pinned target solution metadata is unavailable.');
	}
	if (route.source !== route.target) {
		if (intent !== 'replace-with-github') {
			return decision('unsupported', 'This route changes solution identity and requires the replacement-migration intent.');
		}
		if (route.family === 'vm' && installedTarget) {
			return decision('investigation-required',
				source
					? 'Source and target Volunteer Management solutions coexist; continuation state requires review.'
					: 'The target Volunteer Management solution is installed, but solution identity does not prove migration completion.');
		}
		return decision('candidate-supported', 'Side-by-side replacement is a candidate route; mappings and custom behavior still require reviewed evidence.');
	}
	if (intent === 'replace-with-github') {
		return decision('unsupported', 'This same-identity solution does not require a replacement migration.');
	}
	if (!source || !/^\d+\.\d+\.\d+\.\d+$/.test(source.version)) {
		return decision('investigation-required', 'A comparable installed source version is required.');
	}
	const comparison = compareVersions(target.version, source.version);
	if (intent === 'confirm-alignment') {
		return isEquivalentRelease(route.family, source.version, target.version)
			? decision('already-aligned', 'The installed PPAC release is mapped to the pinned GitHub baseline; no product or data migration is required.')
			: decision('investigation-required', 'The installed and target releases are not in the reviewed equivalence catalog.');
	}
	if (intent === 'apply-github-release') {
		if (comparison < 0) {
			return decision('blocked', 'The selected GitHub release is lower than the installed source version.');
		}
		return comparison === 0
			? decision('already-aligned', 'The installed solution is already on the selected GitHub release.')
			: decision('candidate-supported', 'The selected GitHub release is newer and can be assessed as an in-place managed update.');
	}
	if (comparison < 0) {
		return decision('blocked', 'The pinned target version is lower than the installed source version.');
	}
	return decision('candidate-supported',
		'The same-identity managed solution can be assessed as an ownership transition from PPAC servicing to customer-managed GitHub builds.');
}
