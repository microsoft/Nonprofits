import type { FC } from 'react';

import { useAnnounceStyles } from './Announce.styles';
import type { AnnounceProps } from './Announce.types';

/**
 * Component that announces content to screen readers via ARIA live regions.
 * Content is visually hidden but accessible to assistive technologies.
 */
export const Announce: FC<AnnounceProps> = ({ children, role = 'status', ariaLive = 'polite', ariaAtomic = true }) => {
	const styles = useAnnounceStyles();

	return (
		<div role={role} aria-live={ariaLive} aria-atomic={ariaAtomic} className={styles.root}>
			{children}
		</div>
	);
};
