import { test, expect } from '../fixtures';
import { DeploymentWizardPage, FabricShellPage, PipelinePage } from '../pages';

/**
 * Full E2E flow — All 3 optional packages (D365 + Salesforce + Sample Data).
 *
 * Creates a Fundraising item, selects all optional packages, completes
 * additional configuration for D365 (lakehouse) and Salesforce (connection),
 * deploys everything, and verifies success.
 */
test.describe('Full E2E Flow — All Packages', () => {
	test('create item, configure all packages, deploy, and verify success', async ({
		workspacePage,
	}) => {
		test.setTimeout(480_000); // 8 minutes for wizard + deployment (more items)

		const shell = new FabricShellPage(workspacePage);
		const wizard = new DeploymentWizardPage(workspacePage);
		const itemName = `PW_All_${Date.now()}`;
		const pipeline = new PipelinePage(workspacePage, `${itemName}_Fundraising_Orchestration`);

		// Create a new Fundraising item (auto-starts wizard)
		await shell.createFundraisingItem(itemName);
		await wizard.waitForWizardReady();

		// Step 1 (Overview) → Step 2 (Configuration)
		await wizard.clickNext();
		await wizard.deploymentNameInput.waitFor({ state: 'visible', timeout: 15_000 });
		await wizard.waitForNextEnabled();

		// Select all optional packages
		await wizard.selectPackages(['dynamics365', 'salesforce', 'sampleData']);
		await expect(wizard.dynamics365Checkbox).toBeChecked();
		await expect(wizard.salesforceCheckbox).toBeChecked();
		await expect(wizard.sampleDataCheckbox).toBeChecked();

		// Step 2 (Configuration) → Step 3 (Additional Configuration)
		await wizard.clickNext();
		await wizard.additionalConfigHeading.waitFor({ state: 'visible', timeout: 15_000 });

		// Configure D365 lakehouse
		await expect(wizard.dynamicsIntegrationHeading).toBeVisible();
		await wizard.selectLakehouse(/dataverse/i);

		// Configure Salesforce connection
		await expect(wizard.salesforceIntegrationHeading).toBeVisible();
		await wizard.selectConnection();

		// Step 3 (Additional Configuration) → Step 4 (Review)
		await wizard.clickNext();
		await wizard.configuredItemsHeading.waitFor({ state: 'visible', timeout: 15_000 });

		// 6 steps when additional config is included
		await expect(wizard.stepStatus).toContainText('of 6');
		await expect(wizard.reviewTable).toBeVisible();

		// Step 4 (Review) → Step 5 (Deploy) → wait for finish
		await wizard.clickDeploy();
		await wizard.waitForDeploymentOutcome(360_000);
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
