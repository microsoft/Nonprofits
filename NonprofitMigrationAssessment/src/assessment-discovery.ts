import { z } from 'zod';
import {
	ComponentSummarySchema, CountSummarySchema, DependencySummarySchema, DiscoverySchema,
	EnvironmentObservationSchema, EvidenceSchema, IntegrationSummarySchema, SiteSummarySchema,
	type Discovery, type DiscoveryCategory, type Evidence,
} from './contracts.js';
import { validateEnvironmentUrl } from './discovery.js';

const API = '/api/data/v9.2/';
const RESPONSE_BYTES = 512 * 1024;
const TOTAL_BYTES = 8 * 1024 * 1024;
const MAX_RELEVANT_SOLUTIONS = 12;
const MAX_UNMANAGED_SOLUTIONS = 20;
const MAX_DEPENDENCY_COMPONENTS = 25;
const MAX_COUNT_TABLES = 50;
const MICROSOFT_PUBLISHERS = new Set([
	'microsoftcorporation',
	'microsoftdynamics',
	'microsoftdynamics365nonprofitaccelerator',
	'microsoftfirstparty',
	'microsofttechforsocialimpact',
]);

const VersionResponseSchema = z.object({ Version: z.string() });
const ComponentPageSchema = z.object({
	value: z.array(z.object({
		componenttype: z.number().int().nonnegative(),
		objectid: z.string().regex(
			/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
		).nullable(),
	})).max(5_000),
	'@odata.nextLink': z.unknown().optional(),
});
const DependencyPageSchema = z.object({
	value: z.array(z.unknown()).max(500),
	'@odata.nextLink': z.unknown().optional(),
});
const CountResponseSchema = z.object({
	'@odata.count': z.number().int().nonnegative(),
	value: z.array(z.unknown()).max(1),
});
const EntityDefinitionSchema = z.object({ LogicalName: z.string() });
const TotalCountSchema = z.object({
	EntityRecordCountCollection: z.object({
		Keys: z.array(z.string()),
		Values: z.array(z.union([z.string(), z.number()])),
	}),
});

export interface AssessmentDiscoveryOptions {
	environmentUrl: string;
	consent: boolean;
	categories: DiscoveryCategory[];
	relevantSolutionNames: string[];
	getToken: () => Promise<string>;
	fetch?: typeof globalThis.fetch;
	signal?: AbortSignal;
	timeoutMs?: number;
}

class RequestFailure extends Error {
	constructor(message: string, readonly status: Evidence['status'] = 'error') {
		super(message);
	}
}

interface RequestContext {
	origin: string;
	token: string;
	transport: typeof globalThis.fetch;
	signal: AbortSignal;
	budget: { bytes: number; requests: number };
}

function bounded<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const abort = () => reject(new RequestFailure('Metadata discovery was canceled.'));
		if (signal.aborted) {
			reject(new RequestFailure('Metadata discovery was canceled.'));
			return;
		}
		signal.addEventListener('abort', abort, { once: true });
		operation.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
	});
}

function evidence(
	id: DiscoveryCategory,
	status: Evidence['status'],
	collectedAt: string,
	reason: string,
	inputs: string[] = [],
): Evidence {
	return EvidenceSchema.parse({
		id,
		source: inputs.length ? 'derived' : 'observed',
		status,
		collectedAt,
		collector: `dataverse-${id}`,
		scope: 'environment',
		inputs,
		reason,
	});
}

function replaceEvidence(items: Evidence[], item: Evidence): void {
	const index = items.findIndex(existing => existing.id === item.id);
	if (index >= 0) {
		items[index] = item;
	} else {
		items.push(item);
	}
}

