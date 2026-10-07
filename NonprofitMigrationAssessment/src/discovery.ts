import { z } from 'zod';
import { DiscoverySchema, SolutionSchema, type Discovery, type Evidence, type Solution } from './contracts.js';

const PATH = '/api/data/v9.2/solutions';
const SELECT = 'solutionid,uniquename,version,ismanaged';
const EXPAND = 'publisherid($select=uniquename,customizationprefix)';
const PAGE_BYTES = 1024 * 1024;
const TOTAL_BYTES = 4 * PAGE_BYTES;
const MAX_SOLUTIONS = 10_000;
const PageSchema = z.object({
	value: z.array(z.unknown()).max(5_000),
	'@odata.nextLink': z.unknown().optional(),
});
const RowSchema = z.object({
	solutionid: z.unknown(),
	uniquename: z.unknown(),
	version: z.unknown(),
	ismanaged: z.unknown(),
	publisherid: z.object({
		uniquename: z.unknown(),
		customizationprefix: z.unknown(),
	}),
});

export interface CollectionOptions {
	environmentUrl: string;
	consent: boolean;
	getToken: () => Promise<string>;
	signal?: AbortSignal;
	fetch?: typeof globalThis.fetch;
	now?: () => Date;
	maxPages?: number;
	maxRetries?: number;
	timeoutMs?: number;
}

class CollectionFailure extends Error {
	constructor(message: string, readonly denied = false) {
		super(message);
	}
}

/** Accept only public commercial Dataverse origins, never URL parser-normalized paths or ports. */
export function validateEnvironmentUrl(url: string): string {
	if (typeof url !== 'string' || url.length > 253
		|| /[\s\\]/u.test(url)
		|| !/^https:\/\/[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.crm[0-9]{0,60}\.dynamics\.com\/?$/i.test(url)) {
		throw new Error('Invalid public Dataverse environment origin.');
	}
	return new URL(url).origin;
}

function bound(value: number | undefined, fallback: number, min: number, max: number): number {
	const result = value === undefined ? fallback : value;
	if (!Number.isInteger(result) || result < min || result > max) {
		throw new Error('Invalid discovery limits.');
	}
	return result;
}

function queryUrl(origin: string): URL {
	const url = new URL(PATH, origin);
	url.searchParams.set('$select', SELECT);
	url.searchParams.set('$expand', EXPAND);
	return url;
}

function nextUrl(link: string, origin: string): string {
	const fail = () => new CollectionFailure('Pagination destination or query was not approved.');
	if (link.length > 16_384 || /[\s\\]/u.test(link)
		|| !(link.startsWith(`${origin}${PATH}?`) || link.startsWith(`${PATH}?`))) {
		throw fail();
	}
	let candidate: URL;
	try {
		candidate = new URL(link, origin);
	} catch {
		throw fail();
	}
	if (candidate.origin !== origin || candidate.pathname !== PATH || candidate.hash
		|| candidate.username || candidate.password || candidate.port) {
		throw fail();
	}
	const params = candidate.searchParams;
	const seen = new Set<string>();
	for (const [key] of params) {
		if (seen.has(key) || !['$select', '$expand', '$skiptoken', '$page', 'page'].includes(key)) {
			throw fail();
		}
		seen.add(key);
	}
	if (params.get('$select') !== SELECT || params.get('$expand') !== EXPAND
		|| (!seen.has('$skiptoken') && !seen.has('$page') && !seen.has('page'))
		|| (seen.has('$page') && seen.has('page'))) {
		throw fail();
	}
	// Rebuild from trusted fields instead of fetching a server-supplied URL.
	const result = queryUrl(origin);
	for (const key of ['$skiptoken', '$page', 'page']) {
		const value = params.get(key);
		if (value === null) {
			continue;
		}
		if (key === '$skiptoken'
			? !value || value.length > 8_192 || /[\u0000-\u001f\u007f]/u.test(value)
			: !/^[1-9][0-9]{0,5}$/.test(value)) {
			throw fail();
		}
		result.searchParams.set(key, value);
	}
	return result.href;
}

function discard(response: Response): void {
	void response.body?.cancel().catch(() => undefined);
}

function interrupted(timedOut: () => boolean): CollectionFailure {
	return new CollectionFailure(timedOut() ? 'Discovery time budget was exhausted.' : 'Discovery was canceled.');
}

// Race callbacks as well as transport reads: injected credentials/transports might ignore AbortSignal.
function bounded<T>(operation: Promise<T>, signal: AbortSignal, timedOut: () => boolean): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const abort = () => reject(interrupted(timedOut));
		if (signal.aborted) {
			reject(interrupted(timedOut));
		} else {
			signal.addEventListener('abort', abort, { once: true });
		}
		operation.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
	});
}

