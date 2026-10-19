import type { FC } from 'react';

import { ProgressBar, Spinner, Text } from '@fluentui/react-components';

import { ContentCard } from '@src/items/NonprofitDataSolutions/ItemLanding/components/Explorer/components/ContentCard';

import type { SetupProgressCardProps } from './SetupProgressCard.types';
import { useSetupProgressCardStyles } from './SetupProgressCard.styles';

export const SetupProgressCard: FC<SetupProgressCardProps> = ({ progress, currentStepMessage, sampleDataProgress }) => {
	const styles = useSetupProgressCardStyles();

	return (
		<ContentCard title="Setup progress">
			<div className={styles.content}>
				<ProgressBar value={progress / 100} aria-label={`Setup progress: ${progress}%`} />
				<div className={styles.status} aria-live="polite">
					<Spinner size="extra-tiny" aria-hidden="true" />
					<Text size={100}>
						{sampleDataProgress ?? currentStepMessage ?? 'Working…'} ({progress}%)
					</Text>
				</div>
			</div>
		</ContentCard>
	);
};
