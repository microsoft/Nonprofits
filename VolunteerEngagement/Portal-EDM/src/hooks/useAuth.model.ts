import type ExtendedWindow from '@/ExtendedWindow';

import type { PortalUser } from '@/types';

export function readPortalUserGlobal(): PortalUser | null {
	const extWindow = window as unknown as ExtendedWindow;
	const portalUser = extWindow.Microsoft?.Dynamic365?.Portal?.User;
	if (!portalUser?.contactId && !portalUser?.userName) return null;
	return {
		userName: portalUser.email || portalUser.userName || '',
		firstName: portalUser.firstName || '',
		lastName: portalUser.lastName || '',
		contactId: portalUser.contactId || '',
		userRoles: portalUser.userRoles || [],
	};
}

export function hasPortalUserCookie(cookie: string): boolean {
	return cookie.split(';').some((item) => item.trim().startsWith('__Portal-user'));
}

export async function resolvePortalUser(): Promise<PortalUser | null> {
	const globalUser = readPortalUserGlobal();
	if (globalUser) return globalUser;

	if (!hasPortalUserCookie(document.cookie)) return null;

	try {
		const response = await fetch('/_api/contacts?$select=contactid,firstname,lastname,emailaddress1&$top=1', {
			credentials: 'same-origin',
		});
		if (!response.ok) return null;

		const data = await response.json();
		const contact = data?.value?.[0];
		if (!contact?.contactid) return null;

		return {
			contactId: contact.contactid,
			userName: contact.emailaddress1 || '',
			firstName: contact.firstname || '',
			lastName: contact.lastname || '',
			userRoles: [],
		};
	} catch {
		return null;
	}
}
