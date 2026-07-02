/**
 * E2E test fixtures — shared helpers and environment config.
 *
 * Focused on the Fundraising package installer — NOT Fabric native UI.
 * All fixtures avoid `networkidle` since Fabric is a heavy SPA that
 * never truly stops making requests.
 */
import { test as base, expect, type Page } from '@playwright/test';

export interface E2EConfig {
	fabricBaseURL: string;
	workspaceId: string;
}

function getConfig(): E2EConfig {
	const workspaceId = process.env.E2E_WORKSPACE_ID;

	if (!workspaceId) {
		throw new Error(
			'E2E_WORKSPACE_ID must be set in .env.e2e. ' +
				'Copy .env.e2e.template to .env.e2e and fill in your values.',
		);
	}

	return {
		fabricBaseURL: process.env.FABRIC_BASE_URL || 'https://app.fabric.microsoft.com',
		workspaceId,
	};
}

type E2EFixtures = {
	e2eConfig: E2EConfig;
	workspacePage: Page;
};

export const test = base.extend<E2EFixtures>({
	e2eConfig: async ({}, use) => {
		await use(getConfig());
	},

	/**
	 * Navigate to the workspace page in Fabric.
	 * Waits for the New Item button to be visible (concrete element)
	 * instead of `networkidle` which never resolves in Fabric.
	 */
	workspacePage: async ({ page, e2eConfig }, use) => {
		// Inject allLakehouses=true into every frame (including the workload iframe)
		// so the wizard loads lakehouses from all accessible workspaces, not just the current one.
        await page.addInitScript(() => {
            if (!window.location.search.includes('allLakehouses')) {
                try {
                    const url = new URL(window.location.href);
                    if (url.protocol === 'http:' || url.protocol === 'https:') {
                        url.searchParams.set('allLakehouses', 'true');
                        window.history.replaceState({}, '', url.toString());
                    }
                } catch (error) {
                    console.error('Failed to update URL with allLakehouses parameter:', error);
                }
            }
        });

		const wsURL = `${e2eConfig.fabricBaseURL}/groups/${e2eConfig.workspaceId}?experience=fabric-developer`;
		await page.goto(wsURL);
		await page.waitForLoadState('domcontentloaded');
		await page.waitForTimeout(5_000);

		const actualUrl = page.url();
		const redirectedAway = !actualUrl.includes(`/groups/${e2eConfig.workspaceId}`);
		const accessDenied = await page
			.getByText(/Sorry you don't have access to this group/i)
			.isVisible()
			.catch(() => false);

		if (redirectedAway || accessDenied) {
			throw new Error(
				[
					`Target workspace is not accessible: ${e2eConfig.workspaceId}`,
					`Expected URL to contain /groups/${e2eConfig.workspaceId}`,
					`Actual URL: ${actualUrl}`,
					accessDenied ? 'Fabric displayed an access denied message for this group.' : undefined,
				]
					.filter(Boolean)
					.join('\n'),
			);
		}

		// Wait for Fabric workspace to be interactive — the "+New item" button is our signal
		await page.getByTestId('plus-new-btn').waitFor({ state: 'visible', timeout: 60_000 });

		await use(page);
	},
});

export { expect };
