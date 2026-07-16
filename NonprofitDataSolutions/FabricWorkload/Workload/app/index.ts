import { fabricLightTheme, setTheme } from '@fabric-msft/theme';

import { bootstrap } from '@ms-fabric/workload-client';

// Initialize the Fabric UX System theme so the fabric web components (e.g. the
// deployment Wizard stepper) render with the correct styling.
setTheme(fabricLightTheme);

function printFormattedAADErrorMessage(hashMessage: string): void {
	const hashString = hashMessage.slice(1);

	// Decode URL encoding and parse key-value pairs
	const searchParams = new URLSearchParams(hashString);
	const formattedMessage: Record<string, string> = {};

	searchParams.forEach((value, key) => {
		formattedMessage[key] = decodeURIComponent(value);
	});

	// Print formatted message
	document.documentElement.innerHTML =
		'There was a problem with the consent, open browser debug console for more details';
	for (const key in formattedMessage) {
		if (Object.prototype.hasOwnProperty.call(formattedMessage, key)) {
			console.warn(`${key}: ${formattedMessage[key]}`);
		}
	}
}

/** This is used for authentication API as a redirect URI.
 * Delete this code if you do not plan on using authentication API.
 * You can change the redirectUriPath to whatever suits you.
 */
const redirectUriPath = '/close';
const url = new URL(window.location.href);
if (url.pathname?.startsWith(redirectUriPath)) {
	// Handle errors, Please refer to https://learn.microsoft.com/en-us/entra/identity-platform/reference-error-codes
	if (url?.hash?.includes('error')) {
		// Handle missing service principal error
		if (url.hash.includes('AADSTS650052')) {
			printFormattedAADErrorMessage(url?.hash);
			// handle user declined the consent error
		} else if (url.hash.includes('AADSTS65004')) {
			printFormattedAADErrorMessage(url?.hash);
		} else {
			window.close();
		}
	} else {
		// close the window in case there are no errors
		window.close();
	}
}

try {
	bootstrap({
		initializeWorker: (params) => {
			return import('./index.worker').then(({ initialize }) => {
				return initialize(params);
			});
		},
		initializeUI: (params) => {
			return import('./index.ui').then(
				({ initialize }) => {
					return initialize(params);
				},
				(error) => {
					console.error(`Import index.ui failed: ${error}`);
					throw error;
				},
			);
		},
	});
} catch (error) {
	console.error(`Bootstrap failed: ${error}`);
}
