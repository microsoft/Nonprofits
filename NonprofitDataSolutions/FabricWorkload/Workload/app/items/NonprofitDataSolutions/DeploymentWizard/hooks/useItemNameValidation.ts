import { useCallback, useEffect, useState } from 'react';

import { logger } from '@services/logger';

import { FabricPlatformAPIClient } from '@clients/FabricPlatformAPIClient';

import { PackageItem } from '@originalInstaller/PackageInstallerItemModel';

import { useWorkspaceData } from '../contexts/WorkspaceDataContext';

/**
 * Hook to validate item names and types against existing workspace items
 * Returns a map of item display names (with prefix) that already exist in the workspace with the same type
 */
export const useItemNameValidation = (items: PackageItem[], namePrefix?: string) => {
	const workspaceData = useWorkspaceData();
	const [duplicateNames, setDuplicateNames] = useState<Set<string>>(new Set());
	const [isValidating, setIsValidating] = useState(false);

	const validateItemNames = useCallback(async () => {
		if (!items || items.length === 0) {
			setDuplicateNames(new Set());
			return;
		}

		const workspaceId = workspaceData.state.workloadItem?.workspaceId;
		if (!workspaceId) {
			return;
		}

		setIsValidating(true);

		try {
			const fabricClient = new FabricPlatformAPIClient(workspaceData.workloadClient);
			const existingItems = await fabricClient.items.getAllItems(workspaceId);

			// Create a set of existing item name+type combinations for quick lookup
			const existingNameTypes = new Set(
				existingItems.map((item) => `${item.displayName.toLowerCase()}|${item.type}`),
			);

			// Check which items would have duplicate names and types
			const duplicates = new Set<string>();
			items.forEach((item) => {
				const displayName = namePrefix ? `${namePrefix}_${item.displayName}` : item.displayName;
				const nameTypeKey = `${displayName.toLowerCase()}|${item.type}`;
				if (existingNameTypes.has(nameTypeKey)) {
					duplicates.add(displayName);
				}
			});

			setDuplicateNames(duplicates);
		} catch (error) {
			logger.error('Failed to validate item names:', error);
			// On error, assume no duplicates to not block user
			setDuplicateNames(new Set());
		} finally {
			setIsValidating(false);
		}
	}, [items, namePrefix, workspaceData.workloadClient, workspaceData.state.workloadItem?.workspaceId]);

	useEffect(() => {
		validateItemNames();
	}, [validateItemNames]);

	return { duplicateNames, isValidating, refreshValidation: validateItemNames };
};
