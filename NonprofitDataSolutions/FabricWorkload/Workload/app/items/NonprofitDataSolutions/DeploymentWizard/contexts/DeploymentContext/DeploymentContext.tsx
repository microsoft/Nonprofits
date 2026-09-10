import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';

import { NotificationType, OpenNotificationConfig } from '@ms-fabric/workload-client';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';

import {
	logDeploymentFailed,
	logDeploymentStarted,
	logDeploymentSucceeded,
} from '@src/items/NonprofitDataSolutions/telemetry/DeploymentTelemetry';
import {
	buildDeploymentTelemetryPayload,
	extractFailureMessage,
	formatSelectionForTelemetry,
} from '@src/items/NonprofitDataSolutions/telemetry/DeploymentTelemetryUtils';

import { saveItemDefinition } from '@controller/ItemCRUDController';
import { callNotificationOpen } from '@controller/NotificationController';
import {
	DeploymentStatus,
	Package,
	PackageDeployment,
	PackageInstallerItemDefinition,
	PackageItem,
} from '@originalInstaller/PackageInstallerItemModel';
import {
	DeploymentItemStatusUpdate,
	createInitialDeploymentStatuses,
	upsertDeploymentItemStatus,
} from '@originalInstaller/deployment/DeploymentItemStatus';
import { DeploymentStrategyFactory } from '@originalInstaller/deployment/DeploymentStrategyFactory';
import { PackageInstallerContext } from '@originalInstaller/package/PackageInstallerContext';

import { OPEN_FUNDRAISING_ITEM_ACTION } from '@nds/actions';

import { useItemNameValidation } from '../../hooks/useItemNameValidation';
import { ModuleType } from '../../types/ModuleType';
import { useWorkspaceData } from '../WorkspaceDataContext';
import {
	FUNDRAISING_RUNTIME_VARIABLES,
	filterPackageItemsByModules,
	getModuleInstallationStatus,
} from './DeploymentContext.model';
import { FundraisingDeploymentEventHandler } from './FundraisingDeploymentEventHandler';
import { preparePackageItemsForModules } from './PackageModulePreparer';
import {
	DeploymentAction,
	DeploymentContextValue,
	DeploymentProviderProps,
	DeploymentState,
} from './DeploymentContext.types';

// Initial state
const initialState: DeploymentState = {
	isDeploymentInProgress: false,
	deploymentProgress: undefined,
	itemStatuses: [],
	packageDeployment: undefined,
	installerContext: null,
	originalPackage: null,
	modifiedPackage: null,
	error: undefined,
	deploymentName: null,
	selectedLakehouse: '',
	selectedConnection: '',
	selectedLocation: '',
	selectedModules: new Set<ModuleType>([ModuleType.Fundraising_Core]),
	hasDuplicateNames: false,
	duplicateNames: new Set<string>(),
};

// Reducer
const deploymentReducer = (state: DeploymentState, action: DeploymentAction): DeploymentState => {
	logger.debug('[Deployment Context]', action.type, action);

	switch (action.type) {
		case 'SET_DEPLOYMENT_IN_PROGRESS':
			return {
				...state,
				isDeploymentInProgress: action.payload,
				error: action.payload ? undefined : state.error, // Clear error when starting deployment
			};
		case 'SET_DEPLOYMENT_PROGRESS':
			return {
				...state,
				deploymentProgress: action.payload,
			};
		case 'SET_ERROR':
			return {
				...state,
				isDeploymentInProgress: false,
				error: action.payload,
				deploymentProgress: action.payload ? undefined : state.deploymentProgress, // Clear progress on error
			};
		case 'SET_ITEM_STATUSES':
			return {
				...state,
				itemStatuses: action.payload,
			};
		case 'UPSERT_ITEM_STATUS':
			return {
				...state,
				itemStatuses: upsertDeploymentItemStatus(state.itemStatuses, {
					...action.payload,
					updatedAt: action.payload.updatedAt ?? new Date(),
				}),
			};
		case 'SET_DEPLOYMENT':
			return {
				...state,
				packageDeployment: action.payload,
			};
		case 'SET_INSTALLER_CONTEXT':
			return {
				...state,
				installerContext: action.payload,
			};
		case 'SET_ORIGINAL_PACKAGE':
			return {
				...state,
				originalPackage: action.payload,
			};
		case 'SET_MODIFIED_PACKAGE':
			return {
				...state,
				modifiedPackage: action.payload,
			};
		case 'SET_DEPLOYMENT_NAME':
			return { ...state, deploymentName: action.payload };
		case 'SET_SELECTED_LAKEHOUSE':
			return { ...state, selectedLakehouse: action.payload };
		case 'SET_SELECTED_CONNECTION':
			return { ...state, selectedConnection: action.payload };
		case 'SET_SELECTED_LOCATION':
			return { ...state, selectedLocation: action.payload };
		case 'ADD_MODULE':
			return { ...state, selectedModules: new Set([...state.selectedModules, action.payload]) };
		case 'REMOVE_MODULE':
			const newModules = new Set(state.selectedModules);
			newModules.delete(action.payload);
			return { ...state, selectedModules: newModules };
		case 'SET_HAS_DUPLICATE_NAMES':
			return { ...state, hasDuplicateNames: action.payload };
		case 'SET_DUPLICATE_NAMES':
			return { ...state, duplicateNames: action.payload, hasDuplicateNames: action.payload.size > 0 };
		default:
			return state;
	}
};

