import { ReactNode } from 'react';

export interface SectionContainerProps {
	title: string;
	titleId?: string;
	children: ReactNode;
	className?: string;
}
