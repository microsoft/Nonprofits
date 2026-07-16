import { workloadTelemetryService } from '@services/telemetry';

// Single event name for deployment item creation telemetry
const TELEMETRY_EVENT = 'DeploymentItemCreation';

/**
 * Operation names for deployment item creation telemetry
 */
export enum DeploymentItemCreationOperation {
	ItemCreated = 'DeploymentItemCreation.Success',
	ItemCreationFailed = 'DeploymentItemCreation.Failed',
}

export interface DeploymentItemCreationTelemetryPayload {
	itemId: string;
	itemName: string;
	itemType: string;
	sourceId?: string;
	workspaceId?: string;
	workspaceName?: string;
	deploymentId?: string;
	deploymentName?: string;
	packageId?: string;
	errorMessage?: string;
	errorStack?: string;
	// Note: tenantId and userId are automatically included via telemetryService.commonProperties
}

function buildItemCreationProperties(
	payload: DeploymentItemCreationTelemetryPayload,
	operationName: DeploymentItemCreationOperation,
) {
	return {
		operationName: operationName,
		itemId: payload.itemId,
		itemName: payload.itemName,
		itemType: payload.itemType,
		sourceId: payload.sourceId,
		workspaceId: payload.workspaceId,
		workspaceName: payload.workspaceName,
		deploymentId: payload.deploymentId,
		deploymentName: payload.deploymentName,
		packageId: payload.packageId,
		errorMessage: payload.errorMessage,
		errorStack: payload.errorStack,
	};
}

export function logDeploymentItemCreation(payload: DeploymentItemCreationTelemetryPayload): void {
	const operation = payload.errorMessage
		? DeploymentItemCreationOperation.ItemCreationFailed
		: DeploymentItemCreationOperation.ItemCreated;

	workloadTelemetryService.trackEvent(TELEMETRY_EVENT, buildItemCreationProperties(payload, operation));
}
