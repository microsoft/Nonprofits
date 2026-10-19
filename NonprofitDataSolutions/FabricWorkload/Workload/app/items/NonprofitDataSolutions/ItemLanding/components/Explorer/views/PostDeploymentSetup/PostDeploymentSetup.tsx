import { type FC, useCallback, useMemo, useRef } from 'react';

import { Button, MessageBar, Text } from '@fluentui/react-components';
import { ArrowSync16Regular } from '@fluentui/react-icons';

import { useResolveMovedDeployedItem } from '@src/hooks/useResolveMovedDeployedItem';
import type { DeployedItem } from '@src/items/PackageInstallerItem/PackageInstallerItemModel';

import { PageId } from '@src/items/NonprofitDataSolutions/ItemLanding/ItemLanding.model';
import { useWorkloadItemContext } from '@src/items/NonprofitDataSolutions/ItemLanding/context/WorkloadItemContext';
import {
	useWorkspaceMoveDetection,
} from '@src/items/NonprofitDataSolutions/ItemLanding/hooks/useWorkspaceMoveDetection';
import { useWorkspaceMoveSimulation } from '@src/items/NonprofitDataSolutions/ItemLanding/hooks/useWorkspaceMoveSimulation';

import { usePostDeploymentSetupStyles } from './PostDeploymentSetup.styles';
import { PostDeploymentSetupPhase, type ResolvedItemEntry, type ResolvedTargets } from './PostDeploymentSetup.types';
import { usePostDeploymentSetupData } from './hooks/usePostDeploymentSetupData';
import { useRunPostDeploymentSetup } from './hooks/useRunPostDeploymentSetup';

import { LoadingDataCard } from './components/LoadingDataCard';
import { ResolvedItemsCard } from './components/ResolvedItemsCard';
import { SampleDataCard } from './components/SampleDataCard';
import { SetupProgressCard } from './components/SetupProgressCard';
import { SetupSummaryCard } from './components/SetupSummaryCard';
import { SqlEndpointCard } from './components/SqlEndpointCard';
import { SuccessBanner } from './components/SuccessBanner';
import { WorkspaceMappingCard } from './components/WorkspaceMappingCard';

const findBySourceId = (deployment: any, sourceId: string): DeployedItem | undefined => {
	return deployment?.deployedItems?.find?.((d: DeployedItem) => d?.sourceId === sourceId);
};

