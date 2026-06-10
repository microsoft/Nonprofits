import type { Filters } from '@/components/FilterSidebar';

import type { Engagement } from '@/types';

import type { SortBy } from './Home.types';

function toDateFilterValue(dateTime: string): string {
	return dateTime.slice(0, 10);
}

export function filterAndSortEngagements(engagements: Engagement[], filters: Filters, sortBy: SortBy): Engagement[] {
	let result = [...engagements];

	if (filters.search) {
		const query = filters.search.toLowerCase();
		result = result.filter(
			(engagement) =>
				engagement.msnfp_engagementopportunitytitle?.toLowerCase().includes(query) ||
				engagement.msnfp_shortdescription?.toLowerCase().includes(query),
		);
	}

	if (filters.location) {
		const location = filters.location.toLowerCase();
		result = result.filter(
			(engagement) =>
				engagement.msnfp_locationname?.toLowerCase().includes(location) ||
				engagement.msnfp_locationcitystate?.toLowerCase().includes(location),
		);
	}

	if (filters.startDate) {
		result = result.filter((engagement) => toDateFilterValue(engagement.msnfp_startingdate) >= filters.startDate);
	}

	if (filters.endDate) {
		result = result.filter((engagement) => toDateFilterValue(engagement.msnfp_endingdate) <= filters.endDate);
	}

	return result.sort((firstEngagement, secondEngagement) => {
		switch (sortBy) {
			case 'startdate':
				return (
					new Date(firstEngagement.msnfp_startingdate).getTime() -
					new Date(secondEngagement.msnfp_startingdate).getTime()
				);
			case 'enddate':
				return (
					new Date(firstEngagement.msnfp_endingdate).getTime() -
					new Date(secondEngagement.msnfp_endingdate).getTime()
				);
			case 'title':
				return firstEngagement.msnfp_engagementopportunitytitle.localeCompare(
					secondEngagement.msnfp_engagementopportunitytitle,
				);
			default:
				return 0;
		}
	});
}
