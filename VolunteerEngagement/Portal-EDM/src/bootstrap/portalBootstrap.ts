import type ExtendedWindow from '@/ExtendedWindow';

function getDataAttribute(element: Element, attributeName: string): string {
	return element.getAttribute(attributeName) ?? '';
}

function readUserRoles(bootstrapElement: HTMLElement): string[] {
	return Array.from(bootstrapElement.querySelectorAll('[data-ve-user-role]'))
		.map((roleElement) => getDataAttribute(roleElement, 'data-ve-user-role'))
		.filter((roleName) => roleName !== '');
}

export function initializePortalBootstrap(): void {
	const extWindow = window as unknown as ExtendedWindow;
	const microsoft = (extWindow.Microsoft = extWindow.Microsoft ?? {});
	const dynamic365 = (microsoft.Dynamic365 = microsoft.Dynamic365 ?? {});
	const portal = (dynamic365.Portal = dynamic365.Portal ?? {});
	const bootstrapElement = document.getElementById('ve-bootstrap-data');
	const strings = Object.create(null) as Record<string, string>;

	if (!bootstrapElement) {
		extWindow.__VE_LOCALE = 'en-US';
		extWindow.__VE_LANGUAGES = [];
		extWindow.__VE_STRINGS = strings;
		return;
	}

	const userElement = bootstrapElement.querySelector('[data-ve-user]');
	if (userElement) {
		portal.User = {
			contactId: getDataAttribute(userElement, 'data-contact-id'),
			userName: getDataAttribute(userElement, 'data-user-name'),
			firstName: getDataAttribute(userElement, 'data-first-name'),
			lastName: getDataAttribute(userElement, 'data-last-name'),
			email: getDataAttribute(userElement, 'data-email'),
			userRoles: readUserRoles(bootstrapElement),
		};
	} else {
		delete (portal as { User?: unknown }).User;
	}

	extWindow.__VE_LOCALE = bootstrapElement.getAttribute('data-locale') || 'en-US';
	extWindow.__VE_LANGUAGES = Array.from(bootstrapElement.querySelectorAll('[data-ve-language]')).map(
		(languageElement) => ({
			code: getDataAttribute(languageElement, 'data-code'),
			name: getDataAttribute(languageElement, 'data-name'),
			url: getDataAttribute(languageElement, 'data-url'),
		}),
	);

	bootstrapElement.querySelectorAll('[data-ve-string]').forEach((stringElement) => {
		const key = stringElement.getAttribute('data-key');
		if (key) {
			strings[key] = stringElement.textContent ?? '';
		}
	});

	extWindow.__VE_STRINGS = strings;
}
