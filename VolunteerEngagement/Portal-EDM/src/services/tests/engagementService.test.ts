import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Engagement, EngagementRequiredQualification, EngagementSchedule } from '../../types';
import { EngagementOpportunityStatus } from '../../types';
import { apiGet } from '../apiClient';
import {
	fetchEngagement,
	fetchEngagementRequiredQualifications,
	fetchEngagementSchedules,
	fetchEngagements,
	fetchPublicEngagementByPrivateId,
} from '../engagementService';

vi.mock('../apiClient', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../apiClient')>();
	return { ApiError: actual.ApiError, assertGuid: actual.assertGuid, apiGet: vi.fn() };
});

const mockApiGet = vi.mocked(apiGet);

function jsonResponse(body: unknown, init?: ResponseInit): Response {
	return new Response(JSON.stringify(body), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
		...init,
	});
}

describe('engagementService', () => {
	beforeEach(() => {
		mockApiGet.mockReset();
		vi.useRealTimers();
	});

	it('fetches published future public engagements ordered by start date', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-06-04T12:00:00.000Z'));
		const engagement = {
			msnfp_publicengagementopportunityid: '66666666-6666-4666-8666-666666666666',
		} as Engagement;
		const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ value: [engagement] }));
		vi.stubGlobal('fetch', fetchMock);

		await expect(fetchEngagements()).resolves.toEqual([engagement]);

		const url = fetchMock.mock.calls[0][0] as string;
		expect(url).toContain('/_api/msnfp_publicengagementopportunities?$select=');
		expect(url).toContain(`msnfp_engagementopportunitystatus eq ${EngagementOpportunityStatus.PublishToWeb}`);
		expect(url).toContain('msnfp_endingdate ge 2026-06-04T12:00:00.000Z');
		expect(url).toContain('$orderby=msnfp_startingdate asc');
	});

	it('returns an empty engagement list when public fetch is unauthorized or fails', async () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
		const fetchMock = vi
			.fn<typeof fetch>()
			.mockResolvedValueOnce(new Response('', { status: 403 }))
			.mockResolvedValueOnce(new Response('Nope', { status: 500 }));
		vi.stubGlobal('fetch', fetchMock);

		await expect(fetchEngagements()).resolves.toEqual([]);
		await expect(fetchEngagements()).resolves.toEqual([]);
		expect(warnSpy).toHaveBeenCalledWith('fetchEngagements: 403 Unauthorized');
		expect(errorSpy).toHaveBeenCalledWith('fetchEngagements failed: 500', 'Nope');
	});

	it('fetches a single public engagement by id', async () => {
		const engagement = {
			msnfp_publicengagementopportunityid: '66666666-6666-4666-8666-666666666666',
		} as Engagement;
		mockApiGet.mockResolvedValue(engagement);

		await expect(fetchEngagement('66666666-6666-4666-8666-666666666666')).resolves.toBe(engagement);
		expect(mockApiGet.mock.calls[0][0]).toContain(
			'/_api/msnfp_publicengagementopportunities(66666666-6666-4666-8666-666666666666)?$select=',
		);
	});

	it('rejects malformed engagement ids without calling the Web API', async () => {
		await expect(fetchEngagement('not-a-guid')).rejects.toMatchObject({ name: 'ApiError', status: 404 });
		await expect(fetchEngagementSchedules("x' or 1 eq 1 or 'a")).rejects.toMatchObject({ status: 404 });
		await expect(fetchPublicEngagementByPrivateId('bad')).resolves.toBeNull();
		await expect(fetchEngagementRequiredQualifications('bad')).resolves.toEqual([]);
		expect(mockApiGet).not.toHaveBeenCalled();
	});

	it('fetches engagement schedules ordered by start period', async () => {
		const schedules = [{ msnfp_engagementopportunityscheduleid: 'schedule-1' }] as EngagementSchedule[];
		mockApiGet.mockResolvedValue({ value: schedules });

		await expect(fetchEngagementSchedules('22222222-2222-4222-8222-222222222222')).resolves.toBe(schedules);
		expect(mockApiGet).toHaveBeenCalledWith(
			"/_api/msnfp_engagementopportunityschedules?$select=msnfp_engagementopportunityscheduleid,msnfp_shiftname,msnfp_startperiod,msnfp_maximum,msnfp_number&$filter=_msnfp_engagementopportunity_value eq '22222222-2222-4222-8222-222222222222' and statecode eq 0&$orderby=msnfp_startperiod asc",
		);
	});

	it('returns the first public engagement for a private engagement id', async () => {
		const engagement = {
			msnfp_publicengagementopportunityid: '66666666-6666-4666-8666-666666666666',
		} as Engagement;
		mockApiGet.mockResolvedValue({ value: [engagement] });

		await expect(fetchPublicEngagementByPrivateId('22222222-2222-4222-8222-222222222222')).resolves.toBe(
			engagement,
		);
		expect(mockApiGet.mock.calls[0][0]).toContain('/_api/msnfp_publicengagementopportunities?$select=');
		expect(mockApiGet.mock.calls[0][0]).toContain(
			"$filter=_msnfp_engagementopportunityid_value eq '22222222-2222-4222-8222-222222222222'",
		);
		expect(mockApiGet.mock.calls[0][0]).toContain('$top=1');
	});

	it('uses empty fallbacks for optional engagement lookups', async () => {
		mockApiGet.mockRejectedValue(new Error('not available'));

		await expect(fetchPublicEngagementByPrivateId('22222222-2222-4222-8222-222222222222')).resolves.toBeNull();
		await expect(fetchEngagementRequiredQualifications('22222222-2222-4222-8222-222222222222')).resolves.toEqual(
			[],
		);
	});

	it('fetches required qualification links for an engagement', async () => {
		const required = [
			{ msnfp_engagementopportunityparticipantqualid: 'required-1' },
		] as EngagementRequiredQualification[];
		mockApiGet.mockResolvedValue({ value: required });

		await expect(fetchEngagementRequiredQualifications('22222222-2222-4222-8222-222222222222')).resolves.toBe(
			required,
		);
		expect(mockApiGet).toHaveBeenCalledWith(
			"/_api/msnfp_engagementopportunityparticipantquals?$select=msnfp_engagementopportunityparticipantqualid,_msnfp_qualificationtypeid_value&$filter=_msnfp_engagementopportunityid_value eq '22222222-2222-4222-8222-222222222222'",
		);
	});
});
