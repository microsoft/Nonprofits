import React from 'react';

import { FabricPlatformAPIClient } from '@clients/FabricPlatformAPIClient';
import type { Item } from '@clients/FabricPlatformTypes';
import { useFabricContext } from '@src/context/FabricContext';

const CACHE_TTL_MS = 30_000;

type CacheEntry = {
	timestamp: number;
	index: Map<string, Item>;
};

const workspaceIndexCache = new Map<string, CacheEntry>();
const clientSessionTokens = new WeakMap<object, string>();

const getClientSessionToken = (workloadClient: object): string => {
	const existing = clientSessionTokens.get(workloadClient);
	if (existing) {
		return existing;
	}

	const token = `client-${Date.now()}-${Math.random().toString(36).slice(2)}`;
	clientSessionTokens.set(workloadClient, token);
	return token;
};

const toKey = (displayName: string, type: string) => `${displayName.trim().toLowerCase()}|${type.trim().toLowerCase()}`;

/**
 * Builds (and caches briefly) an index of items in a workspace to resolve items by `type + displayName`.
 *
 * This is used to avoid stale links after Fabric Deployment Pipeline moves/copies items to another workspace.
 */
export const useWorkspaceItemsIndex = (workspaceId?: string) => {
	const { workloadClient } = useFabricContext();
	const fabricClient = React.useMemo(() => new FabricPlatformAPIClient(workloadClient), [workloadClient]);
	const clientSessionToken = React.useMemo(
		() => getClientSessionToken(workloadClient as unknown as object),
		[workloadClient],
	);

	const [index, setIndex] = React.useState<Map<string, Item>>(new Map());
	const [isLoading, setIsLoading] = React.useState(false);
	const [loadError, setLoadError] = React.useState<unknown>(null);

	React.useEffect(() => {
		let isCancelled = false;

		if (!workspaceId) {
			setIndex(new Map());
			setIsLoading(false);
			setLoadError(null);
			return undefined;
		}

		const cacheKey = `${clientSessionToken}:${workspaceId}`;
		const cached = workspaceIndexCache.get(cacheKey);
		const now = Date.now();
		if (cached) {
			if (now - cached.timestamp < CACHE_TTL_MS) {
				setIndex(cached.index);
				setIsLoading(false);
				setLoadError(null);
				return undefined;
			}

			workspaceIndexCache.delete(cacheKey);
		}

		setIsLoading(true);
		setLoadError(null);

		(async () => {
			try {
				const items = await fabricClient.items.getAllItems(workspaceId);
				if (isCancelled) {
					return;
				}

				const nextIndex = new Map<string, Item>();
				for (const item of items) {
					const key = toKey(item.displayName, item.type);
					nextIndex.set(key, item);
				}

				workspaceIndexCache.set(cacheKey, { timestamp: Date.now(), index: nextIndex });
				setIndex(nextIndex);
			} catch (error) {
				if (!isCancelled) {
					setIndex(new Map());
					setLoadError(error);
				}
			} finally {
				if (!isCancelled) {
					setIsLoading(false);
				}
			}
		})();

		return () => {
			isCancelled = true;
		};
	}, [clientSessionToken, fabricClient, workspaceId]);

	const resolveItem = React.useCallback(
		(type: string, displayName: string): Item | undefined => {
			const key = toKey(displayName, type);
			return index.get(key);
		},
		[index],
	);

	return {
		resolveItem,
		isLoading,
		loadError,
	};
};
