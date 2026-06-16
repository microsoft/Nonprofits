import { beforeEach, describe, expect, it, vi } from 'vitest';

type TestWindow = Window & {
	shell?: {
		getTokenDeferred: () => Promise<string>;
	};
};

function jsonResponse(body: unknown, init?: ResponseInit): Response {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
		...init,
	});
}

function getTestWindow(): TestWindow {
	return window as TestWindow;
}

describe('apiClient', () => {
	beforeEach(() => {
		vi.resetModules();
		delete getTestWindow().shell;
	});

	it('uses and caches the Power Pages shell anti-forgery token', async () => {
		const fetchMock = vi.fn<typeof fetch>();
		const getTokenDeferred = vi.fn().mockResolvedValue('shell-token');
		getTestWindow().shell = { getTokenDeferred };
		vi.stubGlobal('fetch', fetchMock);

		const { getToken } = await import('../apiClient');

		await expect(getToken()).resolves.toBe('shell-token');
		await expect(getToken()).resolves.toBe('shell-token');
		expect(getTokenDeferred).toHaveBeenCalledTimes(1);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('falls back to tokenhtml when the shell token API is unavailable', async () => {
		const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response('<input value="html-token" />'));
		vi.stubGlobal('fetch', fetchMock);

		const { getToken } = await import('../apiClient');

		await expect(getToken()).resolves.toBe('html-token');
		expect(fetchMock).toHaveBeenCalledWith('/_layout/tokenhtml');
	});

	it('throws when tokenhtml does not include an anti-forgery token', async () => {
		const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response('<html></html>'));
		vi.stubGlobal('fetch', fetchMock);

		const { getToken } = await import('../apiClient');

		await expect(getToken()).rejects.toThrow('Anti-forgery token not found in response');
	});

	it('turns 403 GET responses into ApiError', async () => {
		const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 403 }));
		vi.stubGlobal('fetch', fetchMock);

		const { apiGet } = await import('../apiClient');

		await expect(apiGet('/_api/protected')).rejects.toMatchObject({
			name: 'ApiError',
			status: 403,
		});
	});

	it('sends POST requests with JSON and the anti-forgery token', async () => {
		const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ id: 'created' }));
		getTestWindow().shell = { getTokenDeferred: vi.fn().mockResolvedValue('request-token') };
		vi.stubGlobal('fetch', fetchMock);

		const { apiPost } = await import('../apiClient');

		await expect(apiPost('/_api/items', { name: 'Food Bank' })).resolves.toEqual({ id: 'created' });
		expect(fetchMock).toHaveBeenCalledWith(
			'/_api/items',
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					'Content-Type': 'application/json',
					Accept: 'application/json',
					__RequestVerificationToken: 'request-token',
				}),
				body: JSON.stringify({ name: 'Food Bank' }),
			}),
		);
	});
});
