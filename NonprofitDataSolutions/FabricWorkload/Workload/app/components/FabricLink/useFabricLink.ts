import { useCallback, useMemo } from 'react';
import type { MouseEvent } from 'react';

import { useFabricContext } from '@src/context/FabricContext';
import { getFrontendPath } from '@src/controller/NavigationController';

const DEFAULT_EXPERIENCE = 'fabric-developer';

export type FabricLinkOptions =
	| { type: 'relative'; path: string } // Relative path from hostOrigin
	| { type: 'item'; itemType: string; itemId: string; workspaceId: string; openInNewTab?: boolean }; // Item reference (workspaceId required)

/**
 * Generic hook for creating and opening Fabric links.
 * Supports relative paths and item references.
 */
export const useFabricLink = (options: FabricLinkOptions) => {
	const { hostOrigin, hostExperience, workloadClient } = useFabricContext();

	const { linkPath, linkUrl } = useMemo(() => {
		switch (options.type) {
			case 'relative':
				return {
					linkPath: options.path,
					linkUrl: `${hostOrigin}${options.path.startsWith('/') ? '' : '/'}${options.path}?experience=${hostExperience ?? DEFAULT_EXPERIENCE}`,
				};
			case 'item': {
				const itemPath = getFrontendPath(options.itemType, options.workspaceId, options.itemId);
				return {
					linkPath: itemPath,
					linkUrl: `${hostOrigin}${itemPath}?experience=${hostExperience ?? DEFAULT_EXPERIENCE}`,
				};
			}
		}
	}, [options, hostOrigin, hostExperience]);
	const linkOnClick = useCallback(
		async (event?: MouseEvent<HTMLAnchorElement>) => {
			if (event) {
				event.preventDefault();
			}

			try {
				if (
					(options.type === 'item' && options.openInNewTab === true) ||
					(options.type === 'item' && options.itemType === 'SemanticModel')
				) {
					// [Workaround] Fabric navigation API doesn't allow to navigate to Semantic model details page as of 2025-11-19.
					// It allows navigation to /groups/{workspaceId}/modeling/{semanticModelId} or /dataset.
					await workloadClient.navigation.openBrowserTab({ url: linkUrl });
				} else if (options.type === 'item') {
					await workloadClient.navigation.navigate('host', { path: linkPath });
				} else if (options.type === 'relative') {
					await workloadClient.navigation.openBrowserTab({ url: linkUrl });
				}
			} catch (error) {
				logger.warn(`Failed to navigate to: ${linkUrl}. Opening in a new tab.`, error);
				if (typeof window !== 'undefined') {
					// Host may deny openBrowserTab; fall back to a direct window.open.
					window.open(linkUrl, '_blank');
				}
			}
		},
		[options, linkPath, linkUrl, workloadClient],
	);

	return { linkPath, linkUrl, linkOnClick };
};

export const useFabricItemLink = (itemType: string, itemId: string, workspaceId: string) => {
	return useFabricLink({ type: 'item', itemType, itemId, workspaceId });
};

export const useFabricRelativeLink = (url: string) => {
	return useFabricLink({ type: 'relative', path: url });
};
