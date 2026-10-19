import { ItemDefinition } from '@ms-fabric/workload-client';

import { ItemWithDefinition } from '@controller/ItemCRUDController';

import { CreateScheduleRequest, Item } from '@clients/FabricPlatformTypes';

import {
	DeployedItem,
	DeploymentErrorDetails,
	DeploymentItemStatus,
	DeploymentJobInfo,
	DeploymentStatus,
	DeploymentVariables,
	InstallType,
	ItemPartInterceptorDefinition,
	Package,
	PackageDeployment,
	PackageInstallerItemDefinition,
	PackageItem,
	PackageItemData,
	PackageItemPart,
	PackageItemPayloadType,
	WorkspaceConfig,
} from '../PackageInstallerItemModel';
import { Interceptor, InterceptorFactory } from '../package/InterceptorFactory';
import { PackageInstallerContext } from '../package/PackageInstallerContext';
import { ContentHelper } from './ContentHelper';
import { DeploymentContext } from './DeploymentContext';
import { DeploymentEventHandler } from './DeploymentEventHandler';
import { DeploymentItemStatusUpdate } from './DeploymentItemStatus';

/**
 * Custom error class for item creation failures
 */
export class CreateItemError extends Error {
	constructor(
		public readonly itemName: string,
		public readonly itemType: string,
		public readonly details: string,
		public readonly originalError: Error | unknown,
	) {
		super(details);
		this.name = 'CreateItemError';

		// Maintain proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, CreateItemError);
		}
	}
}

// Abstract base class for deployment strategies
export abstract class DeploymentStrategy {
	constructor(
		protected context: PackageInstallerContext,
		protected item: ItemWithDefinition<PackageInstallerItemDefinition>,
		protected pack: Package,
		protected deployment: PackageDeployment,
		protected eventHandler?: DeploymentEventHandler,
	) {}

	async deploy(
		deploymentName: string,
		updateDeploymentProgress: (step: string, progress: number) => void,
		handleItemStatusUpdate?: (update: DeploymentItemStatusUpdate) => void,
		variableOverrides?: Record<string, string>,
	): Promise<PackageDeployment> {
		const depContext: DeploymentContext = new DeploymentContext(
			this.pack,
			this.deployment,
			deploymentName,
			updateDeploymentProgress,
			handleItemStatusUpdate,
		);
		let deploymentResult: PackageDeployment;

		if (variableOverrides) {
			depContext.applyRuntimeVariables(variableOverrides);
		}
		try {
			// Make Fabric client available to custom post-deploy handlers
			depContext.attachFabricClient(this.context.fabricPlatformAPIClient);

			const newWorkspace = await this.createWorkspaceAndFolder(this.deployment.workspace, depContext);
			depContext.deployment.workspace = newWorkspace;
			// Ensure we have the workspace name (for existing workspace deployments)
			await depContext.ensureWorkspaceName(async (id: string) => {
				try {
					return await this.context.fabricPlatformAPIClient.workspaces.getWorkspace(id);
				} catch {
					return undefined;
				}
			});

			deploymentResult = await this.deployInternal(depContext);
		} catch (error) {
			depContext.logError('Error in deployment:', error);
			depContext.deployment.status = DeploymentStatus.Failed;

			let errorMessage: string;
			let errorStack: string | undefined;
			let currentItemName: string | undefined;
			let currentItemType: string | undefined;

			// Extract information from CreateItemError if available
			if (error instanceof CreateItemError) {
				errorMessage = error.message;
				errorStack = error.stack;
				currentItemName = error.itemName;
				currentItemType = error.itemType;

				// Log the original error for debugging
				if (error.originalError instanceof Error) {
					depContext.logError(`Original error: ${error.originalError.message}`, error.originalError);
				}
			} else {
				// Fallback to generic error handling
				errorMessage = error instanceof Error ? error.message : String(error);
				errorStack = error instanceof Error ? error.stack : undefined;
				const currentItem = depContext.getCurrentItem();
				currentItemName = currentItem?.displayName;
				currentItemType = currentItem?.type;
			}

			const jobInfo = depContext.deployment.job;

			const errorDetails: DeploymentErrorDetails = {
				deploymentId: depContext.deployment.id,
				jobId: jobInfo?.id,
				jobStatus: jobInfo?.status,
				jobStartTime: jobInfo?.startTime?.toISOString(),
				jobEndTime: jobInfo?.endTime?.toISOString(),
				jobFailureReason: jobInfo?.failureReason,
				currentItemName,
				currentItemType,
				errorMessage,
				errorStack,
				error,
			};

			depContext.deployment.errorDetails = errorDetails;
			deploymentResult = depContext.deployment;
		} finally {
			this.writeLogsToOneLake(depContext);
		}

		return deploymentResult;
	}

