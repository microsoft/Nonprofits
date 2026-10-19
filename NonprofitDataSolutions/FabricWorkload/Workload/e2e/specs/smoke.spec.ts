import { test, expect } from '../fixtures';
import { FabricShellPage, DeploymentWizardPage } from '../pages';

/**
 * Smoke Tests — verify the minimal prerequisites for installer testing:
 * 1. Workspace is reachable
 * 2. A Fundraising item can be created
 * 3. The deployment wizard opens automatically
 */
test.describe('Installer Smoke Tests', () => {
	test('should reach the workspace and see New Item button', async ({ workspacePage }) => {
		await expect(workspacePage.getByTestId('plus-new-btn')).toBeVisible();
	});

	test('should create a Fundraising item and open the wizard', async ({ workspacePage }) => {
		const shell = new FabricShellPage(workspacePage);
		const itemName = `E2E_Smoke_${Date.now()}`;
		await shell.createFundraisingItem(itemName);

		// Wizard dialog iframe should appear
		await expect(
			workspacePage.locator('[data-testid="iframe-dialog-Microsoft.NonprofitData"]'),
		).toBeVisible();

		// Wizard should load and show Step 1
		const wizard = new DeploymentWizardPage(workspacePage);
		await wizard.waitForWizardReady();
		await expect(wizard.stepStatus).toContainText('Step 1 of 5');
	});
});
