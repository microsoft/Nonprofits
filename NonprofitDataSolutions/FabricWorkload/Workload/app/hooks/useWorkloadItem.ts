import { useCallback, useEffect, useState } from 'react';

import { WorkloadClientAPI } from '@ms-fabric/workload-client';

import { workloadTelemetryService } from '@services/telemetry';

import { ItemWithDefinition, getWorkloadItem } from '@controller/ItemCRUDController';

import { PackageInstallerItemDefinition } from '@originalInstaller/PackageInstallerItemModel';

export type FundraisingItem = ItemWithDefinition<PackageInstallerItemDefinition>;

export const useWorkloadItem = (workloadClient: WorkloadClientAPI, itemObjectId?: string) => {
	const [workloadItem, setWorkloadItem] = useState<FundraisingItem | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchItem = useCallback(async () => {
		if (!itemObjectId) {
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const loadedItem = await getWorkloadItem<PackageInstallerItemDefinition>(workloadClient, itemObjectId);
			setWorkloadItem(loadedItem);

			workloadTelemetryService.setCommonProperties({
				itemId: loadedItem?.id,
				itemType: loadedItem?.type,
				workspaceId: loadedItem?.workspaceId,
			});
		} catch (err) {
			const baseErrorMessage = `Failed to load workload item with Id: ${itemObjectId}`;
			logger.error(baseErrorMessage, err);
			setError(baseErrorMessage);

			setWorkloadItem(null);
		} finally {
			setIsLoading(false);
		}
	}, [workloadClient, itemObjectId]);

	useEffect(() => {
		fetchItem();
	}, [fetchItem]);

	return {
		workloadItem,
		isLoading,
		error,
		reload: fetchItem,
	};
};
