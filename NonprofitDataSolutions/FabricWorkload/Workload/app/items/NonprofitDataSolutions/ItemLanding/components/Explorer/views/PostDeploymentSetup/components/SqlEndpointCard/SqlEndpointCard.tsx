import type { FC } from 'react';

import { Text } from '@fluentui/react-components';

import { ContentCard } from '@src/items/NonprofitDataSolutions/ItemLanding/components/Explorer/components/ContentCard';
import { Shimmer } from '@src/items/NonprofitDataSolutions/ItemLanding/components/Explorer/components/Shimmer';

import type { SqlEndpointCardProps } from './SqlEndpointCard.types';
import { useSqlEndpointCardStyles } from './SqlEndpointCard.styles';

export const SqlEndpointCard: FC<SqlEndpointCardProps> = ({ isLoading, currentSql, targetSql }) => {
	const styles = useSqlEndpointCardStyles();

	return (
		<ContentCard title="Semantic Model SQL endpoint">
			{isLoading ? (
				<div className={styles.grid} aria-busy="true" aria-label="Loading SQL endpoint data">
					<div className={styles.column}>
						<Shimmer width="50%" height="12px" />
						<Shimmer width="80%" height="16px" />
					</div>
					<div className={styles.column}>
						<Shimmer width="50%" height="12px" />
						<Shimmer width="95%" height="16px" />
						<Shimmer width="60%" height="16px" />
					</div>
				</div>
			) : (
				<div className={styles.grid}>
					<div className={styles.column}>
						<Text size={100} weight="semibold" className={styles.columnHeader}>Current (from Semantic Model)</Text>
						<Text size={100} className={styles.fieldLabel}>Connection string</Text>
						<Text size={200}>{currentSql?.server ?? 'Unknown'}</Text>
						<Text size={100} className={styles.fieldLabel}>Endpoint ID</Text>
						<Text size={200}>{currentSql?.endpointId ?? 'Unknown'}</Text>
					</div>
					<div className={styles.column}>
						<Text size={100} weight="semibold" className={styles.columnHeader}>Target (from Gold lakehouse)</Text>
						<Text size={100} className={styles.fieldLabel}>Connection string</Text>
						<Text size={200}>{targetSql?.server ?? 'Unknown'}</Text>
						<Text size={100} className={styles.fieldLabel}>Endpoint ID</Text>
						<Text size={200}>{targetSql?.endpointId ?? 'Unknown'}</Text>
					</div>
				</div>
			)}
		</ContentCard>
	);
};
