import type { FC } from 'react';

import { ProgressBar, Spinner, Text } from '@fluentui/react-components';

import { ContentCard } from '@src/items/NonprofitDataSolutions/ItemLanding/components/Explorer/components/ContentCard';

import type { LoadingDataCardProps } from './LoadingDataCard.types';
import { useLoadingDataCardStyles } from './LoadingDataCard.styles';

export const LoadingDataCard: FC<LoadingDataCardProps> = ({ loadedSteps, totalSteps, loadingStepMessage }) => {
	const styles = useLoadingDataCardStyles();

	return (
		<ContentCard title="Loading workspace data">
			<div className={styles.content}>
				<ProgressBar value={loadedSteps / totalSteps} aria-label={`Loading workspace data: step ${loadedSteps} of ${totalSteps}`} />
				<div className={styles.status} aria-live="polite">
					<Spinner size="extra-tiny" aria-hidden="true" />
					<Text size={100}>
						{loadingStepMessage ?? `Loading step ${loadedSteps + 1} of ${totalSteps}…`}
					</Text>
				</div>
			</div>
		</ContentCard>
	);
};
