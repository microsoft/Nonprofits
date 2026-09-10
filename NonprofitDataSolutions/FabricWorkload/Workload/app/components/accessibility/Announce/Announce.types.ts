import type { ReactNode } from 'react';

export interface AnnounceProps {
	children: ReactNode;
	role?: 'status' | 'alert';
	ariaLive?: 'polite' | 'assertive' | 'off';
	ariaAtomic?: boolean;
}