async function wait(ms: number, signal: AbortSignal, timedOut: () => boolean): Promise<void> {
	let timer: ReturnType<typeof setTimeout> | undefined;
	try {
		await bounded(new Promise<void>(resolve => { timer = setTimeout(resolve, ms); }), signal, timedOut);
	} finally {
		clearTimeout(timer);
	}
}

async function readJson(
	response: Response,
	budget: { bytes: number },
	signal: AbortSignal,
	timedOut: () => boolean,
): Promise<unknown> {
	const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
	if (contentType !== 'application/json' || !response.body) {
		discard(response);
		throw new CollectionFailure('The metadata response format was invalid.');
	}
	const length = response.headers.get('content-length');
	if (length !== null && (!/^\d+$/.test(length) || Number(length) > Math.min(PAGE_BYTES, TOTAL_BYTES - budget.bytes))) {
		discard(response);
		throw new CollectionFailure('Discovery response byte budget was exhausted.');
	}
	const reader = response.body.getReader();
	const decoder = new TextDecoder('utf-8', { fatal: true });
	let bytes = 0;
	let text = '';
	try {
		while (true) {
			if (signal.aborted) {
				throw interrupted(timedOut);
			}
			const chunk = await bounded(reader.read(), signal, timedOut);
			if (chunk.done) {
				break;
			}
			bytes += chunk.value.byteLength;
			budget.bytes += chunk.value.byteLength;
			if (bytes > PAGE_BYTES || budget.bytes > TOTAL_BYTES) {
				throw new CollectionFailure('Discovery response byte budget was exhausted.');
			}
			text += decoder.decode(chunk.value, { stream: true });
		}
		text += decoder.decode();
		return JSON.parse(text) as unknown;
	} catch (error) {
		if (error instanceof CollectionFailure) {
			throw error;
		}
		throw new CollectionFailure('The metadata response could not be read or validated.');
	} finally {
		void reader.cancel().catch(() => undefined);
		reader.releaseLock();
	}
}

