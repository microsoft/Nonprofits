import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment-specific .env file
dotenv.config({ path: path.resolve(__dirname, '.env.e2e') });

const storageStatePath = path.resolve(__dirname, 'e2e/auth/storage-state.json');
const reuseStoredAuth =
	!process.env.CI &&
	process.env.E2E_REUSE_STORAGE_STATE !== 'false' &&
	fs.existsSync(storageStatePath);

// Build clientCertificates config when certificate auth is enabled.
// Playwright will present this certificate when the server (Entra ID) requests TLS client auth.
const clientCertificates =
	process.env.E2E_AUTH_METHOD === 'certificate' && process.env.E2E_CERT_PFX_PATH
		? [
				{
					origin: 'https://login.microsoftonline.com',
					pfxPath: process.env.E2E_CERT_PFX_PATH,
					passphrase: process.env.E2E_CERT_PASSPHRASE || '',
				},
				{
					origin: 'https://certauth.login.microsoftonline.com',
					pfxPath: process.env.E2E_CERT_PFX_PATH,
					passphrase: process.env.E2E_CERT_PASSPHRASE || '',
				},
			]
		: undefined;

export default defineConfig({
	testDir: './e2e',
	outputDir: './e2e/test-results',
	globalTimeout: process.env.CI ? 300 * 60_000 : 0, // 5h in CI — exit gracefully before ADO job timeout (330 min)
	fullyParallel: false, // Serial execution — Fabric throttles parallel item creation in the same workspace
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: 1, // One worker — Fabric blocks concurrent item creation with upstream throttling
	reporter: process.env.CI
		? [['junit', { outputFile: './e2e/test-results/results.xml' }], ['html', { open: 'never' }]]
		: [['line'], ['html', { open: 'never' }]],
	timeout: 120_000, // 2 min per test — Fabric pages can be slow
	expect: { timeout: 15_000 },

	use: {
		baseURL: process.env.FABRIC_BASE_URL || 'https://app.fabric.microsoft.com',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
		video: 'on-first-retry',
		headless: !!process.env.CI,
		actionTimeout: 15_000,
		navigationTimeout: 60_000,
		clientCertificates,
	},

	projects: [
		{
			name: 'chromium',
			testMatch: /.*\.spec\.ts$/,
			use: {
				...devices['Desktop Chrome'],
				storageState: storageStatePath,
			},
			dependencies: reuseStoredAuth ? [] : ['auth-setup'],
		},
		{
			name: 'auth-setup',
			testMatch: /auth\.setup\.ts$/,
		},
	],
});
