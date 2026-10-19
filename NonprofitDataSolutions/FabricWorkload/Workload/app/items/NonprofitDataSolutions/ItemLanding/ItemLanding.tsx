import { MessageBar, mergeClasses } from '@fluentui/react-components';

import { useItemLandingStyles } from './ItemLanding.styles';
import { DeploymentStatusMessageBar } from './components/DeploymentStatusMessageBar';
import { WorkspaceMoveSimulationPanel } from './components/WorkspaceMoveSimulationPanel';
import { WorkspaceMoveMessageBar } from './components/WorkspaceMoveMessageBar';
import { Explorer } from './components/Explorer';
import { HomeTabList } from './components/HomeTabList';
import { Ribbon } from './components/Ribbon';
import { useWorkloadItemContext } from './context/WorkloadItemContext';

export const ItemLanding: React.FC = () => {
	const styles = useItemLandingStyles();
	const { state } = useWorkloadItemContext();

	return (
		<div className={mergeClasses(styles['*'], styles.itemLandingContainer)}>
			{/* Ribbon - Top navigation/toolbar */}
			<HomeTabList />

			<div className={styles.ribbonContainer}>
				<Ribbon />
			</div>

			{state.error && (
				<MessageBar intent="error" layout="multiline">
					{state.error}
				</MessageBar>
			)}

			<DeploymentStatusMessageBar />
			<WorkspaceMoveSimulationPanel />
			<WorkspaceMoveMessageBar />
			{/* Explorer - Main content area */}
			<div className={styles.explorerContainer}>
				<Explorer />
			</div>
		</div>
	);
};
