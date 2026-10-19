import type { FrameLocator, Locator, Page } from '@playwright/test';

import { WorkloadBasePage } from './WorkloadBasePage';

/** Optional package identifiers matching the UI labels */
export type OptionalPackage = 'dynamics365' | 'salesforce' | 'sampleData';

/**
 * Page Object for the DeploymentWizard — the multi-step modal wizard.
 *
 * Steps: Overview (1) → Configuration (2) → Review (3) → Deploy (4) → Finish (5)
 *
 * All selectors target the wizard dialog iframe
 * (`[data-testid="iframe-dialog-Microsoft.NonprofitData"]`).
 *
 * Uses `[role="..."]` CSS attribute selectors because bare names like
 * `status`, `heading`, `checkbox` are HTML tag selectors — the actual
 * DOM uses ARIA roles on generic elements.
 */
export class DeploymentWizardPage extends WorkloadBasePage {
	constructor(page: Page) {
		super(page);
	}

	// ── Helpers ─────────────────────────────────────────────────
	private wz(selector: string): Locator {
		return this.wizardFrame.locator(selector);
	}

	private wzRole(): FrameLocator {
		return this.wizardFrame;
	}

	// ── Status / Step Indicator ─────────────────────────────────
	get stepStatus(): Locator {
		return this.wz('[role="status"]').first();
	}

	async getStepText(): Promise<string> {
		return (await this.stepStatus.textContent()) ?? '';
	}

	// ── Navigation Buttons ──────────────────────────────────────
	get nextButton(): Locator {
		return this.wzRole().getByRole('button', { name: 'Next' });
	}

	get previousButton(): Locator {
		return this.wzRole().getByRole('button', { name: 'Previous' });
	}

	get cancelButton(): Locator {
		return this.wzRole().getByRole('button', { name: 'Cancel' });
	}

	get deployButton(): Locator {
		return this.wzRole().getByRole('button', { name: 'Deploy', exact: true }).first();
	}

	get closeButton(): Locator {
		return this.wzRole().getByRole('button', { name: 'Close', exact: true }).first();
	}

	get closeWizardButton(): Locator {
		return this.wz('button[aria-label*="Close deployment wizard" i]').first();
	}

	// ═══════════════════════════════════════════════════════════
	// Step 1: Overview
	// ═══════════════════════════════════════════════════════════
	get overviewHeading(): Locator {
		return this.wzRole().getByRole('heading', { name: /fundraising/i });
	}

	get solutionIncludesHeading(): Locator {
		return this.wzRole().getByRole('heading', { name: /solution includes/i });
	}

	get solutionIncludesList(): Locator {
		return this.wz('[role="list"][aria-label="Solution includes"], ul[aria-label="Solution includes"]');
	}

	get deploymentIncludesHeading(): Locator {
		return this.wzRole().getByRole('heading', { name: /this deployment includes/i });
	}

	get deploymentIncludesList(): Locator {
		return this.wz('[role="list"][aria-label="Items included in this deployment"], ul[aria-label="Items included in this deployment"]');
	}

	get prerequisitesHeading(): Locator {
		return this.wzRole().getByRole('heading', { name: /prerequisites/i });
	}

	get prerequisitesList(): Locator {
		return this.wz('[role="list"][aria-label="System and access requirements"], ul[aria-label="System and access requirements"]');
	}

	get estimatedTimeText(): Locator {
		return this.wzRole().getByText(/estimated deployment time/i);
	}

	// ═══════════════════════════════════════════════════════════
	// Step 2: Configuration
	// ═══════════════════════════════════════════════════════════

	// ── Basic Configuration ─────────────────────────────────────
	get basicConfigHeading(): Locator {
		return this.wzRole().getByRole('heading', { name: /basic configuration/i });
	}

	get deploymentNameInput(): Locator {
		return this.wzRole().getByRole('textbox', { name: /deployment name/i });
	}

	get locationInput(): Locator {
		return this.wzRole().getByRole('textbox', { name: /location/i });
	}

	// ── Required Packages ───────────────────────────────────────
	get requiredPackagesHeading(): Locator {
		return this.wzRole().getByRole('heading', { name: /required packages/i });
	}

	get requiredPackagesStatus(): Locator {
		return this.wz('[role="status"]:has-text("Always included")');
	}

