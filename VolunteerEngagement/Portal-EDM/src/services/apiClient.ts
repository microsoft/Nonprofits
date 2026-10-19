// Core API client — token handling, HTTP helpers, error class
// Used by all domain service modules.
import type ExtendedWindow from '@/ExtendedWindow';
import { isGuid } from '@/utils/guid';

let cachedToken: string | null = null;

/** Drop the cached anti-forgery token so the next write fetches a fresh one. */
export function clearTokenCache(): void {
	cachedToken = null;
}

export async function getToken(): Promise<string> {
	if (cachedToken) return cachedToken;

	const extWindow = window as unknown as ExtendedWindow;

	// Try the shell approach first (works in portal-hosted pages)
	if (extWindow.shell?.getTokenDeferred) {
		cachedToken = await extWindow.shell.getTokenDeferred();
		return cachedToken;
	}
	// Fall back to /_layout/tokenhtml (BYOC pattern from GitHub samples)
	const response = await fetch('/_layout/tokenhtml');
	if (!response.ok) {
		throw new Error(`Failed to fetch anti-forgery token: ${response.status}`);
	}
	const html = await response.text();
	const match = html.match(/value="([^"]+)"/);
	if (!match) {
		throw new Error('Anti-forgery token not found in response');
	}
	cachedToken = match[1];
	return cachedToken;
}

/**
 * Throws a not-found ApiError when an id is not a GUID, so malformed ids are
 * never interpolated into Web API URLs or OData filters.
 */
export function assertGuid(id: string, label = 'id'): string {
	if (!isGuid(id)) {
		throw new ApiError(`Invalid ${label}`, 404);
	}
	return id;
}

// A stale anti-forgery token (e.g. after the session changed) surfaces as 400/403.
// Refresh the token and retry the write exactly once.
async function sendWithToken(url: string, buildInit: (token: string) => RequestInit): Promise<Response> {
	const response = await fetch(url, buildInit(await getToken()));
	if (response.status !== 400 && response.status !== 403) {
		return response;
	}
	clearTokenCache();
	return fetch(url, buildInit(await getToken()));
}

export async function apiGet<T>(url: string): Promise<T> {
	const response = await fetch(url);
	if (response.status === 403) {
		throw new ApiError('Unauthorized', 403);
	}
	if (!response.ok) {
		const text = await response.text().catch(() => '');
		console.error('API GET %s failed: %s', url, response.status, text);
		throw new ApiError(`API error: ${response.status}`, response.status);
	}
	return response.json();
}

export async function apiPost<T>(url: string, body: Record<string, unknown>): Promise<T> {
	const response = await sendWithToken(url, (token) => ({
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			__RequestVerificationToken: token,
		},
		body: JSON.stringify(body),
	}));
	if (!response.ok) {
		throw new ApiError(`API error: ${response.status}`, response.status);
	}
	if (response.status === 204) return {} as T;
	return response.json();
}

export async function apiPatch(url: string, body: Record<string, unknown>): Promise<void> {
	const response = await sendWithToken(url, (token) => ({
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			__RequestVerificationToken: token,
		},
		body: JSON.stringify(body),
	}));
	if (!response.ok) {
		throw new ApiError(`API error: ${response.status}`, response.status);
	}
}

export async function apiDelete(url: string): Promise<void> {
	const response = await sendWithToken(url, (token) => ({
		method: 'DELETE',
		headers: {
			__RequestVerificationToken: token,
		},
	}));
	if (!response.ok) {
		throw new ApiError(`API error: ${response.status}`, response.status);
	}
}

export class ApiError extends Error {
	constructor(
		message: string,
		public status: number,
	) {
		super(message);
		this.name = 'ApiError';
	}
}