	private async writeLogsToOneLake(depContext: DeploymentContext): Promise<void> {
		const log = await depContext.getLogText();
		const oneLakeClient = this.context.getOneLakeClientItemWrapper(this.item);
		await oneLakeClient.writeFileAsText(`Files/DeploymentLogs/DeploymentLog_${depContext.deployment.id}.txt`, log);
	}

	/**
	 * Abstract method that each strategy must implement
	 * @param depContext the object that holds the context on all operations
	 */
	abstract deployInternal(depContext: DeploymentContext): Promise<PackageDeployment>;

	/**
	 * Abstract method to update deployment status depending on the underlying strategy
	 */
	abstract updateDeploymentStatus(): Promise<PackageDeployment>;

	// Common functionality that all strategies can use
	protected async createWorkspaceAndFolder(
		workspaceConfig: WorkspaceConfig,
		depContext: DeploymentContext,
	): Promise<WorkspaceConfig> {
		depContext.updateProgress('Setting up a workspace...', 30);
		const fabricAPI = this.context.fabricPlatformAPIClient;

		const newWorkspaceConfig: WorkspaceConfig = {
			...workspaceConfig,
		};

		// Check if we need to create a new workspace
		if (newWorkspaceConfig?.createNew) {
			const workspace = await fabricAPI.workspaces.createWorkspace({
				displayName: newWorkspaceConfig.name,
				description: newWorkspaceConfig.description,
				capacityId: newWorkspaceConfig.capacityId,
			});
			newWorkspaceConfig.id = workspace.id;
			depContext.variableMap[DeploymentVariables.WORKSPACE_ID] = workspace.id;
			depContext.updateProgress(`Created new workspace: ${newWorkspaceConfig.name}`);
		}

		// Check if we need to create a new folder
		if (newWorkspaceConfig?.folder?.createNew) {
			const folder = await fabricAPI.folders.createFolder(newWorkspaceConfig.id, {
				displayName: newWorkspaceConfig.folder.name,
				parentFolderId: newWorkspaceConfig.folder.parentFolderId,
			});
			newWorkspaceConfig.folder.id = folder.id;
			depContext.variableMap[DeploymentVariables.FOLDER_ID] = folder.id;
			depContext.updateProgress(
				`Created new folder ${folder.displayName} for workspace: ${newWorkspaceConfig.name}`,
			);
		}
		return newWorkspaceConfig;
	}

	protected async startOnFinishJobs(depContext: DeploymentContext): Promise<void> {
		if (depContext.pack.deploymentConfig?.onFinishJobs?.length > 0) {
			const onFinishJobs = depContext.pack.deploymentConfig?.onFinishJobs || [];
			depContext.log(`Starting ${onFinishJobs.length} on-finish jobs`);

			// Initialize the onFinishJobs array if it doesn't exist
			if (!depContext.deployment.onFinishJobs) {
				depContext.deployment.onFinishJobs = [];
			}

			const promises = onFinishJobs.map(async (job: any) => {
				try {
					// Default behavior: scheduler-based Fabric job
					depContext.updateProgress(`Starting on-finish job: ${job.jobType} for item: ${job.itemId}`);

					let executionData = job.executionData;
					if (executionData) {
						executionData = await ContentHelper.replaceVariablesInObject(
							executionData,
							depContext.variableMap,
						);
					}

					const jobId = await this.context.fabricPlatformAPIClient.scheduler.runOnDemandItemJob(
						job.workspaceId,
						job.itemId,
						job.jobType,
						executionData ? { executionData: executionData } : undefined,
					);

					depContext.deployment.onFinishJobs.push({
						id: jobId,
						item: {
							id: job.itemId,
							workspaceId: job.workspaceId,
						},
						deploymentPolicy: job.deploymentPolicy,
						jobStatus: 'InProgress',
						status: 'InProgress' as any,
						// @ts-ignore preserve extended property for UI/logic
						jobKind: 'FabricJob',
					} as any);

					depContext.log(`Successfully started on-finish job: ${job.jobType} with ID: ${jobId}`);
				} catch (error) {
					const label = job.kind === 'CustomHandler' ? job.handlerName : job.jobType;
					depContext.logError(`Failed to start on-finish job: ${label}`, error);
				}
			});

			await Promise.all(promises);
			depContext.log(`Completed starting ${onFinishJobs.length} on-finish jobs`);
		}
	}

