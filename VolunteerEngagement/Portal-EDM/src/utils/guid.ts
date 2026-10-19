const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when the value is a Dataverse record id (canonical 8-4-4-4-12 hex GUID, no braces). */
export function isGuid(value: unknown): value is string {
	return typeof value === 'string' && GUID_PATTERN.test(value);
}
