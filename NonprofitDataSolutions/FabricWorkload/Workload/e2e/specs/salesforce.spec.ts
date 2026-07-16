import { test, expect } from '../fixtures';
import { DeploymentWizardPage, FabricShellPage, PipelinePage } from '../pages';

/**
 * Full E2E flow — Salesforce NPSP package.
 *
 * Creates a Fundraising item, selects the Salesforce optional package,
 * completes the additional configuration (connection selection), deploys,
 * and verifies success.
 */
test.describe('Full E2E Flow — Salesforce', () => {
	test('create item, configure Salesforce connection, deploy, and verify success', async ({
		workspacePage,
	}) => {
		test.setTimeout(360_000); // 6 minutes for wizard + deployment

		const shell = new FabricShellPage(workspacePage);
		const wizard = new DeploymentWizardPage(workspacePage);
		const itemName = `PW_SF_${Date.now()}`;
		const pipeline = new PipelinePage(workspacePage, `${itemName}_Fundraising_Orchestration`);

		// Create a new Fundraising item (auto-starts wizard)
		await shell.createFundraisingItem(itemName);
		await wizard.waitForWizardReady();

		// Step 1 (Overview) → Step 2 (Configuration)
		await wizard.clickNext();
		await wizard.deploymentNameInput.waitFor({ state: 'visible', timeout: 15_000 });
		await wizard.waitForNextEnabled();

		// Select Salesforce package
		await wizard.salesforceCheckbox.click();
		await expect(wizard.salesforceCheckbox).toBeChecked();

		// Step 2 (Configuration) → Step 3 (Additional Configuration)
		await wizard.clickNext();
		await wizard.additionalConfigHeading.waitFor({ state: 'visible', timeout: 15_000 });

		// Verify Salesforce integration section is shown
		await expect(wizard.salesforceIntegrationHeading).toBeVisible();
		await expect(wizard.connectionDropdown).toBeVisible();

		// Select the Salesforce connection (first/only option)
		await wizard.selectConnection();

		// Step 3 (Additional Configuration) → Step 4 (Review)
		await wizard.clickNext();
		await wizard.configuredItemsHeading.waitFor({ state: 'visible', timeout: 15_000 });

		// Verify review shows correct step count (6 steps with additional config)
		await expect(wizard.stepStatus).toContainText('of 6');
		await expect(wizard.reviewTable).toBeVisible();

		// Step 4 (Review) → Step 5 (Deploy) → wait for finish
		await wizard.clickDeploy();
		await wizard.waitForDeploymentOutcome(300_000);
		await expect(wizard.successDescription).toBeVisible();
		await expect(wizard.deployedItemsButton).toBeVisible();

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
