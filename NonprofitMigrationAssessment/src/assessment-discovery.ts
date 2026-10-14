import { z } from 'zod';
import {
	ComponentSummarySchema, CountSummarySchema, DependencySummarySchema, DiscoverySchema,
	EnvironmentObservationSchema, EvidenceSchema, IntegrationSummarySchema, SiteSummarySchema,
	type Discovery, type DiscoveryCategory, type Evidence,
} from './contracts.js';
import { validateEnvironmentUrl } from './discovery.js';
import { isMicrosoftFirstPartyPublisher } from './publishers.js';

const API = '/api/data/v9.2/';
const RESPONSE_BYTES = 512 * 1024;
const TOTAL_BYTES = 16 * 1024 * 1024;
const MAX_REQUESTS = 800;
const MAX_RELEVANT_SOLUTIONS = 12;
const MAX_UNMANAGED_SOLUTIONS = 20;
const MAX_DEPENDENCY_COMPONENTS = 100;
const MAX_DEPENDENCY_EDGES = 2_000;
const MAX_COUNT_TABLES = 50;
const MAX_LAYER_TABLES = 200;
const MAX_LAYER_SOLUTION_TABLES = 60;
const MAX_LAYER_LOOKUPS = 150;
// Form layer stacks embed full form definitions and often exceed the response cap.
const MAX_FORM_LAYER_LOOKUPS = 10;
// Reserved for dependencies, automation, counts, and sites, which run after the layer scan.
const LAYER_RESERVED_REQUESTS = 230;
const LAYER_RESERVED_BYTES = 6 * 1024 * 1024;
const MAX_AUTOMATION_TABLES = 200;
const AUTOMATION_STEP_TABLE_CHUNK = 15;
const AUTOMATION_PROCESS_TABLE_CHUNK = 25;
const MAX_FLOW_LOOKUPS = 50;
const MAX_AUTOMATIONS = 500;
const MAX_LAYER_CUSTOMIZATIONS = 1_000;
const LAYER_CONCURRENCY = 4;
const DEFAULT_SOLUTION_ID = 'fd140aaf-4df4-11dd-bd17-0019b9312238';
const INTEGRATION_COMPONENT_TYPES = new Set([29, 91, 92, 371]);
// Table subcomponents: columns, relationships, views, charts, and forms.
const TABLE_CHILD_TYPES = [2, 10, 26, 59, 60];
const SHARED_TABLE_CHILD_TYPES = [2, 26, 59, 60];
const LAYER_COMPONENT_NAMES: Record<number, string> = {
	2: 'Attribute',
	10: 'EntityRelationship',
	26: 'SavedQuery',
	59: 'SavedQueryVisualization',
	60: 'SystemForm',
};
const SUMMARY_SELECT = [
	'msdyn_name', 'msdyn_displayname', 'msdyn_componenttype', 'msdyn_objectid', 'msdyn_iscustom',
	'msdyn_ismanaged', 'msdyn_hasactivecustomization', 'msdyn_relatedentity',
].join(',');
const GUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const TABLE_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_]{0,99}$/;

const VersionResponseSchema = z.object({ Version: z.string() });
const OrganizationPageSchema = z.object({
	value: z.array(z.object({ name: z.string().trim().min(1).max(200) })).min(1).max(1),
});
const ComponentPageSchema = z.object({
	value: z.array(z.object({
		componenttype: z.number().int().nonnegative(),
		objectid: z.string().regex(
			/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
		).nullable(),
		rootcomponentbehavior: z.number().int().nullable().optional(),
	})).max(5_000),
	'@odata.nextLink': z.unknown().optional(),
});
const DependencyPageSchema = z.object({
	value: z.array(z.object({
		requiredcomponentobjectid: z.string().regex(
			/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
		),
		requiredcomponenttype: z.number().int().nonnegative(),
		dependentcomponentobjectid: z.string().regex(
			/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
		),
		dependentcomponenttype: z.number().int().nonnegative(),
		dependencytype: z.number().int().nonnegative(),
	})).max(500),
	'@odata.nextLink': z.unknown().optional(),
});
const NamedComponentSchema = z.object({ name: z.string().trim().min(1).max(200) });
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
const FlagSchema = z.union([z.boolean(), z.string(), z.null()]).optional()
	.transform(value => value === true || (typeof value === 'string' && value.toLowerCase() === 'true'));
const OptionalTextSchema = z.string().nullable().optional()
	.transform(value => value?.replace(/[\r\n\u0000-\u001f]/g, ' ').trim().slice(0, 200).trim() || null);
const SummaryPageSchema = z.object({
	value: z.array(z.object({
		msdyn_name: OptionalTextSchema,
		msdyn_displayname: OptionalTextSchema,
		msdyn_componenttype: z.number().int().nonnegative(),
		msdyn_objectid: z.string().regex(GUID_PATTERN).nullable().optional(),
		msdyn_iscustom: FlagSchema,
		msdyn_ismanaged: FlagSchema,
		msdyn_hasactivecustomization: FlagSchema,
		msdyn_relatedentity: OptionalTextSchema,
	})).max(5_000),
	'@odata.nextLink': z.unknown().optional(),
});
const LayerPageSchema = z.object({
	value: z.array(z.object({
		msdyn_solutionname: z.string().max(200),
		msdyn_order: z.number().int(),
	})).max(100),
});

