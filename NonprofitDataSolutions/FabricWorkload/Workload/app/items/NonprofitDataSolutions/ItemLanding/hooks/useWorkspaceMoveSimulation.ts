/**
 * @fileoverview Test/Development-only workspace move simulation utilities.
 *
 * This module provides simulation capabilities for testing workspace move scenarios
 * without requiring actual Fabric Deployment Pipeline operations. It is gated by
 * environment configuration and only enabled in specific workspaces.
 *
 * **For testing/development purposes only.**
 * Should not be used in production code except for conditional rendering based on `isAllowed`.
 */

import { useEffect, useMemo, useSyncExternalStore } from 'react';

type WorkspaceMoveSimulationState = {
	simulateMoved: boolean;
	simulateAcknowledged: boolean;
	simulateRemediated: boolean;
	simulateMissingReport: boolean;
	simulateMissingOrchestrationPipeline: boolean;
	simulateMissingSemanticModel: boolean;
	simulateMissingGoldLakehouse: boolean;
	simulateMissingSilverLakehouse: boolean;
	simulateSampleDataMissing: boolean;
	simulateSqlMismatch: boolean;
	simulateSetupError: boolean;
};

const SIMULATION_WORKSPACE_IDS = (process.env.WORKSPACE_MOVE_SIMULATION_WORKSPACE_IDS ?? '')
	.split(',')
	.map((id) => id.trim().toLowerCase())
	.filter((id) => id.length > 0);

const DEV_WORKSPACE_ID = (process.env.DEV_WORKSPACE_ID ?? '').trim().toLowerCase();
const DEBUG_MODE_ENABLED = process.env.DEBUG_MODE_ENABLED === 'true';

const simulationWorkspaceAllowlist = new Set(SIMULATION_WORKSPACE_IDS);
if (DEBUG_MODE_ENABLED && DEV_WORKSPACE_ID.length > 0) {
	simulationWorkspaceAllowlist.add(DEV_WORKSPACE_ID);
}

const defaultSimulationState: WorkspaceMoveSimulationState = {
	simulateMoved: false,
	simulateAcknowledged: false,
	simulateRemediated: false,
	simulateMissingReport: false,
	simulateMissingOrchestrationPipeline: false,
	simulateMissingSemanticModel: false,
	simulateMissingGoldLakehouse: false,
	simulateMissingSilverLakehouse: false,
	simulateSampleDataMissing: false,
	simulateSqlMismatch: false,
	simulateSetupError: false,
};

const simulationStore = new Map<string, WorkspaceMoveSimulationState>();
const listeners = new Set<() => void>();
let storeVersion = 0;

const emit = () => {
	storeVersion++;
	listeners.forEach((listener) => listener());
};

const normalizeWorkspaceId = (workspaceId?: string): string | undefined => {
	if (!workspaceId) return undefined;
	const trimmed = workspaceId.trim().toLowerCase();
	return trimmed.length > 0 ? trimmed : undefined;
};

const isSimulationAllowed = (workspaceId?: string): boolean => {
	if (!DEBUG_MODE_ENABLED) return false;

	const normalizedWorkspaceId = normalizeWorkspaceId(workspaceId);
	if (!normalizedWorkspaceId) return false;
	return simulationWorkspaceAllowlist.has(normalizedWorkspaceId);
};

type SimulationSnapshot = {
	isAllowed: boolean;
	state: WorkspaceMoveSimulationState;
};

const DISALLOWED_SNAPSHOT: SimulationSnapshot = {
	isAllowed: false,
	state: defaultSimulationState,
};

const getSnapshot = (workspaceId?: string): SimulationSnapshot => {
	const normalizedWorkspaceId = normalizeWorkspaceId(workspaceId);
	if (!normalizedWorkspaceId || !isSimulationAllowed(normalizedWorkspaceId)) {
		return DISALLOWED_SNAPSHOT;
	}

	return {
		isAllowed: true,
		state: simulationStore.get(normalizedWorkspaceId) ?? defaultSimulationState,
	};
};

const subscribe = (listener: () => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};

const getStoreVersion = () => storeVersion;

export const useWorkspaceMoveSimulation = (workspaceId?: string) => {
	const version = useSyncExternalStore(subscribe, getStoreVersion, getStoreVersion);
	const snapshot = useMemo(() => getSnapshot(workspaceId), [workspaceId, version]);

	const normalizedWorkspaceId = normalizeWorkspaceId(workspaceId);

	const updateSimulation = (partial: Partial<WorkspaceMoveSimulationState>) => {
		if (!normalizedWorkspaceId || !snapshot.isAllowed) return;
		const current = simulationStore.get(normalizedWorkspaceId) ?? defaultSimulationState;
		simulationStore.set(normalizedWorkspaceId, { ...current, ...partial });
		emit();
	};

	const resetSimulation = () => {
		if (!normalizedWorkspaceId || !snapshot.isAllowed) return;
		simulationStore.delete(normalizedWorkspaceId);
		emit();
	};

	const hasOverrides = useMemo(
		() => Object.values(snapshot.state).some((value) => value),
		[snapshot.state],
	);

	useEffect(() => {
		if (!DEBUG_MODE_ENABLED) {
			return;
		}

		console.info('[WorkspaceMoveSimulation] state', {
			workspaceId,
			normalizedWorkspaceId,
			devWorkspaceId: DEV_WORKSPACE_ID,
			allowlist: [...simulationWorkspaceAllowlist],
			isAllowed: snapshot.isAllowed,
			hasOverrides,
			simulationState: snapshot.state,
		});
	}, [workspaceId, normalizedWorkspaceId, snapshot, hasOverrides]);

	return {
		isAllowed: snapshot.isAllowed,
		state: snapshot.state,
		hasOverrides,
		updateSimulation,
		resetSimulation,
	};
};

export type { WorkspaceMoveSimulationState };
