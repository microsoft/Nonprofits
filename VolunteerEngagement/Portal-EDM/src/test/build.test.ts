// @vitest-environment node

import { fileURLToPath } from 'node:url';

import { build } from 'vite';
import { describe, expect, it } from 'vitest';

describe('production build', () => {
	it('preserves fixed portal asset names and separate vendor bundles', async () => {
		const result = await build({
			root: fileURLToPath(new URL('../..', import.meta.url)),
			logLevel: 'silent',
			build: { write: false },
		});

		if (Array.isArray(result) || !('output' in result)) {
			throw new Error('Expected a single production build output');
		}

		expect(result.output.map((asset) => asset.fileName)).toEqual(
			expect.arrayContaining([
				'index.html',
				'assets/index.js',
				'assets/index.css',
				'assets/vendor-react.js',
				'assets/vendor-fluent-components.js',
				'assets/vendor-fluent-icons.js',
			]),
		);
	}, 30_000);
});
