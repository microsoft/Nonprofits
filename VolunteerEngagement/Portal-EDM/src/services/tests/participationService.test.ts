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
	updateParticipationStatus,
	updateScheduleStatus,
} from '../participationService';

vi.mock('../apiClient', () => ({
	apiGet: vi.fn(),
	apiPatch: vi.fn(),
	apiPost: vi.fn(),
}));

const mockApiGet = vi.mocked(apiGet);
const mockApiPatch = vi.mocked(apiPatch);
const mockApiPost = vi.mocked(apiPost);

describe('participationService', () => {
	beforeEach(() => {
		mockApiGet.mockReset();
		mockApiPatch.mockReset();
		mockApiPost.mockReset();
	});

	it('fetches a contact participation for an engagement opportunity', async () => {
		const participation = { msnfp_participationid: 'participation-1' } as Participation;
		mockApiGet.mockResolvedValue({ value: [participation] });

		await expect(fetchParticipation('contact-1', 'opportunity-1')).resolves.toBe(participation);
		expect(mockApiGet).toHaveBeenCalledWith(
			"/_api/msnfp_participations?$select=msnfp_participationid,msnfp_status,_msnfp_contactid_value,_msnfp_engagementopportunityid_value&$filter=_msnfp_contactid_value eq 'contact-1' and _msnfp_engagementopportunityid_value eq 'opportunity-1'&$top=1",
		);
	});

	it('returns null when no participation exists', async () => {
		mockApiGet.mockResolvedValue({ value: [] });

		await expect(fetchParticipation('contact-1', 'opportunity-1')).resolves.toBeNull();
	});

	it('fetches all participations for a contact', async () => {
		const participations = [{ msnfp_participationid: 'participation-1' }] as Participation[];
		mockApiGet.mockResolvedValue({ value: participations });

		await expect(fetchMyParticipations('contact-1')).resolves.toBe(participations);
		expect(mockApiGet).toHaveBeenCalledWith(
			"/_api/msnfp_participations?$select=msnfp_participationid,msnfp_status,_msnfp_contactid_value,_msnfp_engagementopportunityid_value&$filter=_msnfp_contactid_value eq 'contact-1'",
		);
	});

	it('creates an applied participation with Dataverse bind fields', async () => {
		const participation = { msnfp_participationid: 'participation-1' } as Participation;
		mockApiPost.mockResolvedValue(participation);

		await expect(createParticipation('opportunity-1', 'contact-1')).resolves.toBe(participation);
		expect(mockApiPost).toHaveBeenCalledWith('/_api/msnfp_participations', {
			'msnfp_engagementOpportunityId@odata.bind': '/msnfp_engagementopportunities(opportunity-1)',
			'msnfp_contactId@odata.bind': '/contacts(contact-1)',
			msnfp_status: ParticipationStatus.Applied,
		});
	});

	it('updates participation and schedule status fields', async () => {
		await updateParticipationStatus('participation-1', ParticipationStatus.Canceled);
		await updateScheduleStatus('schedule-1', ScheduleStatus.Canceled);

		expect(mockApiPatch).toHaveBeenNthCalledWith(1, '/_api/msnfp_participations(participation-1)', {
			msnfp_status: ParticipationStatus.Canceled,
		});
		expect(mockApiPatch).toHaveBeenNthCalledWith(2, '/_api/msnfp_participationschedules(schedule-1)', {
			msnfp_schedulestatus: ScheduleStatus.Canceled,
		});
	});

	it('fetches and creates participation schedules', async () => {
		const schedules = [{ msnfp_participationscheduleid: 'participation-schedule-1' }] as ParticipationSchedule[];
		const created = { msnfp_participationscheduleid: 'participation-schedule-2' } as ParticipationSchedule;
		mockApiGet.mockResolvedValue({ value: schedules });
		mockApiPost.mockResolvedValue(created);

		await expect(fetchParticipationSchedules('participation-1')).resolves.toBe(schedules);
		await expect(createParticipationSchedule('participation-1', 'engagement-schedule-1')).resolves.toBe(created);
		expect(mockApiGet).toHaveBeenCalledWith(
			"/_api/msnfp_participationschedules?$select=msnfp_participationscheduleid,msnfp_schedulestatus,_msnfp_participationid_value,_msnfp_engagementopportunityscheduleid_value&$filter=_msnfp_participationid_value eq 'participation-1'",
		);
		expect(mockApiPost).toHaveBeenCalledWith('/_api/msnfp_participationschedules', {
			'msnfp_participationId@odata.bind': '/msnfp_participations(participation-1)',
			'msnfp_engagementOpportunityScheduleId@odata.bind':
				'/msnfp_engagementopportunityschedules(engagement-schedule-1)',
			msnfp_schedulestatus: ScheduleStatus.Registered,
		});
	});

	it('marks a contact as a volunteer', async () => {
		await markContactAsVolunteer('contact-1');

		expect(mockApiPatch).toHaveBeenCalledWith('/_api/contacts(contact-1)', {
			msnfp_volunteer: true,
		});
	});
});
