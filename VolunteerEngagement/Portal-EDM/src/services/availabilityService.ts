// Availability data access
import { isGuid } from '@/utils/guid';

import type { Availability } from '@/types';

import { apiDelete, apiGet, apiPost, assertGuid } from './apiClient';

export async function fetchAvailabilities(contactId: string): Promise<Availability[]> {
	if (!isGuid(contactId)) return [];
	const filter = `_msnfp_contactid_value eq '${contactId}'`;
	const select = 'msnfp_availabilityid,msnfp_availabilitytitle,msnfp_startperiod,msnfp_endperiod,msnfp_workingdays';
	const url = `/_api/msnfp_availabilities?$select=${select}&$filter=${filter}&$orderby=msnfp_startperiod asc`;
	try {
		const data = await apiGet<{ value: Availability[] }>(url);
		return data.value;
	} catch {
		return [];
	}
}

export async function createAvailability(
	contactId: string,
	data: {
		msnfp_availabilitytitle: string;
		msnfp_startperiod: string;
		msnfp_endperiod: string;
		msnfp_workingdays: string;
	},
): Promise<void> {
	await apiPost('/_api/msnfp_availabilities', {
		...data,
		'msnfp_contactId@odata.bind': `/contacts(${assertGuid(contactId, 'contact id')})`,
	});
}

export async function deleteAvailability(id: string): Promise<void> {
	await apiDelete(`/_api/msnfp_availabilities(${assertGuid(id, 'availability id')})`);
}
