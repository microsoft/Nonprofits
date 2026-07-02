import { test, expect } from '../fixtures';
import { DeploymentWizardPage, FabricShellPage, PipelinePage } from '../pages';

/**
 * Full end-to-end recorded flow — creates a Fundraising item, selects
 * Sample Data, deploys, and verifies success.
 *
 * Based on a Playwright codegen recording, refactored to use Page Objects.
 */
test.describe('Full E2E Flow — Sample Data', () => {
	test('create item, deploy with sample data, and verify success', async ({ workspacePage }) => {
		test.setTimeout(360_000); // 6 minutes for wizard + deployment

		const shell = new FabricShellPage(workspacePage);
		const wizard = new DeploymentWizardPage(workspacePage);
		const itemName = `PW_E2E_${Date.now()}`;
		const pipeline = new PipelinePage(workspacePage, `${itemName}_Fundraising_Orchestration`);

		// Create a new Fundraising item (auto-starts wizard)
		await shell.createFundraisingItem(itemName);
		await wizard.waitForWizardReady();

		// Step 1 (Overview) → Step 2 (Configuration)
		await wizard.clickNext();
		await wizard.deploymentNameInput.waitFor({ state: 'visible', timeout: 15_000 });
		await wizard.waitForNextEnabled();

		// Select Sample Data package
		await wizard.sampleDataCheckbox.click();
		await expect(wizard.sampleDataCheckbox).toBeChecked();

		// Step 2 (Configuration) → Step 3 (Review)
		await wizard.clickNext();
		await wizard.configuredItemsHeading.waitFor({ state: 'visible', timeout: 15_000 });

		// Step 3 (Review) → Step 4 (Deploy)
		await wizard.clickDeploy();
		await expect(wizard.stepStatus).toContainText('Step 4 of 5', { timeout: 10_000 });

		// Wait for deployment to complete → Step 5 (Finish)
		await wizard.waitForDeploymentOutcome(300_000);
		await expect(wizard.successDescription).toBeVisible();

		// Close the wizard
		await wizard.clickClose();

		// Verify wizard dialog is closed
		await workspacePage
			.locator('[data-testid="iframe-dialog-Microsoft.NonprofitData"]')
			.waitFor({ state: 'hidden', timeout: 10_000 });

		// Open and run the orchestration pipeline
		await wizard.openPipeline();
		await pipeline.run();

		// Wait for pipeline completion only in CI (ADO pipeline)
		if (process.env.CI) {
			test.setTimeout(7_800_000);
			const status = await pipeline.waitForCompletion();
			expect(status).toBe('Succeeded');
		}
	});
});