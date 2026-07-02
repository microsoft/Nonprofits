import type { FC } from 'react';

import { Text, mergeClasses } from '@fluentui/react-components';
import { ArrowRight16Regular } from '@fluentui/react-icons';

import { ContentCard } from '@src/items/NonprofitDataSolutions/ItemLanding/components/Explorer/components/ContentCard';
import { Shimmer } from '@src/items/NonprofitDataSolutions/ItemLanding/components/Explorer/components/Shimmer';

import type { WorkspaceMappingCardProps } from './WorkspaceMappingCard.types';
import { useWorkspaceMappingCardStyles } from './WorkspaceMappingCard.styles';

export const WorkspaceMappingCard: FC<WorkspaceMappingCardProps> = ({
	isLoading,
	originalWorkspaceName,
	originalWorkspaceId,
	currentWorkspaceName,
	currentWorkspaceId,
}) => {
	const styles = useWorkspaceMappingCardStyles();

	return (
		<ContentCard title="Workspace mapping">
			{isLoading ? (
				<div className={styles.layout} aria-busy="true" aria-label="Loading workspace mapping">
					<div className={styles.card}>
						<Shimmer width="40%" height="12px" />
						<Shimmer width="70%" height="16px" />
						<Shimmer width="90%" height="12px" />
					</div>
					<div className={styles.arrow}>
						<Shimmer width="16px" height="16px" />
					</div>
					<div className={styles.card}>
						<Shimmer width="40%" height="12px" />
						<Shimmer width="70%" height="16px" />
						<Shimmer width="90%" height="12px" />
					</div>
				</div>
			) : (
				<div className={styles.layout}>
					<div className={styles.card}>
						<Text size={100} className={styles.label}>Original</Text>
						<Text size={300} weight="semibold">
							{originalWorkspaceName ?? 'Unknown'}
						</Text>
						<Text size={100} className={styles.id}>{originalWorkspaceId ?? 'Unknown'}</Text>
					</div>
					<div className={styles.arrow}>
						<ArrowRight16Regular aria-hidden="true" />
					</div>
					<div className={mergeClasses(styles.card, styles.cardCurrent)}>
						<Text size={100} className={mergeClasses(styles.label, styles.labelCurrent)}>Current</Text>
						<Text size={300} weight="semibold">
							{currentWorkspaceName ?? 'Unknown'}
						</Text>
						<Text size={100} className={styles.id}>{currentWorkspaceId ?? 'Unknown'}</Text>
					</div>
				</div>
			)}
		</ContentCard>
	);
};
