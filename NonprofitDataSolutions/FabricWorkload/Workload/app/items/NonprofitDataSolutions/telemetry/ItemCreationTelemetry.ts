import { workloadTelemetryService } from '@services/telemetry';

// Single event name for all telemetry
const TELEMETRY_EVENT = 'WorkloadItemCreate';

/**
 * Operation names for item creation telemetry
 */
export enum ItemCreationOperation {
	Succeeded = 'ItemCreation.Succeeded',
	Failed = 'ItemCreation.Failed',
}

export interface ItemCreationTelemetryPayload {
	itemId: string;
	itemName: string;
	workspaceId?: string;
	workspaceName?: string;
	itemType?: string;
	// Note: tenantId and userId are automatically included via telemetryService.commonProperties
}

export interface ItemCreationFailureTelemetryPayload extends ItemCreationTelemetryPayload {
	errorMessage?: string;
	errorDetails?: unknown;
}

function buildCommonProperties(payload: ItemCreationTelemetryPayload, operationName: ItemCreationOperation) {
	return {
		operationName,
		itemId: payload.itemId,
		itemName: payload.itemName,
		workspaceId: payload.workspaceId,
		workspaceName: payload.workspaceName,
		itemType: payload.itemType,
	};
}

export function logItemCreationSucceeded(payload: ItemCreationTelemetryPayload): void {
	workloadTelemetryService.trackEvent(
		TELEMETRY_EVENT,
		buildCommonProperties(payload, ItemCreationOperation.Succeeded),
	);
}

export function logItemCreationFailed(payload: ItemCreationFailureTelemetryPayload): void {
	workloadTelemetryService.trackEvent(TELEMETRY_EVENT, {
		...buildCommonProperties(payload, ItemCreationOperation.Failed),
		errorMessage: payload.errorMessage,
		errorDetails: payload.errorDetails ? JSON.stringify(payload.errorDetails) : undefined,
	});
}
