// Core API client — token handling, HTTP helpers, error class
// Used by all domain service modules.
import type ExtendedWindow from '@/ExtendedWindow';

let cachedToken: string | null = null;

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

export async function apiGet<T>(url: string): Promise<T> {
	const response = await fetch(url);
	if (response.status === 403) {
		throw new ApiError('Unauthorized', 403);
	}
	if (!response.ok) {
		const text = await response.text().catch(() => '');
		console.error(`API GET ${url} failed: ${response.status}`, text);
		throw new ApiError(`API error: ${response.status}`, response.status);
	}
	return response.json();
}

export async function apiPost<T>(url: string, body: Record<string, unknown>): Promise<T> {
	const token = await getToken();
	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Accept: 'application/json',
			__RequestVerificationToken: token,
		},
		body: JSON.stringify(body),
	});
	if (!response.ok) {
		throw new ApiError(`API error: ${response.status}`, response.status);
	}
	if (response.status === 204) return {} as T;
	return response.json();
}

export async function apiPatch(url: string, body: Record<string, unknown>): Promise<void> {
	const token = await getToken();
	const response = await fetch(url, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			__RequestVerificationToken: token,
		},
		body: JSON.stringify(body),
	});
	if (!response.ok) {
		throw new ApiError(`API error: ${response.status}`, response.status);
	}
}

export async function apiDelete(url: string): Promise<void> {
	const token = await getToken();
	const response = await fetch(url, {
		method: 'DELETE',
		headers: {
			__RequestVerificationToken: token,
		},
	});
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
