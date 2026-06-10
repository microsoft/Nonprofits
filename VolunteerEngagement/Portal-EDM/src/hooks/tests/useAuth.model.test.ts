import { beforeEach, describe, expect, it, vi } from 'vitest';

import { hasPortalUserCookie, readPortalUserGlobal, resolvePortalUser } from '../useAuth.model';

type AuthWindow = Window & {
	Microsoft?: {
		Dynamic365?: {
			Portal?: {
				User?: {
					contactId?: string;
					email?: string;
					firstName?: string;
					lastName?: string;
					userName?: string;
					userRoles?: string[];
				};
			};
		};
	};
};

function getAuthWindow(): AuthWindow {
	return window as AuthWindow;
}

function clearPortalCookie() {
	document.cookie = '__Portal-user=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
}

describe('useAuth model helpers', () => {
	beforeEach(() => {
		delete getAuthWindow().Microsoft;
		clearPortalCookie();
	});

	it('reads the Liquid-injected portal user global', () => {
		getAuthWindow().Microsoft = {
			Dynamic365: {
				Portal: {
					User: {
						contactId: 'contact-1',
						email: 'volunteer@example.test',
						firstName: 'Test',
						lastName: 'User',
						userName: 'fallback@example.test',
						userRoles: ['Administrators'],
					},
				},
			},
		};

		expect(readPortalUserGlobal()).toEqual({
			contactId: 'contact-1',
			userName: 'volunteer@example.test',
			firstName: 'Test',
			lastName: 'User',
			userRoles: ['Administrators'],
		});
	});

	it('detects the Power Pages user cookie', () => {
		expect(hasPortalUserCookie('foo=bar; __Portal-user=present')).toBe(true);
		expect(hasPortalUserCookie('foo=bar')).toBe(false);
	});

	it('returns null without a global user or portal user cookie', async () => {
		const fetchMock = vi.fn<typeof fetch>();
		vi.stubGlobal('fetch', fetchMock);

		await expect(resolvePortalUser()).resolves.toBeNull();
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('resolves the current contact from the Web API when the portal cookie exists', async () => {
		document.cookie = '__Portal-user=present; path=/';
		const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
			new Response(
				JSON.stringify({
					value: [
						{
							contactid: 'contact-1',
							emailaddress1: 'volunteer@example.test',
							firstname: 'Test',
							lastname: 'User',
						},
					],
				}),
			),
		);
		vi.stubGlobal('fetch', fetchMock);

		await expect(resolvePortalUser()).resolves.toEqual({
			contactId: 'contact-1',
			userName: 'volunteer@example.test',
			firstName: 'Test',
			lastName: 'User',
			userRoles: [],
		});
		expect(fetchMock).toHaveBeenCalledWith(
			'/_api/contacts?$select=contactid,firstname,lastname,emailaddress1&$top=1',
			{ credentials: 'same-origin' },
		);
	});

	it('returns null when the current contact lookup fails', async () => {
		document.cookie = '__Portal-user=present; path=/';
		vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new Error('expired')));

		await expect(resolvePortalUser()).resolves.toBeNull();
	});
});
