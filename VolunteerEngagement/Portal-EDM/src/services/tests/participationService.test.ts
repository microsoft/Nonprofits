import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Participation, ParticipationSchedule } from '../../types';
import { ParticipationStatus, ScheduleStatus } from '../../types';
import { apiGet, apiPatch, apiPost } from '../apiClient';
import {
	createParticipation,
	createParticipationSchedule,
	fetchMyParticipations,
	fetchParticipation,
	fetchParticipationSchedules,
	markContactAsVolunteer,
	reapplyParticipation,
	updateParticipationStatus,
	updateScheduleStatus,
} from '../participationService';

vi.mock('../apiClient', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../apiClient')>();
	return {
		ApiError: actual.ApiError,
		assertGuid: actual.assertGuid,
		apiGet: vi.fn(),
		apiPatch: vi.fn(),
		apiPost: vi.fn(),
	};
});

const mockApiGet = vi.mocked(apiGet);
const mockApiPatch = vi.mocked(apiPatch);
const mockApiPost = vi.mocked(apiPost);

const CONTACT_ID = '11111111-1111-4111-8111-111111111111';
const OPPORTUNITY_ID = '22222222-2222-4222-8222-222222222222';
const PARTICIPATION_ID = '33333333-3333-4333-8333-333333333333';
const SCHEDULE_ID = '44444444-4444-4444-8444-444444444444';
const ENGAGEMENT_SCHEDULE_ID = '55555555-5555-4555-8555-555555555555';

describe('participationService', () => {
	beforeEach(() => {
		mockApiGet.mockReset();
		mockApiPatch.mockReset();
		mockApiPost.mockReset();
	});

	it('fetches the most recent contact participation for an engagement opportunity', async () => {
		const participation = { msnfp_participationid: PARTICIPATION_ID } as Participation;
		mockApiGet.mockResolvedValue({ value: [participation] });

		await expect(fetchParticipation(CONTACT_ID, OPPORTUNITY_ID)).resolves.toBe(participation);
		expect(mockApiGet).toHaveBeenCalledWith(
			`/_api/msnfp_participations?$select=msnfp_participationid,msnfp_status,_msnfp_contactid_value,_msnfp_engagementopportunityid_value&$filter=_msnfp_contactid_value eq '${CONTACT_ID}' and _msnfp_engagementopportunityid_value eq '${OPPORTUNITY_ID}'&$orderby=createdon desc&$top=1`,
		);
	});

	it('returns null when no participation exists', async () => {
		mockApiGet.mockResolvedValue({ value: [] });

		await expect(fetchParticipation(CONTACT_ID, OPPORTUNITY_ID)).resolves.toBeNull();
	});

	it('rejects malformed ids without calling the Web API', async () => {
		await expect(fetchParticipation("x' or 1 eq 1 or 'a", OPPORTUNITY_ID)).rejects.toMatchObject({
			name: 'ApiError',
			status: 404,
		});
		await expect(updateParticipationStatus('participation-1', ParticipationStatus.Canceled)).rejects.toMatchObject({
			name: 'ApiError',
			status: 404,
		});
		expect(mockApiGet).not.toHaveBeenCalled();
		expect(mockApiPatch).not.toHaveBeenCalled();
	});

	it('fetches all participations for a contact', async () => {
		const participations = [{ msnfp_participationid: PARTICIPATION_ID }] as Participation[];
		mockApiGet.mockResolvedValue({ value: participations });

		await expect(fetchMyParticipations(CONTACT_ID)).resolves.toBe(participations);
		expect(mockApiGet).toHaveBeenCalledWith(
			`/_api/msnfp_participations?$select=msnfp_participationid,msnfp_status,_msnfp_contactid_value,_msnfp_engagementopportunityid_value&$filter=_msnfp_contactid_value eq '${CONTACT_ID}'`,
		);
	});

	it('creates an applied participation with Dataverse bind fields', async () => {
		const participation = { msnfp_participationid: PARTICIPATION_ID } as Participation;
		mockApiPost.mockResolvedValue(participation);

		await expect(createParticipation(OPPORTUNITY_ID, CONTACT_ID)).resolves.toBe(participation);
		expect(mockApiPost).toHaveBeenCalledWith('/_api/msnfp_participations', {
			'msnfp_engagementOpportunityId@odata.bind': `/msnfp_engagementopportunities(${OPPORTUNITY_ID})`,
			'msnfp_contactId@odata.bind': `/contacts(${CONTACT_ID})`,
			msnfp_status: ParticipationStatus.Applied,
		});
	});

	it('updates participation and schedule status fields', async () => {
		await updateParticipationStatus(PARTICIPATION_ID, ParticipationStatus.Canceled);
		await updateScheduleStatus(SCHEDULE_ID, ScheduleStatus.Canceled);

		expect(mockApiPatch).toHaveBeenNthCalledWith(1, `/_api/msnfp_participations(${PARTICIPATION_ID})`, {
			msnfp_status: ParticipationStatus.Canceled,
		});
		expect(mockApiPatch).toHaveBeenNthCalledWith(2, `/_api/msnfp_participationschedules(${SCHEDULE_ID})`, {
			msnfp_schedulestatus: ScheduleStatus.Canceled,
		});
	});

	it('re-applies by patching the existing participation back to Applied', async () => {
		await reapplyParticipation(PARTICIPATION_ID);

		expect(mockApiPost).not.toHaveBeenCalled();
		expect(mockApiPatch).toHaveBeenCalledWith(`/_api/msnfp_participations(${PARTICIPATION_ID})`, {
			msnfp_status: ParticipationStatus.Applied,
		});
	});

	it('fetches and creates participation schedules', async () => {
		const schedules = [{ msnfp_participationscheduleid: SCHEDULE_ID }] as ParticipationSchedule[];
		const created = { msnfp_participationscheduleid: SCHEDULE_ID } as ParticipationSchedule;
		mockApiGet.mockResolvedValue({ value: schedules });
		mockApiPost.mockResolvedValue(created);

		await expect(fetchParticipationSchedules(PARTICIPATION_ID)).resolves.toBe(schedules);
		await expect(createParticipationSchedule(PARTICIPATION_ID, ENGAGEMENT_SCHEDULE_ID)).resolves.toBe(created);
		expect(mockApiGet).toHaveBeenCalledWith(
			`/_api/msnfp_participationschedules?$select=msnfp_participationscheduleid,msnfp_schedulestatus,_msnfp_participationid_value,_msnfp_engagementopportunityscheduleid_value&$filter=_msnfp_participationid_value eq '${PARTICIPATION_ID}'`,
		);
		expect(mockApiPost).toHaveBeenCalledWith('/_api/msnfp_participationschedules', {
			'msnfp_participationId@odata.bind': `/msnfp_participations(${PARTICIPATION_ID})`,
			'msnfp_engagementOpportunityScheduleId@odata.bind': `/msnfp_engagementopportunityschedules(${ENGAGEMENT_SCHEDULE_ID})`,
			msnfp_schedulestatus: ScheduleStatus.Registered,
		});
	});

	it('marks a contact as a volunteer', async () => {
		await markContactAsVolunteer(CONTACT_ID);

		expect(mockApiPatch).toHaveBeenCalledWith(`/_api/contacts(${CONTACT_ID})`, {
			msnfp_volunteer: true,
		});
	});
});
