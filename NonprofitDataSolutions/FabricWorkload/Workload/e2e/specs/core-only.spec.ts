import { test, expect } from '../fixtures';
import { DeploymentWizardPage, FabricShellPage, PipelinePage } from '../pages';

/**
 * Full E2E flow — Core package only (no optional packages).
 *
 * Creates a Fundraising item, skips optional packages, deploys the
 * required Fundraising Core, and verifies success.
 */
test.describe('Full E2E Flow — Core Only', () => {
	test('create item, deploy core only, and verify success', async ({ workspacePage }) => {
		test.setTimeout(360_000); // 6 minutes for wizard + deployment

		const shell = new FabricShellPage(workspacePage);
		const wizard = new DeploymentWizardPage(workspacePage);
		const itemName = `PW_Core_${Date.now()}`;
		const pipeline = new PipelinePage(workspacePage, `${itemName}_Fundraising_Orchestration`);

		// Create a new Fundraising item (auto-starts wizard)
		await shell.createFundraisingItem(itemName);
		await wizard.waitForWizardReady();

		// Step 1 (Overview) → Step 2 (Configuration)
		await wizard.clickNext();
		await wizard.deploymentNameInput.waitFor({ state: 'visible', timeout: 15_000 });
		await wizard.waitForNextEnabled();

		// No optional packages — just go to Review
		// Step 2 (Configuration) → Step 3 (Review)
		await wizard.clickNext();
		await wizard.configuredItemsHeading.waitFor({ state: 'visible', timeout: 15_000 });

		await expect(wizard.stepStatus).toContainText('Step 3 of 5');
		await expect(wizard.reviewTable).toBeVisible();

		// Step 3 (Review) → Step 4 (Deploy) → wait for finish
		await wizard.clickDeploy();
		await wizard.waitForDeploymentOutcome(300_000);
		await expect(wizard.successDescription).toBeVisible();

		// Close the wizard
		await wizard.clickClose();
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
