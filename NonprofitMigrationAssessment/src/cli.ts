#!/usr/bin/env node

import { lstat, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import {
	AssessmentSchema, FAMILIES, VERSION, InventorySchema, QuestionnaireSchema,
} from './contracts.js';
import { assess } from './engine.js';
import { ROUTES } from './routes.js';
import { renderMarkdown } from './report.js';
import { readLocalJson, writeLocalBundle, writeLocalFile } from './storage.js';
import { resolvePublicTarget, verifyPublicTarget } from './target.js';
import { applyLocalReview, deriveLocalReview, LocalReviewSchema } from './review.js';
import { selectAnswers } from './scope.js';
import { validateEnvironmentUrl } from './discovery.js';

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
const reportSlug = (value: string): string => value.toLowerCase()
	.replace(/[^a-z0-9._-]+/g, '-')
	.replace(/^-+|-+$/g, '')
	.slice(0, 80) || 'environment';
interface CliRuntime {
	targetOptions?: { refreshRemote?: boolean };
	quietCompletions?: boolean;
}

// Fixed guidance text only; never include customer values, tokens, or server responses.
class GuidanceError extends Error {}

function environmentOrigin(value: string): string {
	try {
		return validateEnvironmentUrl(value);
	} catch {
		throw new GuidanceError('Use a commercial Dataverse environment URL such as https://contoso.crm.dynamics.com.');
	}
}

async function availableReportBase(directory: string, requested: string, includeJson: boolean): Promise<string> {
	for (let index = 1; index <= 100; index++) {
		const base = index === 1 ? requested : `${requested}-${index}`;
		const paths = [join(directory, `${base}.md`), ...(includeJson ? [join(directory, `${base}.json`)] : [])];
		const exists = await Promise.all(paths.map(async path => {
			try {
				await lstat(path);
				return true;
			} catch (error) {
				if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
					return false;
				}
				throw error;
			}
		}));
		if (exists.every(value => !value)) {
			return base;
		}
	}
	throw new Error('No available report filename was found.');
}

