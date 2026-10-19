import type { FrameLocator, Locator, Page } from '@playwright/test';

/**
 * Base page class that handles the Fabric workload iframe boundary.
 *
 * Fabric loads the workload in two nested iframes:
 * 1. **Item iframe** — the main item landing page (tabs, toolbar, explorer)
 * 2. **Dialog iframe** — the deployment wizard modal (inside `dialog > iframe`)
 * 3. **Pipeline iframe** — the data pipeline page (after navigating to a pipeline)
 *
 * Subclasses use `itemFrame` or `wizardFrame` depending on which they target.
 */
export class WorkloadBasePage {
	readonly page: Page;
	private _itemFrame: FrameLocator | null = null;
	private _wizardFrame: FrameLocator | null = null;

	constructor(page: Page) {
		this.page = page;
	}

	/** The item-landing iframe (main workload content). */
	get itemFrame(): FrameLocator {
		if (!this._itemFrame) {
			this._itemFrame = this.page
				.locator('[data-testid="iframe-page-Microsoft.NonprofitData"]')
				.contentFrame();
		}
		return this._itemFrame;
	}

	/**
	 * The wizard dialog iframe — opened when the deployment wizard is active.
	 * Uses the Fabric `data-testid` pattern for dialog iframes.
	 */
	get wizardFrame(): FrameLocator {
		if (!this._wizardFrame) {
			this._wizardFrame = this.page
				.locator('[data-testid="iframe-dialog-Microsoft.NonprofitData"]')
				.contentFrame();
		}
		return this._wizardFrame;
	}

	// ── Item Landing Page Locators ──────────────────────────────
	get openPipelineButton(): Locator {
		return this.itemFrame.getByRole('button', { name: 'Open pipeline' });
	}

	// ── Actions ─────────────────────────────────────────────────

	/** Wait for the item landing content to be visible inside the iframe. */
	async waitForItemReady(timeout = 60_000): Promise<void> {
		await this.itemFrame
			.locator('[role="application"], [role="main"], [role="tablist"]')
			.first()
			.waitFor({ state: 'visible', timeout });
	}

	/**
	 * Open the orchestration pipeline from the item landing page.
	 * Call this after the wizard is closed and the landing page is visible.
	 */
	async openPipeline(timeout = 60_000): Promise<void> {
		await this.openPipelineButton.waitFor({ state: 'visible', timeout });
		await this.page.waitForTimeout(1_000);
		await this.openPipelineButton.click();
	}

	/** Wait for the wizard dialog iframe to be visible and loaded. */
	async waitForWizardReady(timeout = 60_000): Promise<void> {
		await this.wizardFrame
			.locator('[role="status"], [role="main"], [role="navigation"]')
			.first()
			.waitFor({ state: 'visible', timeout });
	}

	/** Get a locator scoped to the item landing iframe. */
	locator(selector: string): Locator {
		return this.itemFrame.locator(selector);
	}

	/** Take a screenshot of the full page (including Fabric shell). */
	async screenshot(name: string): Promise<Buffer> {
		return this.page.screenshot({ path: `e2e/test-results/screenshots/${name}.png`, fullPage: true });
	}
}