	/**
	 * Creates the items in the
	 * @param pack The package containing the items to create
	 * @param depContext The deployment context
	 */
	protected async createItems(pack: Package, depContext: DeploymentContext): Promise<void> {
		var percIteration = 70 / this.pack.items?.length;
		depContext.currentProgress = 30;

		const hasItems = this.pack.items && this.pack.items.length > 0;
		if (!hasItems) return;

		// Initialize deployedItems array if it doesn't exist
		if (!depContext.deployment.deployedItems) {
			depContext.deployment.deployedItems = [];
		}

		for (const itemDef of this.pack.items) {
			if (this.shouldProcessItem(itemDef) === false) continue;

			try {
				depContext.updateProgress(`Creating item: ${itemDef.displayName}  ${itemDef.type}`);
				depContext.reportItemStatus(itemDef, 'in-progress');

				const createdItem = await this.createItem(depContext, itemDef);
				if (createdItem) {
					depContext.reportItemStatus(itemDef, 'succeeded');

					// Add the successfully created item to deployedItems
					const deployedItem: DeployedItem = {
						...createdItem,
						sourceId: itemDef.sourceId,
						itemDefenitionName: itemDef.displayName,
						deploymentStatus: DeploymentItemStatus.Succeeded,
					};
					depContext.deployment.deployedItems.push(deployedItem);

					// Call event handler for post-item creation logic (telemetry, persistence)
					if (this.eventHandler) {
						await this.eventHandler.postItemPartCreation(itemDef, createdItem, undefined, depContext);
					}
				}
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error);
				depContext.reportItemStatus(itemDef, 'failed', errorMessage);

				// Add failed item to deployed items for tracking
				depContext.deployment.deployedItems.push({
					id: '',
					workspaceId: '',
					displayName: itemDef.displayName,
					type: itemDef.type,
					description: itemDef.description,
					sourceId: itemDef.sourceId,
					itemDefenitionName: itemDef.displayName,
					deploymentStatus: DeploymentItemStatus.Failed,
					creationError: errorMessage,
				});

				// Call event handler for post-item creation (telemetry, persistence)
				if (this.eventHandler) {
					await this.eventHandler.postItemPartCreation(itemDef, undefined, error, depContext);
				}

				throw error;
			} finally {
				depContext.currentProgress += percIteration;
			}
		}
	}

	protected async createData(pack: Package, depContext: DeploymentContext): Promise<void> {
		// If data is provided we upload the data to the OneLake folders
		if (pack.data?.length > 0) {
			depContext.updateProgress(`Uploading ${pack.data.length} data files to OneLake`);
			var packDataPromises = pack.data.map(async (packData) => {
				// Upload the data to OneLake
				//get the item from workspace id and item id in the data
				const item = await this.context.fabricPlatformAPIClient.items.getItem(
					packData.workspaceId,
					packData.itemId,
				);
				depContext.setCurrentItem(undefined, item);
				if (item) {
					await this.createPackageItemData(depContext, packData);
				} else {
					depContext.updateProgress(
						`Item not found: ${packData.itemId} in workspace: ${packData.workspaceId}`,
					);
				}
			});

			await Promise.all(packDataPromises);
		}
	}

	protected shouldProcessItem(item: PackageItem): boolean {
		const isPostDeploymentType = item.installType === InstallType.OnFinishJob;
		return !isPostDeploymentType;
	}

	/**
	 * Creates the item in the
	 * @param item The item to create
	 * @param workspaceId The workspace ID where the item should be created
	 * @param folderId
	 * @param itemNameSuffix Optional suffix to append to the item name
	 * @param direct If true, the item will be created directly in the create call if false two api calls for create and update definition will be used. In this case the returned item cann be null because the call is async
	 * @returns
	 */
	protected async createItem(depContext: DeploymentContext, packItem: PackageItem): Promise<Item> {
		try {
			let newItem: Item | undefined;
			if (this.shouldProcessItem(packItem)) {
				newItem = await this.createItemDefinition(packItem, depContext);
				if (!newItem) {
					throw new CreateItemError(
						packItem.displayName,
						packItem.type,
						'Item creation returned no result',
						new Error('createItemDefinition returned undefined'),
					);
				}

				const currentItem = depContext.getCurrentItem();
				if (!currentItem || currentItem.id !== newItem.id) {
					depContext.setCurrentItem(packItem, newItem);
				}

				await this.createItemData(depContext, packItem);
				await this.createItemSchedules(depContext, packItem);
			} else {
				depContext.logDebug(`Skipping item, will be created with a script: ${packItem.displayName}`);
			}

			return newItem;
		} catch (error) {
			// If it's already a CreateItemError, rethrow it
			if (error instanceof CreateItemError) {
				throw error;
			}

			// Wrap other errors in CreateItemError
			throw new CreateItemError(
				packItem.displayName,
				packItem.type,
				error instanceof Error ? error.message : String(error),
				error,
			);
		}
	}

	protected async createItemDefinition(packItem: PackageItem, depContext: DeploymentContext): Promise<Item> {
		let newItem;
		if (packItem.creationPayload) {
			// If creation payload is provided, use with-response to handle async 202
			logger.debug(`[Create ${packItem.type}] ${packItem.displayName}`);
			const createResp = await this.context.fabricPlatformAPIClient.items.createItemWithResponse(
				depContext.getWorkspaceId(),
				{
					displayName: packItem.displayName,
					type: packItem.type,
					description: packItem.description || '',
					folderId: depContext.getFolderId(),
					creationPayload: packItem.creationPayload,
				},
			);
			logger.debug(`[Create ${packItem.type}] initial response: ${createResp.status} ${createResp.statusText}`);
			logger.debug(
				`[Create ${packItem.type}] headers: operation-location='${createResp.headers['operation-location']}', location='${createResp.headers['location']}', request-id='${createResp.headers['x-ms-request-id'] || createResp.headers['request-id'] || createResp.headers['x-request-id'] || ''}'`,
			);
			if (createResp.rawBody) logger.debug(`[Create ${packItem.type}] raw body: ${createResp.rawBody}`);
			if (createResp.body && createResp.body.id) {
				newItem = createResp.body as any;
				depContext.setCurrentItem(packItem, newItem);
			} else if (createResp.status === 202) {
				const opLocation = createResp.headers['operation-location'] || createResp.headers['location'];
				if (opLocation) {
					newItem = await this.pollOperationForItem(
						opLocation,
						depContext,
						packItem,
						`creationPayload->create`,
						depContext.getWorkspaceId(),
					);
					if (newItem) depContext.setCurrentItem(packItem, newItem);
				} else {
					logger.warn(`[Create ${packItem.type}] 202 without operation header`);
				}
			}
		} else if (
			packItem.definition?.creationMode === 'WithoutDefinition' ||
			packItem.definition?.creationMode === 'CreateAndUpdateDefinition' ||
			(packItem.definition?.creationMode === undefined &&
				(packItem.definition?.interceptor ||
					packItem.schedules?.length > 0 ||
					packItem.data?.files?.length > 0) &&
				// Some types (e.g., SemanticModel) cannot be created without a definition
				packItem.type !== 'SemanticModel')
		) {
			//If there is any case where the id of the item is required immediately we first create the item to have the itemId for further calls
			//For the interceptor this is needed replace variables like {{WORKSPACE_ID}}, {{ITEM_ID}}, etc.
			//For data this is needed to upload the data to the Onelake where the id is needed
			//For schedules this is needed to create a schedule on a specific item
			{
				logger.debug(
					`[Create ${packItem.type}] sending create (without definition first) for '${packItem.displayName}'`,
				);
				const createResp = await this.context.fabricPlatformAPIClient.items.createItemWithResponse(
					depContext.getWorkspaceId(),
					{
						displayName: packItem.displayName,
						type: packItem.type,
						description: packItem.description || '',
						folderId: depContext.getFolderId(),
						creationPayload: undefined,
					},
				);
				logger.debug(
					`[Create ${packItem.type}] initial response: ${createResp.status} ${createResp.statusText}`,
				);
				logger.debug(
					`[Create ${packItem.type}] headers: operation-location='${createResp.headers['operation-location']}', location='${createResp.headers['location']}', request-id='${createResp.headers['x-ms-request-id'] || createResp.headers['request-id'] || createResp.headers['x-request-id'] || ''}'`,
				);
				if (createResp.rawBody) logger.debug(`[Create ${packItem.type}] raw body: ${createResp.rawBody}`);
				if (createResp.body && createResp.body.id) {
					newItem = createResp.body as any;
				} else if (createResp.status === 202) {
					const opLocation = createResp.headers['operation-location'] || createResp.headers['location'];
					if (opLocation) {
						newItem = await this.pollOperationForItem(
							opLocation,
							depContext,
							packItem,
							`create-first`,
							depContext.getWorkspaceId(),
						);
					} else {
						logger.warn(`[Create ${packItem.type}] 202 without operation header`);
					}
				}
				if (newItem) {
					// Set current item as soon as we have the created resource
					depContext.setCurrentItem(packItem, newItem);
				}
				if (newItem && packItem.definition?.creationMode !== 'WithoutDefinition') {
					const itemDef = await this.convertPackageItemDefinition(depContext, packItem);
					if (itemDef) {
						//There can be cases where no item def is provided (e.g. only files should be added)
						await this.context.fabricPlatformAPIClient.items.updateItemDefinition(
							depContext.getWorkspaceId(),
							newItem.id,
							{
								definition: itemDef,
							},
						);
					}
				}
			}
		}
		//not created so far let's try to create it with the definition
		if (!newItem) {
			// in all other cases we create the item with the definition directly
			const itemDef = await this.convertPackageItemDefinition(depContext, packItem);
			logger.debug(`[Create ${packItem.type}] ${packItem.displayName}`);
			const createResp = await this.context.fabricPlatformAPIClient.items.createItemWithResponse(
				depContext.getWorkspaceId(),
				{
					displayName: packItem.displayName,
					type: packItem.type,
					description: packItem.description || '',
					folderId: depContext.getFolderId(),
					definition: itemDef?.parts?.length > 0 ? itemDef : undefined,
				},
			);
			logger.debug(`[Create ${packItem.type}] initial response: ${createResp.status} ${createResp.statusText}`);
			logger.debug(
				`[Create ${packItem.type}] headers: operation-location='${createResp.headers['operation-location']}', location='${createResp.headers['location']}', request-id='${createResp.headers['x-ms-request-id'] || createResp.headers['request-id'] || createResp.headers['x-request-id'] || ''}'`,
			);
			if (createResp.rawBody) logger.debug(`[Create ${packItem.type}] raw body: ${createResp.rawBody}`);
			if (createResp.body && createResp.body.id) {
				newItem = createResp.body as any;
			} else if (createResp.status === 202) {
				const opLocation = createResp.headers['operation-location'] || createResp.headers['location'];
				if (opLocation) {
					newItem = await this.pollOperationForItem(
						opLocation,
						depContext,
						packItem,
						`with-definition`,
						depContext.getWorkspaceId(),
					);
				} else {
					logger.warn(`[Create ${packItem.type}] 202 without operation header`);
				}
				// Fallback: if there's no op header or ID not resolved, poll the workspace listing
				if (!newItem) {
					// packItem.displayName is already suffixed earlier if suffixItemNames=true
					const expectedName = packItem.displayName;
					const maxAttempts = 6;
					const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
					logger.debug(
						`[Create ${packItem.type}] fallback: searching workspace for item named '${expectedName}'`,
					);
					for (let i = 0; i < maxAttempts; i++) {
						const items = await this.context.fabricPlatformAPIClient.items.getItemsByType(
							depContext.getWorkspaceId(),
							packItem.type,
						);
						const found = items.find((i) => i.displayName === expectedName);
						if (found) {
							newItem = found;
							break;
						}
						await sleep(2500);
					}
					if (!newItem) logger.warn(`[Create ${packItem.type}] item not found`);
				}
			}
			if (newItem) {
				depContext.setCurrentItem(packItem, newItem);
			}
		}
		logger.info(
			`[Create ${packItem.type}] Successfully created item '${packItem?.displayName}' with id ${newItem?.id}`,
		);
		depContext.log(`Successfully created item ${packItem?.displayName} with id ${newItem?.id}`);
		return newItem;
	}

	private async createItemData(depContext: DeploymentContext, packItem: PackageItem): Promise<void> {
		// Copy every file to the item OneLake storage into the specified path
		if (packItem.data?.files?.length > 0) {
			depContext.log(
				`Copying ${packItem.data.files.length} data files to OneLake for item: ${packItem.displayName}`,
			);
			// Process all files in parallel
			await this.createPackageItemData(depContext, packItem.data);
		}
	}

	private async createPackageItemData(
		depContext: DeploymentContext,
		packageItemData: PackageItemData,
	): Promise<void> {
		let interceptor: Interceptor<any>;
		if (packageItemData.interceptor) {
			interceptor = InterceptorFactory.createInterceptor(packageItemData.interceptor, depContext);
		}

		const currentItem = depContext.getCurrentItem();
		if (!currentItem) {
			throw new Error('No current item available in deployment context when creating package item data.');
		}

		const filePromises = packageItemData.files.map(async (file) => {
			try {
				let filePath = file.path;
				let workspaceId = currentItem.workspaceId;
				let fileId = currentItem.id;
				// If an interceptor is defined, apply it to the parameters that should be used to create the OneLake file
				if (interceptor) {
					workspaceId = await interceptor.interceptText(workspaceId);
					fileId = await interceptor.interceptText(fileId);
					filePath = await interceptor.interceptText(filePath);
				}

				depContext.updateProgress(`Deploying file: ${file.path} for item: ${currentItem.displayName}`);

				// Get the file content based on payload type
				const fileContent = await this.getPackageItemPartContent(depContext, file, packageItemData.interceptor);

				// Write file to OneLake
				const oneLakeClient = this.context.getOneLakeClientItemWrapper(this.item);

				if (file.addToParentFolder) {
					const customFolderFilePath = fileId;

					await oneLakeClient.writeFileAsBase64AtCustomFolder(filePath, fileContent, customFolderFilePath);
				} else {
					await oneLakeClient.writeFileAsBase64(filePath, fileContent);
				}

				depContext.log(`Successfully copied file ${file.path} to OneLake for item: ${currentItem.displayName}`);
			} catch (error) {
				depContext.updateProgress(`Failed to copy file: ${file.path} for item: ${currentItem.displayName}`, 0);
				depContext.logError(
					`Failed to copy file ${file.path} to OneLake for item: ${currentItem.displayName}`,
					error,
				);
			}
		});
		await Promise.all(filePromises);
	}

	protected async createItemSchedules(depContext: DeploymentContext, item: PackageItem): Promise<void> {
		if (item.schedules?.length > 0) {
			depContext.log(`Creating ${item.schedules.length} schedules for item: ${item.displayName}`);

			// Create all schedules in parallel
			const schedulePromises = item.schedules.map(async (schedule) => {
				depContext.updateProgress(
					`Creating schedule for item: ${item.displayName} with type: ${schedule.configuration.type}`,
				);
				depContext.log(
					`Creating schedule for item: ${item.displayName} with type: ${schedule.configuration.type}`,
				);
				const request: CreateScheduleRequest = { ...schedule };
				return this.context.fabricPlatformAPIClient.scheduler.createItemSchedule(
					depContext.getWorkspaceId(),
					depContext.getCurrentItem().id,
					schedule.jobType,
					request,
				);
			});

			await Promise.all(schedulePromises);
		}
	}

	protected async convertPackageItemDefinition(
		depContext: DeploymentContext,
		packageItem: PackageItem,
	): Promise<ItemDefinition | undefined> {
		const definitionParts = [];
		const itemDefinition = packageItem.definition;
		if (itemDefinition?.parts?.length > 0) {
			for (const defPart of itemDefinition.parts) {
				const payloadData = await this.getPackageItemPartContent(
					depContext,
					defPart,
					itemDefinition.interceptor,
					packageItem,
				);

				definitionParts.push({
					path: defPart.path,
					payload: payloadData,
					payloadType: 'InlineBase64' as const,
				});
			}
			return {
				format: itemDefinition.format,
				parts: definitionParts,
			} as ItemDefinition;
		} else {
			return undefined;
		}
	}

	/**
	 * Retrieves the content of the deployment file based on its payload type
	 * @returns Promise<string> Base64 encoded content of the deployment file
	 */
	private async getPackageItemPartContent(
		depContext: DeploymentContext,
		defPart: PackageItemPart,
		interceptorDef?: ItemPartInterceptorDefinition<any>,
		packageItem?: PackageItem,
	): Promise<string> {
		let retVal: string;
		switch (defPart.payloadType) {
			case PackageItemPayloadType.AssetLink:
				// Fetch content from asset and encode as base64 (handles both text and binary)
				retVal = await ContentHelper.getAssetContentAsBase64(depContext, defPart.payload);
				break;
			case PackageItemPayloadType.Link:
				retVal = await ContentHelper.getLinkContentAsBase64(depContext, defPart.payload);
				break;
			case PackageItemPayloadType.OneLake:
				retVal = await this.context.fabricPlatformAPIClient.oneLake.readFileAsBase64(defPart.payload);
				break;
			case PackageItemPayloadType.InlineBase64:
				// Use base64 payload directly
				retVal = defPart.payload;
				break;
			default:
				throw new Error(`Unsupported payload type: ${defPart.payloadType}`);
		}

		if (this.eventHandler) {
			retVal = await this.eventHandler.preItemPartCreation(packageItem, defPart, retVal, depContext);
		}
		if (interceptorDef) {
			const interceptorInstance = InterceptorFactory.createInterceptor(interceptorDef, depContext);
			retVal = await interceptorInstance.interceptBase64(retVal);
		}
		return retVal;
	}

	// Poll an operation URL until it yields an item id or a terminal state.
	// Logs progress and raw bodies to console for diagnostics.
	private async pollOperationForItem(
		opUrl: string,
		depContext: DeploymentContext,
		packItem: PackageItem,
		phase: string,
		workspaceId: string,
	): Promise<Item | undefined> {
		const maxAttempts = 12; // ~24s at 2s intervals
		const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
		logger.debug(`[Create ${packItem.type}] polling ${phase}`);
		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			try {
				const op = await this.context.fabricPlatformAPIClient.items.getOperationWithResponse(opUrl);
				const state = op.body?.state || op.body?.status || op.body?.operationState || 'unknown';
				const id = op.body?.id || op.body?.result?.id || op.body?.result?.resourceId || op.body?.resourceId;
				logger.debug(`[Create ${packItem.type}] op poll #${attempt}: state='${state}', http=${op.status}`);
				if (op.rawBody) {
					logger.debug(`[Create ${packItem.type}] op raw body: ${op.rawBody}`);
				}
				if (id) {
					logger.debug(`[Create ${packItem.type}] id=${id}`);
					try {
						const fetched = await this.context.fabricPlatformAPIClient.items.getItem(workspaceId, id);
						return fetched;
					} catch (e) {
						logger.warn(`[Create ${packItem.type}] id ${id} not readable`);
					}
				}
				// Detect terminal failure states
				if (typeof state === 'string') {
					const s = state.toLowerCase();
					if (s.includes('fail') || s.includes('error') || s.includes('cancel')) {
						logger.error(`[Create ${packItem.type}] terminal state: ${state}`);
						return undefined;
					}
					if (s === 'succeeded' && !id) {
						// Try to find by display name (already suffixed if config enabled)
						try {
							const items = await this.context.fabricPlatformAPIClient.items.getItemsByType(
								workspaceId,
								packItem.type,
							);
							const found = items.find((i) => i.displayName === packItem.displayName);
							if (found) {
								logger.debug(
									`[Create ${packItem.type}] resolved item by name after success state (no id in op).`,
								);
								return found;
							}
						} catch (listErr) {
							logger.warn(`[Create ${packItem.type}] listing failed: ${listErr}`);
						}
					}
				}
			} catch (error) {
				logger.warn(`[Create ${packItem.type}] polling error:`, error);
			}
			await sleep(2000);
		}
		logger.warn(`[Create ${packItem.type}] polling timeout`);
		return undefined;
	}

	protected async checkDeployementState(): Promise<PackageDeployment> {
		logger.debug(`Checking availability: ${this.deployment.id}`);

		// Create a copy of the original deployment
		const deploymentCopy: PackageDeployment = {
			...this.deployment,
			deployedItems: [],
		};
		await this.checkItemDeploymentState(deploymentCopy);
		await this.checkOnFinishJobsState(deploymentCopy);
		logger.debug(
			`Deployment check complete. ${deploymentCopy.deployedItems.length} out of ${this.pack.items.length} items are available`,
		);

		try {
			var depStatus = DeploymentStatus.Succeeded;
			if (deploymentCopy.onFinishJobs) {
				deploymentCopy.onFinishJobs.forEach((element) => {
					if (element.deploymentPolicy === 'FailOnError') {
						const tempDepStatus = this.mapJobStatusToDeploymentStatus(element.status);
						switch (tempDepStatus) {
							case DeploymentStatus.Pending:
								if (depStatus != DeploymentStatus.Cancelled && depStatus != DeploymentStatus.Failed) {
									depStatus = DeploymentStatus.Pending;
								}
								break;
							case DeploymentStatus.InProgress:
								if (depStatus != DeploymentStatus.Cancelled && depStatus != DeploymentStatus.Failed) {
									depStatus = DeploymentStatus.InProgress;
								}
								break;
							case DeploymentStatus.Succeeded:
								//No change needed
								break;
							case DeploymentStatus.Cancelled:
								depStatus = DeploymentStatus.Cancelled;
								break;
							case DeploymentStatus.Failed:
								depStatus = DeploymentStatus.Failed;
								break;
							default:
								logger.error('Deployment status not supported');
						}
					}
				});
			}

			// Log summary of existing items in workspace for reference
			if (
				depStatus == DeploymentStatus.Succeeded &&
				deploymentCopy.deployedItems?.length === this.pack.items?.length
			) {
				logger.info(`All items deployed: ${deploymentCopy.id}`);
			} else {
				//give the UX job a timeout to finish all item creation
				const jobTimeoutTime = this.deployment.job?.endTime?.getTime() + 10 * 60 * 1000;
				const now = Date.now();
				if (jobTimeoutTime > now) {
					//use a timeout of the job as some of the deployment can be async for UX deployed items
					depStatus = DeploymentStatus.InProgress;
				} else {
					depStatus = DeploymentStatus.Failed;
				}
			}
			//set the actual status
			deploymentCopy.status = depStatus;
		} catch (error) {
			logger.error(`Check availability failed:`, error);
		}

		return deploymentCopy;
	}

	private async checkItemDeploymentState(packDeployment: PackageDeployment): Promise<void> {
		// Get all existing items in the workspace to check for conflicts
		let existingWorkspaceItems: Item[] = [];
		if (this.deployment.workspace?.id) {
			try {
				const fabricAPI = this.context.fabricPlatformAPIClient;
				existingWorkspaceItems = await fabricAPI.items.getAllItems(this.deployment.workspace.id);
				logger.debug(`Found ${existingWorkspaceItems.length} existing items`);
			} catch (error) {
				logger.warn(`Retrieve items failed:`, error);
			}
		}
		const promises = this.pack.items.map(async (itemDef) => {
			logger.debug(`Checking ${itemDef.type}: ${itemDef.displayName}`);

			try {
				// Check if the item type is supported/available
				const deployedItem = await this.getDeployedItem(itemDef, existingWorkspaceItems);

				if (deployedItem) {
					// Determine the final display name (with suffix if configured)
					packDeployment.deployedItems.push(deployedItem);
					logger.debug(`✓ ${itemDef.displayName}`);
				} else {
					logger.debug(`✗ ${itemDef.displayName}`);
				}
			} catch (error) {
				logger.warn(`Check ${itemDef.displayName} failed:`, error);
			}
		});
		// Wait for all item checks to complete
		await Promise.all(promises);
	}

	private async checkOnFinishJobsState(packDeployment: PackageDeployment): Promise<void> {
		return new Promise(async (resolve, reject) => {
			try {
				if (packDeployment.onFinishJobs) {
					logger.debug(`Checking jobs: ${packDeployment.id}`);
					packDeployment.onFinishJobs.map((jobInfo) => {
						this.updateDeploymentJobInfo(jobInfo);
						if (jobInfo.status === 'Completed') {
							logger.debug(`✓ Job ${jobInfo.id}`);
						} else {
							logger.debug(`✗ Job ${jobInfo.id}`);
						}
					});
				}
				resolve();
			} catch (error) {
				logger.error(`Check jobs ${packDeployment.id} failed:`, error);
				reject(error);
			}
		});
	}

	private async getDeployedItem(itemDef: PackageItem, items: Item[]): Promise<DeployedItem | undefined> {
		// List of supported item types in Fabric
		const name = itemDef.displayName;
		const deployedItem = items.find((i) => {
			return i.type === itemDef.type && i.displayName === name;
		});
		if (deployedItem) {
			return {
				...deployedItem,
				sourceId: itemDef.sourceId,
				itemDefenitionName: itemDef.displayName,
				deploymentStatus: DeploymentItemStatus.Succeeded,
			} as DeployedItem;
		} else {
			return undefined;
		}
	}

	protected async updateDeploymentJobInfo(depJobInfo: DeploymentJobInfo): Promise<void> {
		const fabricAPI = this.context.fabricPlatformAPIClient;
		const job = await fabricAPI.scheduler.getItemJobInstance(
			depJobInfo.item.workspaceId,
			depJobInfo.item.id,
			depJobInfo.id,
		);
		// Create updated job info with converted dates
		depJobInfo.startTime = job.startTimeUtc ? new Date(job.startTimeUtc) : undefined;
		depJobInfo.status = job.status;
		depJobInfo.endTime = job.endTimeUtc ? new Date(job.endTimeUtc) : undefined;
		depJobInfo.failureReason = job.failureReason && { failureReason: job.failureReason };
	}

	/**
	 * Maps job status from the API to deployment status
	 * @param jobStatus The job status from the API
	 * @returns The corresponding deployment status
	 */
	protected mapJobStatusToDeploymentStatus(jobStatus: string): DeploymentStatus {
		switch (jobStatus) {
			case 'Completed':
				return DeploymentStatus.Succeeded;
			case 'Failed':
				return DeploymentStatus.Failed;
			case 'Cancelled':
				return DeploymentStatus.Cancelled;
			default:
				logger.debug(`Job ${jobStatus} pending`);
				return DeploymentStatus.InProgress;
		}
	}
}
