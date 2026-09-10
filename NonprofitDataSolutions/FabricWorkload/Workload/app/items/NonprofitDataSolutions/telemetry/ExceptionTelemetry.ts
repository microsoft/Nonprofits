import { workloadTelemetryService } from '@services/telemetry';

// Single event name for all telemetry
const TELEMETRY_EVENT = 'Deployments';

/**
 * Operation names for exception tracking
 */
export enum ExceptionOperation {
	// Workspace Data
	WorkspaceDataSaveItemFailed = 'WorkspaceData.SaveItemFailed',
	WorkspaceDataLoadDataFailed = 'WorkspaceData.LoadDataFailed',
	WorkspaceDataLoadResourcesFailed = 'WorkspaceData.LoadResourcesFailed',

	// Deployment
	DeploymentFailed = 'Deployment.Failed',
}

export interface ExceptionTelemetryPayload {
	name: string;
	error: Error | unknown;
	itemId?: string;
	itemName?: string;
	workspaceId?: string;
	workspaceName?: string;
	additionalProperties?: Record<string, any>;
	// Note: tenantId and userId are automatically included via telemetryService.commonProperties
}

function buildExceptionProperties(payload: ExceptionTelemetryPayload) {
	const error = payload.error instanceof Error ? payload.error : undefined;

	return {
		operationName: payload.name,
		errorMessage: error ? error.message : String(payload.error),
		errorName: error?.name,
		itemId: payload.itemId,
		itemName: payload.itemName,
		workspaceId: payload.workspaceId,
		workspaceName: payload.workspaceName,
		...payload.additionalProperties,
	};
}

export function logException(payload: ExceptionTelemetryPayload): void {
	workloadTelemetryService.trackEvent(TELEMETRY_EVENT, buildExceptionProperties(payload));
}