type LayerCustomization = NonNullable<z.infer<typeof ComponentSummarySchema>['layerCustomizations']>[number];
type LayerScan = NonNullable<z.infer<typeof ComponentSummarySchema>['layerScan']>;
interface LayerCandidate {
	uniqueName: string;
	solutionId: string;
	managed: boolean;
	keys: Set<string>;
	tableBehaviors: Map<string, number | null>;
}
interface NonprofitTable {
	name: string;
	displayName: string | null;
	objectId: string;
	products: string[];
}
const StepPageSchema = z.object({
	value: z.array(z.object({
		sdkmessageprocessingstepid: z.string().regex(GUID_PATTERN).optional(),
		name: OptionalTextSchema,
		stage: z.number().int().nullable().optional(),
		mode: z.number().int().nullable().optional(),
		statecode: z.number().int().nullable().optional(),
		solutionid: z.string().regex(GUID_PATTERN).nullable().optional(),
		sdkmessagefilterid: z.object({ primaryobjecttypecode: z.string().max(100).nullable().optional() }).nullable().optional(),
		sdkmessageid: z.object({ name: OptionalTextSchema }).nullable().optional(),
	})).max(5_000),
	'@odata.nextLink': z.unknown().optional(),
});
const ProcessPageSchema = z.object({
	value: z.array(z.object({
		workflowid: z.string().regex(GUID_PATTERN),
		name: OptionalTextSchema,
		category: z.number().int().nullable().optional(),
		primaryentity: z.string().max(100).nullable().optional(),
		statecode: z.number().int().nullable().optional(),
		solutionid: z.string().regex(GUID_PATTERN).nullable().optional(),
	})).max(5_000),
	'@odata.nextLink': z.unknown().optional(),
});
const STEP_STAGES: Record<number, string> = { 10: 'pre-validation', 20: 'pre-operation', 40: 'post-operation' };
const PROCESS_CATEGORIES: Record<number, string> = {
	0: 'Classic workflow',
	1: 'Dialog',
	2: 'Business rule',
	3: 'Action',
	4: 'Business process flow',
};

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

function fallbackComponentName(type: number, objectId: string): string {
	return `Component type ${type} (${objectId.slice(0, 8)})`;
}

function componentKey(type: number, objectId: string): string {
	return `${type}:${objectId.toLowerCase()}`;
}

async function resolveComponentName(
	context: RequestContext,
	component: { componenttype: number; objectid: string },
): Promise<{ name: string; source: 'observed' | 'identifier' }> {
	try {
		if (component.componenttype === 1) {
			const definition = EntityDefinitionSchema.parse(await getJson(context,
				apiUrl(context.origin, `EntityDefinitions(${component.objectid})`, { '$select': 'LogicalName' })));
			return { name: definition.LogicalName, source: 'observed' };
		}
		const entitySet = component.componenttype === 26 ? 'savedqueries'
			: component.componenttype === 60 ? 'systemforms'
				: null;
		if (entitySet) {
			const named = NamedComponentSchema.parse(await getJson(context,
				apiUrl(context.origin, `${entitySet}(${component.objectid})`, { '$select': 'name' })));
			return { name: named.name, source: 'observed' };
		}
	} catch (error) {
		if (!(error instanceof RequestFailure
			&& ['not-applicable', 'access-denied'].includes(error.status))) {
			throw error;
		}
	}
	return { name: fallbackComponentName(component.componenttype, component.objectid), source: 'identifier' };
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
		throw new RequestFailure('A safety limit on the amount of data read was reached.', 'partial');
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
				throw new RequestFailure('A safety limit on the amount of data read was reached.', 'partial');
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
	if (context.budget.requests >= MAX_REQUESTS) {
		throw new RequestFailure('A safety limit on the number of requests was reached.', 'partial');
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
	integrations: { componenttype: number; objectid: string | null }[];
	integrationSolutions: number;
	dependencyCandidates: { componenttype: number; objectid: string; name: string }[];
	tableProducts: Map<string, Set<string>>;
	nonprofitTables: NonprofitTable[];
	tablesKnown: boolean;
	microsoftSolutions: Set<string>;
	productComponentKeys: Set<string>;
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
			&& !isMicrosoftFirstPartyPublisher(solution.publisher));
	const relevant: { componenttype: number; objectid: string | null }[] = [];
	const integrationComponents = new Map<string, { componenttype: number; objectid: string | null }>();
	const overlapDetails = new Map<string, {
		item: { componenttype: number; objectid: string };
		customizationSolutions: Set<string>;
		productUniqueNames: Set<string>;
	}>();
	const addIntegrations = (items: { componenttype: number; objectid: string | null }[]): void => {
		for (const item of items.filter(candidate => INTEGRATION_COMPONENT_TYPES.has(candidate.componenttype))) {
			integrationComponents.set(`${item.componenttype}:${item.objectid ?? 'unknown'}`, item);
		}
	};
	const productKeys = new Map<string, Set<string>>();
	const tableProducts = new Map<string, Set<string>>();
	const fullTableProducts = new Map<string, Set<string>>();
	const componentTypes = new Map<number, number>();
	let truncated = relevantSolutions.length > MAX_RELEVANT_SOLUTIONS;
	for (const solution of relevantSolutions.slice(0, MAX_RELEVANT_SOLUTIONS)) {
		const parsed = ComponentPageSchema.parse(await getJson(context,
			apiUrl(context.origin, 'solutioncomponents', {
				'$select': 'componenttype,objectid,rootcomponentbehavior',
				'$filter': `_solutionid_value eq ${solution.solutionId}`,
				'$orderby': 'componenttype asc,objectid asc',
				'$top': '5000',
			})));
		truncated ||= parsed['@odata.nextLink'] !== undefined;
		const keys = new Set<string>();
		for (const item of parsed.value) {
			relevant.push({ componenttype: item.componenttype, objectid: item.objectid });
			componentTypes.set(item.componenttype, (componentTypes.get(item.componenttype) ?? 0) + 1);
			if (item.objectid !== null) {
				keys.add(componentKey(item.componenttype, item.objectid));
				if (item.componenttype === 1) {
					const products = tableProducts.get(item.objectid) ?? new Set<string>();
					products.add(solution.uniqueName);
					tableProducts.set(item.objectid, products);
					// Root component behavior 0 means the solution contains the whole table, which marks the owning product.
					if (item.rootcomponentbehavior === 0) {
						const owners = fullTableProducts.get(item.objectid.toLowerCase()) ?? new Set<string>();
						owners.add(solution.uniqueName);
						fullTableProducts.set(item.objectid.toLowerCase(), owners);
					}
				}
			}
		}
		addIntegrations(parsed.value);
		productKeys.set(solution.uniqueName, keys);
	}
	const relevantKeys = new Set(relevant
		.filter(item => item.objectid !== null)
		.map(item => componentKey(item.componenttype, item.objectid!)));
	const overlapping = new Set<string>();
	const analyzedCandidates = customizationCandidates.slice(0, MAX_UNMANAGED_SOLUTIONS);
	truncated ||= customizationCandidates.length > MAX_UNMANAGED_SOLUTIONS;
	const candidateSummaries: Array<{
		uniqueName: string;
		managed: boolean;
		publisher: string;
		componentCount: number;
		componentTypes: Array<{ type: number; count: number }>;
		overlaps: Array<{ productUniqueName: string; componentCount: number }>;
	}> = [];
	const productCustomizationSolutions = new Map<string, Set<string>>();
	const productOverlapCounts = new Map<string, number>();
	const layerCandidates: LayerCandidate[] = [];
	let overlappingCandidateSolutions = 0;
	for (const solution of analyzedCandidates) {
		const parsed = ComponentPageSchema.parse(await getJson(context,
			apiUrl(context.origin, 'solutioncomponents', {
				'$select': 'componenttype,objectid,rootcomponentbehavior',
				'$filter': `_solutionid_value eq ${solution.solutionId}`,
				'$orderby': 'componenttype asc,objectid asc',
				'$top': '5000',
			})));
		truncated ||= parsed['@odata.nextLink'] !== undefined;
		const overlapsByProduct = new Map<string, number>();
		const candidateTypes = new Map<number, number>();
		layerCandidates.push({
			uniqueName: solution.uniqueName,
			solutionId: solution.solutionId!,
			managed: solution.managed,
			keys: new Set(parsed.value
				.filter(item => item.objectid !== null)
				.map(item => componentKey(item.componenttype, item.objectid!))),
			tableBehaviors: new Map(parsed.value
				.filter(item => item.componenttype === 1 && item.objectid !== null)
				.map(item => [item.objectid!.toLowerCase(), item.rootcomponentbehavior ?? null])),
		});
		for (const item of parsed.value) {
			candidateTypes.set(item.componenttype, (candidateTypes.get(item.componenttype) ?? 0) + 1);
			const key = item.objectid === null ? '' : componentKey(item.componenttype, item.objectid);
			if (!solution.managed && relevantKeys.has(key)) {
				overlapping.add(key);
			}
			if (!key) {
				continue;
			}
			for (const [product, keys] of productKeys) {
				if (keys.has(key)) {
					const detail = overlapDetails.get(key) ?? {
						item: { componenttype: item.componenttype, objectid: item.objectid! },
						customizationSolutions: new Set<string>(),
						productUniqueNames: new Set<string>(),
					};
					detail.customizationSolutions.add(solution.uniqueName);
					detail.productUniqueNames.add(product);
					overlapDetails.set(key, detail);
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
			componentTypes: [...candidateTypes.entries()]
				.map(([type, count]) => ({ type, count }))
				.sort((left, right) => left.type - right.type),
			overlaps: [...overlapsByProduct.entries()]
				.map(([productUniqueName, componentCount]) => ({ productUniqueName, componentCount }))
				.sort((left, right) => left.productUniqueName.localeCompare(right.productUniqueName, 'en')),
		});
		if (overlapsByProduct.size > 0) {
			overlappingCandidateSolutions++;
			addIntegrations(parsed.value);
		}
	}
	const customizationComponents = [];
	for (const detail of [...overlapDetails.values()]
		.sort((left, right) => left.item.componenttype - right.item.componenttype
			|| left.item.objectid.localeCompare(right.item.objectid, 'en'))
		.slice(0, MAX_DEPENDENCY_COMPONENTS)) {
		const resolved = await resolveComponentName(context, detail.item);
		customizationComponents.push({
			type: detail.item.componenttype,
			objectId: detail.item.objectid,
			name: resolved.name,
			nameSource: resolved.source,
			customizationSolutions: [...detail.customizationSolutions].sort(),
			productUniqueNames: [...detail.productUniqueNames].sort(),
		});
	}
	const microsoftSolutions = new Set(discovery.solutions
		.filter(solution => relevantNames.has(solution.uniqueName.toLowerCase())
			|| isMicrosoftFirstPartyPublisher(solution.publisher))
		.map(solution => solution.uniqueName.toLowerCase()));
	const defaultSolutionId = discovery.solutions
		.find(solution => solution.uniqueName.toLowerCase() === 'default')?.solutionId ?? DEFAULT_SOLUTION_ID;
	const layers = await collectLayerCustomizations(context, {
		products: relevantSolutions.slice(0, MAX_RELEVANT_SOLUTIONS)
			.map(solution => ({ uniqueName: solution.uniqueName, solutionId: solution.solutionId! })),
		productKeys,
		fullTableProducts,
		candidates: layerCandidates,
		defaultSolutionId,
		microsoftSolutions,
		overlaps: customizationComponents,
	});
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
				customizationComponents,
				layerCustomizations: layers.items,
				layerScan: layers.scan,
				truncated,
		}),
		relevant,
		integrations: [...integrationComponents.values()],
		integrationSolutions: relevantSolutions.length + overlappingCandidateSolutions,
		dependencyCandidates: customizationComponents.map(component => ({
			componenttype: component.type,
			objectid: component.objectId,
			name: component.name,
		})),
		tableProducts,
		nonprofitTables: layers.tables,
		tablesKnown: layers.scan.status !== 'unavailable',
		microsoftSolutions,
		productComponentKeys: new Set([...productKeys.values()].flatMap(keys => [...keys])),
	};
}

