import React from 'react';

import { Button, Text } from '@fluentui/react-components';

import { FabricLink } from '@src/components/FabricLink';
import { useResolveMovedDeployedItem } from '@src/hooks/useResolveMovedDeployedItem';
import { useWorkloadItemContext } from '@src/items/NonprofitDataSolutions/ItemLanding/context/WorkloadItemContext';
import { useWorkspaceMoveDetection } from '@src/items/NonprofitDataSolutions/ItemLanding/hooks/useWorkspaceMoveDetection';
import { useWorkspaceMoveSimulation } from '@src/items/NonprofitDataSolutions/ItemLanding/hooks/useWorkspaceMoveSimulation';

import { useQuickStartSectionStyles } from './QuickStartSection.styles';
import type { QuickStartSectionProps } from './QuickStartSection.types';

export const QuickStartSection: React.FC<QuickStartSectionProps> = ({ data, stepsData }) => {
	const styles = useQuickStartSectionStyles();
	const { actions, state, navigation } = useWorkloadItemContext();
	const { latestDeployment } = state;

	const { orchestrationPipeline, fundraisingSemanticModel, fundraisingReport } = React.useMemo(() => {
		if (!latestDeployment) {
			return {
				orchestrationPipeline: undefined,
				fundraisingSemanticModel: undefined,
				fundraisingReport: undefined,
			};
		}

		return {
			orchestrationPipeline: latestDeployment.deployedItems.find(
				(item) => item.sourceId === 'Fundraising_Orchestration_DataPipeline' && item.type === 'DataPipeline',
			),
			fundraisingSemanticModel: latestDeployment.deployedItems.find(
				(item) => item.sourceId === 'Fundraising_Intelligence_SemanticModel' && item.type === 'SemanticModel',
			),
			fundraisingReport: latestDeployment.deployedItems.find(
				(item) => item.sourceId === 'Fundraising_Intelligence_Report' && item.type === 'Report',
			),
		};
	}, [latestDeployment]);

	const currentWorkspaceId = state.workloadItem?.workspaceId;
	const { isAllowed: isSimulationAllowed, state: simulation } = useWorkspaceMoveSimulation(currentWorkspaceId);
	const { isMoved, isAcknowledged } = useWorkspaceMoveDetection(state.workloadItem ?? undefined);
	const { resolveDeployedItem, isMovedAndUnresolved } = useResolveMovedDeployedItem(currentWorkspaceId, {
		enableResolution: isAcknowledged,
	});

	const resolvedOrchestrationPipeline =
		isSimulationAllowed && simulation.simulateMissingOrchestrationPipeline
			? undefined
			: resolveDeployedItem(orchestrationPipeline);
	const resolvedSemanticModel =
		isSimulationAllowed && simulation.simulateMissingSemanticModel
			? undefined
			: resolveDeployedItem(fundraisingSemanticModel);
	const resolvedReport =
		isSimulationAllowed && simulation.simulateMissingReport ? undefined : resolveDeployedItem(fundraisingReport);

	const isOrchestrationMissing = isMovedAndUnresolved(orchestrationPipeline, resolvedOrchestrationPipeline);
	const isSemanticModelMissing = isMovedAndUnresolved(fundraisingSemanticModel, resolvedSemanticModel);
	const isReportMissing = isMovedAndUnresolved(fundraisingReport, resolvedReport);

	const enhancedStepsData = stepsData.map((step) => {
		switch (step.id) {
			case 'open-deployments':
				return {
					...step,
					item: undefined,
					onClick: () => navigation.goToDeployments(),
				};

			case 'open-orchestration':
				return {
					...step,
					item: isOrchestrationMissing ? undefined : resolvedOrchestrationPipeline,
					onClick: isOrchestrationMissing ? undefined : step.onClick,
				};

			case 'open-semanticmodel':
				return {
					...step,
					item: isSemanticModelMissing ? undefined : resolvedSemanticModel,
					onClick: isSemanticModelMissing ? undefined : step.onClick,
				};

			case 'open-report':
				return {
					...step,
					item: isReportMissing ? undefined : resolvedReport,
					onClick: isReportMissing ? undefined : step.onClick,
				};
		}

		return step;
	});

	return (
		<section className={styles.quickStartSection} aria-labelledby="quickstart-title">
			<Text as="h2" className={styles.sectionTitle} id="quickstart-title">
				{data.title}
			</Text>

			{/* State 1: Single button (before deployment) */}
			{state.enableNewDeployment && (
				<Button
					appearance="primary"
					size="medium"
					className={styles.startButton}
					onClick={() => actions?.openDeploymentWizard()}
					aria-label="Open fundraising deployment wizard modal window and start deployment process"
				>
					{data.buttonText}
				</Button>
			)}

			{/* State 2: 4 elements block (after deployment) */}
			{!state.enableNewDeployment && latestDeployment && (
				<div className={styles.stepsContainer}>
					{enhancedStepsData.map((step) => (
						<div key={step.id} className={styles.stepItem}>
							<div className={styles.stepItemNumber}>{step.number}</div>
							<Text as="h3" className={styles.stepTitle}>
								{step.title}
							</Text>
							{step.item ? (
								<FabricLink
									type="item"
									itemType={step.item?.type}
									itemId={step.item?.id}
									workspaceId={step.item?.workspaceId}
								>
									<Button appearance="secondary" size="medium" className={styles.stepButton}>
										{step.buttonText}
									</Button>
								</FabricLink>
							) : (
								<>
									<Button
										appearance="secondary"
										size="medium"
										className={styles.stepButton}
										onClick={step.onClick}
										disabled={!step.onClick}
									>
										{step.buttonText}
									</Button>
									{isMoved && !step.onClick && step.id !== 'open-deployments' && (
										<>
											<Text className={styles.stepMissingText}>
												Item not found in this workspace. It may have been removed or renamed.
											</Text>
											<Button
												appearance="secondary"
												size="medium"
												className={styles.stepButton}
												onClick={() => navigation.goToDeployments()}
											>
												Open deployments
											</Button>
										</>
									)}
								</>
							)}
						</div>
					))}
				</div>
			)}
		</section>
	);
};
