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
		return decision('unsupported', 'Only migrating to the GitHub solution in the same environment is supported.');
	}
	if (route.family === 've') {
		if (intent !== 'replace-with-github') {
			return decision('unsupported', 'Volunteer Engagement can only be assessed as a move from the legacy site to the GitHub Portal-EDM site.');
		}
		return answer.veSource === 'legacy'
			? decision('candidate-supported', 'Moving the legacy site to the GitHub Portal-EDM site is covered by the public migration guide.')
			: decision('investigation-required', 'It isn\'t known yet whether a legacy site exists or the destination is ready.');
	}
	if (!source && !installedTarget) {
		return decision('investigation-required', 'Neither the installed solution nor its GitHub version was found, so compatibility can\'t be checked.');
	}
	if (!target) {
		return decision('blocked', 'Details for the GitHub version of this solution aren\'t available.');
	}
	if (route.source !== route.target) {
		if (intent !== 'replace-with-github') {
			return decision('unsupported', 'This product moves to a different GitHub solution, so it can only be assessed as a replacement.');
		}
		if (route.family === 'vm' && installedTarget) {
			return decision('investigation-required',
				source
					? 'Both the original and the GitHub Volunteer Management solutions are installed; check how far the migration got.'
					: 'The GitHub Volunteer Management solution is installed, but that alone doesn\'t show the migration is finished.');
		}
		return decision('candidate-supported', 'The GitHub solution can be installed next to the current one; data mapping and custom behavior still need review.');
	}
	if (intent === 'replace-with-github') {
		return decision('unsupported', 'This GitHub solution is the same solution as the installed one, so no replacement is needed.');
	}
	if (!source || !/^\d+\.\d+\.\d+\.\d+$/.test(source.version)) {
		return decision('investigation-required', 'The installed version can\'t be compared with the GitHub version.');
	}
	const comparison = compareVersions(target.version, source.version);
	if (intent === 'confirm-alignment') {
		return isEquivalentRelease(route.family, source.version, target.version)
			? decision('already-aligned', 'The installed release matches a GitHub release, so no product or data migration is needed.')
			: decision('investigation-required', 'It isn\'t confirmed yet which GitHub release matches the installed release.');
	}
	if (intent === 'apply-github-release') {
		if (comparison < 0) {
			return decision('blocked', 'The selected GitHub release is older than the installed version.');
		}
		return comparison === 0
			? decision('already-aligned', 'The installed solution is already on the selected GitHub release.')
			: decision('candidate-supported', 'The selected GitHub release is newer and can be installed as an update.');
	}
	if (comparison < 0) {
		return decision('blocked', 'The GitHub version is older than the installed version.');
	}
	return decision('candidate-supported',
		'You can move from Microsoft-managed updates to managing GitHub releases yourself; the solution stays the same.');
}
