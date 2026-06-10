import { beforeEach, describe, expect, it } from 'vitest';

import { initializePortalBootstrap } from '../portalBootstrap';

type BootstrapWindow = Window & {
	Microsoft?: {
		Dynamic365?: {
			Portal?: {
				User?: unknown;
			};
		};
	};
	__VE_LOCALE?: string;
	__VE_LANGUAGES?: unknown[];
	__VE_STRINGS?: Record<string, string>;
};

function getBootstrapWindow(): BootstrapWindow {
	return window as BootstrapWindow;
}

describe('initializePortalBootstrap', () => {
	beforeEach(() => {
		const bootstrapWindow = getBootstrapWindow();
		delete bootstrapWindow.Microsoft;
		delete bootstrapWindow.__VE_LOCALE;
		delete bootstrapWindow.__VE_LANGUAGES;
		delete bootstrapWindow.__VE_STRINGS;
	});

	it('sets local development defaults when bootstrap data is absent', () => {
		initializePortalBootstrap();

		const bootstrapWindow = getBootstrapWindow();
		expect(bootstrapWindow.__VE_LOCALE).toBe('en-US');
		expect(bootstrapWindow.__VE_LANGUAGES).toEqual([]);
		expect(bootstrapWindow.__VE_STRINGS).toEqual({});
	});

	it('reads user, language, and string data from the portal bootstrap element', () => {
		document.body.innerHTML = `
			<div id="ve-bootstrap-data" data-locale="fr-FR">
				<div
					data-ve-user
					data-contact-id="contact-1"
					data-user-name="volunteer@example.test"
					data-first-name="Test"
					data-last-name="User"
					data-email="volunteer@example.test"
				></div>
				<span data-ve-user-role="Volunteer"></span>
				<span data-ve-user-role="Administrators"></span>
				<a data-ve-language data-code="en-US" data-name="English" data-url="/en-US/"></a>
				<a data-ve-language data-code="fr-FR" data-name="French" data-url="/fr-FR/"></a>
				<span data-ve-string data-key="MSVE_SPA/Home/Title">Bienvenue</span>
			</div>
		`;

		initializePortalBootstrap();

		const bootstrapWindow = getBootstrapWindow();
		expect(bootstrapWindow.Microsoft?.Dynamic365?.Portal?.User).toEqual({
			contactId: 'contact-1',
			userName: 'volunteer@example.test',
			firstName: 'Test',
			lastName: 'User',
			email: 'volunteer@example.test',
			userRoles: ['Volunteer', 'Administrators'],
		});
		expect(bootstrapWindow.__VE_LOCALE).toBe('fr-FR');
		expect(bootstrapWindow.__VE_LANGUAGES).toEqual([
			{ code: 'en-US', name: 'English', url: '/en-US/' },
			{ code: 'fr-FR', name: 'French', url: '/fr-FR/' },
		]);
		expect(bootstrapWindow.__VE_STRINGS).toEqual({
			'MSVE_SPA/Home/Title': 'Bienvenue',
		});
	});
});
