// Type declaration for Power Pages window globals
// Only populated when running on Power Pages (not in local dev).
// Guard access with optional chaining.

export default interface ExtendedWindow extends Window {
	shell?: {
		getTokenDeferred: () => Promise<string>;
	};
	Microsoft?: {
		Dynamic365?: {
			Portal?: {
				User?: {
					userName?: string;
					email?: string;
					firstName?: string;
					lastName?: string;
					contactId?: string;
					userRoles?: string[];
				};
				tenant?: string;
			};
		};
	};
	/** Localized UI strings injected by the MSVE_Home web template from Content Snippets. */
	__VE_STRINGS?: Record<string, string>;
	/** Active locale code (e.g. "en-US", "fr-FR") set by the web template. */
	__VE_LOCALE?: string;
	/** Available website languages injected by the web template. */
	__VE_LANGUAGES?: Array<{ code: string; name: string; url: string }>;
}