	get fundraisingCoreCheckbox(): Locator {
		return this.wzRole().getByRole('checkbox', { name: /fundraising core/i });
	}

	// ── Optional Packages ───────────────────────────────────────
	get optionalPackagesHeading(): Locator {
		return this.wzRole().getByRole('heading', { name: /optional packages/i });
	}

	get optionalPackagesStatus(): Locator {
		return this.wz('[role="status"][aria-label*="Optional packages status"]');
	}

	get optionalPackagesWarning(): Locator {
		return this.wzRole().getByText('Optional packages cannot be added after deployment');
	}

	get dynamics365Checkbox(): Locator {
		return this.wzRole().getByRole('checkbox', { name: /dynamics 365/i });
	}

	get salesforceCheckbox(): Locator {
		return this.wzRole().getByRole('checkbox', { name: /salesforce/i });
	}

	get sampleDataCheckbox(): Locator {
		return this.wzRole().getByRole('checkbox', { name: /sample data/i });
	}

	/** Get checkbox locator by package key */
	getPackageCheckbox(pkg: OptionalPackage): Locator {
		const map: Record<OptionalPackage, Locator> = {
			dynamics365: this.dynamics365Checkbox,
			salesforce: this.salesforceCheckbox,
			sampleData: this.sampleDataCheckbox,
		};
		return map[pkg];
	}

	// ═══════════════════════════════════════════════════════════
	// Step 2b: Additional Configuration (Data Source Integrations)
	// Shown only when Dynamics 365 or Salesforce is selected.
	// ═══════════════════════════════════════════════════════════
	get additionalConfigHeading(): Locator {
		return this.wzRole().getByRole('heading', { name: /data source integrations/i });
	}

	// ── Dynamics 365 Integration ────────────────────────────────
	get dynamicsIntegrationHeading(): Locator {
		return this.wzRole().getByRole('heading', { name: /dynamics 365 sales with/i });
	}

	get lakehouseDropdown(): Locator {
		return this.wzRole().getByRole('combobox', { name: /lakehouse/i });
	}

	/** Get a lakehouse option matching a partial name (e.g. "dataverse") */
	getLakehouseOption(namePattern: RegExp): Locator {
		return this.wzRole().getByRole('option', { name: namePattern });
	}

	// ── Salesforce Integration ──────────────────────────────────
	get salesforceIntegrationHeading(): Locator {
		return this.wzRole().getByRole('heading', { name: /salesforce nonprofit success pack$/i });
	}

	get connectionDropdown(): Locator {
		return this.wzRole().getByRole('combobox', { name: /connection/i });
	}

	/** Get a connection option matching a partial name */
	getConnectionOption(namePattern: RegExp): Locator {
		return this.wzRole().getByRole('option', { name: namePattern });
	}

	// ═══════════════════════════════════════════════════════════
	// Step 3: Review
	// ═══════════════════════════════════════════════════════════
	get configuredItemsHeading(): Locator {
		return this.wzRole().getByRole('heading', { name: /configured items/i });
	}

	get reviewLocationText(): Locator {
		return this.wzRole().getByText(/Location:/).first();
	}

	get reviewTable(): Locator {
		return this.wz('table').first();
	}

	get reviewTableRows(): Locator {
		return this.wz('table:visible tbody tr');
	}

	// ═══════════════════════════════════════════════════════════
	// Step 4: Deploy
	// ═══════════════════════════════════════════════════════════
	get deployProgressStatus(): Locator {
		return this.wz('[role="status"]:has-text("Deploying")');
	}

	get progressBar(): Locator {
		return this.wz('[role="progressbar"]').first();
	}

	get deployTable(): Locator {
		return this.wz('table').first();
	}

	/** Get the status cell text for a specific item row */
	getItemStatus(itemName: string): Locator {
		return this.wz(`tr:has-text("${itemName}") td:last-child`);
	}

	// ═══════════════════════════════════════════════════════════
	// Step 5: Finish
	// ═══════════════════════════════════════════════════════════
	get successHeading(): Locator {
		return this.wzRole().getByRole('heading', { name: /deployment completed successfully/i });
	}

	get successDescription(): Locator {
		return this.wzRole().getByText(/your fundraising capability has been deployed/i);
	}

	/** Heading shown when deployment encounters errors. */
	get deploymentFailedHeading(): Locator {
		return this.wzRole().getByRole('heading', { name: /deployment failed/i });
	}