function apiUrl(origin: string, path: string, parameters: Record<string, string> = {}): string {
	if (!/^[a-zA-Z0-9_()@=,'-]+$/.test(path)) {
		throw new Error('Invalid allowlisted metadata path.');
	}
	const url = new URL(`${API}${path}`, origin);
	for (const [key, value] of Object.entries(parameters)) {
		url.searchParams.set(key, value);
	}
	return url.href;
}

function discard(response: Response): void {
	void response.body?.cancel().catch(() => undefined);
}

async function readJson(response: Response, context: RequestContext): Promise<unknown> {
	const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
	if (contentType !== 'application/json' || !response.body) {
		discard(response);
		throw new RequestFailure('The metadata response format was invalid.');
	}
	const declared = response.headers.get('content-length');
	if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > RESPONSE_BYTES)) {
		discard(response);
		throw new RequestFailure('The metadata response exceeded the approved byte budget.');
	}
	const reader = response.body.getReader();
	const decoder = new TextDecoder('utf-8', { fatal: true });
	let bytes = 0;
	let text = '';
	try {
		while (true) {
			if (context.signal.aborted) {
				throw new RequestFailure('Metadata discovery was canceled.');
			}
			const chunk = await bounded(reader.read(), context.signal);
			if (chunk.done) {
				break;
			}
			bytes += chunk.value.byteLength;
			context.budget.bytes += chunk.value.byteLength;
			if (bytes > RESPONSE_BYTES || context.budget.bytes > TOTAL_BYTES) {
				throw new RequestFailure('The metadata response exceeded the approved byte budget.');
			}
			text += decoder.decode(chunk.value, { stream: true });
		}
		text += decoder.decode();
		return JSON.parse(text) as unknown;
	} catch (error) {
		if (error instanceof RequestFailure) {
			throw error;
		}
		throw new RequestFailure('The metadata response could not be read or validated.');
	} finally {
		void reader.cancel().catch(() => undefined);
		reader.releaseLock();
	}
}

