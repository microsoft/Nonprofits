import { FabricPlatformAPIClient } from '@clients/FabricPlatformAPIClient';
import { Item } from '@clients/FabricPlatformTypes';

import { DeploymentVariables, Package, PackageDeployment, PackageItem } from '../PackageInstallerItemModel';
import { BaseContext } from '../package/BaseContext';
import { DeploymentItemLifecycle, DeploymentItemStatusUpdate } from './DeploymentItemStatus';

// Special token allowing prefix resolution to pull from the current Package Installer item instance name
const DYNAMIC_PREFIX_TOKEN = 'PackageInstallerItemName';

/**
 * Central context object that manages state and operations during package deployment.
 * This class serves as the primary coordination point for deployment activities,
 * maintaining progress tracking, variable substitution, logging, and item management.
 *
 * Key responsibilities:
 * - Track deployment progress and communicate updates
 * - Manage variable substitution for dynamic content
 * - Provide centralized logging capabilities
 * - Maintain current item context during deployment
 * - Handle item naming with optional suffixes
 */
export class DeploymentContext extends BaseContext {
	/** The package being deployed */
	pack: Package;

	/** The deployment configuration and state */
	deployment: PackageDeployment;

	/** Current progress percentage (0-100) */
	currentProgress: number;

	/** The currently active Fabric item being processed */
	private currentItem: Item;

	/** The currently active package item definition being processed */
	private currentPackageItem: PackageItem;

	/** Callback function to report progress updates to the UI */
	private updateDeploymentProgress: (message: string, progress: number) => void;

	/** Callback function to publish per-item deployment status updates */
	private readonly onItemStatusUpdate?: (update: DeploymentItemStatusUpdate) => void;

	/** Reference to Fabric API client for custom handlers (attached by strategy) */
	private fabricClient: FabricPlatformAPIClient;

	/** Display name chosen by the user for this Package Installer item instance */
	private packageInstallerItemDisplayName: string = '';

	/** Resolved prefix applied to item names (may be empty) */
	private resolvedPrefix: string = '';

	/** Resolved suffix applied to item names (may be empty) */
	private resolvedSuffix: string = '';

	/**
	 * Creates a new deployment context for managing package deployment operations.
	 * Initializes variable mappings, progress tracking, and item name processing.
	 *
	 * @param pack - The package definition containing items to deploy
	 * @param deployment - The deployment configuration and target workspace information
	 * @param packageInstallerItemDisplayName - Display name chosen by the user for the Package Installer item instance
	 * @param updateDeploymentProgress - Callback function to report progress updates to the UI
	 *
	 * @example
	 * ```typescript
	 * const context = new DeploymentContext(
	 *   packageDefinition,
	 *   deploymentConfig,
	 *   packageInstallerItem.displayName,
	 *   (message, progress) => console.log(`${progress}%: ${message}`)
	 * );
	 * ```
	 */
	constructor(
		pack: Package,
		deployment: PackageDeployment,
		packageInstallerItemDisplayName: string | undefined,
		updateDeploymentProgress: (message: string, progress: number) => void,
		onItemStatusUpdate?: (update: DeploymentItemStatusUpdate) => void,
	) {
		super();
		this.pack = pack;
		this.deployment = deployment;
		this.packageInstallerItemDisplayName = (packageInstallerItemDisplayName ?? '').trim();
		this.onItemStatusUpdate = onItemStatusUpdate;
		// adding parameters
		if (Array.isArray(this.pack.deploymentConfig?.parameters) && this.pack.deploymentConfig.parameters.length > 0) {
			for (const [key, value] of this.pack.deploymentConfig.parameters) {
				this.variableMap[`{{${key}}}`] = value;
			}
		}
		// Initialize variable map with deployment variables
		this.variableMap[DeploymentVariables.DEPLOYMENT_ID] = deployment.id;
		this.variableMap[DeploymentVariables.PACKAGE_ID] = pack.id;
		this.variableMap[DeploymentVariables.WORKSPACE_ID] = deployment.workspace?.id;
		this.variableMap[DeploymentVariables.FOLDER_ID] = deployment.workspace?.folder?.id;
		this.resolvedSuffix = this.pack.deploymentConfig?.suffixItemNames ? `_${deployment.id}` : '';
		this.variableMap[DeploymentVariables.SUFFIX] = this.resolvedSuffix;

		this.resolvedPrefix = this.resolvePrefixValue(this.pack.deploymentConfig?.prefixItemNames);
		this.variableMap[DeploymentVariables.PREFIX] = this.resolvedPrefix;
		// Add workspace name if available now; if not but we have an ID, attempt lazy fetch later
		if (deployment.workspace?.name) {
			this.variableMap[DeploymentVariables.WORKSPACE_NAME] = deployment.workspace.name;
		} else if (deployment.workspace?.id) {
			// mark placeholder so downstream logic can trigger a fetch once Fabric client available
			this.variableMap[DeploymentVariables.WORKSPACE_NAME] = ''; // will be filled by ensureWorkspaceName()
		}
		this.currentProgress = 0;
		this.updateDeploymentProgress = updateDeploymentProgress;
		this.init();
	}