// Create context
const DeploymentContext = createContext<DeploymentContextValue | undefined>(undefined);

// Provider component
export const DeploymentProvider: React.FC<DeploymentProviderProps> = ({ children, workloadClient, packageId }) => {
	const { t } = useTranslation();
	const [state, dispatch] = useReducer(deploymentReducer, initialState);
	const workspaceData = useWorkspaceData();

	// Get items from modified package, or empty array if not available
	const items = state.modifiedPackage?.items || [];

	// Validate item names against existing workspace items
	const { duplicateNames, refreshValidation } = useItemNameValidation(items, state.deploymentName);

	// Update state when duplicate names change
	useEffect(() => {
		dispatch({ type: 'SET_DUPLICATE_NAMES', payload: duplicateNames });
	}, [duplicateNames]);

	// Generate a unique ID for deployments
	const generateUniqueId = useCallback((): string => {
		return '' + Math.random().toString(36).substring(2, 9);
	}, []);

	// Initialize package context on mount
	useEffect(() => {
		const initializePackageContext = async () => {
			try {
				const context = new PackageInstallerContext(workloadClient);
				await context.packageRegistry.loadFromAssets();

				const pack = context.getPackage(packageId);
				if (!pack) {
					dispatch({ type: 'SET_ERROR', payload: `Package with typeId ${packageId} not found` });
					return;
				}

				dispatch({ type: 'SET_ORIGINAL_PACKAGE', payload: pack });
				dispatch({ type: 'SET_INSTALLER_CONTEXT', payload: context });
			} catch (error) {
				logger.warn('Package context init failed:', error);
				dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize package context' });
			}
		};
		initializePackageContext();
	}, [workloadClient, packageId]);

	// Set selected deployment
	const setPackageDeployment = useCallback((deployment?: PackageDeployment) => {
		dispatch({ type: 'SET_DEPLOYMENT', payload: deployment });
	}, []);

	// Set modified package
	const setModifiedPackage = useCallback((modifiedPackage: Package | null) => {
		dispatch({ type: 'SET_MODIFIED_PACKAGE', payload: modifiedPackage });
	}, []);

	// Add deployment function - creates deployment and sets in state, no persistence
	const addDeployment = useCallback(async (): Promise<void> => {
		// Get required data from URL params and contexts
		const workloadItem = workspaceData.state.workloadItem;
		const folders = workspaceData.state.folders;
		const { deploymentName, originalPackage } = state;

		if (!packageId || !workloadItem || !deploymentName) {
			logger.error('Add deployment failed: missing required data');
			return;
		}

		// Check if folder with same name already exists
		const existingFolder = folders?.find(
			(folder) => folder.label === deploymentName && folder.parentFolderId === workloadItem.subfolderId,
		);

		const createdSolution: PackageDeployment = {
			id: generateUniqueId(),
			status: DeploymentStatus.Pending,
			deployedItems: [],
			packageId: packageId,
			version: originalPackage?.version,
			workspace: {
				id: workloadItem.workspaceId,
				createNew: false,
				folder: {
					createNew: !existingFolder,
					name: deploymentName,
					id: existingFolder && existingFolder?.value,
					parentFolderId: !existingFolder && workloadItem.subfolderId,
				},
			},
		};

		// Just set in state, don't save to persistent storage yet
		dispatch({ type: 'SET_DEPLOYMENT', payload: createdSolution });
	}, [
		packageId,
		workspaceData.state.workloadItem,
		workspaceData.state.folders.length,
		generateUniqueId,
		state.deploymentName,
		state.originalPackage,
	]);

	// Automatically add deployment when data is loaded and no deployment exists
	useEffect(() => {
		const shouldInitializeDeployment =
			state.installerContext &&
			state.originalPackage &&
			!workspaceData.state.isLoadingData &&
			state.deploymentName &&
			workspaceData.state.workloadItem;

		if (shouldInitializeDeployment) {
			addDeployment();
		}
	}, [
		workspaceData.state.isLoadingData,
		workspaceData.state.workloadItem,
		state.installerContext,
		state.originalPackage,
		state.deploymentName,
		addDeployment,
	]);

	const updateDeploymentProgress = useCallback((step: string, progress: number) => {
		dispatch({
			type: 'SET_DEPLOYMENT_PROGRESS',
			payload: {
				currentStep: step,
				progress: Math.max(0, Math.min(100, progress)),
			},
		});
	}, []);

	// Helper to create standardized error responses
	const createErrorResult = useCallback((message: string) => {
		dispatch({ type: 'SET_ERROR', payload: message });
		return { success: false, error: message };
	}, []);

	const handleItemStatusUpdate = useCallback((update: DeploymentItemStatusUpdate) => {
		dispatch({
			type: 'UPSERT_ITEM_STATUS',
			payload: {
				...update,
				updatedAt: update.updatedAt ?? new Date(),
			},
		});
	}, []);

	// Handle deployment update callback
	const handleDeploymentUpdate = useCallback(
		async (updatedDeployment: PackageDeployment) => {
			const workloadItem = workspaceData.state.workloadItem;
			if (!workloadItem?.definition) return;

			dispatch({ type: 'SET_DEPLOYMENT', payload: updatedDeployment });

			updatedDeployment.moduleInstallationStatuses = getModuleInstallationStatus(
				state.selectedModules,
				updatedDeployment,
			);

			// Ensure deployments array exists and handle case where deployment might not exist yet
			const currentDeployments = workloadItem.definition.deployments || [];
			const existingIndex = currentDeployments.findIndex((d) => d.id === updatedDeployment.id);

			let updatedSolutions: PackageDeployment[];
			if (existingIndex >= 0) {
				// Update existing deployment
				updatedSolutions = currentDeployments.map((deployment) =>
					deployment.id === updatedDeployment.id ? updatedDeployment : deployment,
				);
			} else {
				// Add new deployment if it doesn't exist
				updatedSolutions = [...currentDeployments, updatedDeployment];
			}

			const newItemDefinition: PackageInstallerItemDefinition = {
				...workloadItem.definition,
				deployments: updatedSolutions,
			};

			try {
				await saveItemDefinition<PackageInstallerItemDefinition>(
					workloadClient,
					workloadItem.id,
					newItemDefinition,
				);

				if (updatedDeployment.status === DeploymentStatus.Succeeded) {
					logger.info('Deployment succeeded');
				}
			} catch (error) {
				dispatch({
					type: 'SET_ERROR',
					payload: t('labels.deployment.errors.failed_to_update_deployment', { error: error.message }),
				});
			}
		},
		[workloadClient, t, state.selectedModules, workspaceData.state.workloadItem],
	);

	const buildRuntimePlaceholderMap = useCallback(() => {
		const overrides: Record<string, string> = {};
		if (state.selectedConnection) {
			overrides[FUNDRAISING_RUNTIME_VARIABLES.salesforceConnection] = state.selectedConnection;
		}
		if (state.selectedLakehouse) {
			overrides[FUNDRAISING_RUNTIME_VARIABLES.dynamicsConnectionId] = state.selectedLakehouse;
			const selectedLakehouseOption = workspaceData.state.lakehouses.find(
				(option) => option.value === state.selectedLakehouse,
			);
			if (selectedLakehouseOption?.label) {
				overrides[FUNDRAISING_RUNTIME_VARIABLES.dynamicsConnectionName] = selectedLakehouseOption.label;
			}
		}
		return overrides;
	}, [state.selectedConnection, state.selectedLakehouse, workspaceData.state.lakehouses]);

	const buildFundraisingItemNotificationButtons = useCallback(
		(pageId: 'overview' | 'deployments'): OpenNotificationConfig['buttons'] => {
			const workloadName = process.env.WORKLOAD_NAME;
			const workloadItem = workspaceData.state.workloadItem;

			if (!workloadName || !workloadItem?.id) {
				return undefined;
			}

			return [
				{
					action: OPEN_FUNDRAISING_ITEM_ACTION,
					workloadName,
					label: t('labels.deployment.view_fundraising_item', {
						itemName: t('Fundraising_Item_DisplayName'),
					}),
					data: {
						itemObjectId: workloadItem.id,
						pageId,
					},
				},
			];
		},
		[t, workspaceData.state.workloadItem],
	);

	const executeDeployment = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
		// Get fresh values each time we need them to avoid stale closures
		const packageDeployment = state.packageDeployment;
		const workloadItem = workspaceData.state.workloadItem;

		if (!packageDeployment) {
			const errorMessage = 'No package deployment available';
			dispatch({ type: 'SET_ERROR', payload: errorMessage });
			return { success: false, error: errorMessage };
		}

		if (!workloadItem) {
			const errorMessage = 'No workload item available';
			dispatch({ type: 'SET_ERROR', payload: errorMessage });
			return { success: false, error: errorMessage };
		}

		logger.debug(`Starting deployment: ${packageDeployment.id}`);

		updateDeploymentProgress(t('labels.deployment.progress.starting'), 0);

		// Create a new deployment object to avoid modifying the original
		let newDeployment: PackageDeployment = {
			...packageDeployment,
			selectedModules: Array.from(state.selectedModules),
			triggeredTime: new Date(),
		};

		const telemetryLakehouse = formatSelectionForTelemetry(workspaceData.state.lakehouses, state.selectedLakehouse);
		const telemetryConnection = formatSelectionForTelemetry(
			workspaceData.state.connections,
			state.selectedConnection,
		);
		const telemetryLocation = formatSelectionForTelemetry(workspaceData.state.folders, state.selectedLocation);

		// Prepare base telemetry data that will be used for both success and failure logging
		const baseTelemetryData = {
			itemId: workloadItem.id,
			itemName: workloadItem.displayName,
			correlationId: uuidv4(),
			deployment: newDeployment,
			deploymentName: state.deploymentName,
			workspaceId: workloadItem.workspaceId ?? newDeployment.workspace?.id,
			workspaceName:
				workspaceData.state.currentWorkspace?.displayName ?? newDeployment.workspace?.name ?? 'unknown',
			selectedModules: state.selectedModules,
			selectedLakehouseId: telemetryLakehouse.id,
			selectedLakehouseName: telemetryLakehouse.name,
			selectedConnectionId: telemetryConnection.id,
			selectedConnectionName: telemetryConnection.name,
			selectedLocationId: telemetryLocation.id,
			selectedLocationName: telemetryLocation.name,
		};

		// Log deployment started telemetry
		logDeploymentStarted(buildDeploymentTelemetryPayload({ ...baseTelemetryData, deployment: newDeployment }));

		try {
			// Use the persistent PackageInstallerContext from state
			const context = state.installerContext;

			if (!context) {
				throw new Error('Package context not loaded');
			}

			updateDeploymentProgress(t('labels.deployment.progress.validating_config'), 10);
			if (!newDeployment.workspace) {
				throw new Error(t('labels.deployment.workspace_not_defined'));
			}

			// Get the package from state (use modifiedPackage if available, otherwise originalPackage)
			const pack = state.modifiedPackage || state.originalPackage;
			if (!pack) {
				throw new Error(
					t('labels.deployment.errors.package_not_found', { packageId: newDeployment.packageId }),
				);
			}

			// Update the deployment to InProgress
			newDeployment.status = DeploymentStatus.InProgress;
			await handleDeploymentUpdate(newDeployment);

			// Initialize event handler with deployment update callback
			const fundraisingDeploymentEventHandler = new FundraisingDeploymentEventHandler(handleDeploymentUpdate);

			const strategy = DeploymentStrategyFactory.createStrategy(
				context,
				workloadItem,
				pack,
				newDeployment,
				fundraisingDeploymentEventHandler,
			);
			const runtimeVariables = buildRuntimePlaceholderMap();
			updateDeploymentProgress(t('labels.deployment.progress.starting_step'), 20);
			newDeployment = await strategy.deploy(
				state.deploymentName,
				updateDeploymentProgress,
				handleItemStatusUpdate,
				runtimeVariables,
			);

			const telemetryPayload = buildDeploymentTelemetryPayload({
				...baseTelemetryData,
				deployment: newDeployment,
			});

			logger.info('Deployment after deploy', { ...newDeployment });

			switch (newDeployment.status) {
				case DeploymentStatus.Succeeded: {
					callNotificationOpen(
						workloadClient,
						t('labels.deployment.finished'),
						'',
						NotificationType.Success,
						{
							buttons: buildFundraisingItemNotificationButtons('overview'),
						},
					);
					logDeploymentSucceeded(telemetryPayload);
					break;
				}
				case DeploymentStatus.Failed:
					callNotificationOpen(
						workloadClient,
						t('labels.deployment.failed'),
						newDeployment.errorDetails.errorMessage,
						NotificationType.Error,
						{
							buttons: buildFundraisingItemNotificationButtons('deployments'),
						},
					);
					logDeploymentFailed({
						...telemetryPayload,
						errorMessage: extractFailureMessage(newDeployment.job?.failureReason ?? newDeployment.job),
						errorDetails: newDeployment.job?.failureReason ?? newDeployment.job,
					});
					break;
				case DeploymentStatus.InProgress:
					callNotificationOpen(workloadClient, t('labels.deployment.started'), null, NotificationType.Info);
					break;
			}

			const isSuccess =
				newDeployment.status === DeploymentStatus.Succeeded ||
				newDeployment.status === DeploymentStatus.InProgress;
			const errorMessage =
				newDeployment.status === DeploymentStatus.Failed ? t('labels.deployment.failed') : undefined;

			await handleDeploymentUpdate(newDeployment);
			dispatch({ type: 'SET_DEPLOYMENT_IN_PROGRESS', payload: false });
			return { success: isSuccess, error: errorMessage };
		} catch (error) {
			logger.error('Deployment failed:', error);
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			newDeployment.status = DeploymentStatus.Failed;
			await handleDeploymentUpdate(newDeployment);

			logDeploymentFailed({
				...buildDeploymentTelemetryPayload({ ...baseTelemetryData, deployment: newDeployment }),
				errorMessage,
				errorDetails: error,
			});

			callNotificationOpen(workloadClient, t('labels.deployment.failed'), errorMessage, NotificationType.Error, {
				buttons: buildFundraisingItemNotificationButtons('deployments'),
			});
			dispatch({ type: 'SET_ERROR', payload: errorMessage });
			return { success: false, error: errorMessage };
		}
	}, [
		t,
		workloadClient,
		updateDeploymentProgress,
		handleItemStatusUpdate,
		handleDeploymentUpdate,
		state,
		workspaceData.state,
	]);

	const startDeployment = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
		const { packageDeployment: deployment, installerContext: context, originalPackage, modifiedPackage } = state;
		const { workloadItem } = workspaceData.state;

		// Use modifiedPackage if available, otherwise fall back to originalPackage
		const pack = modifiedPackage || originalPackage;

		// Simplified validation with early returns
		if (!deployment) {
			return createErrorResult(t('labels.deployment.errors.deployment_not_set'));
		}
		if (!workloadItem) {
			return createErrorResult(t('labels.deployment.errors.workload_item_not_loaded'));
		}
		if (!context) {
			return createErrorResult(t('labels.deployment.errors.package_context_not_loaded'));
		}
		if (!pack) {
			return createErrorResult(t('labels.deployment.errors.package_not_loaded'));
		}

		// Save the deployment to persistent storage
		try {
			const newItemDefinition: PackageInstallerItemDefinition = {
				...workloadItem.definition,
				deployments: Array.isArray(workloadItem.definition?.deployments)
					? [...workloadItem.definition.deployments, deployment]
					: [deployment],
			};

			await saveItemDefinition<PackageInstallerItemDefinition>(
				workloadClient,
				workloadItem.id,
				newItemDefinition,
			);
		} catch (error) {
			return createErrorResult(
				t('labels.deployment.errors.failed_to_save_deployment', {
					error: error instanceof Error ? error.message : 'Unknown error',
				}),
			);
		}

		const initialItemStatuses = createInitialDeploymentStatuses(pack?.items ?? []);
		dispatch({ type: 'SET_ITEM_STATUSES', payload: initialItemStatuses });
		dispatch({ type: 'SET_DEPLOYMENT_IN_PROGRESS', payload: true });
		dispatch({
			type: 'SET_DEPLOYMENT_PROGRESS',
			payload: {
				currentStep: t('labels.deployment.progress.initializing'),
				progress: 0,
			},
		});

		try {
			const deploymentResult = await executeDeployment();

			// Update error state based on deployment result
			dispatch({ type: 'SET_ERROR', payload: deploymentResult.success ? undefined : deploymentResult.error });
			dispatch({ type: 'SET_DEPLOYMENT_IN_PROGRESS', payload: false });

			// Only clear progress on failure, keep it on success for user feedback
			if (!deploymentResult.success) {
				dispatch({ type: 'SET_DEPLOYMENT_PROGRESS', payload: undefined });
			}

			return deploymentResult;
		} catch (error) {
			logger.error('Start deployment failed:', error);
			dispatch({ type: 'SET_DEPLOYMENT_IN_PROGRESS', payload: false });
			dispatch({ type: 'SET_DEPLOYMENT_PROGRESS', payload: undefined });
			return createErrorResult(
				t('labels.deployment.errors.deployment_failed', {
					error: error instanceof Error ? error.message : 'Unknown error',
				}),
			);
		}
	}, [t, state, workspaceData.state, executeDeployment, createErrorResult]);

	// User selection actions
	const setDeploymentName = useCallback((name: string) => {
		dispatch({ type: 'SET_DEPLOYMENT_NAME', payload: name });
	}, []);

	const setSelectedLakehouse = useCallback((lakehouse: string) => {
		dispatch({ type: 'SET_SELECTED_LAKEHOUSE', payload: lakehouse });
	}, []);

	const setSelectedConnection = useCallback((connection: string) => {
		dispatch({ type: 'SET_SELECTED_CONNECTION', payload: connection });
	}, []);

	const setSelectedLocation = useCallback((location: string) => {
		dispatch({ type: 'SET_SELECTED_LOCATION', payload: location });
	}, []);

	const addModule = useCallback((moduleType: ModuleType) => {
		dispatch({ type: 'ADD_MODULE', payload: moduleType });
	}, []);

	const removeModule = useCallback((moduleType: ModuleType) => {
		dispatch({ type: 'REMOVE_MODULE', payload: moduleType });
	}, []);

	const setHasDuplicateNames = useCallback((hasDuplicates: boolean) => {
		dispatch({ type: 'SET_HAS_DUPLICATE_NAMES', payload: hasDuplicates });
	}, []);

	useEffect(() => {
		if (!state.originalPackage) {
			return;
		}

		const originalItems = (state.originalPackage.items ?? []) as PackageItem[];
		const filteredItems = filterPackageItemsByModules<PackageItem>(originalItems, state.selectedModules);
		const preparedItems = preparePackageItemsForModules(filteredItems, state.selectedModules);

		const modifiedPackage: Package = {
			...state.originalPackage,
			items: preparedItems,
		};

		dispatch({ type: 'SET_MODIFIED_PACKAGE', payload: modifiedPackage });
	}, [state.originalPackage, state.selectedModules]);

	// Auto-set location based on workload item folder ID
	useEffect(() => {
		const workloadItemFolderId = workspaceData.state.workloadItem?.subfolderId;

		if (workloadItemFolderId && state.selectedLocation !== workloadItemFolderId) {
			setSelectedLocation(workloadItemFolderId);
		}
	}, [workspaceData.state.workloadItem?.subfolderId, state.selectedLocation, setSelectedLocation]);

	// Auto-fill deployment name when workload item is loaded (only once)
	useEffect(() => {
		const workloadItemName = workspaceData.state.workloadItem?.displayName;
		const hasInitializedName = state.deploymentName !== null;

		if (workloadItemName && !hasInitializedName) {
			setDeploymentName(workloadItemName);
		}
	}, [workspaceData.state.workloadItem?.displayName, state.deploymentName, setDeploymentName]);

	const contextValue: DeploymentContextValue = {
		state,
		actions: {
			setPackageDeployment,
			setModifiedPackage,
			addDeployment,
			startDeployment,
			setDeploymentName,
			setSelectedLakehouse,
			setSelectedConnection,
			setSelectedLocation,
			addModule,
			removeModule,
			setHasDuplicateNames,
			refreshItemNameValidation: refreshValidation,
		},
	};

	return <DeploymentContext.Provider value={contextValue}>{children}</DeploymentContext.Provider>;
};

// Hook to use the deployment context
export const useDeployment = (): DeploymentContextValue => {
	const context = useContext(DeploymentContext);
	if (context === undefined) {
		throw new Error('useDeployment must be used within a DeploymentProvider');
	}
	return context;
};
