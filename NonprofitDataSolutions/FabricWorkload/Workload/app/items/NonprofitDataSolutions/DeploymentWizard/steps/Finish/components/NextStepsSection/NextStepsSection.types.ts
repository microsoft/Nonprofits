import type { ActionCardProps } from '../shared/ActionCard';

export interface NextStepsSectionProps {
	nextSteps: ActionCardProps[];
	labels?: {
		sectionTitle?: string;
		ariaLabel?: string;
		refreshMessage?: string;
	};
}
