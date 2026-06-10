import type { ContactDetails } from '@/types';

export interface AvailabilityFormState {
	msnfp_availabilitytitle: string;
	msnfp_startperiod: string;
	msnfp_endperiod: string;
	selectedDays: Set<number>;
}

export function buildContactUpdateFields(contact: ContactDetails): Partial<Omit<ContactDetails, 'contactid'>> {
	return {
		firstname: contact.firstname,
		lastname: contact.lastname,
		emailaddress1: contact.emailaddress1,
		telephone1: contact.telephone1,
		address1_line1: contact.address1_line1,
		address1_line2: contact.address1_line2,
		address1_city: contact.address1_city,
		address1_stateorprovince: contact.address1_stateorprovince,
		address1_postalcode: contact.address1_postalcode,
		address1_country: contact.address1_country,
		donotemail: contact.donotemail,
		donotphone: contact.donotphone,
		donotfax: contact.donotfax,
		donotpostalmail: contact.donotpostalmail,
	};
}

export function buildAvailabilityPayload(form: AvailabilityFormState) {
	return {
		msnfp_availabilitytitle: form.msnfp_availabilitytitle,
		msnfp_startperiod: form.msnfp_startperiod,
		msnfp_endperiod: form.msnfp_endperiod,
		msnfp_workingdays: Array.from(form.selectedDays).join(','),
	};
}

export function parseWorkingDays(raw: string | null): Set<number> {
	if (!raw) return new Set();
	return new Set(
		raw
			.split(',')
			.map((value) => parseInt(value.trim(), 10))
			.filter((value) => !isNaN(value)),
	);
}
