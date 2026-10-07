#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import {
	AssessmentSchema, FAMILIES, VERSION, InventorySchema, QuestionnaireSchema, RuleBookSchema,
	RuleReviewDraftSchema,
} from './contracts.js';
import { assess } from './engine.js';
import { DEFAULT_RULES, ROUTES } from './routes.js';
import { renderMarkdown } from './report.js';
import { readLocalJson, writeLocalBundle } from './storage.js';
import { resolvePublicTarget, verifyPublicTarget } from './target.js';
import { createRuleReviewDraft, finalizeRuleReviewDraft } from './rule-review.js';
import { applyLocalReview, LocalReviewSchema } from './review.js';
import { selectAnswers } from './scope.js';
import {
	calibrateAssessment, CalibrationResultSchema, RehearsalObservationSchema, renderCalibrationMarkdown,
} from './calibration.js';

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`;
interface CliRuntime {
	targetOptions?: { refreshRemote?: boolean };
}

export async function main(args: string[], runtime: CliRuntime = {}): Promise<number> {
	const { values, positionals } = parseArgs({
		args,
		options: {
			input: { type: 'string' }, output: { type: 'string' }, rules: { type: 'string' },
			repository: { type: 'string' }, rehearsal: { type: 'string' },
		},
		allowPositionals: true, strict: true,
	});
	const command = positionals[0];
	if (command === 'help' && positionals.length === 1) {
		console.log('Commands: init --repository <microsoft/Nonprofits-checkout> --output <new-local-folder>; collect --repository <checkout> --input <questionnaire.json> --output <new-folder> (human terminal only); review --repository <checkout> --input <inventory.json> --output <new-folder> (human terminal only); assess --repository <checkout> --input <inventory.json> --output <new-folder> [--rules <reviewed-rules.json>]; calibrate --input <assessment.json> --rehearsal <observation.json> --output <new-folder>; finalize-rules --input <completed-rules-review.json> --output <new-folder>. Production target commands fetch origin/master.');
		return 0;
	}
	if (positionals.length !== 1 || !values.output) {
		throw new Error('Invalid command.');
	}
	if (command === 'finalize-rules') {
		if (!values.input || values.rules || values.repository || values.rehearsal) {
			throw new Error('Invalid finalize-rules options.');
		}
		const rules = finalizeRuleReviewDraft(await readLocalJson(values.input));
		const location = await writeLocalBundle(values.output, {
			'rules.json': json(rules),
			'rules.schema.json': json(z.toJSONSchema(RuleBookSchema)),
		});
		console.log(`Reviewed local rulebook written: ${location}`);
		return 0;
	}
	if (command === 'calibrate') {
		if (!values.input || !values.rehearsal || values.rules || values.repository) {
			throw new Error('Invalid calibrate options.');
		}
		const result = calibrateAssessment(
			await readLocalJson(values.input),
			await readLocalJson(values.rehearsal),
		);
		const location = await writeLocalBundle(values.output, {
			'calibration.json': json(result),
			'calibration.md': renderCalibrationMarkdown(result),
			'calibration.schema.json': json(z.toJSONSchema(CalibrationResultSchema)),
		});
		console.log(`Local calibration written: ${location}`);
		return 0;
	}
	if (!values.repository) {
		throw new Error('Public target repository is required.');
	}
	const targetOptions = runtime.targetOptions ?? {};
	if (command === 'init') {
		if (values.input || values.rules || values.rehearsal) {
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
			work: [],
		};
		const location = await writeLocalBundle(values.output, {
			'questionnaire.json': json(draft),
			'questionnaire.schema.json': json(z.toJSONSchema(QuestionnaireSchema)),
			'inventory.schema.json': json(z.toJSONSchema(InventorySchema)),
			'assessment.schema.json': json(z.toJSONSchema(AssessmentSchema)),
			'rules.schema.json': json(z.toJSONSchema(RuleBookSchema)),
			'rules.json': json(DEFAULT_RULES),
			'rules-review.schema.json': json(z.toJSONSchema(RuleReviewDraftSchema)),
			'rules-review.json': json(createRuleReviewDraft()),
			'rehearsal.schema.json': json(z.toJSONSchema(RehearsalObservationSchema)),
		});
		console.log(`Local questionnaire template created: ${location}`);
		return 0;
	}
	if (!values.input) {
		throw new Error('Local input is required.');
	}
	if (command === 'review') {
		if (values.rules || values.rehearsal || !process.stdin.isTTY || !process.stdout.isTTY) {
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
			const interruption = await choose('Maximum acceptable service interruption?', [
				{ label: 'No interruption', value: '0' },
				{ label: 'Up to 2 hours', value: '2' },
				{ label: 'Up to 4 hours', value: '4' },
				{ label: 'Up to 8 hours', value: '8' },
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
				maxInterruptionHours: interruption === 'unknown' ? null : Number(interruption),
				reviewedAt: new Date().toISOString(),
				...(ve ? { ve } : {}),
			});
			const reviewed = applyLocalReview(inventory, review);
			const location = await writeLocalBundle(values.output, {
				'inventory.json': json(reviewed),
				'local-review.json': json(review),
				'local-review.schema.json': json(z.toJSONSchema(LocalReviewSchema)),
			});
			console.log(`Reviewed local inventory written: ${location}`);
			return 0;
		} finally {
			terminal.close();
		}
	}
	if (command === 'assess') {
		if (values.rehearsal) {
			throw new Error('Invalid assess options.');
		}
		const inventory = InventorySchema.parse(await readLocalJson(values.input));
		await verifyPublicTarget(values.repository, inventory.questionnaire.target, targetOptions);
		const rules = values.rules ? await readLocalJson(values.rules) : DEFAULT_RULES;
		const report = assess(inventory, rules);
		const location = await writeLocalBundle(values.output, {
			'assessment.json': json(report),
			'assessment.md': renderMarkdown(report),
		});
		console.log(`Local assessment written: ${location}`);
		return report.status === 'partial' ? 2 : 0;
	}
	if (command === 'collect') {
		if (values.rules || values.rehearsal || !process.stdin.isTTY || !process.stdout.isTTY || process.env['AZURE_LOG_LEVEL']) {
			throw new Error('Collection requires an isolated human terminal without Azure SDK debug logging.');
		}
		const questionnaire = QuestionnaireSchema.parse(await readLocalJson(values.input));
		await verifyPublicTarget(values.repository, questionnaire.target, targetOptions);
		if (!questionnaire.consent.readOnly || !questionnaire.consent.categories.includes('solutions')) {
			throw new Error('Read-only consent is required.');
		}
		const { collectSolutions, validateEnvironmentUrl } = await import('./discovery.js');
		const { collectAssessmentDetails } = await import('./assessment-discovery.js');
		const origin = validateEnvironmentUrl(questionnaire.environment.url);
		const { createInterface } = await import('node:readline/promises');
		const terminal = createInterface({ input: process.stdin, output: process.stdout });
		try {
			const categories = questionnaire.consent.categories.join(', ');
			const answer = await terminal.question(`Read approved metadata/count categories (${categories}) from ${origin}. No changes, record contents, secrets, or uploads. Type ASSESS to confirm: `);
			if (answer !== 'ASSESS') {
				throw new Error('Collection was not confirmed.');
			}
		} finally {
			terminal.close();
		}
		const { AzureCliCredential } = await import('@azure/identity');
		const credential = new AzureCliCredential({ processTimeoutInMs: 30000 });
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
			const inventory = InventorySchema.parse({ schemaVersion: '1.0', toolVersion: VERSION, questionnaire, discovery });
			const location = await writeLocalBundle(values.output, { 'inventory.json': json(inventory) });
			console.log(`Local inventory written: ${location}`);
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
			: 'ASSESSMENT_FAILED: Check command, local paths, consent, terminal isolation, and prerequisites in README. No report completion is claimed.');
		process.exitCode = 1;
	}
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await execute(process.argv.slice(2));
}
