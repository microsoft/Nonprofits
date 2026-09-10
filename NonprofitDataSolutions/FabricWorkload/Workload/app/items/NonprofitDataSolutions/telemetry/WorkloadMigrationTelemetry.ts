import { workloadTelemetryService } from '@services/telemetry';

const TELEMETRY_EVENT = 'WorkloadMigration';

export enum WorkloadMigrationOperation {
	SetupStarted = 'WorkloadMigration.SetupStarted',
	SetupSucceeded = 'WorkloadMigration.SetupSucceeded',
	SetupFailed = 'WorkloadMigration.SetupFailed',
	DataLoadFailed = 'WorkloadMigration.DataLoadFailed',
}

export interface WorkloadMigrationTelemetryPayload {
	itemId: string;
	itemName?: string;
	originalWorkspaceId?: string;
	currentWorkspaceId?: string;
	// Note: tenantId and userId are automatically included via telemetryService.commonProperties
}

export interface WorkloadMigrationStartedPayload extends WorkloadMigrationTelemetryPayload {
	startedAtUtc: string;
}

export interface WorkloadMigrationSucceededPayload extends WorkloadMigrationTelemetryPayload {
	finishedAtUtc: string;
}

export interface WorkloadMigrationFailurePayload extends WorkloadMigrationTelemetryPayload {
	finishedAtUtc: string;
	errorMessage?: string;
	errorDetails?: unknown;
}

export interface WorkloadMigrationDataLoadFailurePayload extends WorkloadMigrationTelemetryPayload {
	step: string;
	errorMessage?: string;
	errorDetails?: unknown;
}

function buildCommonProperties(payload: WorkloadMigrationTelemetryPayload, operationName: WorkloadMigrationOperation) {
	return {
		operationName,
		itemId: payload.itemId,
		itemName: payload.itemName,
		originalWorkspaceId: payload.originalWorkspaceId,
		currentWorkspaceId: payload.currentWorkspaceId,
	};
}

export function logMigrationSetupStarted(payload: WorkloadMigrationStartedPayload): void {
	workloadTelemetryService.trackEvent(TELEMETRY_EVENT, {
		...buildCommonProperties(payload, WorkloadMigrationOperation.SetupStarted),
		startedAtUtc: payload.startedAtUtc,
	});
}

export function logMigrationSetupSucceeded(payload: WorkloadMigrationSucceededPayload): void {
	workloadTelemetryService.trackEvent(TELEMETRY_EVENT, {
		...buildCommonProperties(payload, WorkloadMigrationOperation.SetupSucceeded),
		finishedAtUtc: payload.finishedAtUtc,
	});
}

export function logMigrationSetupFailed(payload: WorkloadMigrationFailurePayload): void {
	workloadTelemetryService.trackEvent(TELEMETRY_EVENT, {
		...buildCommonProperties(payload, WorkloadMigrationOperation.SetupFailed),
		finishedAtUtc: payload.finishedAtUtc,
		errorMessage: payload.errorMessage,
		errorDetails: payload.errorDetails ? JSON.stringify(payload.errorDetails) : undefined,
	});
}

export function logMigrationDataLoadFailed(payload: WorkloadMigrationDataLoadFailurePayload): void {
	workloadTelemetryService.trackEvent(TELEMETRY_EVENT, {
		...buildCommonProperties(payload, WorkloadMigrationOperation.DataLoadFailed),
		step: payload.step,
		errorMessage: payload.errorMessage,
		errorDetails: payload.errorDetails ? JSON.stringify(payload.errorDetails) : undefined,
	});
}
