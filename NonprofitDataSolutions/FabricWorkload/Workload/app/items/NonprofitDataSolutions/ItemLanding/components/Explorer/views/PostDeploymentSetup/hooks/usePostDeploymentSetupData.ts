import { useEffect, useMemo, useState } from 'react';

import { useFabricContext } from '@src/context/FabricContext';
import { FabricPlatformAPIClient } from '@src/clients/FabricPlatformAPIClient';
import { OneLakeClient } from '@src/clients/OneLakeClient';

import { ModuleType } from '@src/items/NonprofitDataSolutions/DeploymentWizard/types/ModuleType';

import type { WorkspaceMoveDetection } from '@src/items/NonprofitDataSolutions/ItemLanding/hooks/useWorkspaceMoveDetection';
import type { WorkspaceMoveSimulationState } from '@src/items/NonprofitDataSolutions/ItemLanding/hooks/useWorkspaceMoveSimulation';
import type { PackageDeployment } from '@src/items/PackageInstallerItem/PackageInstallerItemModel';

import { loadSemanticModelDefinitionForItem } from '../utilities/loadSemanticModelDefinitionForItem';
import type { ResolvedTargets, SqlDatabaseArgs } from '../PostDeploymentSetup.types';
import {
	POST_DEPLOYMENT_LOADING_STEPS,
	POST_DEPLOYMENT_LOG_PREFIX,
	SAMPLE_DATA_MESSAGES,
	SEMANTIC_MODEL_MESSAGES,
} from '../utilities/postDeploymentMessages';
import { extractSqlDatabaseArgs, findSqlExpressionPart, tryDecodeBase64 } from '../utilities/semanticModelSqlUtils';
import { logMigrationDataLoadFailed } from '@src/items/NonprofitDataSolutions/telemetry/WorkloadMigrationTelemetry';

export type PostDeploymentSetupData = {
	originalWorkspaceName?: string;
	currentWorkspaceName?: string;
	currentSql?: SqlDatabaseArgs;
	targetSql?: SqlDatabaseArgs;
	sampleDataMissing?: boolean;
	loadingStepMessage?: string;
	/** Number of completed fetch steps (0–5). */
	loadedSteps: number;
	/** Total fetch steps. */
	totalSteps: number;
};


/**
 * Fetches all read-only data needed by the Post-Deployment Setup page:
 * workspace names, current/target SQL endpoints, and sample-data presence.
 *
 * Fetches run sequentially so the UI can show incremental progress.
 * The hook is a no-op when there is no workspace move or when blocking remediation already completed.
 */
