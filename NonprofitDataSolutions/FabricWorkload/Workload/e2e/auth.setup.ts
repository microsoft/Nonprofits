import { test as setup, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const AUTH_DIR = path.resolve(__dirname, 'auth');
const STORAGE_STATE_PATH = path.join(AUTH_DIR, 'storage-state.json');

/**
 * Authentication setup — runs once before all tests.
 *
 * Supports three modes:
 * - Interactive (local dev): opens browser, you log in manually
 * - Certificate (CI): enters email, Entra ID redirects to cert auth,
 *   Playwright presents the client certificate configured in playwright.config.ts
 * - Credential-based (CI fallback): uses E2E_USERNAME/E2E_PASSWORD
 */
setup('authenticate to Microsoft Fabric', async ({ page }) => {
	setup.setTimeout(360_000); // 6 min for auth flow
	const baseURL = process.env.FABRIC_BASE_URL || 'https://app.fabric.microsoft.com';
	const authMethod = process.env.E2E_AUTH_METHOD || 'interactive';

	await page.goto(baseURL, { waitUntil: 'domcontentloaded' });

	if (authMethod === 'interactive') {
		// Interactive: pause for manual login, then save state
		// eslint-disable-next-line no-console
		console.log('\n🔐 Please log in to Microsoft Fabric in the browser window...\n');

		// Wait for the Fabric home page to load after login
		await page.waitForURL('**/home**', { timeout: 300_000 }); // 5 min for manual login
	} else if (authMethod === 'certificate') {
		// Certificate-based: enter email, Entra ID redirects to cert auth.
		// The client certificate is provided via clientCertificates in playwright.config.ts.
		const username = process.env.E2E_USERNAME;
		if (!username) {
			throw new Error('E2E_USERNAME must be set for certificate auth');
		}

		// Enter email address
		await page.getByRole('textbox', { name: 'Enter email' }).waitFor({ timeout: 30_000 });
		await page.getByRole('textbox', { name: 'Enter email' }).fill(username);
		await page.getByRole('button', { name: 'Submit' }).click();

		// After entering email, Entra ID may:
		// 1. Redirect to /certauth/ for certificate selection
		// 2. Show a "Use a certificate or smart card" link on the password page
		// 3. Complete cert auth automatically and show "Stay signed in?" prompt
		// 4. Complete cert auth automatically and land on /home
		const certLink = page.getByRole('link', { name: 'Use a certificate or smart card' });
		const staySignedIn = page.getByRole('button', { name: 'Yes' });

		const certRedirect = page.waitForURL('**/certauth/**', { timeout: 30_000 })
			.then(() => 'cert-redirect' as const).catch(() => null);
		const certLinkVisible = certLink.waitFor({ state: 'visible', timeout: 30_000 })
			.then(() => 'cert-link' as const).catch(() => null);
		const staySignedInVisible = staySignedIn.waitFor({ state: 'visible', timeout: 30_000 })
			.then(() => 'stay-signed-in' as const).catch(() => null);
		const homeReachedEarly = page.waitForURL('**/home**', { timeout: 30_000 })
			.then(() => 'home' as const).catch(() => null);

		const firstResult = await Promise.race([certRedirect, certLinkVisible, staySignedInVisible, homeReachedEarly]);

		if (firstResult === null) {
			throw new Error('Neither certificate redirect, cert link, "Stay signed in?" prompt, nor home page appeared within the expected time frame.');
		}

		if (firstResult === 'cert-link') {
			await Promise.all([
				page.waitForURL('**/certauth/**', { timeout: 15_000 }).catch(() => null),
				certLink.click().catch(() => {})
			]);
		}

		// If cert auth is still in progress, wait for it to complete
		if (firstResult === 'cert-redirect' || firstResult === 'cert-link') {
			const homeReached = page.waitForURL('**/home**', { timeout: 120_000 })
				.then(() => 'home' as const);
			const promptAppeared = staySignedIn.waitFor({ state: 'visible', timeout: 120_000 })
				.then(() => 'stay-signed-in' as const);

			const postCert = await Promise.race([homeReached, promptAppeared]);

			if (postCert === 'stay-signed-in') {
				await staySignedIn.click();
				await page.waitForURL('**/home**', { timeout: 60_000 });
			}
		} else if (firstResult === 'stay-signed-in') {
			// Cert auth completed instantly, just dismiss the prompt
			await staySignedIn.click();
			await page.waitForURL('**/home**', { timeout: 60_000 });
		}
		// If firstResult === 'home', we're already there
	} else {
		// Credential-based: fill in username + password
		const username = process.env.E2E_USERNAME;
		const password = process.env.E2E_PASSWORD;

		if (!username || !password) {
			throw new Error('E2E_USERNAME and E2E_PASSWORD must be set for credential auth');
		}

		// Microsoft Entra ID login flow
		await page.getByRole('textbox', { name: 'Enter email' }).waitFor({ timeout: 30_000 });
		await page.getByRole('textbox', { name: 'Enter email' }).fill(username);
		await page.getByRole('button', { name: 'Submit' }).click();

		await page.waitForSelector('input[type="password"]', { timeout: 30_000 });
		await page.fill('input[type="password"]', password);

		// Password submit varies by tenant and may immediately transition to MFA.
		// Try common submit buttons, then fall back to Enter if no button is exposed.
		const passwordSubmitCandidates = [
			page.getByRole('button', { name: /^submit$/i }),
			page.getByRole('button', { name: /^sign in$/i }),
			page.locator('input[type="submit"], button[type="submit"]').first(),
		];

		let passwordSubmitted = false;
		for (const candidate of passwordSubmitCandidates) {
			const visible = await candidate.isVisible().catch(() => false);
			if (!visible) {
				continue;
			}

			await candidate.click().catch(() => {});
			passwordSubmitted = true;
			break;
		}

		if (!passwordSubmitted) {
			await page.keyboard.press('Enter').catch(() => {});
		}

		const staySignedIn = page.getByRole('button', { name: 'Yes' });
		const mfaPrompt = page.getByText(/Approve sign in request/i);
		const homeReached = page.waitForURL('**/home**', { timeout: 120_000 }).then(() => 'home' as const);
		const staySignedInPrompt = staySignedIn
			.waitFor({ state: 'visible', timeout: 120_000 })
			.then(() => 'stay-signed-in' as const);
		const mfaPromptVisible = mfaPrompt
			.waitFor({ state: 'visible', timeout: 120_000 })
			.then(() => 'mfa' as const);

		const firstStep = await Promise.race([homeReached, staySignedInPrompt, mfaPromptVisible]);

		if (firstStep === 'mfa') {
			// eslint-disable-next-line no-console
			console.log('\n🔐 MFA approval is required. Approve the sign-in request in Microsoft Authenticator.\n');

			const secondStep = await Promise.race([
				page.waitForURL('**/home**', { timeout: 180_000 }).then(() => 'home' as const),
				staySignedIn.waitFor({ state: 'visible', timeout: 180_000 }).then(() => 'stay-signed-in' as const),
			]);

			if (secondStep === 'stay-signed-in') {
				await staySignedIn.click();
				await page.waitForURL('**/home**', { timeout: 60_000 });
			}
		} else if (firstStep === 'stay-signed-in') {
			await staySignedIn.click();
			await page.waitForURL('**/home**', { timeout: 60_000 });
		}
	}

	// Verify we're on the Fabric home page
	await expect(page).toHaveURL(/fabric\.microsoft\.com/);

	// Ensure auth directory exists, then save authentication state
	fs.mkdirSync(AUTH_DIR, { recursive: true });
	await page.context().storageState({ path: STORAGE_STATE_PATH });
});
