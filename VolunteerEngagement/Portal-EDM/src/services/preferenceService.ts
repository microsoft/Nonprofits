// Preference type + user preference data access
import { isGuid } from '@/utils/guid';

import type { PreferenceType, UserPreference } from '@/types';

import { apiDelete, apiGet, apiPost, assertGuid } from './apiClient';

export async function fetchPreferenceTypes(): Promise<PreferenceType[]> {
	const url = `/_api/msnfp_preferencetypes?$select=msnfp_preferencetypeid,msnfp_preferencetypetitle&$orderby=msnfp_preferencetypetitle asc`;
	const data = await apiGet<{ value: PreferenceType[] }>(url);
	return data.value;
}

export async function fetchUserPreferences(contactId: string): Promise<UserPreference[]> {
	if (!isGuid(contactId)) return [];
	const filter = `_msnfp_preference_customer_value eq '${contactId}'`;
	const select = 'msnfp_preferenceid,msnfp_name,_msnfp_preferencetypeid_value';
	const url = `/_api/msnfp_preferences?$select=${select}&$filter=${filter}`;
	try {
		const data = await apiGet<{ value: UserPreference[] }>(url);
		return data.value;
	} catch {
		return [];
	}
}

export async function createUserPreference(contactId: string, preferenceTypeId: string, name: string): Promise<void> {
	await apiPost('/_api/msnfp_preferences', {
		msnfp_name: name,
		'msnfp_preference_customer_contact@odata.bind': `/contacts(${assertGuid(contactId, 'contact id')})`,
		'msnfp_preferenceTypeId@odata.bind': `/msnfp_preferencetypes(${assertGuid(preferenceTypeId, 'preference type id')})`,
	});
}

export async function deleteUserPreference(id: string): Promise<void> {
	await apiDelete(`/_api/msnfp_preferences(${assertGuid(id, 'preference id')})`);
}
