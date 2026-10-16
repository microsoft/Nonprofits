// Qualification type + user qualification data access
import { isGuid } from '@/utils/guid';

import type { QualificationType, UserQualification } from '@/types';

import { apiDelete, apiGet, apiPost, assertGuid } from './apiClient';

export async function fetchQualificationTypes(): Promise<QualificationType[]> {
	const url = `/_api/msnfp_qualificationtypes?$select=msnfp_qualificationtypeid,msnfp_qualificationtypetitle,msnfp_type&$orderby=msnfp_qualificationtypetitle asc`;
	const data = await apiGet<{ value: QualificationType[] }>(url);
	return data.value;
}

export async function fetchUserQualifications(contactId: string): Promise<UserQualification[]> {
	if (!isGuid(contactId)) return [];
	const filter = `_msnfp_contactid_value eq '${contactId}'`;
	const select = 'msnfp_qualificationid,msnfp_qualificationtitle,_msnfp_typeid_value,msnfp_startdate,msnfp_enddate';
	const url = `/_api/msnfp_qualifications?$select=${select}&$filter=${filter}`;
	try {
		const data = await apiGet<{ value: UserQualification[] }>(url);
		return data.value;
	} catch {
		return [];
	}
}

export async function createUserQualification(
	contactId: string,
	qualificationTypeId: string,
	startDate: string,
	endDate: string,
	title?: string,
): Promise<void> {
	const body: Record<string, unknown> = {
		'msnfp_contactId@odata.bind': `/contacts(${assertGuid(contactId, 'contact id')})`,
		'msnfp_typeId@odata.bind': `/msnfp_qualificationtypes(${assertGuid(qualificationTypeId, 'qualification type id')})`,
	};
	if (title) body.msnfp_qualificationtitle = title;
	if (startDate) body.msnfp_startdate = startDate;
	if (endDate) body.msnfp_enddate = endDate;
	await apiPost('/_api/msnfp_qualifications', body);
}

export async function deleteUserQualification(id: string): Promise<void> {
	await apiDelete(`/_api/msnfp_qualifications(${assertGuid(id, 'qualification id')})`);
}
