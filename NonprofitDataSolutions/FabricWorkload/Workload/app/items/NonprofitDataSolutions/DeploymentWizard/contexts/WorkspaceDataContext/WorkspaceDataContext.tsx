import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';

import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';

import { ContextProps } from '@src/App';

import { workloadTelemetryService } from '@services/telemetry';

import { ItemWithDefinition, getWorkloadItem, saveItemDefinition } from '@controller/ItemCRUDController';

import { FabricPlatformAPIClient } from '@clients/FabricPlatformAPIClient';

import { PackageInstallerItemDefinition } from '@originalInstaller/PackageInstallerItemModel';

import { ExceptionOperation, logException } from '@nds/telemetry/ExceptionTelemetry';

import type {
	WorkspaceDataAction,
	WorkspaceDataContextValue,
	WorkspaceDataProviderProps,
	WorkspaceDataState,
} from './WorkspaceDataContext.types';

// Initial state
const initialState: WorkspaceDataState = {
	isLoadingData: true,
	lakehouses: [],
	connections: [],
	folders: [],
};

// Reducer
function workspaceDataReducer(state: WorkspaceDataState, action: WorkspaceDataAction): WorkspaceDataState {
	logger.debug('[Workspace Data Context]', action.type, action);

	switch (action.type) {
		case 'SET_LOADING':
			return { ...state, isLoadingData: action.payload };
		case 'SET_WORKLOAD_ITEM':
			return { ...state, workloadItem: action.payload };
		case 'UPDATE_ITEM_DEFINITION':
			return state.workloadItem
				? {
						...state,
						workloadItem: {
							...state.workloadItem,
							definition: { ...state.workloadItem.definition, ...action.payload },
						},
					}
				: state;
		case 'SET_ERROR':
			return { ...state, error: action.payload };
		case 'SET_LAKEHOUSES':
			return { ...state, lakehouses: action.payload };
		case 'SET_CONNECTIONS':
			return { ...state, connections: action.payload };
		case 'SET_FOLDERS':
			return { ...state, folders: action.payload };
		case 'SET_CURRENT_WORKSPACE':
			return { ...state, currentWorkspace: action.payload };
		default:
			return state;
	}
}

// Create context
const WorkspaceDataContext = createContext<WorkspaceDataContextValue | undefined>(undefined);

// Provider component

