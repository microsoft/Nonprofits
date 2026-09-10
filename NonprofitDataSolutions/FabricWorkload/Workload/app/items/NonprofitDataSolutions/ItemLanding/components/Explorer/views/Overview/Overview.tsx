import { Skeleton, SkeletonItem } from '@fluentui/react-components';

import { DeploymentStatus } from '@originalInstaller/PackageInstallerItemModel';

import { useWorkloadItemContext } from '@nds/ItemLanding/context/WorkloadItemContext';

import { useOverviewStyles } from './Overview.styles';
import type { OverviewProps } from './Overview.types';
import { HeroSection, OverviewFailure, OverviewSuccess } from './components';

/**
 * Main Overview component that routes to success or failure view
 * based on deployment status
 */
export const Overview: React.FC<OverviewProps> = ({ deployment }) => {
	const styles = useOverviewStyles();
	const isDeploymentFailed =
		deployment?.status === DeploymentStatus.Failed || deployment?.status === DeploymentStatus.InProgress;
	const { state } = useWorkloadItemContext();
	const isLoading = state.isLoading;

	return (
		<main className={styles.container} role="main">
			<div className={styles.content}>
				<HeroSection />

				{isLoading ? (
					<>
						<Skeleton aria-label="Loading content">
							<SkeletonItem size={72} shape="rectangle" className={styles.skeletonItem1} />
							<SkeletonItem size={128} shape="rectangle" className={styles.skeletonItem2} />
							<SkeletonItem size={128} shape="rectangle" className={styles.skeletonItem3} />
						</Skeleton>
					</>
				) : (
					<>{isDeploymentFailed ? <OverviewFailure deployment={deployment} /> : <OverviewSuccess />}</>
				)}
			</div>
		</main>
	);
};
