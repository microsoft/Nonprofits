import { workloadTelemetryService } from '@services/telemetry';

// Single event name for all telemetry
const TELEMETRY_EVENT = 'Deployments';

/**
 * Operation names that will be logged as a column in the telemetry table
 */
export enum DeploymentOperation {
	Started = 'Deployment.Started',
	Succeeded = 'Deployment.Succeeded',
	Failed = 'Deployment.Failed',
}

export interface DeploymentTelemetryPayload {
	itemId: string;
	itemName: string;
	correlationId?: string;
	deploymentId: string;
	packageId: string;
	deploymentName?: string;
	workspaceId?: string;
	workspaceName?: string;
	jobId?: string;
	triggeredBy?: string;
	modules?: string[];
	selectedLakehouseId?: string;
	selectedLakehouseName?: string;
	selectedConnectionId?: string;
	selectedConnectionName?: string;
	selectedLocationId?: string;
	selectedLocationName?: string;
	// Note: tenantId and userId are automatically included via telemetryService.commonProperties
}

export interface DeploymentFailureTelemetryPayload extends DeploymentTelemetryPayload {
	errorMessage?: string;
	errorDetails?: unknown;
}

function buildCommonProperties(payload: DeploymentTelemetryPayload, operationName: DeploymentOperation) {
	return {
		operationName,
		itemId: payload.itemId,
		itemName: payload.itemName,
		correlationId: payload.correlationId,
		deploymentId: payload.deploymentId,
		deploymentName: payload.deploymentName,
		packageId: payload.packageId,
		workspaceId: payload.workspaceId,
		workspaceName: payload.workspaceName,
		jobId: payload.jobId,
		triggeredBy: payload.triggeredBy,
		modules: payload.modules?.join(',') ?? undefined,
		selectedLakehouseId: payload.selectedLakehouseId,
		selectedLakehouseName: payload.selectedLakehouseName,
		selectedConnectionId: payload.selectedConnectionId,
		selectedConnectionName: payload.selectedConnectionName,
		selectedLocationId: payload.selectedLocationId,
		selectedLocationName: payload.selectedLocationName,
	};
}

export function logDeploymentStarted(payload: DeploymentTelemetryPayload): void {
	workloadTelemetryService.trackEvent(TELEMETRY_EVENT, buildCommonProperties(payload, DeploymentOperation.Started));
}

export function logDeploymentSucceeded(payload: DeploymentTelemetryPayload): void {
	workloadTelemetryService.trackEvent(TELEMETRY_EVENT, buildCommonProperties(payload, DeploymentOperation.Succeeded));
}

export function logDeploymentFailed(payload: DeploymentFailureTelemetryPayload): void {
	workloadTelemetryService.trackEvent(TELEMETRY_EVENT, {
		...buildCommonProperties(payload, DeploymentOperation.Failed),
		errorMessage: payload.errorMessage,
		errorDetails: payload.errorDetails ? JSON.stringify(payload.errorDetails) : undefined,
	});
}
