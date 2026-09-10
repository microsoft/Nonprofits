import React from 'react';

import {
	Button,
	MessageBar,
	MessageBarActions,
	MessageBarBody,
	MessageBarTitle,
	Skeleton,
	SkeletonItem,
	Text,
} from '@fluentui/react-components';
import { ArrowDown16Regular } from '@fluentui/react-icons';

import { ItemsTable } from '@src/items/NonprofitDataSolutions/common/ItemsTable';
import { useDownloadDeploymentLogs } from '@src/items/NonprofitDataSolutions/hooks/useDownloadDeploymentLogs';
import { useWorkspaceMoveDetection } from '@src/items/NonprofitDataSolutions/ItemLanding/hooks/useWorkspaceMoveDetection';

import { useWorkloadItemContext } from '@nds/ItemLanding/context/WorkloadItemContext';

import { modulesModel } from './Deployments.fundraising.model';
// Helpers
import { deploymentsLabels, getModulesModel } from './Deployments.model';
import { useDeploymentsStyles } from './Deployments.styles';
import type { DeploymentsProps } from './Deployments.types';
import { DeploymentInformation } from './components/DeploymentInformation';
import { ModulesSection } from './components/ModuleSection';
import { SectionContainer } from './components/SectionContainer';

export const Deployments: React.FC<DeploymentsProps> = ({ deployment }) => {
	const styles = useDeploymentsStyles();
	const downloadDeploymentLogs = useDownloadDeploymentLogs();

	const { state, config } = useWorkloadItemContext();
	const isLoading = state.isLoading;
	const currentWorkspaceId = state.workloadItem?.workspaceId;
	const { isAcknowledged: workspaceMoveAcknowledged } = useWorkspaceMoveDetection(state.workloadItem ?? undefined);

	const downloadLogsOnClick = React.useCallback(() => {
		downloadDeploymentLogs(deployment);
	}, [deployment, downloadDeploymentLogs]);

	return (
		<main className={styles.container} role="main" aria-label={deploymentsLabels.mainAriaLabel}>
			{/* Header */}
			<header className={styles.header}>
				<Text as="h1" className={styles.title}>
					{deploymentsLabels.pageTitle}
				</Text>
				<Text className={styles.subtitle}>{config.displayName}</Text>
			</header>

			{/* Content */}
			<div className={styles.content}>
				{isLoading ? (
					<>
						<Skeleton aria-label={deploymentsLabels.loadingContent}>
							<SkeletonItem size={96} shape="rectangle" />
						</Skeleton>
					</>
				) : (
					<>
						{deployment ? (
							<>
								{deployment && <DeploymentInformation data={deployment} />}
								<ModulesSection
									modules={getModulesModel(
										modulesModel,
										deployment.selectedModules || [],
										deployment.moduleInstallationStatuses || {},
									)}
								/>
								{deployment.deployedItems && (
									<SectionContainer
										title={`${deploymentsLabels.itemsTitle}${deployment.deployedItems?.length > 0 ? ` (${deployment.deployedItems.length})` : ''}`}
										titleId="items-title"
									>
										{deployment.errorDetails && (
											<MessageBar intent="error">
												<MessageBarBody>
													<MessageBarTitle>
														{deploymentsLabels.itemCreationFailed}
													</MessageBarTitle>
													{deployment.errorDetails?.errorMessage}
												</MessageBarBody>
												<MessageBarActions>
													<Button icon={<ArrowDown16Regular />} onClick={downloadLogsOnClick}>
														{deploymentsLabels.downloadLogs}
													</Button>
												</MessageBarActions>
											</MessageBar>
										)}
										<ItemsTable
											items={deployment.deployedItems}
											tableAriaLabel={deploymentsLabels.itemsTableAriaLabel}
											currentWorkspaceId={currentWorkspaceId}
											enableMovedResolution={workspaceMoveAcknowledged}
										/>
									</SectionContainer>
								)}
							</>
						) : (
							<MessageBar intent="info">
								<MessageBarBody>
									<MessageBarTitle>{deploymentsLabels.noDeploymentTitle}</MessageBarTitle>
									{deploymentsLabels.noDeploymentMessage}
								</MessageBarBody>
							</MessageBar>
						)}
					</>
				)}
			</div>
		</main>
	);
};
