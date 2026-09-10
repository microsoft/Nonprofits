import { ReactNode } from 'react';

export interface IntegrationHeaderProps {
	icon: ReactNode;
	title: string;
	titleId: string;
	subtitle: string;
	setupGuideUrl: string;
	setupGuideLabel: string;
}
