import { z } from 'zod';
import { validateEnvironmentUrl } from './discovery.js';

export const GLOBAL_DISCOVERY_ORIGIN = 'https://globaldisco.crm.dynamics.com';
const INSTANCES_URL = `${GLOBAL_DISCOVERY_ORIGIN}/api/discovery/v2.0/Instances`;
const RESPONSE_BYTES = 1024 * 1024;

const InstancesSchema = z.object({
	value: z.array(z.object({
		FriendlyName: z.string().max(200).nullable().optional(),
		UrlName: z.string().max(200).nullable().optional(),
		Url: z.string().max(500),
		State: z.number().int().nullable().optional(),
		Region: z.string().max(20).nullable().optional(),
		IsUserSysAdmin: z.boolean().nullable().optional(),
	})).max(1_000),
});

export interface EnvironmentListing {
	name: string;
	url: string;
	region: string | null;
	enabled: boolean;
	systemAdministrator: boolean | null;
}

export interface EnvironmentListOptions {
	getToken: () => Promise<string>;
	fetch?: typeof globalThis.fetch;
	timeoutMs?: number;
}

async function readBounded(response: Response, signal: AbortSignal): Promise<unknown> {
	const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
	const declared = response.headers.get('content-length');
	if (contentType !== 'application/json' || !response.body
		|| (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > RESPONSE_BYTES))) {
		void response.body?.cancel().catch(() => undefined);
		throw new Error('The environment list response was invalid.');
	}
	const reader = response.body.getReader();
	const decoder = new TextDecoder('utf-8', { fatal: true });
	let bytes = 0;
	let text = '';
	try {
		while (true) {
			if (signal.aborted) {
				throw new Error('Listing environments was canceled.');
			}
			const chunk = await reader.read();
			if (chunk.done) {
				break;
			}
			bytes += chunk.value.byteLength;
			if (bytes > RESPONSE_BYTES) {
				throw new Error('The environment list response was too large.');
			}
			text += decoder.decode(chunk.value, { stream: true });
		}
		text += decoder.decode();
		return JSON.parse(text) as unknown;
	} catch {
		throw new Error('The environment list response could not be read.');
	} finally {
		void reader.cancel().catch(() => undefined);
		reader.releaseLock();
	}
}

// Lists commercial Dataverse environments the signed-in user can access, using only names, URLs, and regions.
export async function listEnvironments(options: EnvironmentListOptions): Promise<EnvironmentListing[]> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? 30_000);
	try {
		let token: string;
		try {
			token = await options.getToken();
		} catch {
			throw new Error('Authentication did not complete. Sign in with Azure CLI (az login) and try again.');
		}
		if (typeof token !== 'string' || token.length > 16_384 || !/^[A-Za-z0-9._~+/-]+=*$/.test(token)) {
			throw new Error('Authentication did not provide a valid access token.');
		}
		let response: Response;
		try {
			response = await (options.fetch ?? globalThis.fetch)(INSTANCES_URL, {
				method: 'GET',
				headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
				redirect: 'manual',
				credentials: 'omit',
				referrerPolicy: 'no-referrer',
				cache: 'no-store',
				signal: controller.signal,
			});
		} catch {
			throw new Error('The environment list request failed.');
		}
		if (response.status !== 200) {
			void response.body?.cancel().catch(() => undefined);
			throw new Error(response.status === 401 || response.status === 403
				? 'Access to the environment list was denied.'
				: 'The environment list service returned an unsuccessful response.');
		}
		const parsed = InstancesSchema.safeParse(await readBounded(response, controller.signal));
		if (!parsed.success) {
			throw new Error('The environment list response was invalid.');
		}
		const listings: EnvironmentListing[] = [];
		for (const instance of parsed.data.value) {
			let url: string;
			try {
				url = validateEnvironmentUrl(instance.Url);
			} catch {
				continue;
			}
			listings.push({
				name: instance.FriendlyName?.replace(/[\r\n\u0000-\u001f]/g, ' ').trim() || instance.UrlName || new URL(url).hostname,
				url,
				region: instance.Region && /^[A-Za-z0-9-]{1,20}$/.test(instance.Region) ? instance.Region : null,
				enabled: (instance.State ?? 0) === 0,
				systemAdministrator: instance.IsUserSysAdmin ?? null,
			});
		}
		return listings.sort((left, right) => left.name.localeCompare(right.name, 'en') || left.url.localeCompare(right.url, 'en'));
	} finally {
		clearTimeout(timer);
	}
}

export function formatEnvironmentList(listings: EnvironmentListing[]): string {
	if (!listings.length) {
		return 'No commercial Dataverse environments were found for the signed-in account.';
	}
	return [
		'Dataverse environments you can access:',
		...listings.map((item, index) => {
			const details = [
				item.region,
				item.systemAdministrator === true ? 'System Administrator' : item.systemAdministrator === false ? 'not System Administrator' : null,
				item.enabled ? null : 'disabled',
			].filter(Boolean).join('; ');
			return `${index + 1}. ${item.name} — ${item.url}${details ? ` (${details})` : ''}`;
		}),
	].join('\n');
}
