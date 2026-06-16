// Barrel re-export — all service modules are available via '@/services/api'
// for backward compatibility. Prefer importing from specific service modules
// in new code (e.g. '@/services/engagementService').

export { getToken, apiGet, apiPost, apiPatch, apiDelete, ApiError } from './apiClient';
export {
	fetchEngagements,
	fetchEngagement,
	fetchEngagementSchedules,
	fetchPublicEngagementByPrivateId,
	fetchEngagementRequiredQualifications,
} from './engagementService';
export {
	fetchParticipation,
	fetchMyParticipations,
	createParticipation,
	updateParticipationStatus,
	fetchParticipationSchedules,
	createParticipationSchedule,
	updateScheduleStatus,
	markContactAsVolunteer,
} from './participationService';
export { fetchContactDetails, updateContactDetails } from './contactService';
export { fetchAvailabilities, createAvailability, deleteAvailability } from './availabilityService';
export {
	fetchPreferenceTypes,
	fetchUserPreferences,
	createUserPreference,
	deleteUserPreference,
} from './preferenceService';
export {
	fetchQualificationTypes,
	fetchUserQualifications,
	createUserQualification,
	deleteUserQualification,
} from './qualificationService';
