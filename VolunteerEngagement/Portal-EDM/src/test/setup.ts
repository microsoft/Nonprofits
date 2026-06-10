import { afterEach, vi } from 'vitest';

afterEach(() => {
	document.body.innerHTML = '';
	document.documentElement.className = '';
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});