async function mapBounded<T>(items: T[], operation: (item: T) => Promise<unknown>): Promise<void> {
	let next = 0;
	await Promise.all(Array.from({ length: Math.min(LAYER_CONCURRENCY, items.length) }, async () => {
		while (next < items.length) {
			await operation(items[next++]!);
		}
	}));
}

async function collectLayerCustomizations(
	context: RequestContext,
	input: {
		products: Array<{ uniqueName: string; solutionId: string }>;
		productKeys: Map<string, Set<string>>;
		fullTableProducts: Map<string, Set<string>>;
		candidates: LayerCandidate[];
		defaultSolutionId: string;
		microsoftSolutions: Set<string>;
		overlaps: Array<{
			type: number;
			objectId: string;
			name: string;
			nameSource: 'observed' | 'identifier';
			customizationSolutions: string[];
			productUniqueNames: string[];
		}>;
	},
): Promise<{ items: LayerCustomization[]; scan: LayerScan; tables: NonprofitTable[] }> {
	const items = new Map<string, LayerCustomization>();
	const tables = new Map<string, {
		displayName: string | null;
		objectId: string;
		custom: boolean;
		products: Set<string>;
	}>();
	let succeeded = 0;
	let failed = 0;
	let limited = false;
	// Keep enough of the shared request and byte budget for dependencies, counts, and sites.
	const budgetAvailable = (): boolean => {
		const available = context.budget.requests < MAX_REQUESTS - LAYER_RESERVED_REQUESTS
			&& context.budget.bytes < TOTAL_BYTES - LAYER_RESERVED_BYTES;
		limited ||= !available;
		return available;
	};
	const scannedTables = new Set<string>();
	const scannedSolutionTables = new Set<string>();
	const summaries = async (filter: string) => {
		if (!budgetAvailable()) {
			throw new RequestFailure('The customization layer budget was exhausted.', 'partial');
		}
		const parsed = SummaryPageSchema.parse(await getJson(context,
			apiUrl(context.origin, 'msdyn_solutioncomponentsummaries', {
				'$select': SUMMARY_SELECT,
				'$filter': filter,
			})));
		limited ||= parsed['@odata.nextLink'] !== undefined;
		return parsed.value;
	};
	const attempt = async (operation: () => Promise<void>): Promise<boolean> => {
		try {
			await operation();
			succeeded++;
			return true;
		} catch {
			failed++;
			return false;
		}
	};
	const unmanagedSolutionsContaining = (key: string): string[] => input.candidates
		.filter(candidate => !candidate.managed && candidate.keys.has(key))
		.map(candidate => candidate.uniqueName);
	const itemKey = (item: LayerCustomization): string =>
		`${item.layer}:${item.layer === 'managed-solution' ? item.solutions[0] : ''}:${item.objectId.toLowerCase()}`;
	const add = (item: LayerCustomization): void => {
		const existing = items.get(itemKey(item));
		if (existing) {
			existing.solutions = [...new Set([...existing.solutions, ...item.solutions])].sort();
			existing.productUniqueNames = [...new Set([...existing.productUniqueNames, ...item.productUniqueNames])].sort();
			return;
		}
		items.set(itemKey(item), item);
	};

	await mapBounded(input.products, product => attempt(async () => {
		for (const row of await summaries(`msdyn_solutionid eq ${product.solutionId}`)) {
			if (!row.msdyn_objectid || !row.msdyn_name) {
				continue;
			}
			const isTable = row.msdyn_componenttype === 1 && TABLE_NAME_PATTERN.test(row.msdyn_name);
			if (isTable) {
				const table = tables.get(row.msdyn_name) ?? {
					displayName: row.msdyn_displayname,
					objectId: row.msdyn_objectid,
					custom: row.msdyn_iscustom,
					products: new Set<string>(),
				};
				table.products.add(product.uniqueName);
				tables.set(row.msdyn_name, table);
			}
			if (row.msdyn_hasactivecustomization && !TABLE_CHILD_TYPES.includes(row.msdyn_componenttype)) {
				add({
					productUniqueNames: [product.uniqueName],
					table: isTable ? row.msdyn_name : null,
					tableDisplayName: isTable ? row.msdyn_displayname : null,
					type: row.msdyn_componenttype,
					objectId: row.msdyn_objectid,
					name: row.msdyn_name,
					displayName: row.msdyn_displayname,
					change: row.msdyn_ismanaged ? 'modified' : 'added',
					layer: 'active',
					solutions: unmanagedSolutionsContaining(componentKey(row.msdyn_componenttype, row.msdyn_objectid)),
					relatedTable: null,
				});
			}
		}
	}));
	const summariesAvailable = succeeded > 0 || input.products.length === 0;
	const typeFilter = `(${TABLE_CHILD_TYPES.map(type => `msdyn_componenttype eq ${type}`).join(' or ')})`;
	const tableFilter = (solutionId: string, tableName: string): string =>
		`msdyn_solutionid eq ${solutionId} and msdyn_primaryentityname eq '${tableName}' and ${typeFilter}`;
	const tableList = [...tables.entries()].sort(([left], [right]) => left.localeCompare(right, 'en'));
	const checkedTables = summariesAvailable ? tableList.slice(0, MAX_LAYER_TABLES) : [];
	limited ||= tableList.length > checkedTables.length && summariesAvailable;
	await mapBounded(checkedTables, ([tableName, table]) => attempt(async () => {
		// Shared tables such as User carry platform relationships from every table, so only managed nonprofit components are read.
		const filter = table.custom
			? tableFilter(input.defaultSolutionId, tableName)
			: `msdyn_solutionid eq ${input.defaultSolutionId} and msdyn_primaryentityname eq '${tableName}'`
				+ ` and (${SHARED_TABLE_CHILD_TYPES.map(type => `msdyn_componenttype eq ${type}`).join(' or ')})`
				+ ' and msdyn_ismanaged eq \'true\'';
		const rows = await summaries(`${filter} and msdyn_hasactivecustomization eq 'true'`);
		scannedTables.add(tableName);
		for (const row of rows) {
			if (!row.msdyn_hasactivecustomization || !row.msdyn_objectid || !row.msdyn_name
				|| !TABLE_CHILD_TYPES.includes(row.msdyn_componenttype)) {
				continue;
			}
			// Platform-generated columns and relationships (owner, created by, and similar) are unmanaged but not customer changes.
			if ([2, 10].includes(row.msdyn_componenttype) && !row.msdyn_ismanaged && !row.msdyn_iscustom) {
				continue;
			}
			if (row.msdyn_componenttype === 2 && !row.msdyn_displayname) {
				continue;
			}
			add({
				productUniqueNames: [],
				table: tableName,
				tableDisplayName: table.displayName,
				type: row.msdyn_componenttype,
				objectId: row.msdyn_objectid,
				name: row.msdyn_name,
				displayName: row.msdyn_displayname,
				change: row.msdyn_ismanaged ? 'modified' : 'added',
				layer: 'active',
				solutions: unmanagedSolutionsContaining(componentKey(row.msdyn_componenttype, row.msdyn_objectid)),
				relatedTable: row.msdyn_componenttype === 10 ? row.msdyn_relatedentity : null,
			});
		}
	}));

	const tablesById = new Map([...tables.entries()].map(([name, table]) => [table.objectId.toLowerCase(), name]));
	const hasTableChildren = (candidate: LayerCandidate): boolean =>
		[...candidate.keys].some(key => TABLE_CHILD_TYPES.includes(Number(key.split(':')[0])));
	const solutionTables: Array<{ candidate: LayerCandidate; tableName: string }> = [];
	for (const candidate of input.candidates.filter(item => item.managed)) {
		if (!hasTableChildren(candidate)) {
			continue;
		}
		for (const key of candidate.keys) {
			const tableName = key.startsWith('1:') ? tablesById.get(key.slice(2)) : undefined;
			if (tableName) {
				solutionTables.push({ candidate, tableName });
			}
		}
	}
	solutionTables.sort((left, right) => left.candidate.uniqueName.localeCompare(right.candidate.uniqueName, 'en')
		|| left.tableName.localeCompare(right.tableName, 'en'));
	const checkedSolutionTables = summariesAvailable ? solutionTables.slice(0, MAX_LAYER_SOLUTION_TABLES) : [];
	limited ||= solutionTables.length > checkedSolutionTables.length && summariesAvailable;
	await mapBounded(checkedSolutionTables, ({ candidate, tableName }) => attempt(async () => {
		const table = tables.get(tableName)!;
		const rows = await summaries(tableFilter(candidate.solutionId, tableName));
		scannedSolutionTables.add(`${candidate.uniqueName}|${tableName}`);
		for (const row of rows) {
			if (!row.msdyn_objectid || !row.msdyn_name
				|| !candidate.keys.has(componentKey(row.msdyn_componenttype, row.msdyn_objectid))) {
				continue;
			}
			add({
				productUniqueNames: [],
				table: tableName,
				tableDisplayName: table.displayName,
				type: row.msdyn_componenttype,
				objectId: row.msdyn_objectid,
				name: row.msdyn_name,
				displayName: row.msdyn_displayname,
				change: 'unknown',
				layer: 'managed-solution',
				solutions: [candidate.uniqueName],
				relatedTable: row.msdyn_componenttype === 10 ? row.msdyn_relatedentity : null,
			});
		}
	}));

	// The lowest layers show which Microsoft solutions a change sits on; form stacks can exceed the response cap and fall back.
	const layerStacks = new Map<string, string[]>();
	const lookups = [...new Map([...items.values()]
		.filter(item => item.table && item.type in LAYER_COMPONENT_NAMES && item.change !== 'added')
		.sort((left, right) => Number(left.type === 60) - Number(right.type === 60)
			|| Number(left.layer === 'active') - Number(right.layer === 'active'))
		.map(item => [componentKey(item.type, item.objectId), item])).values()];
	const formLookups = lookups.filter(item => item.type === 60).slice(0, MAX_FORM_LAYER_LOOKUPS);
	const checkedLookups = [...lookups.filter(item => item.type !== 60), ...formLookups].slice(0, MAX_LAYER_LOOKUPS);
	await mapBounded(checkedLookups, async item => {
		if (!budgetAvailable()) {
			return;
		}
		try {
			const parsed = LayerPageSchema.parse(await getJson(context, apiUrl(context.origin, 'msdyn_componentlayers', {
				'$select': 'msdyn_solutionname,msdyn_order',
				'$filter': `msdyn_componentid eq '${item.objectId}' and msdyn_solutioncomponentname eq '${LAYER_COMPONENT_NAMES[item.type]}'`,
			})));
			layerStacks.set(componentKey(item.type, item.objectId), [...parsed.value]
				.sort((left, right) => left.msdyn_order - right.msdyn_order)
				.map(layer => layer.msdyn_solutionname.toLowerCase()));
		} catch {
			// Attribution falls back to explicit solution membership.
		}
	});
	const productsByName = new Map(input.products.map(product => [product.uniqueName.toLowerCase(), product.uniqueName]));
	for (const [key, item] of [...items.entries()]) {
		if (!item.table || !TABLE_CHILD_TYPES.includes(item.type)) {
			continue;
		}
		const table = tables.get(item.table)!;
		const componentId = componentKey(item.type, item.objectId);
		const stack = layerStacks.get(componentId);
		const ownLayer = item.layer === 'active' ? 'active' : item.solutions[0]!.toLowerCase();
		const below = stack ? stack.slice(0, Math.max(stack.indexOf(ownLayer), 0)) : [];
		const layered = below.flatMap(name => productsByName.has(name) ? [productsByName.get(name)!] : []);
		const explicit = [...table.products].filter(product => input.productKeys.get(product)?.has(componentId));
		const owners = layered.length ? layered : explicit;
		// On shared Dataverse tables such as Contact, only changes on top of nonprofit solution components are in scope.
		if (!table.custom && owners.length === 0) {
			items.delete(key);
			continue;
		}
		const fullTable = [...(input.fullTableProducts.get(table.objectId.toLowerCase()) ?? [])]
			.filter(product => table.products.has(product));
		item.productUniqueNames = [...new Set(owners.length ? owners : fullTable.length ? fullTable : [...table.products])].sort();
		if (item.layer === 'managed-solution') {
			item.change = below.some(name => input.microsoftSolutions.has(name)) || explicit.length ? 'modified'
				: stack && stack.includes(ownLayer) ? 'added'
					: 'unknown';
		}
	}
	// When every scan completed, a component that only sits in an unmanaged solution without a direct change isn't a customization.
	const scansComplete = summariesAvailable && failed === 0 && !limited;
	for (const overlap of input.overlaps) {
		const scannedTable = overlap.type === 1 && summariesAvailable
			? tablesById.get(overlap.objectId.toLowerCase())
			: undefined;
		for (const solutionName of overlap.customizationSolutions) {
			const candidate = input.candidates.find(item => item.uniqueName === solutionName);
			if (!candidate) {
				continue;
			}
			if (!candidate.managed && scansComplete && !items.has(`active::${overlap.objectId.toLowerCase()}`)) {
				continue;
			}
			// Solutions often include a table only as a shell for their columns, forms, and views, which the scans above list.
			if (scannedTable) {
				const covered = candidate.managed
					? candidate.tableBehaviors.get(overlap.objectId.toLowerCase()) === 2
						&& (scannedSolutionTables.has(`${candidate.uniqueName}|${scannedTable}`) || !hasTableChildren(candidate))
					: scannedTables.has(scannedTable);
				if (covered) {
					continue;
				}
			}
			const tableName = overlap.type === 1 && overlap.nameSource === 'observed' && TABLE_NAME_PATTERN.test(overlap.name)
				? overlap.name
				: null;
			add({
				productUniqueNames: [...overlap.productUniqueNames].sort(),
				table: tableName,
				tableDisplayName: tableName ? tables.get(tableName)?.displayName ?? null : null,
				type: overlap.type,
				objectId: overlap.objectId,
				name: overlap.name,
				displayName: null,
				change: 'modified',
				layer: candidate.managed ? 'managed-solution' : 'active',
				solutions: [solutionName],
				relatedTable: null,
			});
		}
	}

	const sorted = [...items.values()].sort((left, right) =>
		(left.productUniqueNames[0] ?? '').localeCompare(right.productUniqueNames[0] ?? '', 'en')
		|| (left.table ?? '').localeCompare(right.table ?? '', 'en')
		|| left.type - right.type
		|| left.name.localeCompare(right.name, 'en')
		|| left.layer.localeCompare(right.layer, 'en'));
	limited ||= sorted.length > MAX_LAYER_CUSTOMIZATIONS;
	return {
		items: sorted.slice(0, MAX_LAYER_CUSTOMIZATIONS),
		scan: {
			status: !summariesAvailable ? 'unavailable' : failed > 0 || limited ? 'partial' : 'complete',
			productTables: tables.size,
			checkedTables: checkedTables.length,
			solutionTables: solutionTables.length,
			checkedSolutionTables: checkedSolutionTables.length,
		},
		tables: [...tables.entries()]
			.filter(([, table]) => table.custom)
			.map(([name, table]) => {
				const fullTable = [...(input.fullTableProducts.get(table.objectId.toLowerCase()) ?? [])]
					.filter(product => table.products.has(product));
				return {
					name,
					displayName: table.displayName,
					objectId: table.objectId.toLowerCase(),
					products: (fullTable.length ? fullTable : [...table.products]).sort(),
				};
			})
			.sort((left, right) => left.name.localeCompare(right.name, 'en')),
	};
}

