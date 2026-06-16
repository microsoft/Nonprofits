// Engagement opportunity data access
import type { Engagement, EngagementRequiredQualification, EngagementSchedule } from '@/types';
import { EngagementOpportunityStatus } from '@/types';

import { apiGet } from './apiClient';

const PUBLIC_ENGAGEMENT_FIELDS = [
	'msnfp_publicengagementopportunityid',
	'msnfp_engagementopportunitytitle',
	'msnfp_shortdescription',
	'msnfp_description',
	'msnfp_startingdate',
	'msnfp_endingdate',
	'msnfp_locationtype',
	'msnfp_locationname',
	'msnfp_locationcitystate',
	'msnfp_number',
	'msnfp_minimum',
	'msnfp_maximum',
	'msnfp_engagementopportunitystatus',
	'msnfp_shifts',
	'msnfp_multipledays',
	'_msnfp_engagementopportunityid_value',
].join(',');

export async function fetchEngagements(): Promise<Engagement[]> {
	const now = new Date().toISOString();
	const filters = [
		`msnfp_engagementopportunitystatus eq ${EngagementOpportunityStatus.PublishToWeb}`,
		`msnfp_endingdate ge ${now}`,
	];
	const url = `/_api/msnfp_publicengagementopportunities?$select=${PUBLIC_ENGAGEMENT_FIELDS}&$filter=${filters.join(' and ')}&$orderby=msnfp_startingdate asc`;
	try {
		const response = await fetch(url);
		if (response.status === 403) {
			console.warn('fetchEngagements: 403 Unauthorized');
			return [];
		}
		if (!response.ok) {
			const text = await response.text().catch(() => '');
			console.error(`fetchEngagements failed: ${response.status}`, text);
			return [];
		}
		const data = await response.json();
		return data.value || [];
	} catch (err) {
		console.error('fetchEngagements failed:', err);
		return [];
	}
}

export async function fetchEngagement(id: string): Promise<Engagement> {
	const url = `/_api/msnfp_publicengagementopportunities(${id})?$select=${PUBLIC_ENGAGEMENT_FIELDS}`;
	return apiGet<Engagement>(url);
}

export async function fetchEngagementSchedules(privateOppId: string): Promise<EngagementSchedule[]> {
	const filter = [`_msnfp_engagementopportunity_value eq '${privateOppId}'`, 'statecode eq 0'].join(' and ');
	const url = `/_api/msnfp_engagementopportunityschedules?$select=msnfp_engagementopportunityscheduleid,msnfp_shiftname,msnfp_startperiod,msnfp_maximum,msnfp_number&$filter=${filter}&$orderby=msnfp_startperiod asc`;
	const data = await apiGet<{ value: EngagementSchedule[] }>(url);
	return data.value;
}

export async function fetchPublicEngagementByPrivateId(privateOppId: string): Promise<Engagement | null> {
	const filter = `_msnfp_engagementopportunityid_value eq '${privateOppId}'`;
	const url = `/_api/msnfp_publicengagementopportunities?$select=${PUBLIC_ENGAGEMENT_FIELDS}&$filter=${filter}&$top=1`;
	try {
		const data = await apiGet<{ value: Engagement[] }>(url);
		return data.value[0] ?? null;
	} catch {
		return null;
	}
}

export async function fetchEngagementRequiredQualifications(
	engagementOppId: string,
): Promise<EngagementRequiredQualification[]> {
	const filter = `_msnfp_engagementopportunityid_value eq '${engagementOppId}'`;
	const url = `/_api/msnfp_engagementopportunityparticipantquals?$select=msnfp_engagementopportunityparticipantqualid,_msnfp_qualificationtypeid_value&$filter=${filter}`;
	try {
		const data = await apiGet<{ value: EngagementRequiredQualification[] }>(url);
		return data.value;
	} catch {
		return [];
	}
}
