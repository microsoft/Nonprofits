import { test, expect } from '../fixtures';
import { DeploymentWizardPage, FabricShellPage, type OptionalPackage } from '../pages';

/**
 * Fundraising Package Installer E2E Tests
 *
 * Tests the deployment wizard that installs Fabric items (lakehouses,
 * notebooks, pipelines, semantic model, Power BI report) in a medallion
 * architecture. Validates all package combination variations:
 *
 *   - Core only (required, always included)
 *   - Core + Sample Data
 *   - Core + Dynamics 365
 *   - Core + Salesforce
 *   - Core + all optional packages
 */

test.describe('Fundraising Package Installer', () => {
	let shell: FabricShellPage;
	let wizard: DeploymentWizardPage;

	test.beforeEach(async ({ workspacePage }) => {
		shell = new FabricShellPage(workspacePage);
		wizard = new DeploymentWizardPage(workspacePage);
	});

	// Helper: create item and wait for wizard to be ready
	async function openInstaller(itemName: string): Promise<void> {
		await shell.createFundraisingItem(itemName);
		await wizard.waitForWizardReady();
	}

	// ═══════════════════════════════════════════════════════════
	// Installer Overview (Step 1)
	// ═══════════════════════════════════════════════════════════
	test.describe('Installer Overview', () => {
		test.beforeEach(async () => {
			await openInstaller(`E2E_Overview_${Date.now()}`);
		});

		test('should show Step 1 of 5 with solution details', async () => {
			await expect(wizard.stepStatus).toContainText('Step 1 of 5');
			await expect(wizard.overviewHeading).toBeVisible();
		});

		test('should list what the solution includes', async () => {
			await expect(wizard.solutionIncludesHeading).toBeVisible();
			const items = wizard.solutionIncludesList.locator('li');
			await expect(items).toHaveCount(4);
		});

		test('should list deployment items and prerequisites', async () => {
			await expect(wizard.deploymentIncludesHeading).toBeVisible();
			await expect(wizard.prerequisitesHeading).toBeVisible();
			await expect(wizard.estimatedTimeText).toBeVisible();
		});
	});

	// ═══════════════════════════════════════════════════════════
	// Package Configuration (Step 2)
	// ═══════════════════════════════════════════════════════════
	test.describe('Package Configuration', () => {
		test.beforeEach(async () => {
			await openInstaller(`E2E_Config_${Date.now()}`);
			await wizard.clickNext();
			await wizard.deploymentNameInput.waitFor({ state: 'visible', timeout: 15_000 });
		});

		test('should show required Fundraising core package as always included', async () => {
			await expect(wizard.fundraisingCoreCheckbox).toBeChecked();
			await expect(wizard.fundraisingCoreCheckbox).toBeDisabled();
		});

		test('should show 3 optional packages unchecked by default', async () => {
			await expect(wizard.dynamics365Checkbox).not.toBeChecked();
			await expect(wizard.salesforceCheckbox).not.toBeChecked();
			await expect(wizard.sampleDataCheckbox).not.toBeChecked();
		});

		test('should allow toggling optional packages on and off', async () => {
			await wizard.sampleDataCheckbox.click();
			await expect(wizard.sampleDataCheckbox).toBeChecked();

			await wizard.sampleDataCheckbox.click();
			await expect(wizard.sampleDataCheckbox).not.toBeChecked();
		});

		test('should allow selecting all optional packages', async () => {
			await wizard.dynamics365Checkbox.click();
			await wizard.salesforceCheckbox.click();
			await wizard.sampleDataCheckbox.click();
			await expect(wizard.dynamics365Checkbox).toBeChecked();
			await expect(wizard.salesforceCheckbox).toBeChecked();
			await expect(wizard.sampleDataCheckbox).toBeChecked();
		});

		test('should allow editing deployment name', async () => {
			const customName = `Custom_${Date.now()}`;
			await wizard.fillDeploymentName(customName);
			await expect(wizard.deploymentNameInput).toHaveValue(customName);
		});

		test('should show warning about optional packages', async () => {
			await expect(wizard.optionalPackagesWarning).toBeVisible();
		});
	});

	// ═══════════════════════════════════════════════════════════
	// Review — Package Variations (Step 3)
	// ═══════════════════════════════════════════════════════════
	test.describe('Review — Core Only', () => {
		test('should show items table on review step', async () => {
			const name = `E2E_ReviewCore_${Date.now()}`;
			await openInstaller(name);
			await wizard.walkToReview(name);

			await expect(wizard.stepStatus).toContainText('Step 3 of 5');
			await expect(wizard.configuredItemsHeading).toBeVisible();
			await expect(wizard.reviewTable).toBeVisible();
		});
	});

	test.describe('Review — Core + Sample Data', () => {
		test('should show items table with sample data selected', async () => {
			const name = `E2E_ReviewSample_${Date.now()}`;
			await openInstaller(name);
			await wizard.walkToReview(name, ['sampleData']);

			await expect(wizard.reviewTable).toBeVisible();
		});
	});

	test.describe('Review — Core + Dynamics 365', () => {
		test('should show items table for D365 package', async () => {
			const name = `E2E_ReviewD365_${Date.now()}`;
			await openInstaller(name);
			await wizard.walkToReview(name, ['dynamics365']);

			// 6 steps when additional config is included
			await expect(wizard.stepStatus).toContainText('of 6');
			await expect(wizard.reviewTable).toBeVisible();
		});
	});

	test.describe('Review — Core + Salesforce', () => {
		test('should show items table for Salesforce package', async () => {
			const name = `E2E_ReviewSF_${Date.now()}`;
			await openInstaller(name);
			await wizard.walkToReview(name, ['salesforce']);

			// 6 steps when additional config is included
			await expect(wizard.stepStatus).toContainText('of 6');
			await expect(wizard.reviewTable).toBeVisible();
		});
	});

	test.describe('Review — All Packages', () => {
		test('should show items table with all packages selected', async () => {
			const name = `E2E_ReviewAll_${Date.now()}`;
			await openInstaller(name);
			await wizard.walkToReview(name, ['dynamics365', 'salesforce', 'sampleData']);

			// 6 steps when additional config is included
			await expect(wizard.stepStatus).toContainText('of 6');
			await expect(wizard.reviewTable).toBeVisible();
		});
	});

	// ═══════════════════════════════════════════════════════════
	// Full Deployment — Package Installation Variations
	// ═══════════════════════════════════════════════════════════
	test.describe('Full Deployment — Core + Sample Data', () => {
		test('should deploy successfully and show finish step', async () => {
			test.setTimeout(360_000); // 6 min for deployment
			const name = `E2E_DeploySample_${Date.now()}`;
			await openInstaller(name);
			await wizard.walkToReview(name, ['sampleData']);

			await wizard.clickDeploy();
			await expect(wizard.stepStatus).toContainText('Step 4 of 5', { timeout: 10_000 });
			// Fluent UI ProgressBar has aria-hidden="true" — use toBeAttached instead of toBeVisible
			await expect(wizard.progressBar).toBeAttached();

			// Wait for finish
			await wizard.successHeading.waitFor({ state: 'visible', timeout: 300_000 });
			await expect(wizard.stepStatus).toContainText('Step 5 of 5');
		});

		test('should show next steps and documentation after deploy', async () => {
			test.setTimeout(360_000);
			const name = `E2E_FinishSample_${Date.now()}`;
			await openInstaller(name);
			await wizard.runFullDeployment(name, ['sampleData']);

			await expect(wizard.successHeading).toBeVisible();
			await expect(wizard.successDescription).toBeVisible();
			await expect(wizard.nextStepsHeading).toBeVisible();
			await expect(wizard.runPipelineCard).toBeVisible();
			await expect(wizard.deployedItemsButton).toBeVisible();
		});

		test('should close wizard after successful deploy', async () => {
			test.setTimeout(360_000);
			const name = `E2E_CloseSample_${Date.now()}`;
			await openInstaller(name);
			await wizard.runFullDeployment(name, ['sampleData']);

			await wizard.clickClose();
			await wizard.page
				.locator('[data-testid="iframe-dialog-Microsoft.NonprofitData"]')
				.waitFor({ state: 'hidden', timeout: 10_000 });
		});
	});

	test.describe('Full Deployment — Core Only', () => {
		test('should deploy core-only package successfully', async () => {
			test.setTimeout(360_000);
			const name = `E2E_DeployCore_${Date.now()}`;
			await openInstaller(name);
			await wizard.runFullDeployment(name); // no optional packages

			await expect(wizard.successHeading).toBeVisible();
			await expect(wizard.successDescription).toBeVisible();
		});
	});

	test.describe('Full Deployment — All Packages', () => {
		test('should deploy all packages successfully', async () => {
			test.setTimeout(360_000);
			const name = `E2E_DeployAll_${Date.now()}`;
			await openInstaller(name);
			await wizard.runFullDeployment(name, ['dynamics365', 'salesforce', 'sampleData']);

			await expect(wizard.successHeading).toBeVisible();
			await expect(wizard.successDescription).toBeVisible();
			await expect(wizard.deployedItemsButton).toBeVisible();
		});
	});

	// ═══════════════════════════════════════════════════════════
	// Wizard Navigation (installer UX)
	// ═══════════════════════════════════════════════════════════
	test.describe('Wizard Navigation', () => {
		test('should navigate forward and backward through steps', async () => {
			await openInstaller(`E2E_Nav_${Date.now()}`);

			await wizard.clickNext();
			await expect(wizard.stepStatus).toContainText('Step 2 of 5');

			await wizard.clickPrevious();
			await expect(wizard.stepStatus).toContainText('Step 1 of 5');

			await wizard.clickNext();
			await wizard.clickNext();
			await expect(wizard.stepStatus).toContainText('Step 3 of 5');

			await wizard.clickPrevious();
			await expect(wizard.stepStatus).toContainText('Step 2 of 5');
		});

		test('should close wizard via close button', async () => {
			await openInstaller(`E2E_Close_${Date.now()}`);
			await wizard.closeWizardButton.click();

			await wizard.page
				.locator('[data-testid="iframe-dialog-Microsoft.NonprofitData"]')
				.waitFor({ state: 'hidden', timeout: 10_000 });
		});
	});
});
