import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Questionnaire } from '../src/contracts.js';
import { resolvePublicTarget } from '../src/target.js';

const DEFAULT_VERSIONS = {
	NonprofitCore: '3.1.3.4',
	SocialImpactFundraising: '1.0.3.1',
	SocialImpactGrants: '1.0.3.1',
	SocialImpactOutcomes: '1.0.3.1',
	volunteermanagementos: '1.1.3.0',
} as const;

type TargetVersions = Record<keyof typeof DEFAULT_VERSIONS, string>;

function files(versionOverrides: Partial<TargetVersions> = {}): Record<string, string> {
	const versions = { ...DEFAULT_VERSIONS, ...versionOverrides };
	return {
		'CommonDataModelforNonprofits/Solution/Other/Solution.xml': manifest(
			'NonprofitCore', versions.NonprofitCore, 'microsoftdynamics365nonprofitaccelerator', 'msnfp'),
		'Fundraising/Solution/Other/Solution.xml': manifest(
			'SocialImpactFundraising', versions.SocialImpactFundraising, 'microsofttechforsocialimpact', 'sifund'),
		'GrantManagement/Solution/Other/Solution.xml': manifest(
			'SocialImpactGrants', versions.SocialImpactGrants, 'microsofttechforsocialimpact', 'signt'),
		'OutcomeManagement/Solution/Other/Solution.xml': manifest(
			'SocialImpactOutcomes', versions.SocialImpactOutcomes, 'microsofttechforsocialimpact', 'sioutc'),
		'VolunteerManagement/VolunteerManagement/Solution/Other/Solution.xml': manifest(
			'volunteermanagementos', versions.volunteermanagementos, 'microsofttechforsocialimpact', 'msnfp'),
		'Documents/ppac-to-github-migration.md': '# Synthetic CDM and template migration guide\n',
		'VolunteerManagement/MIGRATION.md': '# Synthetic VM migration guide\n',
		'VolunteerEngagement/MIGRATION.md': '# Synthetic VE migration guide\n',
		'VolunteerEngagement/Portal-EDM/README.md': '# Synthetic VE target site\n',
	};
}

function manifest(uniqueName: string, version: string, publisher: string, prefix: string): string {
	return `<?xml version="1.0" encoding="utf-8"?>
<ImportExportXml>
  <SolutionManifest>
    <UniqueName>${uniqueName}</UniqueName>
    <Version>${version}</Version>
    <Managed>2</Managed>
    <Publisher>
      <UniqueName>${publisher}</UniqueName>
      <CustomizationPrefix>${prefix}</CustomizationPrefix>
    </Publisher>
  </SolutionManifest>
</ImportExportXml>
`;
}

function git(repository: string, args: string[]): string {
	const result = spawnSync('git', ['-C', repository, ...args], { encoding: 'utf8', windowsHide: true });
	assert.equal(result.status, 0, result.stderr);
	return result.stdout.trim();
}

export interface PublicRepositoryFixture {
	path: string;
	commit: string;
	target: Questionnaire['target'];
}

export async function createPublicRepository(
	root: string,
	versionOverrides: Partial<TargetVersions> = {},
): Promise<PublicRepositoryFixture> {
	const repository = join(root, 'Nonprofits');
	await mkdir(repository);
	git(repository, ['init', '--initial-branch=master']);
	git(repository, ['remote', 'add', 'origin', 'https://github.com/microsoft/Nonprofits.git']);
	for (const [path, content] of Object.entries(files(versionOverrides))) {
		const destination = join(repository, ...path.split('/'));
		await mkdir(join(destination, '..'), { recursive: true });
		await writeFile(destination, content);
	}
	git(repository, ['add', '.']);
	git(repository, ['-c', 'user.name=Synthetic Test', '-c', 'user.email=test@example.invalid',
		'commit', '-m', 'Synthetic public target']);
	const commit = git(repository, ['rev-parse', 'HEAD']);
	git(repository, ['update-ref', 'refs/remotes/origin/master', commit]);
	return {
		path: repository,
		commit,
		target: await resolvePublicTarget(repository, undefined, { refreshRemote: false }),
	};
}
