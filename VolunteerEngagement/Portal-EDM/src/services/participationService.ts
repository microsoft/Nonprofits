// Participation and participation schedule data access
import type { Participation, ParticipationSchedule } from '@/types';
import { ParticipationStatus } from '@/types';

import { apiGet, apiPatch, apiPost, assertGuid } from './apiClient';

export async function fetchParticipation(userId: string, engagementOppId: string): Promise<Participation | null> {
	const filter = `_msnfp_contactid_value eq '${assertGuid(userId, 'contact id')}' and _msnfp_engagementopportunityid_value eq '${assertGuid(engagementOppId, 'engagement opportunity id')}'`;
	const url = `/_api/msnfp_participations?$select=msnfp_participationid,msnfp_status,_msnfp_contactid_value,_msnfp_engagementopportunityid_value&$filter=${filter}&$orderby=createdon desc&$top=1`;
	const data = await apiGet<{ value: Participation[] }>(url);
	return data.value[0] ?? null;
}

export async function fetchMyParticipations(userId: string): Promise<Participation[]> {
	const filter = `_msnfp_contactid_value eq '${assertGuid(userId, 'contact id')}'`;
	const select = 'msnfp_participationid,msnfp_status,_msnfp_contactid_value,_msnfp_engagementopportunityid_value';
	const url = `/_api/msnfp_participations?$select=${select}&$filter=${filter}`;
	const data = await apiGet<{ value: Participation[] }>(url);
	return data.value;
}

export async function createParticipation(engagementOppId: string, volunteerId: string): Promise<Participation> {
	return apiPost<Participation>('/_api/msnfp_participations', {
		'msnfp_engagementOpportunityId@odata.bind': `/msnfp_engagementopportunities(${assertGuid(engagementOppId, 'engagement opportunity id')})`,
		'msnfp_contactId@odata.bind': `/contacts(${assertGuid(volunteerId, 'contact id')})`,
		msnfp_status: ParticipationStatus.Applied,
	});
}

export async function updateParticipationStatus(participationId: string, status: number): Promise<void> {
	return apiPatch(`/_api/msnfp_participations(${assertGuid(participationId, 'participation id')})`, {
		msnfp_status: status,
	});
}

/** Re-apply on a previously canceled participation by moving the existing record back to Applied. */
export async function reapplyParticipation(participationId: string): Promise<void> {
	return updateParticipationStatus(participationId, ParticipationStatus.Applied);
}

export async function fetchParticipationSchedules(participationId: string): Promise<ParticipationSchedule[]> {
	const filter = `_msnfp_participationid_value eq '${assertGuid(participationId, 'participation id')}'`;
	const url = `/_api/msnfp_participationschedules?$select=msnfp_participationscheduleid,msnfp_schedulestatus,_msnfp_participationid_value,_msnfp_engagementopportunityscheduleid_value&$filter=${filter}`;
	const data = await apiGet<{ value: ParticipationSchedule[] }>(url);
	return data.value;
}

export async function createParticipationSchedule(
	participationId: string,
	engagementScheduleId: string,
): Promise<ParticipationSchedule> {
	return apiPost<ParticipationSchedule>('/_api/msnfp_participationschedules', {
		'msnfp_participationId@odata.bind': `/msnfp_participations(${assertGuid(participationId, 'participation id')})`,
		'msnfp_engagementOpportunityScheduleId@odata.bind': `/msnfp_engagementopportunityschedules(${assertGuid(engagementScheduleId, 'engagement schedule id')})`,
		msnfp_schedulestatus: 335940000, // Registered
	});
}

export async function updateScheduleStatus(scheduleId: string, status: number): Promise<void> {
	return apiPatch(`/_api/msnfp_participationschedules(${assertGuid(scheduleId, 'participation schedule id')})`, {
		msnfp_schedulestatus: status,
	});
}

export async function markContactAsVolunteer(contactId: string): Promise<void> {
	return apiPatch(`/_api/contacts(${assertGuid(contactId, 'contact id')})`, {
		msnfp_volunteer: true,
	});
}
