import { type FC } from 'react';

import { Button, MessageBar } from '@fluentui/react-components';

import { DeploymentStatus } from '@src/items/PackageInstallerItem/PackageInstallerItemModel';

import { PageId } from '../../ItemLanding.model';
import { useWorkloadItemContext } from '../../context/WorkloadItemContext';
import { deploymentStatusMessageBarLabels } from './DeploymentStatusMessageBar.model';
import { useDeploymentStatusMessageBarStyles } from './DeploymentStatusMessageBar.styles';

export const DeploymentStatusMessageBar: FC = () => {
	const styles = useDeploymentStatusMessageBarStyles();
	const { state, navigation } = useWorkloadItemContext();
	const { latestDeployment, pageId } = state;

	if (latestDeployment?.status !== DeploymentStatus.Failed) {
		return null;
	}

	const showButton = pageId !== PageId.Deployments;

	return (
		<MessageBar intent="error">
			<div className={styles.messageBarContent}>
				<span className={styles.messageText}>
					<strong>{deploymentStatusMessageBarLabels.failedTitle}</strong>{' '}
					{deploymentStatusMessageBarLabels.failedMessage}
				</span>
				{showButton && (
					<Button
						size="small"
						appearance="secondary"
						onClick={navigation.goToDeployments}
						className={styles.actionButton}
					>
						{deploymentStatusMessageBarLabels.goToDeploymentsButton}
					</Button>
				)}
			</div>
		</MessageBar>
	);
};