export async function main(args: string[], runtime: CliRuntime = {}): Promise<number> {
	const { values, positionals } = parseArgs({
		args,
		options: {
			input: { type: 'string' }, output: { type: 'string' },
			repository: { type: 'string' },
			environment: { type: 'string' },
			'confirm-read-only': { type: 'boolean' },
			'partner-json': { type: 'boolean' },
		},
		allowPositionals: true, strict: true,
	});
	const command = positionals[0];
	if (command === 'help' && positionals.length === 1) {
		console.log('Commands: environments (lists Dataverse environments you can access); run --repository <microsoft/Nonprofits-checkout> [--environment <url> --confirm-read-only] [--output <visible-folder>] [--partner-json] (recommended workflow; pass --confirm-read-only only after the customer approves the read-only scope); init --repository <checkout> --output <new-folder>; configure --repository <checkout> --input <questionnaire.json> --output <new-folder> [--environment <url>]; collect --repository <checkout> --input <questionnaire.json> --output <new-folder> [--environment <url> --confirm-read-only]; review --repository <checkout> --input <inventory.json> --output <new-folder> (human terminal only); assess --repository <checkout> --input <inventory.json> --output <new-folder>. Production target commands fetch origin/master.');
		return 0;
	}
	if (command === 'environments' && positionals.length === 1) {
		if (Object.values(values).some(value => value !== undefined)) {
			throw new Error('Invalid command.');
		}
		if (process.env['AZURE_LOG_LEVEL']) {
			throw new Error('Listing environments requires Azure SDK debug logging to be off.');
		}
		const { AzureCliCredential } = await import('@azure/identity');
		const { GLOBAL_DISCOVERY_ORIGIN, formatEnvironmentList, listEnvironments } = await import('./environments.js');
		const credential = new AzureCliCredential({ processTimeoutInMs: 30000 });
		let listings: Awaited<ReturnType<typeof listEnvironments>>;
		try {
			listings = await listEnvironments({
				getToken: async () => (await credential.getToken(`${GLOBAL_DISCOVERY_ORIGIN}/.default`)).token,
			});
		} catch (error) {
			throw new GuidanceError(error instanceof Error && error.message.length < 200
				? error.message
				: 'The environment list could not be retrieved.');
		}
		console.log(formatEnvironmentList(listings));
		return 0;
	}
	if (positionals.length !== 1 || (command !== 'run' && !values.output)
		|| (values['partner-json'] && command !== 'run')
		|| (values.environment !== undefined && !['run', 'configure', 'collect'].includes(command ?? ''))
		|| (values['confirm-read-only'] && !['run', 'collect'].includes(command ?? ''))
		|| (values['confirm-read-only'] && values.environment === undefined)) {
		throw new Error('Invalid command.');
	}
	if (!values.repository) {
		throw new Error('Public target repository is required.');
	}
	const targetOptions = runtime.targetOptions ?? {};
	const completion = (message: string): void => {
		if (!runtime.quietCompletions) {
			console.log(message);
		}
	};
	if (command === 'run') {
		// Copilot passes the environment and --confirm-read-only after the customer approves in chat; otherwise the terminal asks.
		const conversational = values.environment !== undefined && values['confirm-read-only'] === true;
		if (values.input || process.env['AZURE_LOG_LEVEL']
			|| (!conversational && (!process.stdin.isTTY || !process.stdout.isTTY))) {
			throw new GuidanceError('Run in an interactive terminal, or pass --environment <url> with --confirm-read-only after the customer approves the read-only assessment. Azure SDK debug logging must be off.');
		}
		if (values.environment !== undefined) {
			environmentOrigin(values.environment);
		}
		const temporary = await mkdtemp(join(tmpdir(), 'nonprofit-assessment-'));
		try {
			const initialized = join(temporary, '1-initialized');
			const configured = join(temporary, '2-configured');
			const collected = join(temporary, '3-collected');
			const nestedRuntime = { ...runtime, quietCompletions: true };
			await main(['init', '--repository', values.repository, '--output', initialized], nestedRuntime);
			await main([
				'configure', '--repository', values.repository,
				'--input', join(initialized, 'questionnaire.json'), '--output', configured,
				...(values.environment !== undefined ? ['--environment', values.environment] : []),
			], nestedRuntime);
			await main([
				'collect', '--repository', values.repository,
				'--input', join(configured, 'questionnaire.json'), '--output', collected,
				...(values['confirm-read-only'] ? ['--confirm-read-only', '--environment', values.environment!] : []),
			], nestedRuntime);
			const collectedInventory = InventorySchema.parse(
				await readLocalJson(join(collected, 'inventory.json')),
			);
			const inventory = applyLocalReview(
				collectedInventory,
				deriveLocalReview(collectedInventory),
			);
			await verifyPublicTarget(values.repository, inventory.questionnaire.target, targetOptions);
			const report = assess(inventory);
			const outputDirectory = resolve(values.output ?? join(homedir(), 'Documents'));
			await mkdir(outputDirectory, { recursive: true });
			const date = report.assessedAt.slice(0, 10).replaceAll('-', '');
			const base = await availableReportBase(
				outputDirectory,
				`nonprofit-assessment-${reportSlug(report.environment)}-${date}`,
				values['partner-json'] ?? false,
			);
			const markdownPath = await writeLocalFile(
				join(outputDirectory, `${base}.md`),
				renderMarkdown(report),
			);
			if (values['partner-json']) {
				await writeLocalFile(join(outputDirectory, `${base}.json`), json(report));
			}
			console.log(`Assessment report written: ${markdownPath}`);
			console.log(`Open report: ${markdownPath}`);
			return report.status === 'partial' ? 2 : 0;
		} finally {
			await rm(temporary, { recursive: true, force: true });
		}
	}
	if (command === 'init') {
		if (values.input) {
			throw new Error('Invalid init options.');
		}
		const now = new Date().toISOString();
		const target = await resolvePublicTarget(values.repository, undefined, targetOptions);
		const draft = {
			schemaVersion: '1.0',
			assessmentId: 'local-assessment',
			environment: {
				alias: 'production',
				url: 'https://YOUR-ENVIRONMENT.crm.dynamics.com',
				type: 'unknown',
				region: 'unknown',
				managedEnvironment: 'unknown',
				accessRestriction: 'unknown',
			},
			consent: {
				readOnly: false,
				confirmedAt: now,
				categories: ['environment', 'solutions', 'components', 'dependencies', 'integrations', 'counts', 'sites'],
			},
			target,
			answers: FAMILIES.map(family => ({
				family,
				scope: 'auto',
				destination: 'github-same-environment',
				intent: ['cdm', 'fundraising', 'grants', 'outcomes'].includes(family)
					? 'confirm-alignment'
					: 'replace-with-github',
				compatibility: 'unknown',
				customization: 'unknown', dependencies: 'unknown', integrations: 'unknown',
				validation: 'unknown', veSource: family === 've' ? 'unknown' : 'not-applicable', basis: '',
				...(family === 've' ? {
					veAuthenticationProviders: 'unknown',
					veLanguages: null,
					veCustomJourneys: 'unknown',
				} : {}),
			})),
		};
		const location = await writeLocalBundle(values.output!, {
			'questionnaire.json': json(draft),
			'questionnaire.schema.json': json(z.toJSONSchema(QuestionnaireSchema)),
			'inventory.schema.json': json(z.toJSONSchema(InventorySchema)),
			'assessment.schema.json': json(z.toJSONSchema(AssessmentSchema)),
		});
		completion(`Local questionnaire template created: ${location}`);
		return 0;
	}
	if (!values.input) {
		throw new Error('Local input is required.');
	}
	if (command === 'configure') {
		if (values.environment === undefined && (!process.stdin.isTTY || !process.stdout.isTTY)) {
			throw new Error('Local configuration requires --environment or an interactive terminal.');
		}
		const questionnaire = QuestionnaireSchema.parse(await readLocalJson(values.input));
		await verifyPublicTarget(values.repository, questionnaire.target, targetOptions);
		const promptEnvironmentUrl = async (): Promise<string> => {
			const { createInterface } = await import('node:readline/promises');
			const terminal = createInterface({ input: process.stdin, output: process.stdout });
			try {
				while (true) {
					const value = (await terminal.question('Dataverse environment URL: ')).trim();
					try {
						return validateEnvironmentUrl(value);
					} catch {
						console.log('Enter a commercial Dataverse HTTPS origin such as https://example.crm.dynamics.com.');
					}
				}
			} finally {
				terminal.close();
			}
		};
		const url = values.environment !== undefined
			? environmentOrigin(values.environment)
			: await promptEnvironmentUrl();
		const host = new URL(url).hostname.split('.')[0]!.toLowerCase();
		const date = new Date().toISOString().slice(0, 10).replaceAll('-', '');
		questionnaire.assessmentId = `assessment-${host}-${date}`;
		questionnaire.environment = {
			alias: host,
			url,
			type: 'unknown',
			region: 'unknown',
			managedEnvironment: 'unknown',
			accessRestriction: 'unknown',
		};
		questionnaire.consent.readOnly = false;
		for (const answer of questionnaire.answers) {
			answer.scope = 'auto';
			answer.intent = ['cdm', 'fundraising', 'grants', 'outcomes'].includes(answer.family)
				? 'confirm-alignment'
				: 'replace-with-github';
		}
		const configured = QuestionnaireSchema.parse(questionnaire);
		const location = await writeLocalBundle(values.output!, {
			'questionnaire.json': json(configured),
			'questionnaire.schema.json': json(z.toJSONSchema(QuestionnaireSchema)),
		});
		completion(`Configured local questionnaire written: ${location}`);
		return 0;
	}
	if (command === 'review') {
		if (!process.stdin.isTTY || !process.stdout.isTTY) {
			throw new Error('Local review requires an isolated human terminal.');
		}
		const inventory = InventorySchema.parse(await readLocalJson(values.input));
		await verifyPublicTarget(values.repository, inventory.questionnaire.target, targetOptions);
		const selected = selectAnswers(inventory.questionnaire, inventory.discovery);
		const { createInterface } = await import('node:readline/promises');
		const terminal = createInterface({ input: process.stdin, output: process.stdout });
		const choose = async <T extends string>(
			label: string,
			options: ReadonlyArray<{ label: string; value: T }>,
		): Promise<T> => {
			while (true) {
				console.log(`\n${label}`);
				options.forEach((option, index) => console.log(`  ${index + 1}. ${option.label}`));
				const answer = await terminal.question('Select a number: ');
				const index = Number(answer) - 1;
				if (Number.isInteger(index) && options[index]) {
					return options[index].value;
				}
			}
		};
		try {
			console.log(`Selected families: ${selected.map(answer => answer.family).join(', ') || 'none'}.`);
			const scopeOptions = [
				{ label: 'None identified', value: 'none' },
				{ label: 'Present and bounded/understood', value: 'bounded' },
				{ label: 'Present but owner or impact is opaque', value: 'opaque' },
				{ label: 'Unknown', value: 'unknown' },
			] as const;
			const customization = await choose('Critical custom plug-ins, flows, or components?', scopeOptions);
			const integrations = await choose('External integrations affecting selected products?', scopeOptions);
			const ownerAvailability = await choose('Is an accountable owner or source available for custom/partner components?', [
				{ label: 'Available', value: 'available' },
				{ label: 'Unavailable', value: 'unavailable' },
				{ label: 'Unknown', value: 'unknown' },
			] as const);
			const sandboxAndTests = await choose('Representative sandbox and critical journey/regression coverage?', [
				{ label: 'Ready', value: 'ready' },
				{ label: 'Partially available', value: 'partial' },
				{ label: 'Unavailable', value: 'unavailable' },
				{ label: 'Unknown', value: 'unknown' },
			] as const);
			const veSelected = selected.some(answer => answer.family === 've');
			const ve = veSelected ? {
				source: await choose('Volunteer Engagement source site model?', [
					{ label: 'Legacy', value: 'legacy' },
					{ label: 'Enhanced target', value: 'target' },
					{ label: 'Unknown', value: 'unknown' },
				] as const),
				authenticationProviders: await choose('Volunteer Engagement authentication providers?', [
					{ label: 'None', value: 'none' },
					{ label: 'One', value: 'single' },
					{ label: 'Multiple', value: 'multiple' },
					{ label: 'Unknown', value: 'unknown' },
				] as const),
				languages: await choose('Volunteer Engagement languages?', [
					{ label: 'One', value: '1' },
					{ label: 'Two', value: '2' },
					{ label: 'Three or more', value: '3' },
					{ label: 'Unknown', value: 'unknown' },
				] as const).then(value => value === 'unknown' ? null : Number(value)),
				customJourneys: await choose('Business-critical custom Volunteer Engagement journeys?', [
					{ label: 'None', value: 'none' },
					{ label: 'Present', value: 'present' },
					{ label: 'Unknown', value: 'unknown' },
				] as const),
			} : undefined;
			const review = LocalReviewSchema.parse({
				customization,
				integrations,
				ownerAvailability,
				sandboxAndTests,
				reviewedAt: new Date().toISOString(),
				...(ve ? { ve } : {}),
			});
			const reviewed = applyLocalReview(inventory, review);
			const location = await writeLocalBundle(values.output!, {
				'inventory.json': json(reviewed),
				'local-review.json': json(review),
				'local-review.schema.json': json(z.toJSONSchema(LocalReviewSchema)),
			});
			completion(`Reviewed local inventory written: ${location}`);
			return 0;
		} finally {
			terminal.close();
		}
	}
	if (command === 'assess') {
		const inventory = InventorySchema.parse(await readLocalJson(values.input));
		await verifyPublicTarget(values.repository, inventory.questionnaire.target, targetOptions);
		const report = assess(inventory);
		const slug = reportSlug(report.environment);
		const location = await writeLocalBundle(values.output!, {
			[`assessment-${slug}.json`]: json(report),
			[`assessment-${slug}.md`]: renderMarkdown(report),
		});
		completion(`Local assessment written: ${location}`);
		return report.status === 'partial' ? 2 : 0;
	}
	if (command === 'collect') {
		const confirmed = values['confirm-read-only'] === true;
		if (process.env['AZURE_LOG_LEVEL'] || (!confirmed && (!process.stdin.isTTY || !process.stdout.isTTY))) {
			throw new GuidanceError('Collection requires --confirm-read-only after the customer approves, or an interactive terminal. Azure SDK debug logging must be off.');
		}
		const questionnaire = QuestionnaireSchema.parse(await readLocalJson(values.input));
		await verifyPublicTarget(values.repository, questionnaire.target, targetOptions);
		if (!questionnaire.consent.categories.includes('solutions')) {
			throw new Error('Solution discovery category is required.');
		}
		const { collectSolutions, validateEnvironmentUrl } = await import('./discovery.js');
		const { collectAssessmentDetails } = await import('./assessment-discovery.js');
		const origin = validateEnvironmentUrl(questionnaire.environment.url);
		// Approval given in chat names one environment; it must match the questionnaire before anything is read.
		if (confirmed && environmentOrigin(values.environment!) !== origin) {
			throw new GuidanceError('The approved environment doesn\'t match the configured environment. Nothing was read.');
		}
		if (!confirmed) {
			const { createInterface } = await import('node:readline/promises');
			const terminal = createInterface({ input: process.stdin, output: process.stdout });
			try {
				console.log(`This assessment reads metadata and record counts (${questionnaire.consent.categories.join(', ')}) from ${origin}.`);
				console.log('It doesn\'t change the environment, read record contents or secrets, or upload anything.');
				const answer = (await terminal.question('Continue with this read-only assessment? [y/N] ')).trim().toLowerCase();
				if (!['y', 'yes'].includes(answer)) {
					throw new GuidanceError('The read-only assessment was not confirmed, so nothing was read.');
				}
			} finally {
				terminal.close();
			}
		}
		const { AzureCliCredential } = await import('@azure/identity');
		const credential = new AzureCliCredential({ processTimeoutInMs: 30000 });
		if (confirmed) {
			console.log(`Reading metadata from ${origin}. This usually takes under a minute.`);
		}
		const controller = new AbortController();
		const cancel = (): void => controller.abort();
		process.once('SIGINT', cancel);
		try {
			const solutionDiscovery = await collectSolutions({
				environmentUrl: origin, consent: true, signal: controller.signal,
				getToken: async () => (await credential.getToken(`${origin}/.default`)).token,
			});
			const selectedFamilies = new Set(questionnaire.answers.map(item => item.family));
			const relevantSolutionNames = ROUTES
				.filter(route => selectedFamilies.has(route.family))
				.flatMap(route => [route.source, route.target]);
			const discovery = await collectAssessmentDetails(solutionDiscovery, {
				environmentUrl: origin,
				consent: true,
				categories: questionnaire.consent.categories,
				relevantSolutionNames,
				signal: controller.signal,
				getToken: async () => (await credential.getToken(`${origin}/.default`)).token,
			});
			const authorizedQuestionnaire = structuredClone(questionnaire);
			authorizedQuestionnaire.consent.readOnly = true;
			authorizedQuestionnaire.consent.confirmedAt = new Date().toISOString();
			const inventory = InventorySchema.parse({
				schemaVersion: '1.0',
				toolVersion: VERSION,
				questionnaire: authorizedQuestionnaire,
				discovery,
			});
			const location = await writeLocalBundle(values.output!, { 'inventory.json': json(inventory) });
			completion(`Local inventory written: ${location}`);
			return discovery.evidence.find(item => item.id === 'solutions')?.status === 'observed' ? 0 : 2;
		} finally {
			process.removeListener('SIGINT', cancel);
		}
	}
	throw new Error('Unknown command.');
}

export async function execute(args: string[], runtime: CliRuntime = {}): Promise<void> {
	if (!process.versions.node.startsWith('22.')) {
		console.error(`UNSUPPORTED_NODE: Node.js 22.x is required; detected ${process.versions.node}.`);
		process.exitCode = 1;
	} else try {
		process.exitCode = await main(args, runtime);
	} catch (error) {
		// Do not leak local values, auth errors, server bodies, or Zod input details to a host.
		console.error(error instanceof z.ZodError
			? 'INPUT_INVALID: Local input violates the strict schema or cross-field rules. Review the local schema and README.'
			: error instanceof GuidanceError
				? `ASSESSMENT_FAILED: ${error.message}`
				: 'ASSESSMENT_FAILED: Check command, local paths, consent, terminal isolation, and prerequisites in README. No report completion is claimed.');
		process.exitCode = 1;
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await execute(process.argv.slice(2));
}