export async function collectSolutions(options: CollectionOptions): Promise<Discovery> {
	if (options.consent !== true) {
		throw new Error('Read-only discovery consent is required.');
	}
	const origin = validateEnvironmentUrl(options.environmentUrl);
	const maxPages = bound(options.maxPages, 20, 1, 100);
	const maxRetries = bound(options.maxRetries, 2, 0, 5);
	const timeoutMs = bound(options.timeoutMs, 30_000, 1, 120_000);
	const transport = options.fetch ?? globalThis.fetch;
	if (typeof options.getToken !== 'function' || typeof transport !== 'function'
		|| (options.now !== undefined && typeof options.now !== 'function')
		|| (options.signal !== undefined && !(options.signal instanceof AbortSignal))) {
		throw new Error('Invalid discovery configuration.');
	}
	let collectedAt: string;
	try {
		collectedAt = (options.now ?? (() => new Date()))().toISOString();
		if (!z.iso.datetime().safeParse(collectedAt).success) {
			throw new Error();
		}
	} catch {
		throw new Error('Invalid discovery clock.');
	}
	const controller = new AbortController();
	const abort = () => controller.abort();
	options.signal?.addEventListener('abort', abort, { once: true });
	if (options.signal?.aborted) {
		controller.abort();
	}
	let expired = false;
	const timedOut = () => expired;
	const timer = setTimeout(() => { expired = true; controller.abort(); }, timeoutMs);
	const signal = controller.signal;
	const check = () => {
		if (signal.aborted) {
			throw interrupted(timedOut);
		}
	};
	const solutions = new Map<string, Solution>();
	const budget = { bytes: 0 };
	let status: Evidence['status'] = 'error';
	let reason = 'Discovery did not complete.';
	let incompleteRows = false;
	try {
		check();
		let token: string;
		try {
			token = await bounded(Promise.resolve().then(() => { check(); return options.getToken(); }), signal, timedOut);
		} catch {
			check();
			throw new CollectionFailure('Authentication did not complete.');
		}
		check();
		if (typeof token !== 'string' || token.length > 16_384 || !/^[A-Za-z0-9._~+/-]+=*$/.test(token)) {
			throw new CollectionFailure('Authentication did not provide a valid access token.');
		}
		let url: string | undefined = queryUrl(origin).href;
		const visited = new Set<string>();
		for (let page = 0; url !== undefined; page++) {
			check();
			if (page >= maxPages) {
				throw new CollectionFailure('Discovery page budget was exhausted.');
			}
			if (visited.has(url)) {
				throw new CollectionFailure('Pagination repeated a previously requested page.');
			}
			visited.add(url);
			let response: Response | undefined;
			for (let attempt = 0; attempt <= maxRetries; attempt++) {
				check();
				let retryDelay = Math.min(100 * 2 ** attempt, 2_000);
				try {
					const request = transport(url, {
						method: 'GET',
						headers: {
							Authorization: `Bearer ${token}`,
							Accept: 'application/json',
							'OData-MaxVersion': '4.0',
							'OData-Version': '4.0',
						},
						redirect: 'manual',
						credentials: 'omit',
						referrerPolicy: 'no-referrer',
						cache: 'no-store',
						signal,
					});
					void request.then(late => { if (signal.aborted) { discard(late); } }, () => undefined);
					response = await bounded(request, signal, timedOut);
				} catch {
					check();
					if (attempt === maxRetries) {
						throw new CollectionFailure('The metadata request failed after bounded retries.');
					}
					await wait(retryDelay, signal, timedOut);
					continue;
				}
				check();
				if (response.redirected || response.type === 'opaqueredirect'
					|| (response.status >= 300 && response.status < 400)) {
					discard(response);
					throw new CollectionFailure('Metadata redirects are not permitted.');
				}
				if (response.status === 401 || response.status === 403) {
					discard(response);
					throw new CollectionFailure('Access to solution metadata was denied.', true);
				}
				if (![429, 500, 502, 503, 504].includes(response.status)) {
					break;
				}
				const retryAfter = response.headers.get('retry-after');
				discard(response);
				if (attempt === maxRetries) {
					throw new CollectionFailure('The metadata service exhausted bounded retries.');
				}
				if (retryAfter !== null) {
					// Do not retry earlier than requested or accept an unbounded server-controlled wait.
					const delay = /^\d+$/.test(retryAfter)
						? Number(retryAfter) * 1_000
						: Date.parse(retryAfter) - Date.now();
					if (!Number.isFinite(delay) || delay > 5_000) {
						throw new CollectionFailure('The metadata retry delay exceeded the approved budget.');
					}
					retryDelay = Math.max(0, delay);
				}
				await wait(retryDelay, signal, timedOut);
			}
			if (!response || response.status !== 200) {
				if (response) {
					discard(response);
				}
				throw new CollectionFailure('The metadata service returned an unsuccessful response.');
			}
			const parsed = PageSchema.safeParse(await readJson(response, budget, signal, timedOut));
			check();
			if (!parsed.success) {
				throw new CollectionFailure('The solution metadata page was invalid.');
			}
			for (const raw of parsed.data.value) {
				const row = RowSchema.safeParse(raw);
				const entry = row.success ? SolutionSchema.safeParse({
					solutionId: row.data.solutionid,
					uniqueName: row.data.uniquename,
					version: row.data.version,
					managed: row.data.ismanaged,
					publisher: row.data.publisherid.uniquename,
					publisherPrefix: row.data.publisherid.customizationprefix,
				}) : undefined;
				if (!entry?.success) {
					incompleteRows = true;
					continue;
				}
				const previous = solutions.get(entry.data.uniqueName);
				if (previous && JSON.stringify(previous) !== JSON.stringify(entry.data)) {
					solutions.delete(entry.data.uniqueName);
					throw new CollectionFailure('Conflicting duplicate solution metadata was omitted.');
				}
				solutions.set(entry.data.uniqueName, entry.data);
				if (solutions.size > MAX_SOLUTIONS) {
					solutions.delete(entry.data.uniqueName);
					throw new CollectionFailure('Discovery solution budget was exhausted.');
				}
			}
			const next = parsed.data['@odata.nextLink'];
			if (next !== undefined && typeof next !== 'string') {
				throw new CollectionFailure('Pagination metadata was invalid.');
			}
			url = next === undefined ? undefined : nextUrl(next, origin);
		}
		check();
		status = incompleteRows ? (solutions.size ? 'partial' : 'error') : 'observed';
		reason = incompleteRows
			? 'Some solution metadata was missing or invalid; those entries remain unknown and were omitted.'
			: 'The approved solution metadata query completed.';
	} catch (error) {
		status = error instanceof CollectionFailure && error.denied ? 'access-denied' : (solutions.size ? 'partial' : 'error');
		reason = error instanceof CollectionFailure ? error.message : 'Solution metadata discovery failed.';
	} finally {
		clearTimeout(timer);
		options.signal?.removeEventListener('abort', abort);
		controller.abort();
	}
	const evidence: Evidence[] = [{
		id: 'solutions',
		source: 'observed',
		status,
		collectedAt,
		collector: 'dataverse-solutions',
		scope: 'environment',
		inputs: [],
		reason,
	}];
	for (const id of ['environment', 'components', 'dependencies', 'integrations', 'counts', 'sites']) {
		evidence.push({
			id,
			source: 'not-collected',
			status: 'unknown',
			collectedAt: null,
			collector: 'not-collected',
			scope: 'environment',
			inputs: [],
			reason: 'This category was not collected.',
		});
	}
	return DiscoverySchema.parse({ collectedAt, solutions: [...solutions.values()], evidence });
}
