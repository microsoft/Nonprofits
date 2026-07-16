import { useCallback } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';

import { useFabricContext } from '@src/context/FabricContext';

import { callNavigationOpenInNewBrowserTab } from '@controller/NavigationController';

/**
 * Hook for handling external link navigation with keyboard and mouse support.
 * Returns url, onClick and handleKeyDown handlers that open links in new browser tabs.
 *
 * @param url - The URL to navigate to
 * @returns Object containing url, onClick and handleKeyDown handlers
 */
export const useExternalLink = (url: string) => {
	const { workloadClient } = useFabricContext();

	const _handleClick = useCallback(async () => {
		try {
			await callNavigationOpenInNewBrowserTab(workloadClient, url);
		} catch (error) {
			logger.error('Failed to open link in new browser tab:', error);
		}
	}, [workloadClient, url]);

	const onClick = useCallback(
		async (event: MouseEvent<HTMLElement>) => {
			event.preventDefault();
			await _handleClick();
		},
		[_handleClick],
	);

	const handleKeyDown = useCallback(
		async (event: KeyboardEvent<HTMLElement>) => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				await _handleClick();
			}
		},
		[_handleClick],
	);

	return { url, onClick, handleKeyDown };
};
