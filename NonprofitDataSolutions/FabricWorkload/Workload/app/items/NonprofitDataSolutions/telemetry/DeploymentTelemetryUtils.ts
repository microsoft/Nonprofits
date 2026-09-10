import { PackageDeployment } from '@originalInstaller/PackageInstallerItemModel';

import { DeploymentTelemetryPayload } from './DeploymentTelemetry';

export interface BuildDeploymentTelemetryPayloadParams {
	itemId: string;
	itemName: string;
	correlationId?: string;
	deployment: PackageDeployment;
	deploymentName?: string;
	workspaceId?: string;
	workspaceName?: string;
	selectedModules: Set<string>;
	selectedLakehouseId?: string;
	selectedLakehouseName?: string;
	selectedConnectionId?: string;
	selectedConnectionName?: string;
	selectedLocationId?: string;
	selectedLocationName?: string;
}

export interface SelectionTelemetryDetails {
	id?: string;
	name?: string;
}

export function formatSelectionForTelemetry(
	options: Array<{ label: string; value: string }>,
	selectedValue?: string,
): SelectionTelemetryDetails {
	if (!selectedValue) {
		return {};
	}

	const result: SelectionTelemetryDetails = {
		id: selectedValue,
	};

	const match = options.find((option) => option.value === selectedValue);
	if (!match) {
		return result;
	}

	const trimmedLabel = match.label?.trim();
	if (!trimmedLabel) {
		return result;
	}

	result.name = trimmedLabel;
	return result;
}
export function buildDeploymentTelemetryPayload({
	itemId,
	itemName,
	correlationId,
	deployment,
	deploymentName,
	workspaceId,
	workspaceName,
	selectedModules,
	selectedLakehouseId,
	selectedLakehouseName,
	selectedConnectionId,
	selectedConnectionName,
	selectedLocationId,
	selectedLocationName,
}: BuildDeploymentTelemetryPayloadParams): DeploymentTelemetryPayload {
	return {
		itemId,
		itemName,
		correlationId,
		deploymentId: deployment.id,
		deploymentName: deploymentName ?? deployment.id,
		packageId: deployment.packageId,
		workspaceId: workspaceId ?? deployment.workspace?.id,
		workspaceName: workspaceName ?? deployment.workspace?.name ?? workspaceId ?? 'unknown',
		jobId: deployment.job?.id,
		triggeredBy: deployment.triggeredBy,
		modules: Array.from(selectedModules.values()),
		selectedLakehouseId,
		selectedLakehouseName,
		selectedConnectionId,
		selectedConnectionName,
		selectedLocationId,
		selectedLocationName,
	};
}

export function extractFailureMessage(details: unknown): string | undefined {
	if (!details) {
		return undefined;
	}

	if (typeof details === 'string') {
		return details;
	}

	if (details instanceof Error) {
		return details.message;
	}

	if (typeof details === 'object') {
		const messageCandidate = (details as { message?: unknown }).message;
		if (typeof messageCandidate === 'string') {
			return messageCandidate;
		}
	}

	return undefined;
}
