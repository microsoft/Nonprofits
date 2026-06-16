// Dataverse entity types for Volunteer Engagement

export interface Engagement {
	msnfp_publicengagementopportunityid: string;
	msnfp_engagementopportunitytitle: string;
	msnfp_shortdescription: string;
	msnfp_description?: string;
	msnfp_startingdate: string;
	msnfp_endingdate: string;
	msnfp_locationtype: number;
	msnfp_locationname: string;
	msnfp_locationcitystate: string;
	msnfp_number: number;
	msnfp_minimum: number;
	msnfp_maximum: number;
	msnfp_engagementopportunitystatus: number;
	msnfp_shifts?: boolean;
	msnfp_multipledays: boolean;
	_msnfp_engagementopportunityid_value: string;
}

export interface Participation {
	msnfp_participationid: string;
	msnfp_status: number;
	_msnfp_contactid_value: string;
	_msnfp_engagementopportunityid_value: string;
}

export interface ParticipationSchedule {
	msnfp_participationscheduleid: string;
	msnfp_schedulestatus: number;
	_msnfp_participationid_value: string;
	_msnfp_engagementopportunityscheduleid_value: string;
}

export interface EngagementSchedule {
	msnfp_engagementopportunityscheduleid: string;
	msnfp_shiftname: string;
	msnfp_startperiod: string;
	msnfp_maximum: number;
	msnfp_number?: number;
}

export interface PreferenceType {
	msnfp_preferencetypeid: string;
	msnfp_preferencetypetitle: string;
}

export interface QualificationType {
	msnfp_qualificationtypeid: string;
	msnfp_qualificationtypetitle: string;
	msnfp_type: number;
}

export interface MyEngagement extends Participation {
	'pubEngage.msnfp_engagementopportunitytitle': string;
	'pubEngage.msnfp_publicengagementopportunityid': string;
	'pubEngage.msnfp_startingdate': string;
	'pubEngage.msnfp_endingdate': string;
	'pubEngage.msnfp_locationtype': number;
	'pubEngage.msnfp_locationname': string;
	'pubEngage.msnfp_multipledays': boolean;
}

export interface PortalUser {
	userName: string;
	firstName: string;
	lastName: string;
	contactId: string;
	userRoles: string[];
}

export interface ContactDetails {
	contactid: string;
	firstname: string | null;
	lastname: string | null;
	emailaddress1: string | null;
	telephone1: string | null;
	address1_line1: string | null;
	address1_line2: string | null;
	address1_city: string | null;
	address1_stateorprovince: string | null;
	address1_postalcode: string | null;
	address1_country: string | null;
	donotemail: boolean | null;
	donotphone: boolean | null;
	donotfax: boolean | null;
	donotpostalmail: boolean | null;
}

// Status enums matching Dataverse option set values
export enum ParticipationStatus {
	Applied = 844060000,
	Accepted = 844060002,
	Dismissed = 844060003,
	Canceled = 844060004,
}

export enum ScheduleStatus {
	Registered = 335940000,
	Completed = 335940001,
	Missed = 335940002,
	Canceled = 335940003,
}

export enum EngagementOpportunityStatus {
	PublishToWeb = 844060002,
	Closed = 844060004,
	Cancelled = 844060005,
}

export enum LocationType {
	OnLocation = 844060000,
	Virtual = 844060001,
	Both = 844060002,
}

export function getLocationLabel(value: number, t?: (key: string) => string): string {
	switch (value) {
		case LocationType.OnLocation:
			return t ? t('MSVE_SPA/Location/OnLocation') : 'On-Location';
		case LocationType.Virtual:
			return t ? t('MSVE_SPA/Location/Virtual') : 'Virtual';
		case LocationType.Both:
			return t ? t('MSVE_SPA/Location/Both') : 'On-Location & Virtual';
		default:
			return t ? t('MSVE_SPA/Status/Unknown') : 'Unknown';
	}
}

export function getParticipationStatusLabel(value: number, t?: (key: string) => string): string {
	switch (value) {
		case ParticipationStatus.Applied:
			return t ? t('MSVE_SPA/Status/Applied') : 'Applied';
		case ParticipationStatus.Accepted:
			return t ? t('MSVE_SPA/Status/Accepted') : 'Accepted';
		case ParticipationStatus.Dismissed:
			return t ? t('MSVE_SPA/Status/Dismissed') : 'Dismissed';
		case ParticipationStatus.Canceled:
			return t ? t('MSVE_SPA/Status/Canceled') : 'Canceled';
		default:
			return t ? t('MSVE_SPA/Status/Unknown') : 'Unknown';
	}
}

export function getScheduleStatusLabel(value: number, t?: (key: string) => string): string {
	switch (value) {
		case ScheduleStatus.Registered:
			return t ? t('MSVE_SPA/Status/Registered') : 'Registered';
		case ScheduleStatus.Completed:
			return t ? t('MSVE_SPA/Status/Completed') : 'Completed';
		case ScheduleStatus.Missed:
			return t ? t('MSVE_SPA/Status/Missed') : 'Missed';
		case ScheduleStatus.Canceled:
			return t ? t('MSVE_SPA/Status/Canceled') : 'Canceled';
		default:
			return t ? t('MSVE_SPA/Status/Unknown') : 'Unknown';
	}
}

// Profile management entities

export interface Availability {
	msnfp_availabilityid: string;
	msnfp_availabilitytitle: string | null;
	msnfp_startperiod: string | null;
	msnfp_endperiod: string | null;
	msnfp_workingdays: string | null; // MultiSelectPicklist: comma-separated values, e.g. "844060000,844060001"
}

export interface UserPreference {
	msnfp_preferenceid: string;
	msnfp_name: string;
	_msnfp_preferencetypeid_value: string;
}

export interface UserQualification {
	msnfp_qualificationid: string;
	msnfp_qualificationtitle: string | null;
	_msnfp_typeid_value: string | null;
	msnfp_startdate: string | null;
	msnfp_enddate: string | null;
}

export interface EngagementRequiredQualification {
	msnfp_engagementopportunityparticipantqualid: string;
	_msnfp_qualificationtypeid_value: string;
}

// Values match the msnfp_workingdays option set on msnfp_availability
export const DAYS_OF_WEEK = [
	{ value: 844060006, label: 'Sun' },
	{ value: 844060000, label: 'Mon' },
	{ value: 844060001, label: 'Tue' },
	{ value: 844060002, label: 'Wed' },
	{ value: 844060003, label: 'Thu' },
	{ value: 844060004, label: 'Fri' },
	{ value: 844060005, label: 'Sat' },
] as const;
