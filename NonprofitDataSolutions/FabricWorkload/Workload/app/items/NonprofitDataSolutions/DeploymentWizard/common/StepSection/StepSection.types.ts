import type { ReactNode } from 'react';

export interface StepSectionProps {
	title: string;
	children: ReactNode;
	titleBadge?: ReactNode;
	subtitle?: ReactNode;
}
