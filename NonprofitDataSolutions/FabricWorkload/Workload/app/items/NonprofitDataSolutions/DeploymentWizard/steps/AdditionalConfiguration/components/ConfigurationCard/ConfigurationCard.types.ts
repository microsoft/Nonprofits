import { KeyboardEvent, MouseEvent, ReactNode } from 'react';

export interface ConfigurationCardProps {
	configLabelId: string;
	configLabel: string;
	connectionGuideUrl: string;
	connectionGuideLabel: string;
	connectionGuideText: string;
	children: ReactNode;
	onLinkClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
	onLinkKeyDown?: (event: KeyboardEvent<HTMLAnchorElement>) => void;
}