async function collectAutomations(
	context: RequestContext,
	input: {
		tables: NonprofitTable[];
		tablesKnown: boolean;
		solutions: Discovery['solutions'];
		microsoftSolutions: Set<string>;
		productComponentKeys: Set<string>;
	},
): Promise<Pick<z.infer<typeof IntegrationSummarySchema>, 'automations' | 'automationScan'>> {
	type Automation = NonNullable<z.infer<typeof IntegrationSummarySchema>['automations']>[number];
	const automations: Automation[] = [];
	const tables = input.tables.slice(0, MAX_AUTOMATION_TABLES);
	const tablesByName = new Map(tables.map(table => [table.name, table]));
	const tablesById = new Map(tables.map(table => [table.objectId, table]));
	const solutionsById = new Map(input.solutions
		.filter(solution => solution.solutionId)
		.map(solution => [solution.solutionId!.toLowerCase(), solution]));
	let succeeded = 0;
	let failed = 0;
	let limited = input.tables.length > tables.length;
	const attempt = async (operation: () => Promise<void>): Promise<void> => {
		try {
			await operation();
			succeeded++;
		} catch {
			failed++;
		}
	};
	// The top solution layer identifies who owns the registration; Microsoft and nonprofit product registrations are excluded.
	const layerOf = (solutionId: string | null | undefined): Pick<Automation, 'layer' | 'solution'> | null => {
		const solution = solutionId ? solutionsById.get(solutionId.toLowerCase()) : undefined;
		if (!solution) {
			return { layer: 'managed-solution', solution: null };
		}
		const name = solution.uniqueName.toLowerCase();
		if (name === 'active' || name === 'default') {
			return { layer: 'active', solution: null };
		}
		if (input.microsoftSolutions.has(name)) {
			return null;
		}
		return { layer: solution.managed ? 'managed-solution' : 'active', solution: solution.uniqueName };
	};
	const describeTables = (names: string[]): Pick<Automation, 'tables' | 'tableDisplayNames' | 'productUniqueNames'> => {
		const matched = [...new Set(names)].sort().flatMap(name => tablesByName.has(name) ? [tablesByName.get(name)!] : []);
		return {
			tables: matched.map(table => table.name),
			tableDisplayNames: matched.map(table => table.displayName ?? table.name),
			productUniqueNames: [...new Set(matched.flatMap(table => table.products))].sort(),
		};
	};
	const chunks = (size: number): NonprofitTable[][] => Array.from(
		{ length: Math.ceil(tables.length / size) },
		(_, index) => tables.slice(index * size, (index + 1) * size),
	);

	await mapBounded(chunks(AUTOMATION_STEP_TABLE_CHUNK), chunk => attempt(async () => {
		const parsed = StepPageSchema.parse(await getJson(context, apiUrl(context.origin, 'sdkmessageprocessingsteps', {
			'$select': 'sdkmessageprocessingstepid,name,stage,mode,statecode,solutionid',
			'$expand': 'sdkmessagefilterid($select=primaryobjecttypecode),sdkmessageid($select=name)',
			// Hidden steps are platform registrations, including the internal steps behind real-time workflows.
			'$filter': `ishidden/Value eq false and (${chunk.map(table =>
				`sdkmessagefilterid/primaryobjecttypecode eq '${table.name}'`).join(' or ')})`,
		})));
		limited ||= parsed['@odata.nextLink'] !== undefined;
		for (const step of parsed.value) {
			const layer = layerOf(step.solutionid);
			const tableName = step.sdkmessagefilterid?.primaryobjecttypecode;
			// Product steps edited in the environment are already reported as changed product components by the layer scan.
			if (!layer || !tableName || !tablesByName.has(tableName)
				|| (step.sdkmessageprocessingstepid && input.productComponentKeys.has(componentKey(92, step.sdkmessageprocessingstepid)))) {
				continue;
			}
			const message = step.sdkmessageid?.name ?? 'Message';
			const stage = STEP_STAGES[step.stage ?? -1] ?? 'custom stage';
			automations.push({
				kind: 'plugin-step',
				name: step.name ?? `${message} step`,
				detail: `${message}, ${stage}, ${step.mode === 1 ? 'asynchronous' : 'synchronous'}`,
				...describeTables([tableName]),
				...layer,
				enabled: step.statecode === null || step.statecode === undefined ? null : step.statecode === 0,
			});
		}
	}));

	await mapBounded(chunks(AUTOMATION_PROCESS_TABLE_CHUNK), chunk => attempt(async () => {
		const parsed = ProcessPageSchema.parse(await getJson(context, apiUrl(context.origin, 'workflows', {
			'$select': 'workflowid,name,category,primaryentity,statecode,solutionid',
			'$filter': `type eq 1 and category ne 5 and category ne 6 and (${chunk.map(table =>
				`primaryentity eq '${table.name}'`).join(' or ')})`,
		})));
		limited ||= parsed['@odata.nextLink'] !== undefined;
		for (const process of parsed.value) {
			const layer = layerOf(process.solutionid);
			if (!layer || !process.primaryentity || !tablesByName.has(process.primaryentity)
				|| input.productComponentKeys.has(componentKey(29, process.workflowid))) {
				continue;
			}
			automations.push({
				kind: 'process',
				name: process.name ?? 'Unnamed process',
				detail: PROCESS_CATEGORIES[process.category ?? -1] ?? 'Process',
				...describeTables([process.primaryentity]),
				...layer,
				enabled: process.statecode === null || process.statecode === undefined ? null : process.statecode === 1,
			});
		}
	}));

	// Cloud flows don't record a primary table; their required components show which tables they use without reading definitions.
	let cloudFlows: Array<z.infer<typeof ProcessPageSchema>['value'][number]> = [];
	let checkedFlows: typeof cloudFlows = [];
	if (tables.length) {
		await attempt(async () => {
			const parsed = ProcessPageSchema.parse(await getJson(context, apiUrl(context.origin, 'workflows', {
				'$select': 'workflowid,name,category,primaryentity,statecode,solutionid',
				'$filter': 'type eq 1 and category eq 5',
			})));
			limited ||= parsed['@odata.nextLink'] !== undefined;
			cloudFlows = parsed.value.filter(flow => layerOf(flow.solutionid) !== null)
				.sort((left, right) => (left.name ?? '').localeCompare(right.name ?? '', 'en'));
		});
		checkedFlows = cloudFlows.slice(0, MAX_FLOW_LOOKUPS);
		limited ||= cloudFlows.length > checkedFlows.length;
		await mapBounded(checkedFlows, flow => attempt(async () => {
			const parsed = DependencyPageSchema.parse(await getJson(context, apiUrl(context.origin,
				`RetrieveRequiredComponents(ObjectId=${flow.workflowid},ComponentType=29)`)));
			limited ||= parsed['@odata.nextLink'] !== undefined;
			const names = parsed.value
				.filter(edge => edge.requiredcomponenttype === 1)
				.flatMap(edge => {
					const table = tablesById.get(edge.requiredcomponentobjectid.toLowerCase());
					return table ? [table.name] : [];
				});
			if (names.length) {
				automations.push({
					kind: 'cloud-flow',
					name: flow.name ?? 'Unnamed cloud flow',
					detail: 'Cloud flow',
					...describeTables(names),
					...layerOf(flow.solutionid)!,
					enabled: flow.statecode === null || flow.statecode === undefined ? null : flow.statecode === 1,
				});
			}
		}));
	}
	automations.sort((left, right) => left.kind.localeCompare(right.kind, 'en')
		|| left.tables[0]!.localeCompare(right.tables[0]!, 'en')
		|| left.name.localeCompare(right.name, 'en'));
	limited ||= automations.length > MAX_AUTOMATIONS;
	return {
		automations: automations.slice(0, MAX_AUTOMATIONS),
		automationScan: {
			status: !input.tablesKnown || (succeeded === 0 && failed > 0) ? 'unavailable'
				: failed > 0 || limited ? 'partial' : 'complete',
			tables: tables.length,
			cloudFlows: cloudFlows.length,
			checkedCloudFlows: checkedFlows.length,
		},
	};
}