	/** The error detail message inside the failure banner. */
	get deploymentFailedDetail(): Locator {
		return this.wzRole().getByText(/failed to create item/i);
	}

	get nextStepsHeading(): Locator {
		return this.wzRole().getByRole('heading', { name: /next steps/i });
	}

	get nextStepsList(): Locator {
		return this.wz('[role="list"][aria-label="Recommended next steps"], ul[aria-label="Recommended next steps"]');
	}

	get runPipelineCard(): Locator {
		return this.wzRole().getByText('Run orchestration pipeline');
	}

	get reviewInsightsCard(): Locator {
		return this.wzRole().getByText('Review fundraising intelligence insights');
	}

	get bringDataCard(): Locator {
		return this.wzRole().getByText('Bring your own data');
	}

	get createInsightsCard(): Locator {
		return this.wzRole().getByText('Create your own fundraising insights');
	}

	get documentationHeading(): Locator {
		return this.wzRole().getByRole('heading', { name: /documentation/i });
	}

	get gettingStartedLink(): Locator {
		return this.wzRole().getByRole('link', { name: /getting started guide/i });
	}

	get dataPipelineLink(): Locator {
		return this.wzRole().getByRole('link', { name: /data pipeline documentation/i });
	}

	get powerBILink(): Locator {
		return this.wzRole().getByRole('link', { name: /power bi integration/i });
	}

	get deployedItemsButton(): Locator {
		return this.wzRole().getByRole('button', { name: /created items list/i });
	}

	// ═══════════════════════════════════════════════════════════
	// Actions
	// ═══════════════════════════════════════════════════════════

	/** Wait for the Next button to be enabled, then click it. */
	async clickNext(): Promise<void> {
		await this.waitForNextEnabled();
		await this.page.waitForTimeout(500);
		await this.nextButton.click();
	}

	async clickPrevious(): Promise<void> {
		await this.previousButton.click();
		await this.page.waitForTimeout(500);
	}

	async clickDeploy(): Promise<void> {
		await this.deployButton.click();
		await this.page.waitForTimeout(500);
	}

	/**
	 * Wait for the deployment to reach the Finish step and verify it succeeded.
	 *
	 * The wizard Finish step always shows the "Deployment completed successfully"
	 * heading — even when errors occurred. A separate "Deployment failed" banner
	 * appears on top when there are failures. This method races both conditions
	 * and throws immediately on failure instead of timing out.
	 */
	async waitForDeploymentOutcome(timeout = 300_000): Promise<void> {
		// Wait for the Finish step heading to appear (shown in both success and failure)
		await this.successHeading.waitFor({ state: 'visible', timeout });

		// Give the failure banner a moment to render after the heading appears
		await this.page.waitForTimeout(2_000);

		// Check whether a failure banner is present
		const failed = await this.deploymentFailedHeading.isVisible().catch(() => false);
		if (failed) {
			const detail = await this.deploymentFailedDetail.textContent().catch(() => 'unknown error');
			throw new Error(`Deployment failed: ${detail}`);
		}
	}

	async clickClose(): Promise<void> {
		await this.closeButton.click();
		await this.page.waitForTimeout(500);
	}

	/** Wait for the Next button to become enabled (not disabled). */
	async waitForNextEnabled(timeout = 30_000): Promise<void> {
		await this.nextButton.waitFor({ state: 'visible', timeout });
		// Poll until the button loses the disabled attribute.
		// Playwright's locator methods work across FrameLocators (no
		// cross-origin contentDocument issues).
		const deadline = Date.now() + timeout;
		while (Date.now() < deadline) {
			const disabled = await this.nextButton.isDisabled();
			if (!disabled) return;
			await this.page.waitForTimeout(500);
		}
		throw new Error(`Next button did not become enabled within ${timeout}ms`);
	}

	async fillDeploymentName(name: string): Promise<void> {
		await this.deploymentNameInput.clear();
		await this.deploymentNameInput.fill(name);
		await this.page.waitForTimeout(500);
	}

	/** Select one or more optional packages on the Configuration step. */
	async selectPackages(packages: OptionalPackage[]): Promise<void> {
		for (const pkg of packages) {
			const checkbox = this.getPackageCheckbox(pkg);
			if (!(await checkbox.isChecked())) {
				await checkbox.click();
				await this.page.waitForTimeout(500);
			}
		}
	}

