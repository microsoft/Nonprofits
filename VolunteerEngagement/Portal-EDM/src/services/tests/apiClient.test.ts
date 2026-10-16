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

	it('refreshes a stale token and retries a write exactly once on 403', async () => {
		const getTokenDeferred = vi.fn().mockResolvedValueOnce('stale-token').mockResolvedValueOnce('fresh-token');
		getTestWindow().shell = { getTokenDeferred };
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(new Response('', { status: 403 }))
			.mockResolvedValueOnce(new Response(null, { status: 204 }));
		vi.stubGlobal('fetch', fetchMock);

		const { apiPatch } = await import('../apiClient');

		await expect(apiPatch('/_api/items(1)', { name: 'Food Bank' })).resolves.toBeUndefined();
		expect(getTokenDeferred).toHaveBeenCalledTimes(2);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ __RequestVerificationToken: 'stale-token' });
		expect(fetchMock.mock.calls[1][1]?.headers).toMatchObject({ __RequestVerificationToken: 'fresh-token' });
	});

	it('does not retry more than once when the write keeps failing with 400/403', async () => {
		const getTokenDeferred = vi.fn().mockResolvedValueOnce('stale-token').mockResolvedValueOnce('fresh-token');
		getTestWindow().shell = { getTokenDeferred };
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(new Response('', { status: 400 }))
			.mockResolvedValueOnce(new Response('', { status: 403 }));
		vi.stubGlobal('fetch', fetchMock);

		const { apiPost } = await import('../apiClient');

		await expect(apiPost('/_api/items', { name: 'Food Bank' })).rejects.toMatchObject({
			name: 'ApiError',
			status: 403,
		});
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(getTokenDeferred).toHaveBeenCalledTimes(2);
	});

	it('does not retry writes that fail with other statuses', async () => {
		getTestWindow().shell = { getTokenDeferred: vi.fn().mockResolvedValue('request-token') };
		const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response('', { status: 500 }));
		vi.stubGlobal('fetch', fetchMock);

		const { apiDelete } = await import('../apiClient');

		await expect(apiDelete('/_api/items(1)')).rejects.toMatchObject({ status: 500 });
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('fetches a new token after clearTokenCache', async () => {
		const getTokenDeferred = vi.fn().mockResolvedValueOnce('first-token').mockResolvedValueOnce('second-token');
		getTestWindow().shell = { getTokenDeferred };
		vi.stubGlobal('fetch', vi.fn<typeof fetch>());

		const { clearTokenCache, getToken } = await import('../apiClient');

		await expect(getToken()).resolves.toBe('first-token');
		clearTokenCache();
		await expect(getToken()).resolves.toBe('second-token');
	});

	it('assertGuid rejects malformed ids with a not-found ApiError', async () => {
		const { assertGuid } = await import('../apiClient');
		const id = 'a1b2c3d4-e5f6-4789-8abc-def012345678';

		expect(assertGuid(id)).toBe(id);
		expect(() => assertGuid("x' or 1 eq 1", 'contact id')).toThrow('Invalid contact id');
	});
});