async function collectDependencies(
	context: RequestContext,
	components: { componenttype: number; objectid: string; name: string }[],
): Promise<z.infer<typeof DependencySummarySchema>> {
	const distinct = [...new Map(components
		.map(item => [`${item.componenttype}:${item.objectid}`, item])).values()]
		.sort((left, right) => left.componenttype - right.componenttype
			|| left.objectid.localeCompare(right.objectid, 'en'));
	const componentNames = new Map(distinct.map(item =>
		[`${item.componenttype}:${item.objectid}`, item.name]));
	const candidates = distinct.slice(0, MAX_DEPENDENCY_COMPONENTS);
	let dependentReferences = 0;
	let truncated = distinct.length > candidates.length;
	const edges: z.infer<typeof DependencySummarySchema>['edges'] = [];
	for (const component of candidates) {
		const parsed = DependencyPageSchema.parse(await getJson(context,
			apiUrl(context.origin,
				`RetrieveDependentComponents(ObjectId=${component.objectid},ComponentType=${component.componenttype})`)));
		dependentReferences += parsed.value.length;
		truncated ||= parsed['@odata.nextLink'] !== undefined;
		for (const edge of parsed.value) {
			if (edges.length >= MAX_DEPENDENCY_EDGES) {
				truncated = true;
				break;
			}
			edges.push({
				requiredComponent: {
					type: edge.requiredcomponenttype,
					objectId: edge.requiredcomponentobjectid,
					name: componentNames.get(
						`${edge.requiredcomponenttype}:${edge.requiredcomponentobjectid}`,
					) ?? fallbackComponentName(edge.requiredcomponenttype, edge.requiredcomponentobjectid),
				},
				dependentComponent: {
					type: edge.dependentcomponenttype,
					objectId: edge.dependentcomponentobjectid,
					name: componentNames.get(
						`${edge.dependentcomponenttype}:${edge.dependentcomponentobjectid}`,
					) ?? null,
				},
				dependencyType: edge.dependencytype,
			});
		}
	}
	return DependencySummarySchema.parse({
		checkedComponents: candidates.length,
		dependentReferences,
		scope: 'direct-customization-overlaps',
		candidateComponents: distinct.length,
		edges,
		truncated,
	});
}

