import type { FrameLocator, Locator, Page } from '@playwright/test';

const MONITORING_HUB_URL = 'https://app.fabric.microsoft.com/monitoringhub?experience=fabric-developer';

/** Terminal pipeline statuses that stop polling. */
const TERMINAL_STATUSES = ['Succeeded', 'Failed', 'Cancelled'] as const;
type TerminalStatus = (typeof TERMINAL_STATUSES)[number];

const TERMINAL_REGEX = /\b(succeeded|failed|cancelled|canceled)\b/i;

function toTerminalStatus(matched: string): TerminalStatus {
	const lower = matched.toLowerCase();
	if (lower === 'succeeded') return 'Succeeded';
	if (lower === 'failed') return 'Failed';
	return 'Cancelled';
}

/**
 * Page Object for the Fabric Data Pipeline page.
 *
 * Uses the **Monitoring Hub** (iframe-free top-level page) as the single
 * strategy for tracking pipeline completion. The hub shows a table of recent
 * runs with columns: Activity name | Status | Item type | Start time | …
 *
 * The `pipelineName` constructor arg is used to find the correct row.
 * Iframes are only touched once — to click the Run button.
 */
export class PipelinePage {
	readonly page: Page;
	readonly pipelineName: string;

	constructor(page: Page, pipelineName: string) {
		this.page = page;
		this.pipelineName = pipelineName;
	}

	// ── Iframe locators (only used by run()) ────────────────────

	private get pipelineFrame(): FrameLocator {
		return this.page
			.locator('[data-testid="iframe-page-data-pipeline"]')
			.contentFrame();
	}

	private get runButton(): Locator {
		return this.pipelineFrame.getByRole('button', { name: 'Run', exact: true });
	}

	// ── Public actions ──────────────────────────────────────────

	/** Click the Run button inside the pipeline iframe. */
	async run(timeout = 60_000): Promise<void> {
		await this.runButton.waitFor({ state: 'visible', timeout });
		await this.page.waitForTimeout(1_000);
		await this.runButton.click();
		await this.page.waitForTimeout(1_000);
	}

	/**
	 * Poll the Monitoring Hub until the pipeline reaches a terminal state.
	 *
	 * The hub is a plain top-level page (no iframes) with a `<table>` listing
	 * recent runs. We find the row whose Activity name matches
	 * `this.pipelineName` and whose Item type contains "Pipeline", then read
	 * its Status cell.
	 */
	async waitForCompletion(timeout = 7_200_000): Promise<string> {
		const POLL_MS = 30_000;
		const SCREENSHOT_MS = 120_000;
		const deadline = Date.now() + timeout;
		let iteration = 0;
		let lastScreenshot = 0;

		console.log(`[Pipeline] Polling Monitoring Hub for "${this.pipelineName}" …`);

		while (Date.now() < deadline) {
			iteration++;
			const now = Date.now();

			if (now - lastScreenshot >= SCREENSHOT_MS) {
				lastScreenshot = now;
				await this.screenshot(`hub-poll-${iteration}`);
			}

			const result = await this.readStatusFromHub();

			if (result === 'not-found' && iteration <= 4) {
				// Pipeline row may not appear immediately after clicking Run
				console.log(`[Pipeline] Poll #${iteration}: row not yet visible`);
			} else if (result === 'not-found') {
				console.log(`[Pipeline] Poll #${iteration}: row not found — will retry`);
			} else if (result === 'running') {
				if (iteration === 1 || iteration % 4 === 0) {
					const mins = Math.round((now - (deadline - timeout)) / 60_000);
					console.log(`[Pipeline] Poll #${iteration} (${mins}m): still running`);
				}
			} else {
				// Terminal status
				console.log(`[Pipeline] Final status: "${result}"`);
				await this.screenshot('hub-final-status');
				return result;
			}

			await this.page.waitForTimeout(POLL_MS);
		}

		await this.screenshot('hub-timeout');
		throw new Error(
			`Pipeline "${this.pipelineName}" did not finish within ${timeout / 60_000} minutes`,
		);
	}

	// ── Private helpers ─────────────────────────────────────────

	/**
	 * Navigate to the Monitoring Hub and find the row for our pipeline.
	 * Returns a terminal status, `'running'`, or `'not-found'`.
	 *
	 * Each row is inspected cell-by-cell instead of using `textContent()` on
	 * the whole `<tr>`, because `textContent` concatenates cells without
	 * whitespace (e.g. "In progressPipeline") which breaks word-boundary
	 * regex checks.
	 *
	 * Uses `page.reload()` when already on the hub to avoid accumulating
	 * HTTP/2 TLS sessions in long-running polls (Node.js TLSWrap crash).
	 */
	private async readStatusFromHub(): Promise<TerminalStatus | 'running' | 'not-found'> {
		try {
			const currentUrl = this.page.url();
			if (currentUrl.startsWith(MONITORING_HUB_URL)) {
				await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 30_000 });
			} else {
				await this.page.goto(MONITORING_HUB_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
			}
			await this.page.waitForTimeout(8_000);

			const rows = this.page.locator('table tbody tr');
			const count = await rows.count().catch(() => 0);

			for (let i = 0; i < Math.min(count, 50); i++) {
				const row = rows.nth(i);
				const cells = row.locator('td');
				const cellCount = await cells.count().catch(() => 0);
				if (cellCount < 3) continue;

				const activityName = await cells.nth(0).textContent({ timeout: 2_000 }).catch(() => '');
				if (!activityName?.includes(this.pipelineName)) continue;

				const itemType = await cells.nth(2).textContent({ timeout: 2_000 }).catch(() => '');
				if (!itemType?.trim().includes('Pipeline')) continue;

				const statusText = await cells.nth(1).textContent({ timeout: 2_000 }).catch(() => '');
				if (!statusText) continue;

				const match = statusText.match(TERMINAL_REGEX);
				if (match) return toTerminalStatus(match[1]);

				if (/in progress/i.test(statusText)) return 'running';

				// Row found but status unrecognized — treat as running
				console.log(`[Pipeline] Hub row[${i}] unrecognized status: "${statusText.trim()}"`);
				return 'running';
			}

			return 'not-found';
		} catch (err) {
			console.log(`[Pipeline] Hub navigation failed: ${err}`);
			return 'not-found';
		}
	}

	private async screenshot(name: string): Promise<void> {
		await this.page
			.screenshot({ path: `e2e/test-results/${name}.png`, fullPage: true })
			.catch(() => {});
	}
}
