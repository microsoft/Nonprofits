import { describe, expect, it } from 'vitest';

import type { ContactDetails } from '../../../types';
import { buildAvailabilityPayload, buildContactUpdateFields, parseWorkingDays } from '../Profile.model';

function createContact(overrides: Partial<ContactDetails> = {}): ContactDetails {
	return {
		contactid: 'contact-1',
		firstname: 'Test',
		lastname: 'User',
		emailaddress1: 'volunteer@example.test',
		telephone1: '555-0100',
		address1_line1: '1 Main St',
		address1_line2: null,
		address1_city: 'Seattle',
		address1_stateorprovince: 'WA',
		address1_postalcode: '98101',
		address1_country: 'US',
		donotemail: false,
		donotphone: true,
		donotfax: true,
		donotpostalmail: false,
		...overrides,
	};
}

describe('Profile model helpers', () => {
	it('builds contact update fields without contactid', () => {
		expect(buildContactUpdateFields(createContact())).toEqual({
			firstname: 'Test',
			lastname: 'User',
			emailaddress1: 'volunteer@example.test',
			telephone1: '555-0100',
			address1_line1: '1 Main St',
			address1_line2: null,
			address1_city: 'Seattle',
			address1_stateorprovince: 'WA',
			address1_postalcode: '98101',
			address1_country: 'US',
			donotemail: false,
			donotphone: true,
			donotfax: true,
			donotpostalmail: false,
		});
	});

	it('builds an availability create payload from form state', () => {
		expect(
			buildAvailabilityPayload({
				msnfp_availabilitytitle: 'Weekdays',
				msnfp_startperiod: '2026-06-01',
				msnfp_endperiod: '2026-06-30',
				selectedDays: new Set([844060000, 844060001]),
			}),
		).toEqual({
			msnfp_availabilitytitle: 'Weekdays',
			msnfp_startperiod: '2026-06-01',
			msnfp_endperiod: '2026-06-30',
			msnfp_workingdays: '844060000,844060001',
		});
	});

	it('parses comma-separated working days and ignores invalid values', () => {
		expect(parseWorkingDays(null)).toEqual(new Set());
		expect(parseWorkingDays('844060000, bad, 844060001')).toEqual(new Set([844060000, 844060001]));
	});
});