function collectIntegrations(
	componentData: Awaited<ReturnType<typeof collectComponents>>,
): z.infer<typeof IntegrationSummarySchema> {
	const count = (type: number): number =>
		componentData.integrations.filter(item => item.componenttype === type).length;
	return IntegrationSummarySchema.parse({
		workflows: count(29),
		connectionReferences: count(371),
		pluginAssemblies: count(91),
		pluginSteps: count(92),
		scope: 'selected-products-and-overlapping-customizations',
		scopedSolutions: componentData.integrationSolutions,
		truncated: componentData.summary.truncated
			|| componentData.integrations.some(item => item.objectid === null),
	});
}

async function collectCounts(
	context: RequestContext,
	components: { componenttype: number; objectid: string | null }[],
	tableProducts: Map<string, Set<string>>,
): Promise<z.infer<typeof CountSummarySchema>> {
	const metadataIds = [...new Set(components
		.filter(item => item.componenttype === 1 && item.objectid !== null)
		.map(item => item.objectid!))];
	const selected = metadataIds.slice(0, MAX_COUNT_TABLES);
	const resolvedTables: Array<{ id: string; logicalName: string }> = [];
	for (const id of selected) {
		try {
			const definition = EntityDefinitionSchema.parse(await getJson(context,
				apiUrl(context.origin, `EntityDefinitions(${id})`, { '$select': 'LogicalName' })));
			if (/^[a-zA-Z0-9][a-zA-Z0-9_]{0,99}$/.test(definition.LogicalName)) {
				resolvedTables.push({ id, logicalName: definition.LogicalName });
			}
		} catch (error) {
			if (!(error instanceof RequestFailure && error.status === 'not-applicable')) {
				throw error;
			}
		}
	}
	const names = resolvedTables.map(item => item.logicalName);
	if (resolvedTables.length === 0) {
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
		tables: resolvedTables.filter(table => values.has(table.logicalName)).map(table => ({
			logicalName: table.logicalName,
			count: values.get(table.logicalName)!,
			accuracy: 'snapshot-within-24-hours',
			products: [...(tableProducts.get(table.id) ?? [])].sort(),
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
			const organization = OrganizationPageSchema.parse(await getJson(context, apiUrl(origin, 'organizations', {
				'$select': 'name',
				'$top': '1',
			})));
			result.environment = EnvironmentObservationSchema.parse({
				dataverseVersion: parsed.Version,
				name: organization.value[0]!.name,
			});
		}, 'The Dataverse environment name and version were observed.');
		await run('components', ['solutions'], async () => {
			componentData = await collectComponents(context, result,
				new Set(options.relevantSolutionNames.map(name => name.toLowerCase())));
			result.components = componentData.summary;
		}, 'Relevant solution components, solution layers, and customization overlap signals were summarized.');
		if (result.components?.truncated) {
			replaceEvidence(result.evidence, evidence('components', 'partial', result.collectedAt,
				'A safety limit on the number of solutions or components was reached, so more may exist.', ['solutions']));
		} else if (result.components?.layerScan && result.components.layerScan.status !== 'complete') {
			replaceEvidence(result.evidence, evidence('components', 'partial', result.collectedAt,
				result.components.layerScan.status === 'unavailable'
					? 'Solution layer details weren\'t available, so changes made directly in the environment couldn\'t be listed.'
					: 'Some tables couldn\'t be checked for customizations, or a safety limit was reached.', ['solutions']));
		}
		if (selected('dependencies') && !selected('components')) {
			replaceEvidence(result.evidence, evidence('dependencies', 'unknown', result.collectedAt,
				'Dependency discovery requires consent for component metadata.', ['components']));
		} else {
			await run('dependencies', ['components'], async () => {
				if (!componentData) {
					throw new RequestFailure('No relevant solution component evidence was available.', 'not-applicable');
				}
				result.dependencies = await collectDependencies(context, componentData.dependencyCandidates);
			}, 'Dependencies were inspected for components directly shared by selected products and customization solutions.');
			if (result.dependencies?.truncated) {
				replaceEvidence(result.evidence, evidence('dependencies', 'partial', result.collectedAt,
					'A safety limit was reached before every changed component could be checked for dependencies.',
					['components']));
			}
		}
		if (selected('integrations') && !selected('components')) {
			replaceEvidence(result.evidence, evidence('integrations', 'unknown', result.collectedAt,
				'Scoped integration discovery requires consent for component metadata.', ['components']));
		} else {
			await run('integrations', ['components'], async () => {
				if (!componentData) {
					throw new RequestFailure('No relevant solution component evidence was available.', 'not-applicable');
				}
				result.integrations = IntegrationSummarySchema.parse({
					...collectIntegrations(componentData),
					...await collectAutomations(context, {
						tables: componentData.nonprofitTables,
						tablesKnown: componentData.tablesKnown,
						solutions: result.solutions,
						microsoftSolutions: componentData.microsoftSolutions,
						productComponentKeys: componentData.productComponentKeys,
					}),
				});
			}, 'Scoped workflow, connection-reference, and plug-in counts were derived, and plug-in steps, processes, and cloud flows registered on nonprofit tables were named.');
			if (result.integrations?.truncated) {
				replaceEvidence(result.evidence, evidence('integrations', 'partial', result.collectedAt,
					'Plug-in and workflow counts may be incomplete because a safety limit was reached while reading components.',
					['components']));
			} else if (result.integrations?.automationScan && result.integrations.automationScan.status !== 'complete') {
				replaceEvidence(result.evidence, evidence('integrations', 'partial', result.collectedAt,
					result.integrations.automationScan.status === 'unavailable'
						? 'Plug-in steps, processes, and cloud flows on nonprofit tables couldn\'t be listed.'
						: 'Some plug-in steps, processes, or cloud flows couldn\'t be read, or a safety limit was reached.',
					['components']));
			}
		}
		if (selected('counts') && !selected('components')) {
			replaceEvidence(result.evidence, evidence('counts', 'unknown', result.collectedAt,
				'Relevant table counts require consent for component metadata.', ['components']));
		} else {
			await run('counts', ['components'], async () => {
				if (!componentData) {
					throw new RequestFailure('No relevant table component identifiers were available.', 'not-applicable');
				}
				result.counts = await collectCounts(context, componentData.relevant, componentData.tableProducts);
			}, 'Relevant table counts were read from the Dataverse snapshot count function.');
			if (result.counts?.truncated) {
				replaceEvidence(result.evidence, evidence('counts', 'partial', result.collectedAt,
					'Record counts couldn\'t be read for every related table.', ['components']));
			}
		}
		await run('sites', [], async () => {
			result.sites = await collectSites(context);
		}, 'Legacy and enhanced Power Pages site counts were summarized.');
		if (result.sites?.truncated) {
			replaceEvidence(result.evidence, evidence('sites', 'partial', result.collectedAt,
				'There are more than 5,000 Power Pages sites, so the site count is a lower limit.'));
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