	/** Deselect a previously-selected optional package. */
	async deselectPackage(pkg: OptionalPackage): Promise<void> {
		const checkbox = this.getPackageCheckbox(pkg);
		if (await checkbox.isChecked()) {
			await checkbox.click();
		}
	}

	/** Select a lakehouse from the Dynamics 365 config dropdown.
	 *  Falls back to the first option if no match is found. */
	async selectLakehouse(namePattern: RegExp = /dataverse/i): Promise<void> {
		await this.lakehouseDropdown.click();
		// Wait for at least one option to render (lakehouses load from API)
		await this.wzRole().getByRole('option').first().waitFor({ state: 'attached', timeout: 30_000 });
		const match = this.getLakehouseOption(namePattern);
		if ((await match.count()) > 0) {
			await match.first().click();
		} else {
			await this.wzRole().getByRole('option').first().click();
		}
		await this.page.waitForTimeout(500);
	}

	/** Select a connection from the Salesforce config dropdown. */
	async selectConnection(namePattern?: RegExp): Promise<void> {
		await this.connectionDropdown.click();
		// Wait for at least one option to render (connections load from API)
		await this.wzRole().getByRole('option').first().waitFor({ state: 'attached', timeout: 30_000 });
		if (namePattern) {
			await this.getConnectionOption(namePattern).click();
		} else {
			await this.wzRole().getByRole('option').first().click();
		}
		await this.page.waitForTimeout(500);
	}

	/**
	 * Complete the Additional Configuration step (Step 2b).
	 * Selects lakehouse for Dynamics 365 and/or connection for Salesforce.
	 */
	async completeAdditionalConfiguration(
		packages: OptionalPackage[],
		options?: { lakehousePattern?: RegExp; connectionPattern?: RegExp },
	): Promise<void> {
		await this.additionalConfigHeading.waitFor({ state: 'visible', timeout: 15_000 });

		if (packages.includes('dynamics365')) {
			await this.selectLakehouse(options?.lakehousePattern ?? /dataverse/i);
		}
		if (packages.includes('salesforce')) {
			await this.selectConnection(options?.connectionPattern);
		}
	}

	/**
	 * Walk from Overview through Configuration (and optionally
	 * Additional Configuration) to the Review step.
	 */
	async walkToReview(
		deploymentName: string,
		packages: OptionalPackage[] = [],
		additionalConfigOptions?: { lakehousePattern?: RegExp; connectionPattern?: RegExp },
	): Promise<void> {
		// Step 1 (Overview) → Step 2 (Configuration)
		await this.clickNext();
		await this.deploymentNameInput.waitFor({ state: 'visible', timeout: 15_000 });

		// Wait for the Next button to become enabled (disabled until workspace data loads)
		await this.waitForNextEnabled();

		// Fill deployment name
		await this.fillDeploymentName(deploymentName);

		// Select optional packages
		if (packages.length > 0) {
			await this.selectPackages(packages);
		}

		// Step 2 (Configuration) → next step
		await this.clickNext();

		// If D365 or Salesforce selected, handle Additional Configuration step
		const needsAdditionalConfig = packages.includes('dynamics365') || packages.includes('salesforce');
		if (needsAdditionalConfig) {
			await this.completeAdditionalConfiguration(packages, additionalConfigOptions);
			// Step 2b (Additional Configuration) → Step 3 (Review)
			await this.clickNext();
		}

		await this.configuredItemsHeading.waitFor({ state: 'visible', timeout: 15_000 });
	}

	/**
	 * Execute a full deployment from Overview through Finish.
	 * Waits for deployment to complete (up to 5 minutes).
	 */
	async runFullDeployment(
		deploymentName: string,
		packages: OptionalPackage[] = [],
		options?: {
			timeout?: number;
			lakehousePattern?: RegExp;
			connectionPattern?: RegExp;
		},
	): Promise<void> {
		await this.walkToReview(deploymentName, packages, {
			lakehousePattern: options?.lakehousePattern,
			connectionPattern: options?.connectionPattern,
		});

		// Step 3 (Review) → Step 4 (Deploy)
		await this.clickDeploy();

		// Wait for deployment to finish and verify it succeeded
		await this.waitForDeploymentOutcome(options?.timeout ?? 300_000);
	}
}
