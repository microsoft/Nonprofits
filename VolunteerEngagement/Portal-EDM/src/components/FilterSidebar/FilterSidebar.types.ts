import type { PreferenceType, QualificationType } from '@/types';

export interface Filters {
	search: string;
	location: string;
	startDate: string;
	endDate: string;
	preferences: string[];
	qualifications: string[];
}

export interface FilterSidebarProps {
	filters: Filters;
	onFiltersChange: (filters: Filters) => void;
	preferences: PreferenceType[];
	qualifications: QualificationType[];
	onApply: () => void;
	onClear: () => void;
}
