import { Item } from '@clients/FabricPlatformTypes';

import {
	DeploymentItemStatus,
	InstallType,
	PackageDeployment,
	PackageItem,
	PackageItemPart,
} from '@originalInstaller/PackageInstallerItemModel';
import { DeploymentContext } from '@originalInstaller/deployment/DeploymentContext';
import { DeploymentEventHandler } from '@originalInstaller/deployment/DeploymentEventHandler';

import { logDeploymentItemCreation } from '@nds/telemetry/DeploymentItemCreationTelemetry';

/**
 * Fundraising-specific deployment event handler that manages telemetry and persistence.
 */
export class FundraisingDeploymentEventHandler implements DeploymentEventHandler {
	constructor(private handleDeploymentUpdate: (updatedDeployment: PackageDeployment) => Promise<void>) {}
	public async preItemPartCreation(
		packageItem: PackageItem | undefined,
		itemPart: PackageItemPart,
		payloadData: string,
		depContext: DeploymentContext,
	): Promise<string> {
		switch (packageItem?.sourceId) {
			case 'Fundraising_Intelligence_SemanticModel':
				return await this.preSemanticModelDeployment(packageItem, itemPart, payloadData, depContext);
		}

		return payloadData;
	}

	public async postItemPartCreation(
		itemDefinition: PackageItem,
		createdItem: Item | undefined,
		error: Error | unknown | undefined,
		depContext: DeploymentContext,
	): Promise<void> {
		const errorMessage = error instanceof Error ? error.message : error ? JSON.stringify(error) : undefined;
		const errorStack = error instanceof Error ? error.stack : undefined;

		// Log telemetry
		logDeploymentItemCreation({
			itemId: createdItem?.id ?? '',
			itemName: createdItem?.displayName ?? itemDefinition.displayName,
			itemType: createdItem?.type ?? itemDefinition.type,
			sourceId: itemDefinition.sourceId,
			workspaceId: createdItem?.workspaceId ?? depContext.getWorkspaceId(),
			workspaceName: depContext.deployment.workspace?.name,
			deploymentId: depContext.deployment.id,
			packageId: depContext.pack.id,
			errorMessage,
			errorStack,
		});

		// Persist the current deployment state (items already added to deployedItems by BaseDeploymentStrategy)
		await this.persistDeploymentState(depContext);
	}

	/**
	 * Persists the current deployment state with complete information about deployed, failed, and skipped items.
	 * @param depContext - The deployment context
	 */
	private async persistDeploymentState(depContext: DeploymentContext): Promise<void> {
		// Create a complete deployment state including skipped items
		const updatedDeployment = this.createCompleteDeploymentState(depContext);

		// Delegate to the provided update handler
		await this.handleDeploymentUpdate(updatedDeployment);
	}

	/**
	 * Creates a complete deployment state including deployed, failed, and skipped items.
	 * @param depContext - The deployment context
	 * @returns A new deployment object with complete state
	 */
	private createCompleteDeploymentState(depContext: DeploymentContext): PackageDeployment {
		const updatedDeployment: PackageDeployment = {
			...depContext.deployment,
			deployedItems: [...(depContext.deployment.deployedItems || [])],
		};

		// Add skipped items (items that should not be processed)
		const processedItemNames = new Set(updatedDeployment.deployedItems.map((item) => item.itemDefenitionName));

		for (const itemDef of depContext.pack.items) {
			if (!this.shouldSkipItem(itemDef) && !processedItemNames.has(itemDef.displayName)) {
				updatedDeployment.deployedItems.push({
					id: '',
					workspaceId: '',
					displayName: itemDef.displayName,
					type: itemDef.type,
					description: itemDef.description,
					sourceId: itemDef.sourceId,
					itemDefenitionName: itemDef.displayName,
					deploymentStatus: DeploymentItemStatus.Skipped,
				});
			}
		}

		return updatedDeployment;
	}

	/**
	 * Determines if an item should be skipped during deployment.
	 * Items with InstallType.OnFinishJob are deployed after the main deployment.
	 * @param item - The package item to check
	 * @returns True if the item should be skipped
	 */
	private shouldSkipItem(item: PackageItem): boolean {
		return item.installType === InstallType.OnFinishJob;
	}

	private async preSemanticModelDeployment(
		packageItem: PackageItem,
		itemPart: PackageItemPart,
		payloadData: string,
		depContext: DeploymentContext,
	): Promise<string> {
		if (itemPart.path !== 'definition/expressions.tmdl') {
			return payloadData;
		}

		// Fetch Gold Lakehouse connection string and set it as variable
		const goldLakehouse = depContext.deployment.deployedItems.find(
			(di) => di.type === 'Lakehouse' && di.sourceId === 'Fundraising_GD_Lakehouse',
		);
		if (!goldLakehouse || !goldLakehouse.id) {
			logger.error('Gold Lakehouse not found or missing ID in deployed items', goldLakehouse);
			throw new Error('Gold Lakehouse not found or missing ID');
		}

		const fabricClient = depContext.getFabricClient();

		// Retry logic: SQL endpoint properties might not be available immediately after lakehouse creation
		const maxRetries = 60;
		const retryDelayMs = 2000; // 2 seconds
		let sqlServerHostname: string | undefined;
		let sqlEndpointId: string | undefined;

		for (let attempt = 1; attempt <= maxRetries; attempt++) {
			const lakehouseDetails = await fabricClient.lakehouse.getLakehouse(
				depContext.getWorkspaceId(),
				goldLakehouse.id,
			);
			sqlServerHostname = lakehouseDetails.properties?.sqlEndpointProperties?.connectionString;
			sqlEndpointId = lakehouseDetails.properties?.sqlEndpointProperties?.id;

			if (sqlServerHostname && sqlEndpointId) {
				// SQL Server hostname (e.g., "pwg4htrhog6ezg5lefmfkacucu-wmbsf26fi7ze3pbohwkxlvajki.datawarehouse.fabric.microsoft.com")
				depContext.variableMap['{{Fundraising_GD_SQL_Server}}'] = sqlServerHostname;
				
				// SQL Endpoint database ID (e.g., "ab1e0aa0-bb5e-4c53-bdac-5996d1b4e4c8")
				depContext.variableMap['{{Fundraising_GD_SQL_Endpoint}}'] = sqlEndpointId;
				
				logger.debug(
					`Successfully retrieved lakehouse SQL endpoint on attempt ${attempt} for lakehouse: ${goldLakehouse.displayName} (ID: ${goldLakehouse.id})`,
					{ server: sqlServerHostname, endpointId: sqlEndpointId },
				);
				break;
			}

			if (attempt < maxRetries) {
				logger.debug(
					`SQL endpoint properties not available yet for lakehouse: ${goldLakehouse.displayName} (ID: ${goldLakehouse.id}) - attempt ${attempt}/${maxRetries}, waiting ${retryDelayMs}ms...`,
				);
				await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
			}
		}

		if (!sqlServerHostname || !sqlEndpointId) {
			logger.error(
				`Failed to retrieve lakehouse SQL endpoint details after ${maxRetries} attempts for lakehouse: ${goldLakehouse.displayName} (ID: ${goldLakehouse.id})`,
			);
			throw new Error(`Lakehouse SQL endpoint not available after ${maxRetries} attempts`);
		}

		return payloadData;
	}
}
