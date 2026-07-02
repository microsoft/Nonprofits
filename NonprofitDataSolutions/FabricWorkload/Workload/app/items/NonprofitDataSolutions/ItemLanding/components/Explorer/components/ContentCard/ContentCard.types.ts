import type { ReactNode } from 'react';

export interface ContentCardProps {
	/** Text displayed in the card header. */
	title: string;
	/** Card body content. */
	children: ReactNode;
	/** Optional extra className applied to the outer wrapper. */
	className?: string;
}
