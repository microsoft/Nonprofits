import type { ActionCardProps } from '../shared/ActionCard';

export interface RecommendedActionsSectionProps {
	actions: ActionCardProps[];
	labels?: {
		sectionTitle?: string;
		ariaLabel?: string;
	};
}
