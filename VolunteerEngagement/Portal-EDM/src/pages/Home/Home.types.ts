import type { Filters } from '@/components/FilterSidebar';

export enum SortBy {
	StartDate = 'startdate',
	EndDate = 'enddate',
	Title = 'title',
}

export const emptyFilters: Filters = {
	search: '',
	location: '',
	startDate: '',
	endDate: '',
	preferences: [],
	qualifications: [],
};
