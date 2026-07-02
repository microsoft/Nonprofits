import { useCallback, useMemo, useState } from 'react';

import { PayloadType } from '@ms-fabric/workload-client';

import { FabricPlatformAPIClient } from '@src/clients/FabricPlatformAPIClient';
import { useFabricContext } from '@src/context/FabricContext';
import { saveItemDefinition } from '@src/controller/ItemCRUDController';
import { PackageInstallerItemDefinition } from '@src/items/PackageInstallerItem/PackageInstallerItemModel';

import type { WorkspaceMoveDetection } from '@src/items/NonprofitDataSolutions/ItemLanding/hooks/useWorkspaceMoveDetection';
import { SIMULATED_ORIGINAL_WORKSPACE_ID } from '@src/items/NonprofitDataSolutions/ItemLanding/hooks/useWorkspaceMoveDetection';
import type { WorkspaceMoveSimulationState } from '@src/items/NonprofitDataSolutions/ItemLanding/hooks/useWorkspaceMoveSimulation';
import type { PackageDeployment } from '@src/items/PackageInstallerItem/PackageInstallerItemModel';

import {
	logMigrationSetupStarted,
	logMigrationSetupSucceeded,
	logMigrationSetupFailed,
	type WorkloadMigrationTelemetryPayload,
} from '@src/items/NonprofitDataSolutions/telemetry/WorkloadMigrationTelemetry';

import {
	PostDeploymentSetupPhase,
	type ResolvedTargets,
	type SetupSummaryLine,
	type SqlDatabaseArgs,
} from '../PostDeploymentSetup.types';
import { installSampleData } from '../utilities/installSampleData';
import { loadSemanticModelDefinitionForItem } from '../utilities/loadSemanticModelDefinitionForItem';
import {
	buildSampleDataFileProgressMessage,
	buildSqlExpressionPartNotFoundMessage,
	buildSampleDataInstallFailedMessage,
	buildSampleDataInstalledMessage,
	buildUnresolvedItemsWarningMessage,
	POST_DEPLOYMENT_RUN_MESSAGES,
	POST_DEPLOYMENT_SUMMARY_MESSAGES,
	SEMANTIC_MODEL_MESSAGES,
	toErrorMessage,
} from '../utilities/postDeploymentMessages';
import { findSqlExpressionPartIndex, replaceSqlDatabaseArgs, tryDecodeBase64 } from '../utilities/semanticModelSqlUtils';
import { shouldRewriteSqlEndpoint } from '../utilities/sqlRewriteDecision';

const utcNow = () => new Date().toISOString();

interface UseRunPostDeploymentSetupParams {
	workloadItem?: {
		id: string;
		displayName?: string;
		definition?: PackageInstallerItemDefinition;
	};
	reloadData?: () => Promise<void>;
	move: WorkspaceMoveDetection;
	resolvedTargets: ResolvedTargets;
	currentSql?: SqlDatabaseArgs;
	targetSql?: SqlDatabaseArgs;
	sampleDataMissing?: boolean;
	isLoadingData: boolean;
	latestDeployment?: PackageDeployment;
	simulation: WorkspaceMoveSimulationState;
	isSimulationAllowed: boolean;
	hasSimulationOverrides: boolean;
	resetSimulation: () => void;
}

interface UseRunPostDeploymentSetupResult {
	phase: PostDeploymentSetupPhase;
	progress: number;
	currentStepMessage?: string;
	sampleDataProgress?: string;
	error?: string;
	summary?: SetupSummaryLine[];
	canRunSetup: boolean;
	onRunSetup: () => Promise<void>;
}