async function getJsonOnce(context: RequestContext, url: string): Promise<unknown> {
	if (context.budget.requests >= 160) {
		throw new RequestFailure('The metadata request budget was exhausted.', 'partial');
	}
	context.budget.requests++;
	let response: Response;
	try {
		const request = context.transport(url, {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${context.token}`,
				Accept: 'application/json',
				'OData-MaxVersion': '4.0',
				'OData-Version': '4.0',
			},
			redirect: 'manual',
			credentials: 'omit',
			referrerPolicy: 'no-referrer',
			cache: 'no-store',
			signal: context.signal,
		});
		void request.then(late => { if (context.signal.aborted) { discard(late); } }, () => undefined);
		response = await bounded(request, context.signal);
	} catch {
		throw new RequestFailure('The metadata request failed.');
	}
	if (response.redirected || response.type === 'opaqueredirect'
		|| (response.status >= 300 && response.status < 400)) {
		discard(response);
		throw new RequestFailure('Metadata redirects are not permitted.');
	}
	if (response.status === 401 || response.status === 403) {
		discard(response);
		throw new RequestFailure('Access to this metadata category was denied.', 'access-denied');
	}
	if (response.status === 404) {
		discard(response);
		throw new RequestFailure('This metadata capability is not available.', 'not-applicable');
	}
	if (response.status !== 200) {
		discard(response);
		throw new RequestFailure('The metadata service returned an unsuccessful response.');
	}
	return readJson(response, context);
}

async function getJson(context: RequestContext, url: string): Promise<unknown> {
	for (let attempt = 0; attempt <= 2; attempt++) {
		try {
			return await getJsonOnce(context, url);
		} catch (error) {
			if (error instanceof RequestFailure
				&& ['access-denied', 'not-applicable', 'partial'].includes(error.status)) {
				throw error;
			}
			if (attempt === 2) {
				throw new RequestFailure('The metadata request failed after bounded retries.');
			}
			let timer: ReturnType<typeof setTimeout> | undefined;
			try {
				await bounded(new Promise<void>(resolve => {
					timer = setTimeout(resolve, 100 * 2 ** attempt);
				}), context.signal);
			} finally {
				clearTimeout(timer);
			}
		}
	}
	throw new RequestFailure('The metadata request failed after bounded retries.');
}

async function countEntitySet(
	context: RequestContext,
	entitySet: string,
	primaryId: string,
): Promise<{ count: number | null; truncated: boolean }> {
	try {
		const parsed = CountResponseSchema.parse(await getJson(context, apiUrl(context.origin, entitySet, {
			'$select': primaryId,
			'$count': 'true',
			'$top': '1',
		})));
		return { count: parsed['@odata.count'], truncated: parsed['@odata.count'] >= 5_000 };
	} catch (error) {
		if (error instanceof RequestFailure && error.status === 'not-applicable') {
			return { count: null, truncated: false };
		}
		throw error;
	}
}

async function collectComponents(
	context: RequestContext,
	discovery: Discovery,
	relevantNames: Set<string>,
): Promise<{
	summary: z.infer<typeof ComponentSummarySchema>;
	relevant: { componenttype: number; objectid: string | null }[];
}> {
	const relevantSolutions = discovery.solutions
		.filter(solution => relevantNames.has(solution.uniqueName.toLowerCase()) && solution.solutionId);
	const unmanaged = discovery.solutions
		.filter(solution => !solution.managed && solution.solutionId
			&& !['active', 'default'].includes(solution.uniqueName.toLowerCase()));
	const customizationCandidates = discovery.solutions
		.filter(solution => solution.solutionId
			&& !relevantNames.has(solution.uniqueName.toLowerCase())
			&& !['active', 'default', 'system'].includes(solution.uniqueName.toLowerCase())
			&& (!solution.managed || !MICROSOFT_PUBLISHERS.has(solution.publisher.toLowerCase())));
	const relevant: { componenttype: number; objectid: string | null }[] = [];
	const productKeys = new Map<string, Set<string>>();
	const componentTypes = new Map<number, number>();
	let truncated = relevantSolutions.length > MAX_RELEVANT_SOLUTIONS;
	for (const solution of relevantSolutions.slice(0, MAX_RELEVANT_SOLUTIONS)) {
		const parsed = ComponentPageSchema.parse(await getJson(context,
			apiUrl(context.origin, 'solutioncomponents', {
				'$select': 'componenttype,objectid',
				'$filter': `_solutionid_value eq ${solution.solutionId}`,
				'$orderby': 'componenttype asc,objectid asc',
				'$top': '5000',
			})));
		truncated ||= parsed['@odata.nextLink'] !== undefined;
		const keys = new Set<string>();
		for (const item of parsed.value) {
			relevant.push(item);
			componentTypes.set(item.componenttype, (componentTypes.get(item.componenttype) ?? 0) + 1);
			if (item.objectid !== null) {
				keys.add(`${item.componenttype}:${item.objectid}`);
			}
		}
		productKeys.set(solution.uniqueName, keys);
	}
	const relevantKeys = new Set(relevant
		.filter(item => item.objectid !== null)
		.map(item => `${item.componenttype}:${item.objectid}`));
	const overlapping = new Set<string>();
	const analyzedCandidates = customizationCandidates.slice(0, MAX_UNMANAGED_SOLUTIONS);
	truncated ||= customizationCandidates.length > MAX_UNMANAGED_SOLUTIONS;
	const candidateSummaries: Array<{
		uniqueName: string;
		managed: boolean;
		publisher: string;
		componentCount: number;
		overlaps: Array<{ productUniqueName: string; componentCount: number }>;
	}> = [];
	const productCustomizationSolutions = new Map<string, Set<string>>();
	const productOverlapCounts = new Map<string, number>();
	for (const solution of analyzedCandidates) {
		const parsed = ComponentPageSchema.parse(await getJson(context,
			apiUrl(context.origin, 'solutioncomponents', {
				'$select': 'componenttype,objectid',
				'$filter': `_solutionid_value eq ${solution.solutionId}`,
				'$orderby': 'componenttype asc,objectid asc',
				'$top': '5000',
			})));
		truncated ||= parsed['@odata.nextLink'] !== undefined;
		const overlapsByProduct = new Map<string, number>();
		for (const item of parsed.value) {
			const key = item.objectid === null ? '' : `${item.componenttype}:${item.objectid}`;
			if (!solution.managed && relevantKeys.has(key)) {
				overlapping.add(key);
			}
			if (!key) {
				continue;
			}
			for (const [product, keys] of productKeys) {
				if (keys.has(key)) {
					overlapsByProduct.set(product, (overlapsByProduct.get(product) ?? 0) + 1);
					const names = productCustomizationSolutions.get(product) ?? new Set<string>();
					names.add(solution.uniqueName);
					productCustomizationSolutions.set(product, names);
					productOverlapCounts.set(product, (productOverlapCounts.get(product) ?? 0) + 1);
				}
			}
		}
		candidateSummaries.push({
			uniqueName: solution.uniqueName,
			managed: solution.managed,
			publisher: solution.publisher,
			componentCount: parsed.value.length,
			overlaps: [...overlapsByProduct.entries()]
				.map(([productUniqueName, componentCount]) => ({ productUniqueName, componentCount }))
				.sort((left, right) => left.productUniqueName.localeCompare(right.productUniqueName, 'en')),
		});
	}
	return {
		summary: ComponentSummarySchema.parse({
			relevantSolutions: relevantSolutions.length,
			relevantComponents: relevant.length,
			componentTypes: [...componentTypes.entries()]
				.sort(([left], [right]) => left - right)
				.map(([type, count]) => ({ type, count })),
			unmanagedSolutions: unmanaged.length,
				analyzedUnmanagedSolutions: analyzedCandidates.filter(solution => !solution.managed).length,
			overlappingUnmanagedComponents: overlapping.size,
				productSummaries: [...productKeys.entries()].map(([uniqueName, keys]) => ({
					uniqueName,
					componentCount: keys.size,
					overlappingCustomizationComponents: productOverlapCounts.get(uniqueName) ?? 0,
					customizationSolutions: [...(productCustomizationSolutions.get(uniqueName) ?? [])].sort(),
				})),
				customizationCandidates: candidateSummaries,
				truncated,
		}),
		relevant,
	};
}

async function collectDependencies(
	context: RequestContext,
	components: { componenttype: number; objectid: string | null }[],
): Promise<z.infer<typeof DependencySummarySchema>> {
	const distinct = [...new Map(components
		.filter((item): item is { componenttype: number; objectid: string } => item.objectid !== null)
		.map(item => [`${item.componenttype}:${item.objectid}`, item])).values()]
		.sort((left, right) => left.componenttype - right.componenttype
			|| left.objectid.localeCompare(right.objectid, 'en'));
	const candidates = distinct.slice(0, MAX_DEPENDENCY_COMPONENTS);
	let dependentReferences = 0;
	let truncated = distinct.length > candidates.length;
	for (const component of candidates) {
		const parsed = DependencyPageSchema.parse(await getJson(context,
			apiUrl(context.origin,
				`RetrieveDependentComponents(ObjectId=${component.objectid},ComponentType=${component.componenttype})`)));
		dependentReferences += parsed.value.length;
		truncated ||= parsed['@odata.nextLink'] !== undefined;
	}
	return DependencySummarySchema.parse({
		checkedComponents: candidates.length,
		dependentReferences,
		truncated,
	});
}

async function collectIntegrations(context: RequestContext): Promise<z.infer<typeof IntegrationSummarySchema>> {
	const workflows = await countEntitySet(context, 'workflows', 'workflowid');
	const connectionReferences = await countEntitySet(context, 'connectionreferences', 'connectionreferenceid');
	const pluginAssemblies = await countEntitySet(context, 'pluginassemblies', 'pluginassemblyid');
	const pluginSteps = await countEntitySet(context, 'sdkmessageprocessingsteps', 'sdkmessageprocessingstepid');
	return IntegrationSummarySchema.parse({
		workflows: workflows.count,
		connectionReferences: connectionReferences.count,
		pluginAssemblies: pluginAssemblies.count,
		pluginSteps: pluginSteps.count,
		truncated: [workflows, connectionReferences, pluginAssemblies, pluginSteps].some(item => item.truncated),
	});
}

async function collectCounts(
	context: RequestContext,
	components: { componenttype: number; objectid: string | null }[],
): Promise<z.infer<typeof CountSummarySchema>> {
	const metadataIds = [...new Set(components
		.filter(item => item.componenttype === 1 && item.objectid !== null)
		.map(item => item.objectid!))];
	const selected = metadataIds.slice(0, MAX_COUNT_TABLES);
	const names: string[] = [];
	for (const id of selected) {
		try {
			const definition = EntityDefinitionSchema.parse(await getJson(context,
				apiUrl(context.origin, `EntityDefinitions(${id})`, { '$select': 'LogicalName' })));
			if (/^[a-zA-Z0-9][a-zA-Z0-9_]{0,99}$/.test(definition.LogicalName)) {
				names.push(definition.LogicalName);
			}
		} catch (error) {
			if (!(error instanceof RequestFailure && error.status === 'not-applicable')) {
				throw error;
			}
		}
	}
	if (names.length === 0) {
		return CountSummarySchema.parse({ tables: [], truncated: metadataIds.length > selected.length });
	}
	const parameter = `['${names.join("','")}']`;
	const result = TotalCountSchema.parse(await getJson(context,
		apiUrl(context.origin, 'RetrieveTotalRecordCount(EntityNames=@names)', { '@names': parameter })));
	const values = new Map<string, number>();
	for (let index = 0; index < result.EntityRecordCountCollection.Keys.length; index++) {
		const value = Number(result.EntityRecordCountCollection.Values[index]);
		if (Number.isSafeInteger(value) && value >= 0) {
			values.set(result.EntityRecordCountCollection.Keys[index]!, value);
		}
	}
	return CountSummarySchema.parse({
		tables: names.filter(name => values.has(name)).map(logicalName => ({
			logicalName,
			count: values.get(logicalName)!,
			accuracy: 'snapshot-within-24-hours',
		})),
		truncated: metadataIds.length > selected.length || values.size !== names.length,
	});
}

async function collectSites(context: RequestContext): Promise<z.infer<typeof SiteSummarySchema>> {
	const legacy = await countEntitySet(context, 'adx_websites', 'adx_websiteid');
	const enhanced = await countEntitySet(context, 'mspp_websites', 'mspp_websiteid');
	return SiteSummarySchema.parse({
		legacySites: legacy.count,
		enhancedSites: enhanced.count,
		truncated: legacy.truncated || enhanced.truncated,
	});
}

export async function collectAssessmentDetails(
	base: Discovery,
	options: AssessmentDiscoveryOptions,
): Promise<Discovery> {
	if (options.consent !== true) {
		throw new Error('Read-only discovery consent is required.');
	}
	const origin = validateEnvironmentUrl(options.environmentUrl);
	const categories = new Set(options.categories);
	const requested = [...categories].filter(category => category !== 'solutions');
	if (requested.length === 0) {
		return DiscoverySchema.parse(base);
	}
	const timeoutMs = options.timeoutMs ?? 300_000;
	if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 900_000) {
		throw new Error('Invalid discovery limits.');
	}
	const controller = new AbortController();
	const abort = () => controller.abort();
	options.signal?.addEventListener('abort', abort, { once: true });
	if (options.signal?.aborted) {
		controller.abort();
	}
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	const result: Discovery = structuredClone(base);
	const selected = (category: DiscoveryCategory): boolean => categories.has(category);
	const markUnselected = (category: DiscoveryCategory): void => {
		replaceEvidence(result.evidence, {
			id: category,
			source: 'not-collected',
			status: 'unknown',
			collectedAt: null,
			collector: 'not-collected',
			scope: 'environment',
			inputs: [],
			reason: 'This category was not included in read-only consent.',
		});
	};
	for (const category of ['environment', 'components', 'dependencies', 'integrations', 'counts', 'sites'] as const) {
		if (!selected(category)) {
			markUnselected(category);
		}
	}
	try {
		let token: string;
		try {
			token = await bounded(options.getToken(), controller.signal);
		} catch {
			throw new RequestFailure('Authentication did not complete.');
		}
		if (typeof token !== 'string' || token.length > 16_384 || !/^[A-Za-z0-9._~+/-]+=*$/.test(token)) {
			throw new RequestFailure('Authentication did not provide a valid access token.');
		}
		const context: RequestContext = {
			origin,
			token,
			transport: options.fetch ?? globalThis.fetch,
			signal: controller.signal,
			budget: { bytes: 0, requests: 0 },
		};
		let componentData: Awaited<ReturnType<typeof collectComponents>> | undefined;
		const run = async (
			category: Exclude<DiscoveryCategory, 'solutions'>,
			inputs: string[],
			operation: () => Promise<void>,
			successReason: string,
		): Promise<void> => {
			if (!selected(category)) {
				return;
			}
			try {
				await operation();
				replaceEvidence(result.evidence, evidence(category, 'observed', result.collectedAt, successReason, inputs));
			} catch (error) {
				const failure = error instanceof RequestFailure ? error : new RequestFailure('The metadata response was invalid.');
				replaceEvidence(result.evidence, evidence(category, failure.status, result.collectedAt, failure.message, inputs));
			}
		};
		await run('environment', [], async () => {
			const parsed = VersionResponseSchema.parse(await getJson(context, apiUrl(origin, 'RetrieveVersion()')));
			result.environment = EnvironmentObservationSchema.parse({ dataverseVersion: parsed.Version });
		}, 'The Dataverse environment version was observed.');
		await run('components', ['solutions'], async () => {
			componentData = await collectComponents(context, result,
				new Set(options.relevantSolutionNames.map(name => name.toLowerCase())));
			result.components = componentData.summary;
		}, 'Relevant solution components and unmanaged overlap signals were summarized.');
		if (result.components?.truncated) {
			replaceEvidence(result.evidence, evidence('components', 'partial', result.collectedAt,
				'Component discovery reached an approved solution, row, or pagination cap.', ['solutions']));
		}
		if (selected('dependencies') && !selected('components')) {
			replaceEvidence(result.evidence, evidence('dependencies', 'unknown', result.collectedAt,
				'Dependency discovery requires consent for component metadata.', ['components']));
		} else {
			await run('dependencies', ['components'], async () => {
				if (!componentData || componentData.relevant.length === 0) {
					throw new RequestFailure('No relevant component identifiers were available.', 'not-applicable');
				}
				result.dependencies = await collectDependencies(context, componentData.relevant);
			}, 'Direct dependent-component references were summarized within the request cap.');
			if (result.dependencies?.truncated) {
				replaceEvidence(result.evidence, evidence('dependencies', 'partial', result.collectedAt,
					'Dependency discovery inspected a bounded subset of relevant components.', ['components']));
			}
		}
		await run('integrations', [], async () => {
			result.integrations = await collectIntegrations(context);
		}, 'Environment-wide automation and integration registration counts were summarized.');
		if (result.integrations?.truncated) {
			replaceEvidence(result.evidence, evidence('integrations', 'partial', result.collectedAt,
				'One or more registration counts reached the Dataverse 5,000-row OData count limit.'));
		}
		if (selected('counts') && !selected('components')) {
			replaceEvidence(result.evidence, evidence('counts', 'unknown', result.collectedAt,
				'Relevant table counts require consent for component metadata.', ['components']));
		} else {
			await run('counts', ['components'], async () => {
				if (!componentData) {
					throw new RequestFailure('No relevant table component identifiers were available.', 'not-applicable');
				}
				result.counts = await collectCounts(context, componentData.relevant);
			}, 'Relevant table counts were read from the Dataverse snapshot count function.');
			if (result.counts?.truncated) {
				replaceEvidence(result.evidence, evidence('counts', 'partial', result.collectedAt,
					'Relevant table discovery or count results were incomplete.', ['components']));
			}
		}
		await run('sites', [], async () => {
			result.sites = await collectSites(context);
		}, 'Legacy and enhanced Power Pages site counts were summarized.');
		if (result.sites?.truncated) {
			replaceEvidence(result.evidence, evidence('sites', 'partial', result.collectedAt,
				'One or more Power Pages site counts reached the Dataverse 5,000-row OData count limit.'));
		}
	} catch (error) {
		const failure = error instanceof RequestFailure ? error : new RequestFailure('Detailed discovery failed.');
		for (const category of requested) {
			const current = result.evidence.find(item => item.id === category);
			if (current?.source === 'not-collected') {
				replaceEvidence(result.evidence, evidence(category, failure.status, result.collectedAt, failure.message));
			}
		}
	} finally {
		clearTimeout(timer);
		options.signal?.removeEventListener('abort', abort);
		controller.abort();
	}
	return DiscoverySchema.parse(result);
}