export const usePostDeploymentSetupData = (
	move: WorkspaceMoveDetection,
	resolvedTargets: ResolvedTargets,
	latestDeployment?: PackageDeployment,
	simulation?: WorkspaceMoveSimulationState,
	itemId?: string,
	itemName?: string,
): PostDeploymentSetupData => {
	const { workloadClient } = useFabricContext();
	const fabricClient = useMemo(() => new FabricPlatformAPIClient(workloadClient), [workloadClient]);

	const TOTAL_STEPS = 5;
	const [data, setData] = useState<PostDeploymentSetupData>({ loadedSteps: 0, totalSteps: TOTAL_STEPS });

	const shouldFetch = move.isMoved && !move.isRemediated;
	const deploymentWorkspaceName = latestDeployment?.workspace?.name;
	const isSampleDataModuleSelected = (latestDeployment?.selectedModules ?? []).includes(ModuleType.Fundraising_SampleData);

	useEffect(() => {
		if (!shouldFetch) {
			// Preserve already-loaded data; only mark loading as complete
			setData((prev) => ({ ...prev, loadedSteps: TOTAL_STEPS, totalSteps: TOTAL_STEPS }));
			return undefined;
		}

		let cancelled = false;
		const partial: Omit<PostDeploymentSetupData, 'loadedSteps' | 'totalSteps'> = {};
		let step = 0;

		const update = () => {
			if (!cancelled) setData({ ...partial, loadedSteps: step, totalSteps: TOTAL_STEPS });
		};

		const run = async () => {
			const telemetryBase = {
				itemId: itemId ?? '',
				itemName,
				originalWorkspaceId: move.originalWorkspaceId,
				currentWorkspaceId: move.currentWorkspaceId,
			};

			// 1. Original workspace name
			partial.loadingStepMessage = POST_DEPLOYMENT_LOADING_STEPS.readOriginalWorkspace;
			update();
			try {
				const fromHistory = deploymentWorkspaceName;
				if (fromHistory) {
					partial.originalWorkspaceName = fromHistory;
				} else if (move.originalWorkspaceId) {
					const ws = await fabricClient.workspaces.getWorkspace(move.originalWorkspaceId);
					partial.originalWorkspaceName = ws?.displayName;
				}
			} catch (e) {
				console.warn('[PostDeploymentSetup] Failed to fetch original workspace name', e);
				logMigrationDataLoadFailed({
					...telemetryBase,
					step: 'OriginalWorkspaceName',
					errorMessage: e instanceof Error ? e.message : String(e),
					errorDetails: e,
				});
			}
			step++;
			update();
			if (cancelled) return;

			// 2. Current workspace name
			partial.loadingStepMessage = POST_DEPLOYMENT_LOADING_STEPS.readCurrentWorkspace;
			update();
			try {
				if (move.currentWorkspaceId) {
					const ws = await fabricClient.workspaces.getWorkspace(move.currentWorkspaceId);
					partial.currentWorkspaceName = ws?.displayName;
				}
			} catch (e) {
				console.warn('[PostDeploymentSetup] Failed to fetch current workspace name', e);
				logMigrationDataLoadFailed({
					...telemetryBase,
					step: 'CurrentWorkspaceName',
					errorMessage: e instanceof Error ? e.message : String(e),
					errorDetails: e,
				});
			}
			step++;
			update();
			if (cancelled) return;

			// 3. Target SQL endpoint (from Gold lakehouse)
			partial.loadingStepMessage = POST_DEPLOYMENT_LOADING_STEPS.readGoldSqlEndpoint;
			update();
			try {
				if (move.currentWorkspaceId && resolvedTargets.goldLakehouse?.id) {
					const lakehouse = await fabricClient.lakehouse.getLakehouse(
						move.currentWorkspaceId,
						resolvedTargets.goldLakehouse.id,
					);
					partial.targetSql = {
						server: lakehouse?.properties?.sqlEndpointProperties?.connectionString,
						endpointId: lakehouse?.properties?.sqlEndpointProperties?.id,
					};
				}
			} catch (e) {
				console.warn('[PostDeploymentSetup] Failed to fetch Gold lakehouse SQL endpoint', e);
				logMigrationDataLoadFailed({
					...telemetryBase,
					step: 'GoldLakehouseSqlEndpoint',
					errorMessage: e instanceof Error ? e.message : String(e),
					errorDetails: e,
				});
			}
			step++;
			update();
			if (cancelled) return;

			// 4. Current SQL reference (from Semantic Model expressions.tmdl)
			partial.loadingStepMessage = POST_DEPLOYMENT_LOADING_STEPS.readSemanticModelSqlEndpoint;
			update();
			try {
				if (resolvedTargets.semanticModel?.id) {
					const def = await loadSemanticModelDefinitionForItem(
						fabricClient,
						workloadClient,
						move.currentWorkspaceId,
						resolvedTargets.semanticModel.id,
					);
					const exprPart = findSqlExpressionPart(def?.definition?.parts ?? []);
					const text = tryDecodeBase64(exprPart?.payload);
					if (text) {
						partial.currentSql = extractSqlDatabaseArgs(text);
					}
				}
			} catch (e) {
				console.warn(`${POST_DEPLOYMENT_LOG_PREFIX} ${SEMANTIC_MODEL_MESSAGES.readExpressionsFailed}`, e);
				logMigrationDataLoadFailed({
					...telemetryBase,
					step: 'SemanticModelSqlEndpoint',
					errorMessage: e instanceof Error ? e.message : String(e),
					errorDetails: e,
				});
			}
			step++;
			update();
			if (cancelled) return;

			// 5. Sample data presence check
			partial.loadingStepMessage = POST_DEPLOYMENT_LOADING_STEPS.checkSampleDataPresence;
			update();
			try {
				if (isSampleDataModuleSelected) {
					if (move.currentWorkspaceId && resolvedTargets.silverLakehouse?.id) {
						const filePath = OneLakeClient.getPath(
							move.currentWorkspaceId,
							resolvedTargets.silverLakehouse.id,
							'Files/nds-silver-sampledata/Account.csv',
						);
						const exists = await fabricClient.oneLake.checkIfFileExists(filePath);
						partial.sampleDataMissing = !exists;
					}
				}
			} catch (e) {
				console.warn(`${POST_DEPLOYMENT_LOG_PREFIX} ${SAMPLE_DATA_MESSAGES.checkPresenceFailed}`, e);
				logMigrationDataLoadFailed({
					...telemetryBase,
					step: 'SampleDataPresenceCheck',
					errorMessage: e instanceof Error ? e.message : String(e),
					errorDetails: e,
				});
			}

			if (simulation?.simulateSampleDataMissing) {
				partial.sampleDataMissing = true;
			}

			if (simulation?.simulateSqlMismatch) {
				partial.currentSql = {
					server: 'simulated-sql-server',
					endpointId: 'simulated-endpoint-id',
				};
			}

			partial.loadingStepMessage = POST_DEPLOYMENT_LOADING_STEPS.loaded;

			step++;
			update();
		};

		run();

		return () => {
			cancelled = true;
		};
	}, [
		shouldFetch,
		deploymentWorkspaceName,
		isSampleDataModuleSelected,
		move.originalWorkspaceId,
		move.currentWorkspaceId,
		resolvedTargets.goldLakehouse?.id,
		resolvedTargets.semanticModel?.id,
		resolvedTargets.silverLakehouse?.id,
		simulation?.simulateSampleDataMissing,
		simulation?.simulateSqlMismatch,
	]);

	return data;
};
