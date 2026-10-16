import { useEffect, useState } from 'react';

import { clearTokenCache } from '@/services/apiClient';

import type { PortalUser } from '@/types';

import { readPortalUserGlobal, resolvePortalUser } from './useAuth.model';

interface AuthState {
	user: PortalUser | null;
	isAuthenticated: boolean;
	isAdmin: boolean;
	loading: boolean;
}

let cachedResolvedUser: PortalUser | null | undefined;
let resolveUserPromise: Promise<PortalUser | null> | null = null;
let lastAuthContactId: string | null | undefined;

// The anti-forgery token is bound to the auth session, so drop it whenever the resolved identity changes.
function setResolvedUser(user: PortalUser | null) {
	cachedResolvedUser = user;
	const contactId = user?.contactId ?? null;
	if (lastAuthContactId !== contactId) {
		lastAuthContactId = contactId;
		clearTokenCache();
	}
}

async function resolveUserOnce(): Promise<PortalUser | null> {
	if (cachedResolvedUser !== undefined) {
		return cachedResolvedUser;
	}

	if (resolveUserPromise) {
		return resolveUserPromise;
	}

	resolveUserPromise = resolvePortalUser().then((user) => {
		setResolvedUser(user);
		return user;
	});

	try {
		return await resolveUserPromise;
	} finally {
		resolveUserPromise = null;
	}
}

/**
 * Resolve the current authenticated portal user. Prefers the Liquid-injected
 * `window.Microsoft.Dynamic365.Portal.User` global, but falls back to querying
 * the Power Pages Web API. With a `Self`-scoped Contact entity permission,
 * `/_api/contacts` only returns the current user's record, so we can detect
 * the contact id from any page (including direct-loaded URLs and refreshes).
 */
export function useAuth(): AuthState {
	const [user, setUser] = useState<PortalUser | null>(() => {
		if (cachedResolvedUser !== undefined) {
			return cachedResolvedUser;
		}

		const globalUser = readPortalUserGlobal();
		if (globalUser) {
			setResolvedUser(globalUser);
		}
		return globalUser;
	});
	const [loading, setLoading] = useState<boolean>(() => cachedResolvedUser === undefined);

	useEffect(() => {
		let cancelled = false;

		async function resolve() {
			const current = await resolveUserOnce();

			if (!cancelled) {
				setUser(current);
				setLoading(false);
			}
		}

		resolve();
		return () => {
			cancelled = true;
		};
	}, []);

	return {
		user,
		isAuthenticated: user !== null,
		isAdmin: user?.userRoles?.includes('Administrators') ?? false,
		loading,
	};
}
