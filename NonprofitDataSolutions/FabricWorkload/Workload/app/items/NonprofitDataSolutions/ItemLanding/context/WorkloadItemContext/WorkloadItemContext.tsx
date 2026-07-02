import React, { createContext, useCallback, useContext } from 'react';

import { useParams } from 'react-router-dom';

import { ContextProps } from '@src/App';
import { useFabricContext } from '@src/context/FabricContext';
import { callGetItem } from '@src/controller/ItemCRUDController';
import { callOpenSettings } from '@src/controller/SettingsController';
import { useWorkloadItem } from '@src/hooks/useWorkloadItem';
import { logger } from '@src/services/logger';

import { PageId } from '../../ItemLanding.model';
import { useLatestDeployment } from '../../hooks/useLatestDeployment';
import type { WorkloadItemContextValue, WorkloadItemProviderProps } from './WorkloadItemContext.types';

// Create context
const WorkloadItemContext = createContext<WorkloadItemContextValue | undefined>(undefined);

/**
 * Generic WorkloadItemProvider that can be configured for different item types
 * @param children - Child components
 * @param config - Configuration object defining item type, routes, and actions
 */
export const WorkloadItemProvider: React.FC<WorkloadItemProviderProps> = ({ children, config }) => {
	// Local state
	const [autoStartWizard, setAutoStartWizard] = React.useState<boolean>(false);
	const { itemObjectId, pageId = PageId.Overview } = useParams<ContextProps>();
	const { workloadClient, openExternalLink } = useFabricContext();

	// Use hooks to fetch data
	const { workloadItem, isLoading, error: loadingError, reload } = useWorkloadItem(workloadClient, itemObjectId);
	const latestDeployment = useLatestDeployment(workloadItem);
	const enableNewDeployment = !isLoading && !!workloadItem && latestDeployment === null;

	// Actions
	const openDeploymentWizard = useCallback(async () => {
		const result = await config.openWizard(workloadClient, itemObjectId);
		await reload();
		return result;
	}, [workloadClient, itemObjectId, reload, config]);

	const openItemSettings = useCallback(async () => {
		const item = await callGetItem(workloadClient, itemObjectId);
		await callOpenSettings(workloadClient, item, 'About');
	}, [workloadClient, itemObjectId]);

	const reloadData = useCallback(async () => {
		await reload();
	}, [reload]);

	// Navigation
	const goToOverview = useCallback(async () => {
		return workloadClient.navigation.navigate('workload', {
			path: config.itemPageRoute.replace(':itemObjectId', itemObjectId).replace(':pageId?', PageId.Overview),
			queryParams: null,
		});
	}, [workloadClient, itemObjectId, config]);

	const goToDeployments = useCallback(async () => {
		return workloadClient.navigation.navigate('workload', {
			path: config.itemPageRoute.replace(':itemObjectId', itemObjectId).replace(':pageId?', PageId.Deployments),
			queryParams: null,
		});
	}, [workloadClient, itemObjectId, config]);

	const goToPostDeploymentSetup = useCallback(async () => {
		return workloadClient.navigation.navigate('workload', {
			path: config.itemPageRoute
				.replace(':itemObjectId', itemObjectId)
				.replace(':pageId?', PageId.PostDeploymentSetup),
			queryParams: null,
		});
	}, [workloadClient, itemObjectId, config]);

	const contextValue: WorkloadItemContextValue = {
		config, // Expose config to components
		state: {
			workloadItem,
			latestDeployment,
			isLoading,
			error: loadingError,
			enableNewDeployment,
			pageId,
		},
		actions: {
			openDeploymentWizard,
			openItemSettings,
			reloadData: reloadData,
		},
		navigation: {
			goToOverview,
			goToDeployments,
			goToPostDeploymentSetup,
			openExternalLink,
		},
	};

	// Auto start wizard if query param is set
	React.useEffect(() => {
		const autostartwizard = new URLSearchParams(window.location.search).get('autostartwizard') === 'true';
		setAutoStartWizard(autostartwizard);
	}, [window.location.search]);

	React.useEffect(() => {
		if (autoStartWizard && enableNewDeployment && itemObjectId) {
			openDeploymentWizard()
				.catch((error) => {
					logger.error(`Auto-start wizard failed:`, error);
				})
				.finally(() => {
					setAutoStartWizard(false); // prevent re-opening
				});
		}
	}, [openDeploymentWizard, enableNewDeployment, autoStartWizard, workloadClient, itemObjectId]);

	return <WorkloadItemContext.Provider value={contextValue}>{children}</WorkloadItemContext.Provider>;
};

/**
 * Hook to use the WorkloadItemContext
 * @throws Error if used outside of WorkloadItemProvider
 */
export const useWorkloadItemContext = (): WorkloadItemContextValue => {
	const context = useContext(WorkloadItemContext);

	if (!context) {
		throw new Error('useWorkloadItemContext must be used within a WorkloadItemProvider');
	}
	return context;
};

export default WorkloadItemContext;
