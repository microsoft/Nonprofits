import { type FC } from 'react';

import { Button, MessageBar } from '@fluentui/react-components';

import { useWorkspaceMoveDetection } from '@src/items/NonprofitDataSolutions/ItemLanding/hooks/useWorkspaceMoveDetection';

import { useWorkloadItemContext } from '../../context/WorkloadItemContext';
import { PageId } from '../../ItemLanding.model';
import { workspaceMoveMessageBarLabels } from './WorkspaceMoveMessageBar.model';
import { useWorkspaceMoveMessageBarStyles } from './WorkspaceMoveMessageBar.styles';

export const WorkspaceMoveMessageBar: FC = () => {
	const styles = useWorkspaceMoveMessageBarStyles();
	const { state, navigation } = useWorkloadItemContext();
	const { isMoved, isRemediated } = useWorkspaceMoveDetection(state.workloadItem ?? undefined);

	if (!isMoved || isRemediated || state.pageId === PageId.PostDeploymentSetup) {
		return null;
	}

	return (
		<MessageBar intent="warning" layout="multiline">
			<div className={styles.content}>
				<span className={styles.text}>
					<strong>{workspaceMoveMessageBarLabels.title}</strong> {workspaceMoveMessageBarLabels.message}
				</span>
				<Button
					size="small"
					appearance="secondary"
					onClick={navigation.goToPostDeploymentSetup}
					className={styles.button}
				>
					{workspaceMoveMessageBarLabels.button}
				</Button>
			</div>
		</MessageBar>
	);
};
