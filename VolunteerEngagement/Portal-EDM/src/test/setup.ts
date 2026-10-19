import { afterEach, vi } from 'vitest';

afterEach(() => {
	if (typeof document !== 'undefined') {
		document.body.innerHTML = '';
		document.documentElement.className = '';
	}
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});
