import { useMemo } from 'react';

import { PackageInstallerItemDefinition } from '@src/items/PackageInstallerItem/PackageInstallerItemModel';
import { ItemWithDefinition } from '@src/controller/ItemCRUDController';
import { useWorkspaceMoveSimulation } from './useWorkspaceMoveSimulation';

export const SIMULATED_ORIGINAL_WORKSPACE_ID = 'SIMULATED_ORIGINAL_WORKSPACE';

export type WorkspaceMoveDetection = {
	isMoved: boolean;
	originalWorkspaceId?: string;
	currentWorkspaceId?: string;
	/** Whether the user already acknowledged the workspace move for the current workspace. */
	isAcknowledged: boolean;
	/** Whether blocking remediation already completed for the current workspace. */
	isRemediated: boolean;
};

/**
 * Detects when an installer item has been moved between workspaces via Fabric CI/CD (Deployment Pipelines).
 *
 * Heuristic:
 * - We treat `latestDeployment.workspace.id` as the original workspace that the deployment history refers to.
 * - We treat `workloadItem.workspaceId` as the current workspace.
 *
 * This hook does not mutate state; the Post-Deployment Setup flow is responsible for persisting `workspaceMove`.
 */
export const useWorkspaceMoveDetection = (
	workloadItem?: ItemWithDefinition<PackageInstallerItemDefinition>,
): WorkspaceMoveDetection => {
	const currentWorkspaceId = workloadItem?.workspaceId;
	const { isAllowed, state: simulation } = useWorkspaceMoveSimulation(currentWorkspaceId);

	return useMemo(() => {
		const definition = workloadItem?.definition;
		const deployments = definition?.deployments;
		const latest =
			Array.isArray(deployments) && deployments.length > 0
				? [...deployments].sort((a, b) => {
					const timeA = a.triggeredTime ? new Date(a.triggeredTime).getTime() : 0;
					const timeB = b.triggeredTime ? new Date(b.triggeredTime).getTime() : 0;
					return timeB - timeA;
				})[0]
				: undefined;

		const currentWorkspaceId = workloadItem?.workspaceId;
		const originalWorkspaceId = latest?.workspace?.id ?? definition?.workspaceMove?.originalWorkspaceId;

		const detectedMoved = !!currentWorkspaceId && !!originalWorkspaceId && currentWorkspaceId !== originalWorkspaceId;
		const simulatedMoved = isAllowed && simulation.simulateMoved;
		const isMoved = detectedMoved || simulatedMoved;

		const effectiveOriginalWorkspaceId =
			isMoved && currentWorkspaceId === originalWorkspaceId
				? SIMULATED_ORIGINAL_WORKSPACE_ID
				: originalWorkspaceId ?? (simulatedMoved ? SIMULATED_ORIGINAL_WORKSPACE_ID : undefined);

		// Consider acknowledged if we have an update record for this current workspace.
		const detectedAcknowledged =
			!!definition?.workspaceMove?.acknowledgedAtUtc &&
			definition.workspaceMove.currentWorkspaceId === currentWorkspaceId;
		const detectedRemediated =
			!!definition?.workspaceMove?.remediatedAtUtc &&
			definition.workspaceMove.currentWorkspaceId === currentWorkspaceId;
		const simulatedAcknowledged = isAllowed && (simulation.simulateAcknowledged || simulation.simulateRemediated);
		const isAcknowledged = detectedAcknowledged || simulatedAcknowledged;
		const isRemediated = detectedRemediated || (isAllowed && simulation.simulateRemediated);

		return { isMoved, originalWorkspaceId: effectiveOriginalWorkspaceId, currentWorkspaceId, isAcknowledged, isRemediated };
	}, [isAllowed, simulation, workloadItem]);
};