export const useRunPostDeploymentSetup = (params: UseRunPostDeploymentSetupParams): UseRunPostDeploymentSetupResult => {
	const {
		workloadItem,
		reloadData,
		move,
		resolvedTargets,
		currentSql,
		targetSql,
		sampleDataMissing,
		isLoadingData,
		latestDeployment,
		simulation,
		isSimulationAllowed,
		hasSimulationOverrides,
		resetSimulation,
	} = params;

	const { workloadClient } = useFabricContext();
	const fabricClient = useMemo(() => new FabricPlatformAPIClient(workloadClient), [workloadClient]);

	const [phase, setPhase] = useState<PostDeploymentSetupPhase>(PostDeploymentSetupPhase.Idle);
	const [progress, setProgress] = useState<number>(0);
	const [currentStepMessage, setCurrentStepMessage] = useState<string | undefined>(undefined);
	const [sampleDataProgress, setSampleDataProgress] = useState<string | undefined>(undefined);
	const [error, setError] = useState<string | undefined>(undefined);
	const [summary, setSummary] = useState<SetupSummaryLine[] | undefined>(undefined);

	const canRunSetup = useMemo(() => {
		if (!move.isMoved) return false;
		if (move.isRemediated) return false;
		if (isLoadingData) return false;
		if (!resolvedTargets.semanticModel?.id) return false;
		if (!targetSql?.server || !targetSql?.endpointId) return false;
		if (phase === PostDeploymentSetupPhase.Done) return false;
		if (phase === PostDeploymentSetupPhase.Running) return false;
		return true;
	}, [
		move.isMoved,
		move.isRemediated,
		isLoadingData,
		resolvedTargets.semanticModel?.id,
		targetSql?.server,
		targetSql?.endpointId,
		phase,
	]);

	const onRunSetup = useCallback(async () => {
		if (phase === PostDeploymentSetupPhase.Running) return;
		setPhase(PostDeploymentSetupPhase.Running);
		setProgress(0);
		setCurrentStepMessage(POST_DEPLOYMENT_RUN_MESSAGES.preparing);
		setSampleDataProgress(undefined);
		setError(undefined);
		setSummary(undefined);

		const lines: SetupSummaryLine[] = [];
		const telemetryPayload: WorkloadMigrationTelemetryPayload = {
			itemId: workloadItem?.id ?? '',
			itemName: workloadItem?.displayName,
			originalWorkspaceId: move.originalWorkspaceId,
			currentWorkspaceId: move.currentWorkspaceId,
		};

		logMigrationSetupStarted({ ...telemetryPayload, startedAtUtc: utcNow() });

		try {
			if (!workloadItem?.definition || !move.currentWorkspaceId) {
				throw new Error('Workload item is not loaded');
			}

			if (!resolvedTargets.semanticModel?.id) {
				throw new Error('Semantic Model not found in the current workspace');
			}

			if (!targetSql?.server || !targetSql?.endpointId) {
				throw new Error('Gold lakehouse SQL endpoint details are not available');
			}

			setProgress(5);
			setCurrentStepMessage(POST_DEPLOYMENT_RUN_MESSAGES.detectedMove);
			lines.push({ message: POST_DEPLOYMENT_SUMMARY_MESSAGES.moveSetupStarted, success: true });

			// (1) Persist move metadata to installer item definition
			setProgress(10);
			setCurrentStepMessage(POST_DEPLOYMENT_RUN_MESSAGES.saveMoveMetadata);
			const persistableOriginalWorkspaceId =
				move.originalWorkspaceId === SIMULATED_ORIGINAL_WORKSPACE_ID
					? latestDeployment?.workspace?.id ?? workloadItem.definition.workspaceMove?.originalWorkspaceId
					: move.originalWorkspaceId;

			const acknowledgedAtUtc = workloadItem.definition.workspaceMove?.acknowledgedAtUtc ?? utcNow();
			const acknowledgedDefinition: PackageInstallerItemDefinition = {
				...workloadItem.definition,
				workspaceMove: {
					originalWorkspaceId: persistableOriginalWorkspaceId,
					currentWorkspaceId: move.currentWorkspaceId,
					detectedAtUtc: workloadItem.definition.workspaceMove?.detectedAtUtc ?? utcNow(),
					acknowledgedAtUtc,
					remediatedAtUtc: workloadItem.definition.workspaceMove?.remediatedAtUtc,
				},
			};
			await saveItemDefinition(workloadClient, workloadItem.id, acknowledgedDefinition);
			lines.push({ message: POST_DEPLOYMENT_SUMMARY_MESSAGES.moveMetadataUpdated, success: true });

			// (2) Resolve moved links (non-blocking)
			setProgress(20);
			setCurrentStepMessage(POST_DEPLOYMENT_RUN_MESSAGES.resolveItems);
			const unresolved: string[] = [];
			if (!resolvedTargets.report?.id) unresolved.push('Report');
			if (!resolvedTargets.orchestrationPipeline?.id) unresolved.push('Orchestration pipeline');
			if (!resolvedTargets.goldLakehouse?.id) unresolved.push('Gold lakehouse');
			if (unresolved.length > 0) {
				lines.push({ message: buildUnresolvedItemsWarningMessage(unresolved), success: false });
			} else {
				lines.push({ message: POST_DEPLOYMENT_SUMMARY_MESSAGES.resolvedItems, success: true });
			}

			// (3) Update Semantic Model SQL endpoint
			setProgress(30);
			setCurrentStepMessage(POST_DEPLOYMENT_RUN_MESSAGES.checkSqlAlignment);

			if (isSimulationAllowed && simulation.simulateSetupError) {
				throw new Error('[Simulated] Post-deployment setup failed during SQL endpoint update (test-only error).');
			}

			const forceSqlRewriteInSimulation = isSimulationAllowed && simulation.simulateMoved;
			const shouldRewriteSql = shouldRewriteSqlEndpoint({
				currentSql,
				targetSql,
				forceRewrite: forceSqlRewriteInSimulation,
			});

			if (!shouldRewriteSql) {
				lines.push({ message: POST_DEPLOYMENT_SUMMARY_MESSAGES.sqlAlreadyAligned, success: true });
			} else {
				setCurrentStepMessage(POST_DEPLOYMENT_RUN_MESSAGES.updateSqlEndpoint);
				const def = await loadSemanticModelDefinitionForItem(
					fabricClient,
					workloadClient,
					move.currentWorkspaceId,
					resolvedTargets.semanticModel.id,
				);

				const parts = def?.definition?.parts ?? [];
				const exprIndex = findSqlExpressionPartIndex(parts);
				if (exprIndex < 0) {
					throw new Error(buildSqlExpressionPartNotFoundMessage(parts.map((p: any) => p?.path)));
				}

				const exprPart = parts[exprIndex];
				const exprText = tryDecodeBase64(exprPart.payload);
				if (!exprText) {
					throw new Error(SEMANTIC_MODEL_MESSAGES.sqlPartDecodeFailed);
				}

				const updatedText = replaceSqlDatabaseArgs(exprText, {
					server: targetSql.server,
					endpointId: targetSql.endpointId,
				});

				parts[exprIndex] = {
					...exprPart,
					payload: btoa(updatedText),
					payloadType: PayloadType.InlineBase64,
				};

				await fabricClient.items.updateItemDefinition(move.currentWorkspaceId, resolvedTargets.semanticModel.id, {
					definition: {
						...(def?.definition ?? {}),
						parts,
					},
				});
				lines.push({ message: POST_DEPLOYMENT_SUMMARY_MESSAGES.sqlUpdated, success: true });
			}

			// (4) Re-install sample data into the current Silver lakehouse (if applicable)
			if (sampleDataMissing && resolvedTargets.silverLakehouse?.id) {
				setProgress(45);
				setCurrentStepMessage(POST_DEPLOYMENT_RUN_MESSAGES.reinstallSampleData);
				setSampleDataProgress(POST_DEPLOYMENT_RUN_MESSAGES.loadSampleDataList);
				const installResult = await installSampleData(
					fabricClient.oneLake,
					move.currentWorkspaceId,
					resolvedTargets.silverLakehouse.id,
					(prog) => {
						const pct = 45 + Math.round((prog.current / prog.total) * 50);
						setProgress(pct);
						setSampleDataProgress(buildSampleDataFileProgressMessage(prog.fileName, prog.current, prog.total));
					},
				);
				setSampleDataProgress(undefined);
				if (installResult.installedFiles.length > 0) {
					lines.push({ message: buildSampleDataInstalledMessage(installResult.installedFiles.length), success: true });
				}
				if (installResult.failedFiles.length > 0) {
					lines.push({
						message: buildSampleDataInstallFailedMessage(
							installResult.failedFiles.length,
							installResult.failedFiles,
						),
						success: false,
					});
				}
			} else if (sampleDataMissing && !resolvedTargets.silverLakehouse?.id) {
				lines.push({
					message: 'Warning: sample data could not be re-installed because the Silver lakehouse was not resolved in the current workspace.',
					success: false,
				});
			}

			setProgress(100);
			setCurrentStepMessage(POST_DEPLOYMENT_RUN_MESSAGES.finalizing);
			const remediatedDefinition: PackageInstallerItemDefinition = {
				...acknowledgedDefinition,
				workspaceMove: {
					...acknowledgedDefinition.workspaceMove,
					remediatedAtUtc: acknowledgedDefinition.workspaceMove?.remediatedAtUtc ?? utcNow(),
				},
			};
			await saveItemDefinition(workloadClient, workloadItem.id, remediatedDefinition);
			if (reloadData) {
				try {
					await reloadData();
				} catch (reloadError) {
					console.warn('[PostDeploymentSetup] Failed to reload workload item after remediation', reloadError);
				}
			}
			setSummary(lines);
			setPhase(PostDeploymentSetupPhase.Done);
			logMigrationSetupSucceeded({ ...telemetryPayload, finishedAtUtc: utcNow() });
			if (isSimulationAllowed && hasSimulationOverrides) {
				resetSimulation();
			}
		} catch (e: any) {
			setPhase(PostDeploymentSetupPhase.Error);
			setCurrentStepMessage(undefined);
			setError(`Post-deployment setup failed: ${toErrorMessage(e)}`);
			logMigrationSetupFailed({
				...telemetryPayload,
				finishedAtUtc: utcNow(),
				errorMessage: e instanceof Error ? e.message : String(e),
				errorDetails: e,
			});
		}
	}, [
		fabricClient,
		hasSimulationOverrides,
		isSimulationAllowed,
		move,
		phase,
		reloadData,
		resetSimulation,
		resolvedTargets,
		currentSql?.endpointId,
		currentSql?.server,
		simulation.simulateMoved,
		simulation.simulateSetupError,
		sampleDataMissing,
		targetSql,
		workloadClient,
		workloadItem,
		latestDeployment,
	]);

	return {
		phase,
		progress,
		currentStepMessage,
		sampleDataProgress,
		error,
		summary,
		canRunSetup,
		onRunSetup,
	};
};