	reportItemStatus(packageItem: PackageItem, status: DeploymentItemLifecycle, errorMessage?: string): void {
		this.onItemStatusUpdate?.({
			packageItem,
			status,
			errorMessage,
			updatedAt: new Date(),
		});
	}

	/**
	 * Ensures workspace name is populated (and variable replaced) when only ID was initially provided.
	 * Safe to call multiple times; caches result.
	 */
	async ensureWorkspaceName(
		fetch: (workspaceId: string) => Promise<{ displayName: string } | undefined>,
	): Promise<string | undefined> {
		if (this.deployment.workspace?.name) {
			return this.deployment.workspace.name;
		}
		const wsId = this.deployment.workspace?.id;
		if (!wsId) return undefined;
		try {
			const info = await fetch(wsId);
			const name = info?.displayName;
			if (name) {
				this.deployment.workspace.name = name;
				this.variableMap[DeploymentVariables.WORKSPACE_NAME] = name;
				this.log(`Resolved workspace name '${name}' for id ${wsId}`);
				return name;
			}
		} catch (err) {
			this.log(`Failed to resolve workspace name for id ${wsId}: ${err}`);
		}
		return undefined;
	}

	/** Attach Fabric API client for downstream custom handlers */
	attachFabricClient(client: FabricPlatformAPIClient): void {
		this.fabricClient = client;
	}

	/** Retrieve Fabric API client */
	getFabricClient<T = FabricPlatformAPIClient>(): T {
		return this.fabricClient as T;
	}

	/**
	 * Initializes the deployment context by setting up package and deployment copies,
	 * and processing item display names with optional suffixes.
	 * @private
	 */
	private init() {
		this.pack = { ...this.pack };
		this.deployment = { ...this.deployment };
		// Update display names for all items in the package
		const shouldDecorateNames = (this.resolvedPrefix?.length ?? 0) > 0 || (this.resolvedSuffix?.length ?? 0) > 0;
		if (shouldDecorateNames && this.pack.items && this.pack.items.length > 0) {
			for (const item of this.pack.items) {
				const originalDisplayName = item.displayName;
				// Update the item's display name with suffix if configured
				item.displayName = this.decorateItemName(originalDisplayName);
				this.log(`Updated item display name: ${originalDisplayName} -> ${item.displayName}`);
			}
		}
	}

	/**
	 * Gets the workspace ID from the deployment configuration.
	 * @returns The workspace ID where items will be deployed, or undefined if not set
	 */
	getWorkspaceId() {
		return this.deployment.workspace?.id;
	}

	/**
	 * Gets the folder ID from the deployment configuration.
	 * @returns The folder ID where items will be deployed, or undefined if not set
	 */
	getFolderId() {
		return this.deployment.workspace?.folder?.id;
	}

