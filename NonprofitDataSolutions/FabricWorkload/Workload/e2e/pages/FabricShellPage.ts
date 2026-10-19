import type { Locator, Page } from '@playwright/test';

/**
 * Page Object for the Fabric portal shell — operations outside the workload iframes.
 *
 * Handles: workspace navigation, item creation, toast notifications, global search.
 */
export class FabricShellPage {
	readonly page: Page;

	constructor(page: Page) {
		this.page = page;
	}

	// ── Global Elements ─────────────────────────────────────────
	get globalSearch(): Locator {
		return this.page.getByRole('textbox', { name: 'Global search' });
	}

	get newItemButton(): Locator {
		return this.page.getByTestId('plus-new-btn');
	}

	get nameInput(): Locator {
		return this.page.getByTestId('nameInput');
	}

	get createButton(): Locator {
		return this.page.getByTestId('confirm-button');
	}

	get toastTitle(): Locator {
		return this.page.getByTestId('toast-title');
	}

	// ── New Item Panel ──────────────────────────────────────────
	get newItemPanel(): Locator {
		return this.page.getByRole('region', { name: 'New item' });
	}

	get newItemSearchBox(): Locator {
		return this.newItemPanel.getByTestId('tri-search-box');
	}

	// ── Actions ─────────────────────────────────────────────────

	/** Navigate to a workspace by URL. */
	async navigateToWorkspace(baseURL: string, workspaceId: string): Promise<void> {
		await this.page.goto(`${baseURL}/groups/${workspaceId}?experience=fabric-developer`);
		await this.newItemButton.waitFor({ state: 'visible', timeout: 60_000 });
	}

	/**
	 * Create a new Fundraising item from the workspace view.
	 * Returns after the item is created and the page navigates to it.
	 */
	async createFundraisingItem(name: string): Promise<void> {
		await this.newItemButton.click();
		await this.page.waitForTimeout(1_000);

		// Search for Fundraising in the New Item panel
		await this.newItemSearchBox.click();
		await this.newItemSearchBox.fill('Fund');
		await this.page.waitForTimeout(1_000);

		// Select the Fundraising item type
		await this.page.getByText('Fundraising').click();
		await this.page.waitForTimeout(1_000);

		// Wait for the name input to be ready — the dialog re-renders after
		// initial mount which can clear the input, so we wait for it to
		// stabilise before typing.
		await this.nameInput.waitFor({ state: 'visible', timeout: 10_000 });
		await this.page.waitForTimeout(3_000);

		// Fill the name and retry until the value sticks (guards against
		// late re-renders that clear the input).
		for (let attempt = 0; attempt < 5; attempt++) {
			await this.nameInput.click();
			await this.nameInput.fill(name);
			await this.page.waitForTimeout(1_000);
			const currentValue = await this.nameInput.inputValue();
			if (currentValue === name) break;
		}

		// Wait for Create button to become enabled (name validation is async)
		await this.createButton.waitFor({ state: 'visible', timeout: 10_000 });
		await this.page.waitForFunction(
			(selector) => {
				const btn = document.querySelector(selector);
				return btn instanceof HTMLButtonElement && !btn.disabled;
			},
			'button[data-testid="confirm-button"]',
			{ timeout: 30_000 },
		);
		await this.createButton.click();

		// Detect creation errors — the dialog may show "An error occurred" instead
		// of navigating to the wizard. Race the two outcomes.
		const wizardIframe = this.page.locator('[data-testid="iframe-dialog-Microsoft.NonprofitData"]');
		const errorBanner = this.page.getByText('An error occurred');

		const result = await Promise.race([
			wizardIframe.waitFor({ state: 'visible', timeout: 60_000 }).then(() => 'wizard' as const),
			errorBanner.waitFor({ state: 'visible', timeout: 60_000 }).then(() => 'error' as const),
		]);

		if (result === 'error') {
			throw new Error(`Item creation failed: "An error occurred. Try again." dialog appeared for item "${name}"`);
		}
	}
}