export const WorkspaceDataProvider: React.FC<WorkspaceDataProviderProps> = ({ children, workloadClient }) => {
	const { t } = useTranslation();
	const pageContext = useParams<ContextProps>();
	const [state, dispatch] = useReducer(workspaceDataReducer, initialState);

	// Initialize clients once using useMemo
	const fabricClient = useMemo(() => new FabricPlatformAPIClient(workloadClient), [workloadClient]);

	// Load lakehouses for a workspace (or all workspaces when ?allLakehouses=true)
	const loadLakehouses = useCallback(
		async (workspaceId: string): Promise<void> => {
			const allLakehouses =
				new URLSearchParams(window.location.search).get('allLakehouses') === 'true';
			const lakehouses = await fabricClient.artifacts.getLakehouses(
				allLakehouses ? undefined : workspaceId,
			);
			const formatted = lakehouses
				.map((lakehouse) => ({ label: lakehouse.displayName, value: lakehouse.id }))
				.sort((a, b) => a.label.localeCompare(b.label));
			dispatch({ type: 'SET_LAKEHOUSES', payload: formatted });
		},
		[fabricClient],
	);

	// Load Salesforce connections
	const loadConnections = useCallback(async (): Promise<void> => {
		const connections = await fabricClient.connections.getAllConnections();
		const formatted = connections
			.filter((connection) => connection.connectionDetails.type === 'Salesforce')
			.map((connection) => ({ label: connection.displayName, value: connection.id }))
			.sort((a, b) => a.label.localeCompare(b.label));
		dispatch({ type: 'SET_CONNECTIONS', payload: formatted });
	}, [fabricClient]);

	// Load workspace folders
	const loadWorkspaceFolders = useCallback(
		async (workspaceId: string): Promise<void> => {
			const folders = await fabricClient.folders.getAllFolders(workspaceId);
			const formattedFolders = folders
				.map((folder) => ({
					label: folder.displayName,
					value: folder.id,
					parentFolderId: folder.parentFolderId,
				}))
				.sort((a, b) => a.label.localeCompare(b.label));
			dispatch({ type: 'SET_FOLDERS', payload: formattedFolders });
		},
		[fabricClient],
	);

	// Load current workspace information
	const loadCurrentWorkspace = useCallback(
		async (workspaceId: string): Promise<void> => {
			const workspace = await fabricClient.workspaces.getWorkspace(workspaceId);
			dispatch({
				type: 'SET_CURRENT_WORKSPACE',
				payload: {
					id: workspace.id,
					displayName: workspace.displayName,
					description: workspace.description,
				},
			});
		},
		[fabricClient],
	);

	// Load workload item and initialize definition
	const loadWorkloadItem = useCallback(
		async (itemObjectId: string): Promise<ItemWithDefinition<PackageInstallerItemDefinition>> => {
			let loadedItem = await getWorkloadItem<PackageInstallerItemDefinition>(workloadClient, itemObjectId);

			if (!loadedItem.definition) {
				loadedItem = {
					...loadedItem,
					definition: {
						deployments: [],
					},
				};
			}

			workloadTelemetryService.setCommonProperties({
				itemId: loadedItem?.id,
				itemType: loadedItem?.type,
				workspaceId: loadedItem?.workspaceId,
			});

			dispatch({ type: 'SET_WORKLOAD_ITEM', payload: loadedItem });
			return loadedItem;
		},
		[workloadClient],
	);

	// Helper function to update item definition immutably
	const updateItemDefinition = useCallback((updates: Partial<PackageInstallerItemDefinition>) => {
		dispatch({ type: 'UPDATE_ITEM_DEFINITION', payload: updates });
	}, []);

	// Save item function
	const saveItem = useCallback(
		async (definition?: PackageInstallerItemDefinition) => {
			if (!state.workloadItem) return null;

			try {
				const successResult = await saveItemDefinition<PackageInstallerItemDefinition>(
					workloadClient,
					state.workloadItem.id,
					definition || state.workloadItem.definition,
				);
				return successResult;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);

				logException({
					name: ExceptionOperation.WorkspaceDataSaveItemFailed,
					error,
					itemId: state.workloadItem.id,
					itemName: state.workloadItem.displayName,
					workspaceId: state.workloadItem.workspaceId,
					workspaceName: state.currentWorkspace?.displayName,
				});

				dispatch({
					type: 'SET_ERROR',
					payload: t('labels.deployment.errors.failed_to_save_item', { error: errorMessage }),
				});
				return null;
			}
		},
		[state.workloadItem, state.currentWorkspace, workloadClient, t],
	);

	// Helper to load workspace resources and collect any errors
	const loadWorkspaceResources = useCallback(
		async (workspaceId: string): Promise<string[]> => {
			const resources = [
				{ name: 'workspace information', loader: () => loadCurrentWorkspace(workspaceId) },
				{ name: 'lakehouses', loader: () => loadLakehouses(workspaceId) },
				{ name: 'folders', loader: () => loadWorkspaceFolders(workspaceId) },
				{ name: 'connections', loader: loadConnections },
			];

			const results = await Promise.allSettled(resources.map(({ loader }) => loader()));

			logger.debug('[Workspace Data Context] Resource loading results:', results);

			return results.reduce<string[]>((errors, result, index) => {
				if (result.status === 'rejected') {
					const resourceName = resources[index].name;
					const message = result.reason?.message || String(result.reason);
					errors.push(`${resourceName} (${message})`);
				}

				return errors;
			}, []);
		},
		[loadCurrentWorkspace, loadLakehouses, loadWorkspaceFolders, loadConnections],
	);

	// Load data from URL
	const loadData = useCallback(
		async (pageContext: ContextProps): Promise<void> => {
			let loadedItem: ItemWithDefinition<PackageInstallerItemDefinition> | undefined;

			try {
				dispatch({ type: 'SET_LOADING', payload: true });

				loadedItem = await loadWorkloadItem(pageContext.itemObjectId);

				if (loadedItem.workspaceId) {
					const errors = await loadWorkspaceResources(loadedItem.workspaceId);

					if (errors.length > 0) {
						const errorParts = errors.join(', ');

						logException({
							name: ExceptionOperation.WorkspaceDataLoadResourcesFailed,
							error: new Error(errorParts),
							itemId: loadedItem.id,
							itemName: loadedItem.displayName,
							workspaceId: loadedItem.workspaceId,
							additionalProperties: { failedResources: errors },
						});

						dispatch({
							type: 'SET_ERROR',
							payload: t('labels.deployment.errors.failed_to_load_resources', {
								error: errorParts,
							}),
						});
					}
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);

				logException({
					name: ExceptionOperation.WorkspaceDataLoadDataFailed,
					error,
					itemId: pageContext.itemObjectId,
					itemName: loadedItem?.displayName,
					workspaceId: loadedItem?.workspaceId,
				});

				dispatch({
					type: 'SET_ERROR',
					payload: `Failed to load data: ${errorMessage}`,
				});
			} finally {
				dispatch({ type: 'SET_LOADING', payload: false });
			}
		},
		[loadWorkloadItem, loadWorkspaceResources, t],
	);

	// Initialize context on mount
	useEffect(() => {
		(async () => {
			if (!pageContext?.itemObjectId) return;
			await loadData(pageContext);
		})();
	}, [pageContext, loadData]);

	const contextValue: WorkspaceDataContextValue = {
		state,
		workloadClient,
		actions: {
			loadData,
			saveItem,
			updateItemDefinition,
			loadLakehouses,
			loadConnections,
			loadWorkspaceFolders,
			loadCurrentWorkspace,
		},
	};

	return <WorkspaceDataContext.Provider value={contextValue}>{children}</WorkspaceDataContext.Provider>;
};

// Hook to use the context
export const useWorkspaceData = (): WorkspaceDataContextValue => {
	const context = useContext(WorkspaceDataContext);

	if (!context) {
		throw new Error('useWorkspaceData hook must be used within a WorkspaceDataProvider');
	}
	return context;
};

export default WorkspaceDataContext;
