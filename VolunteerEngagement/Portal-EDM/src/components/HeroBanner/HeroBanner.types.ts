import type { ReactNode } from 'react';

export interface HeroBannerProps {
	title: string;
	subtitle?: string;
	icon?: ReactNode;
	className?: string;
	children?: ReactNode;
}
