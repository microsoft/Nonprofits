// Converts a Retry-After header (seconds or HTTP date) into a wait in milliseconds.
// Returns null when the value is invalid or asks for a longer wait than the caller allows.
export function retryAfterDelay(header: string, maxMs: number, now = Date.now()): number | null {
	const delay = /^\d+$/.test(header) ? Number(header) * 1_000 : Date.parse(header) - now;
	return Number.isFinite(delay) && delay <= maxMs ? Math.max(0, delay) : null;
}

export const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
