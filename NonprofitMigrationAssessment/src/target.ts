import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, realpath } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import { promisify } from 'node:util';
import { TargetSchema, type Questionnaire } from './contracts.js';
import { ROUTES } from './routes.js';

const exec = promisify(execFile);
const REPOSITORY = 'https://github.com/microsoft/Nonprofits' as const;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

const MANIFESTS = [
	'CommonDataModelforNonprofits/Solution/Other/Solution.xml',
	'Fundraising/Solution/Other/Solution.xml',
	'GrantManagement/Solution/Other/Solution.xml',
	'OutcomeManagement/Solution/Other/Solution.xml',
	'VolunteerManagement/VolunteerManagement/Solution/Other/Solution.xml',
] as const;
const EVIDENCE_FILES: readonly string[] = [
	...MANIFESTS,
	...new Set(ROUTES.map(route => route.guidePath)),
	'VolunteerEngagement/Portal-EDM/README.md',
];

type Target = Questionnaire['target'];
interface TargetResolutionOptions {
	refreshRemote?: boolean;
}

async function git(repository: string, args: string[], maxBuffer = 64 * 1024): Promise<string> {
	try {
		const { stdout } = await exec('git', ['-C', repository, ...args], {
			encoding: 'utf8',
			maxBuffer,
			windowsHide: true,
		});
		return stdout;
	} catch {
		throw new Error('Public target checkout validation failed.');
	}
}

function canonicalRemote(value: string): string | undefined {
	const remote = value.trim();
	if (/^https:\/\/github\.com\/microsoft\/Nonprofits(?:\.git)?$/i.test(remote)
		|| /^git@github\.com:microsoft\/Nonprofits\.git$/i.test(remote)
		|| /^ssh:\/\/git@github\.com\/microsoft\/Nonprofits\.git$/i.test(remote)) {
		return REPOSITORY;
	}
	return undefined;
}

function decodeXml(value: string): string {
	return value
		.replaceAll('&lt;', '<')
		.replaceAll('&gt;', '>')
		.replaceAll('&quot;', '"')
		.replaceAll('&apos;', '\'')
		.replaceAll('&amp;', '&');
}

function element(xml: string, name: string): string {
	const match = new RegExp(`<${name}>([^<]+)</${name}>`).exec(xml);
	if (!match?.[1]) {
		throw new Error('Public target manifest is missing required metadata.');
	}
	return decodeXml(match[1].trim());
}

function parseManifest(xml: string): Target['solutions'][number] {
	const manifest = /<SolutionManifest\b[^>]*>([\s\S]*?)<\/SolutionManifest>/.exec(xml)?.[1];
	const publisher = manifest
		? /<Publisher\b[^>]*>([\s\S]*?)<\/Publisher>/.exec(manifest)?.[1]
		: undefined;
	if (!manifest || !publisher) {
		throw new Error('Public target manifest structure is invalid.');
	}
	const managed = element(manifest, 'Managed');
	if (!['1', '2'].includes(managed)) {
		throw new Error('Public target manifest does not support a managed package.');
	}
	return {
		uniqueName: element(manifest, 'UniqueName'),
		version: element(manifest, 'Version'),
		managed: true,
		publisher: element(publisher, 'UniqueName'),
		prefix: element(publisher, 'CustomizationPrefix'),
	};
}

async function readPinnedFile(repository: string, commit: string, path: string): Promise<Buffer> {
	const value = await git(repository, ['show', `${commit}:${path}`], MAX_FILE_BYTES + 1);
	const data = Buffer.from(value, 'utf8');
	if (data.byteLength === 0 || data.byteLength > MAX_FILE_BYTES) {
		throw new Error('Public target evidence file exceeded the approved size.');
	}
	return data;
}

async function remoteMaster(repository: string, refresh: boolean): Promise<string> {
	if (refresh) {
		await git(repository, ['-c', 'credential.helper=', 'fetch', '--quiet', '--no-tags', 'origin', 'master'], 1024 * 1024);
	}
	return (await git(repository, ['rev-parse', '--verify', 'refs/remotes/origin/master^{commit}'])).trim().toLowerCase();
}

async function isAncestor(repository: string, commit: string, descendant: string): Promise<boolean> {
	try {
		await git(repository, ['merge-base', '--is-ancestor', commit, descendant]);
		return true;
	} catch {
		return false;
	}
}

export async function resolvePublicTarget(
	repositoryPath: string,
	revision?: string,
	options: TargetResolutionOptions = {},
): Promise<Target> {
	if (!isAbsolute(repositoryPath) || repositoryPath.startsWith('\\\\') || repositoryPath.startsWith('//')) {
		throw new Error('Public target checkout path must be absolute and local.');
	}
	const repository = await realpath(resolve(repositoryPath));
	const stat = await lstat(repository);
	if (!stat.isDirectory()) {
		throw new Error('Public target checkout path is not a directory.');
	}
	const topLevel = (await git(repository, ['rev-parse', '--show-toplevel'])).trim();
	if (await realpath(topLevel) !== repository) {
		throw new Error('Public target path must be the checkout root.');
	}
	if (!canonicalRemote(await git(repository, ['remote', 'get-url', 'origin']))) {
		throw new Error('Checkout origin is not microsoft/Nonprofits.');
	}
	if ((await git(repository, ['status', '--porcelain=v1', '--untracked-files=normal'])).trim()) {
		throw new Error('Public target checkout must be clean.');
	}
	const upstream = await remoteMaster(repository, options.refreshRemote !== false);
	const selectedRevision = revision ?? upstream;
	const commit = (await git(repository, ['rev-parse', '--verify', `${selectedRevision}^{commit}`])).trim().toLowerCase();
	if (!/^[a-f0-9]{40}$/.test(commit)) {
		throw new Error('Public target revision did not resolve to a commit.');
	}
	if (!await isAncestor(repository, commit, upstream)) {
		throw new Error('Public target revision is not reachable from freshly fetched origin/master.');
	}
	const contents = new Map<string, Buffer>();
	for (const path of EVIDENCE_FILES) {
		contents.set(path, await readPinnedFile(repository, commit, path));
	}
	const solutions = MANIFESTS.map(path => parseManifest(contents.get(path)!.toString('utf8')));
	const routeTargets = new Map(ROUTES.filter(route => route.family !== 've')
		.map(route => [route.target, route]));
	for (const solution of solutions) {
		const route = routeTargets.get(solution.uniqueName);
		if (!route || route.publisher !== solution.publisher || route.prefix !== solution.prefix) {
			throw new Error('Public target manifest and route catalog disagree.');
		}
	}
	if (solutions.length !== routeTargets.size) {
		throw new Error('Public target route catalog is missing a manifest.');
	}
	return TargetSchema.parse({
		repository: REPOSITORY,
		commit,
		source: 'pinned-public-git-checkout',
		files: EVIDENCE_FILES.map(path => ({
			path,
			sha256: createHash('sha256').update(contents.get(path)!).digest('hex'),
		})),
		solutions,
	});
}

export async function verifyPublicTarget(
	repositoryPath: string,
	target: unknown,
	options: TargetResolutionOptions = {},
): Promise<Target> {
	const expected = TargetSchema.parse(target);
	const actual = await resolvePublicTarget(repositoryPath, expected.commit, options);
	if (JSON.stringify(actual) !== JSON.stringify(expected)) {
		throw new Error('Pinned public target evidence does not match the questionnaire.');
	}
	return actual;
}
