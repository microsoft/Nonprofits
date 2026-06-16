import { describe, expect, it } from 'vitest';

import type { Engagement } from '../../../types';
import { LocationType } from '../../../types';
import { filterAndSortEngagements } from '../Home.model';
import { SortBy, emptyFilters } from '../Home.types';

function createEngagement(overrides: Partial<Engagement>): Engagement {
	return {
		msnfp_publicengagementopportunityid: 'public-id',
		msnfp_engagementopportunitytitle: 'Community Kitchen',
		msnfp_shortdescription: 'Prepare meals',
		msnfp_startingdate: '2026-06-10T12:00:00.000Z',
		msnfp_endingdate: '2026-06-10T16:00:00.000Z',
		msnfp_locationtype: LocationType.OnLocation,
		msnfp_locationname: 'Downtown Center',
		msnfp_locationcitystate: 'Seattle, WA',
		msnfp_number: 1,
		msnfp_minimum: 1,
		msnfp_maximum: 5,
		msnfp_engagementopportunitystatus: 844060002,
		msnfp_multipledays: false,
		_msnfp_engagementopportunityid_value: 'private-id',
		...overrides,
	};
}

describe('filterAndSortEngagements', () => {
	it('filters by title or short description', () => {
		const engagements = [
			createEngagement({
				msnfp_publicengagementopportunityid: 'meals',
				msnfp_engagementopportunitytitle: 'Meals',
			}),
			createEngagement({
				msnfp_publicengagementopportunityid: 'garden',
				msnfp_engagementopportunitytitle: 'Garden',
				msnfp_shortdescription: 'Plant trees',
			}),
		];

		const result = filterAndSortEngagements(engagements, { ...emptyFilters, search: 'tree' }, SortBy.StartDate);

		expect(result.map((engagement) => engagement.msnfp_publicengagementopportunityid)).toEqual(['garden']);
	});

	it('filters by location name or city and state', () => {
		const engagements = [
			createEngagement({ msnfp_publicengagementopportunityid: 'seattle' }),
			createEngagement({
				msnfp_publicengagementopportunityid: 'tacoma',
				msnfp_locationname: 'South Hub',
				msnfp_locationcitystate: 'Tacoma, WA',
			}),
		];

		const result = filterAndSortEngagements(engagements, { ...emptyFilters, location: 'tacoma' }, SortBy.StartDate);

		expect(result.map((engagement) => engagement.msnfp_publicengagementopportunityid)).toEqual(['tacoma']);
	});

	it('filters by inclusive start and end dates', () => {
		const engagements = [
			createEngagement({
				msnfp_publicengagementopportunityid: 'early',
				msnfp_startingdate: '2026-06-01T12:00:00.000Z',
				msnfp_endingdate: '2026-06-01T16:00:00.000Z',
			}),
			createEngagement({
				msnfp_publicengagementopportunityid: 'same-day-boundaries',
				msnfp_startingdate: '2026-06-10T12:00:00.000Z',
				msnfp_endingdate: '2026-06-30T16:00:00.000Z',
			}),
			createEngagement({
				msnfp_publicengagementopportunityid: 'late',
				msnfp_startingdate: '2026-07-01T12:00:00.000Z',
				msnfp_endingdate: '2026-07-01T16:00:00.000Z',
			}),
		];

		const result = filterAndSortEngagements(
			engagements,
			{ ...emptyFilters, startDate: '2026-06-10', endDate: '2026-06-30' },
			SortBy.StartDate,
		);

		expect(result.map((engagement) => engagement.msnfp_publicengagementopportunityid)).toEqual([
			'same-day-boundaries',
		]);
	});

	it('sorts by start date, end date, or title', () => {
		const engagements = [
			createEngagement({
				msnfp_publicengagementopportunityid: 'beta',
				msnfp_engagementopportunitytitle: 'Beta',
				msnfp_startingdate: '2026-06-20T12:00:00.000Z',
				msnfp_endingdate: '2026-06-20T16:00:00.000Z',
			}),
			createEngagement({
				msnfp_publicengagementopportunityid: 'alpha',
				msnfp_engagementopportunitytitle: 'Alpha',
				msnfp_startingdate: '2026-06-10T12:00:00.000Z',
				msnfp_endingdate: '2026-06-30T16:00:00.000Z',
			}),
		];

		expect(
			filterAndSortEngagements(engagements, emptyFilters, SortBy.StartDate).map(
				(engagement) => engagement.msnfp_publicengagementopportunityid,
			),
		).toEqual(['alpha', 'beta']);
		expect(
			filterAndSortEngagements(engagements, emptyFilters, SortBy.EndDate).map(
				(engagement) => engagement.msnfp_publicengagementopportunityid,
			),
		).toEqual(['beta', 'alpha']);
		expect(
			filterAndSortEngagements(engagements, emptyFilters, SortBy.Title).map(
				(engagement) => engagement.msnfp_publicengagementopportunityid,
			),
		).toEqual(['alpha', 'beta']);
	});
});