	/**
	 * Sets the currently active item being processed during deployment.
	 * Updates the variable map with item-specific variables for template substitution.
	 *
	 * @param itemPac - The package item definition being processed (can be undefined)
	 * @param item - The actual Fabric item that was created (can be undefined)
	 *
	 * @remarks
	 * This method automatically creates variable mappings using the item's sourceId as the key
	 * (since displayName can be duplicated):
	 * - `{{<sourceId>}}` - Maps to the created Fabric item's ID for template substitution
	 *
	 * @example
	 * ```typescript
	 * context.setCurrentItem(packageItemDef, createdFabricItem);
	 * // Now variables like {{MyNotebook_sourceId}} will resolve to the created item's ID
	 * ```
	 */
	setCurrentItem(itemPac: PackageItem, item: Item): void {
		if (itemPac === undefined) {
			this.log('Package item definition is undefined in context.');
		} else if (item === undefined) {
			this.log('Fabric item is undefined in context for package item: ', itemPac.displayName);
		}

		this.currentItem = item;
		this.currentPackageItem = itemPac;
		// Create a variable mapping for template substitution using the item's sourceId
		// This allows other deployment steps to reference this item's ID in their configurations
		// Use sourceId as the key since displayName can be duplicated across items
		const itemKey = itemPac?.sourceId;
		const itemId = item?.id;
		// Only create the variable mapping when we have both a valid sourceId and item ID
		if (itemKey && itemId) {
			this.variableMap[`{{${itemKey}}}`] = itemId;
		}
	}

	/**
	 * Generates a display name for an item with optional suffix based on deployment configuration.
	 * @param item - The package item to generate a name for
	 * @returns The item's display name, optionally suffixed with the deployment ID
	 * @private
	 */
	private decorateItemName(baseName: string): string {
		return `${this.resolvedPrefix ?? ''}${baseName}${this.resolvedSuffix ?? ''}`;
	}

	private resolvePrefixValue(raw: string | null | undefined): string {
		if (raw === undefined || raw === null) {
			return '';
		}

		if (raw === DYNAMIC_PREFIX_TOKEN) {
			const instanceName = this.packageInstallerItemDisplayName;
			if (instanceName) {
				return instanceName.endsWith('_') ? instanceName : `${instanceName}_`;
			}
			const packageName = this.pack?.id ?? this.pack?.displayName ?? '';
			if (packageName) {
				return packageName.endsWith('_') ? packageName : `${packageName}_`;
			}
			return '';
		}

		return raw;
	}

	/**
	 * Gets the currently active Fabric item being processed during deployment.
	 * @returns The current Fabric item instance
	 */
	getCurrentItem(): Item {
		return this.currentItem;
	}

	/**
	 * Gets the currently active package item definition being processed during deployment.
	 * @returns The current package item definition
	 */
	getCurrentPackageItem(): PackageItem {
		return this.currentPackageItem;
	}

	/**
	 * Updates the deployment progress with a message and optional progress percentage.
	 * Also logs the message to the deployment logs.
	 *
	 * @param message - Progress message to display and log
	 * @param progress - Optional progress percentage (0-100)
	 *
	 * @example
	 * ```typescript
	 * context.updateProgress("Creating notebook...", 25);
	 * context.updateProgress("Deployment complete");
	 * ```
	 */
	updateProgress(message: string, progress?: number) {
		if (progress) {
			this.currentProgress = progress;
		}
		this.updateDeploymentProgress(message, this.currentProgress);
		this.log(message);
	}

	/**
	 * Injects runtime variables gathered from the deployment wizard so interceptors can resolve placeholders.
	 * Values with falsy content are ignored to avoid overwriting defaults.
	 */
	applyRuntimeVariables(variables: Record<string, string | undefined>): void {
		for (const [key, value] of Object.entries(variables)) {
			if (!key || !value) {
				continue;
			}
			this.variableMap[key] = value;
		}
	}
}
