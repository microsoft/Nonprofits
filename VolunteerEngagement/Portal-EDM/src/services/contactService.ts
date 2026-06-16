// Contact profile data access
import type { ContactDetails } from '@/types';

import { ApiError, apiGet, apiPatch } from './apiClient';

export async function fetchContactDetails(contactId: string): Promise<ContactDetails> {
	const select = [
		'contactid',
		'firstname',
		'lastname',
		'emailaddress1',
		'telephone1',
		'address1_line1',
		'address1_line2',
		'address1_city',
		'address1_stateorprovince',
		'address1_postalcode',
		'address1_country',
		'donotemail',
		'donotphone',
		'donotfax',
		'donotpostalmail',
	].join(',');
	const url = `/_api/contacts?$select=${select}&$filter=contactid eq '${contactId}'&$top=1`;
	const data = await apiGet<{ value: ContactDetails[] }>(url);
	const contact = data.value?.[0];
	if (!contact) throw new ApiError('Contact not found', 404);
	return contact;
}

export async function updateContactDetails(
	contactId: string,
	fields: Partial<Omit<ContactDetails, 'contactid'>>,
): Promise<void> {
	return apiPatch(`/_api/contacts(${contactId})`, fields as Record<string, unknown>);
}