export const PostDeploymentSetup: FC = () => {
	const styles = usePostDeploymentSetupStyles();
	const { state, actions, navigation } = useWorkloadItemContext();

	const workloadItem = state.workloadItem;
	const latestDeployment = state.latestDeployment;

	const move = useWorkspaceMoveDetection(workloadItem ?? undefined);
	const currentWorkspaceId = move.currentWorkspaceId;
	const { isAllowed: isSimulationAllowed, state: simulation, hasOverrides: hasSimulationOverrides, resetSimulation } = useWorkspaceMoveSimulation(currentWorkspaceId);

	const { resolveDeployedItem } = useResolveMovedDeployedItem(currentWorkspaceId);

	const resolvedTargets = useMemo<ResolvedTargets>(() => {
		if (!latestDeployment || !currentWorkspaceId) return {};

		const original = {
			goldLakehouse: findBySourceId(latestDeployment, 'Fundraising_GD_Lakehouse'),
			silverLakehouse: findBySourceId(latestDeployment, 'Fundraising_SL_Lakehouse'),
			semanticModel: findBySourceId(latestDeployment, 'Fundraising_Intelligence_SemanticModel'),
			report: findBySourceId(latestDeployment, 'Fundraising_Intelligence_Report'),
			orchestrationPipeline: findBySourceId(latestDeployment, 'Fundraising_Orchestration_DataPipeline'),
		} satisfies Record<string, DeployedItem | undefined>;

		const resolved = {
			goldLakehouse: original.goldLakehouse ? resolveDeployedItem(original.goldLakehouse) : undefined,
			silverLakehouse: original.silverLakehouse ? resolveDeployedItem(original.silverLakehouse) : undefined,
			semanticModel: original.semanticModel ? resolveDeployedItem(original.semanticModel) : undefined,
			report: original.report ? resolveDeployedItem(original.report) : undefined,
			orchestrationPipeline: original.orchestrationPipeline
				? resolveDeployedItem(original.orchestrationPipeline)
				: undefined,
		};

		if (!isSimulationAllowed) {
			return resolved;
		}

		return {
			goldLakehouse: simulation.simulateMissingGoldLakehouse ? undefined : resolved.goldLakehouse,
			silverLakehouse: simulation.simulateMissingSilverLakehouse ? undefined : resolved.silverLakehouse,
			semanticModel: simulation.simulateMissingSemanticModel ? undefined : resolved.semanticModel,
			report: simulation.simulateMissingReport ? undefined : resolved.report,
			orchestrationPipeline: simulation.simulateMissingOrchestrationPipeline
				? undefined
				: resolved.orchestrationPipeline,
		};
	}, [currentWorkspaceId, isSimulationAllowed, latestDeployment, resolveDeployedItem, simulation]);

	const { originalWorkspaceName, currentWorkspaceName, currentSql, targetSql, sampleDataMissing, loadingStepMessage, loadedSteps, totalSteps } =
		usePostDeploymentSetupData(move, resolvedTargets, latestDeployment, simulation, workloadItem?.id, workloadItem?.displayName);

	const isLoadingData = loadedSteps < totalSteps;

	const { phase, progress, currentStepMessage, sampleDataProgress, error, summary, canRunSetup, onRunSetup } =
		useRunPostDeploymentSetup({
			workloadItem,
			reloadData: actions.reloadData,
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
		});

	const missingPrerequisites = useMemo(() => {
		const reasons: string[] = [];

		if (!latestDeployment) {
			reasons.push('No deployment history was found for this item.');
		}

		if (!resolvedTargets.goldLakehouse?.id) {
			reasons.push('Gold lakehouse was not resolved in the current workspace (target SQL endpoint is unavailable).');
		}

		if (!resolvedTargets.semanticModel?.id) {
			reasons.push('Semantic model was not resolved in the current workspace.');
		}

		if (targetSql?.server && !targetSql?.endpointId) {
			reasons.push('Gold lakehouse SQL endpoint ID is missing.');
		}

		if (!targetSql?.server && targetSql?.endpointId) {
			reasons.push('Gold lakehouse SQL server is missing.');
		}

		if (!targetSql?.server || !targetSql?.endpointId) {
			reasons.push('Semantic model SQL endpoint cannot be updated until Gold lakehouse SQL endpoint is available.');
		}

		return reasons;
	}, [
		latestDeployment,
		resolvedTargets.goldLakehouse?.id,
		resolvedTargets.semanticModel?.id,
		targetSql?.endpointId,
		targetSql?.server,
	]);

	const resolvedItemEntries = useMemo<ResolvedItemEntry[]>(
		() => [
			{ label: 'Gold lakehouse', item: resolvedTargets.goldLakehouse, blocking: true },
			{ label: 'Silver lakehouse', item: resolvedTargets.silverLakehouse, blocking: false },
			{ label: 'Semantic model', item: resolvedTargets.semanticModel, blocking: true },
			{ label: 'Report', item: resolvedTargets.report, blocking: false },
			{ label: 'Orchestration pipeline', item: resolvedTargets.orchestrationPipeline, blocking: false },
		],
		[resolvedTargets],
	);

	const onCancel = useCallback(async () => {
		if (phase === PostDeploymentSetupPhase.Running) return;
		if (state.pageId === PageId.PostDeploymentSetup) {
			await navigation.goToOverview();
		}
	}, [navigation, phase, state.pageId]);

	// Track whether setup has ever started during this page session.
	// Once true, we never show the "no move detected" / "already remediated" guard messages.
	const hasRunRef = useRef(false);
	if (phase === PostDeploymentSetupPhase.Running || phase === PostDeploymentSetupPhase.Done || phase === PostDeploymentSetupPhase.Error) {
		hasRunRef.current = true;
	}

	if (!hasRunRef.current && !state.isLoading && (!move.isMoved || move.isRemediated)) {
		return (
			<div className={styles.root}>
				<MessageBar intent="info">
					{move.isRemediated
						? 'Post-deployment remediation is already completed for this workspace.'
						: 'No workspace change detected for this item.'}
				</MessageBar>
			</div>
		);
	}

	// While the workload item is still loading, don't render the full page with unresolved data
	if (!hasRunRef.current && state.isLoading) {
		return null;
	}

	return (
		<div className={styles.root}>
			<div className={styles.header}>
				<Text as="h2" block weight="semibold" size={500}>
					Post-deployment setup
				</Text>
				<Text block size={200} className={styles.subtitle}>
					This item was moved between workspaces via CI/CD. The steps below reconfigure SQL endpoints,
					re-map item links, and re-install sample data if needed.
				</Text>
			</div>

			<div className={styles.cardsContainer} aria-live="polite">
				{phase === PostDeploymentSetupPhase.Done && <SuccessBanner />}

				{isLoadingData && (
					<LoadingDataCard loadedSteps={loadedSteps} totalSteps={totalSteps} loadingStepMessage={loadingStepMessage} />
				)}

				<WorkspaceMappingCard
					isLoading={isLoadingData}
					originalWorkspaceName={originalWorkspaceName}
					originalWorkspaceId={move.originalWorkspaceId}
					currentWorkspaceName={currentWorkspaceName}
					currentWorkspaceId={move.currentWorkspaceId}
				/>

				<SqlEndpointCard isLoading={isLoadingData} currentSql={currentSql} targetSql={targetSql} />

				<ResolvedItemsCard isLoading={isLoadingData} entries={resolvedItemEntries} />

				{!isLoadingData && sampleDataMissing !== undefined && (
					<SampleDataCard sampleDataMissing={sampleDataMissing} silverLakehouseResolved={!!resolvedTargets.silverLakehouse?.id} />
				)}

				{/* Prerequisites warning */}
				{!canRunSetup &&
					!isLoadingData &&
					move.isMoved &&
					!move.isRemediated &&
					phase !== PostDeploymentSetupPhase.Done &&
					missingPrerequisites.length > 0 && (
					<MessageBar intent="warning" layout="multiline">
						<div className={styles.messageContent}>
							<Text weight="semibold">Run setup is disabled because:</Text>
							<ul className={styles.list}>
								{missingPrerequisites.map((reason, idx) => (
									<li key={idx}>{reason}</li>
								))}
							</ul>
						</div>
					</MessageBar>
				)}

				{/* Error */}
				{error && (
					<MessageBar intent="error" layout="multiline">
						{error}
					</MessageBar>
				)}

				{phase === PostDeploymentSetupPhase.Running && (
					<SetupProgressCard progress={progress} currentStepMessage={currentStepMessage} sampleDataProgress={sampleDataProgress} />
				)}

				{summary && <SetupSummaryCard summary={summary} />}
			</div>

			{/* Actions */}
			<div className={styles.actions}>
				<Button appearance="secondary" onClick={onCancel} disabled={phase === PostDeploymentSetupPhase.Running}>
					{phase === PostDeploymentSetupPhase.Done ? 'Close' : 'Cancel'}
				</Button>
				{!move.isRemediated && phase !== PostDeploymentSetupPhase.Done && (
					<Button appearance="primary" icon={<ArrowSync16Regular />} onClick={onRunSetup} disabled={!canRunSetup}>
						Run setup
					</Button>
				)}
			</div>
		</div>
	);
};
