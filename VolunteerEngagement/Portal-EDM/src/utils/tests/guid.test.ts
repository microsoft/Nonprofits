import { describe, expect, it } from 'vitest';

import { isGuid } from '../guid';

describe('isGuid', () => {
	it('accepts canonical Dataverse GUIDs in any case', () => {
		expect(isGuid('a1b2c3d4-e5f6-4789-8abc-def012345678')).toBe(true);
		expect(isGuid('A1B2C3D4-E5F6-4789-8ABC-DEF012345678')).toBe(true);
		expect(isGuid('00000000-0000-0000-0000-000000000000')).toBe(true);
	});

	it('rejects malformed or non-string values', () => {
		expect(isGuid(undefined)).toBe(false);
		expect(isGuid(null)).toBe(false);
		expect(isGuid(123)).toBe(false);
		expect(isGuid('')).toBe(false);
		expect(isGuid('not-a-guid')).toBe(false);
		expect(isGuid('{a1b2c3d4-e5f6-4789-8abc-def012345678}')).toBe(false);
		expect(isGuid('a1b2c3d4e5f647898abcdef012345678')).toBe(false);
		expect(isGuid('a1b2c3d4-e5f6-4789-8abc-def01234567g')).toBe(false);
		expect(isGuid(' a1b2c3d4-e5f6-4789-8abc-def012345678')).toBe(false);
		expect(isGuid("a1b2c3d4-e5f6-4789-8abc-def012345678' or 1 eq 1")).toBe(false);
		expect(isGuid('a1b2c3d4-e5f6-4789-8abc-def012345678)/foo(')).toBe(false);
	});
});
