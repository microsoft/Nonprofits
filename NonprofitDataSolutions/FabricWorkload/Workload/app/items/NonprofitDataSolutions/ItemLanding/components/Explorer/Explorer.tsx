import { type FC, useCallback, useEffect, useMemo } from 'react';

import { PageId } from '@src/items/NonprofitDataSolutions/ItemLanding/ItemLanding.model';
import { useWorkloadItemContext } from '@src/items/NonprofitDataSolutions/ItemLanding/context/WorkloadItemContext';
import { logPageView } from '@src/items/NonprofitDataSolutions/telemetry/PageViewTelemetry';

import { explorerItems, explorerLabels } from './Explorer.model';
import { useExplorerStyles } from './Explorer.styles';
import { ExplorerSidebar } from './components/ExplorerSidebar';
import { ExplorerItemProps } from './components/ExplorerSidebar/components/ExplorerItem';
import { Deployments, Overview, PostDeploymentSetup } from './views';

export const Explorer: FC = () => {
	const { navigation, state, config } = useWorkloadItemContext();
	const styles = useExplorerStyles();

	// Log page view every time workloadItem and pageId change
	useEffect(() => {
		const workloadItem = state.workloadItem;
		const pageId = state.pageId;

		if (workloadItem && pageId) {
			const pageName = config.telemetryPageNames[pageId];

			if (pageName) {
				logPageView({
					pageName,
					itemId: workloadItem.id,
					itemName: workloadItem.displayName,
					workspaceId: workloadItem.workspaceId,
				});
			}
		}
	}, [state.workloadItem, state.pageId, config.telemetryPageNames]);

	const onItemSelect = useCallback(
		(item: ExplorerItemProps) => {
			switch (item.id) {
				case PageId.Overview:
					navigation.goToOverview();
					break;
				case PageId.Deployments:
					navigation.goToDeployments();
					break;

				default:
					logger.warn(`No navigation for item: ${item.id}`);
			}
		},
		[navigation],
	);
	const mainContent = useMemo(() => {
		switch (state.pageId) {
			case PageId.Overview:
				return <Overview deployment={state.latestDeployment} />;

			case PageId.Deployments:
				return <Deployments deployment={state.latestDeployment} />;

			case PageId.PostDeploymentSetup:
				return <PostDeploymentSetup />;

			default:
				return null;
		}
	}, [state.pageId, state.latestDeployment]);

	return (
		<div className={styles.explorerContainer} role="application" aria-label={explorerLabels.explorerInterface}>
			<ExplorerSidebar items={explorerItems} selectedItemId={state.pageId} onItemSelect={onItemSelect} />

			<main className={styles.mainContent} role="main" aria-label={explorerLabels.mainContentArea}>
				{mainContent}
			</main>
		</div>
	);
};
