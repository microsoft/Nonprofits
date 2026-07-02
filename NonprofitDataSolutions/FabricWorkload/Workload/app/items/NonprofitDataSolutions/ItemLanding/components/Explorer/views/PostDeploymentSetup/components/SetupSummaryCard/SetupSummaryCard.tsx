import type { FC } from 'react';

import { Text } from '@fluentui/react-components';
import { Checkmark16Regular, DismissCircle16Regular } from '@fluentui/react-icons';

import { ContentCard } from '@src/items/NonprofitDataSolutions/ItemLanding/components/Explorer/components/ContentCard';

import type { SetupSummaryCardProps } from './SetupSummaryCard.types';
import { useSetupSummaryCardStyles } from './SetupSummaryCard.styles';

export const SetupSummaryCard: FC<SetupSummaryCardProps> = ({ summary }) => {
	const styles = useSetupSummaryCardStyles();

	return (
		<ContentCard title="Setup summary">
			<div className={styles.list} role="list" aria-label="Setup results">
				{summary.map((s, i) => (
					<div key={i} role="listitem" className={styles.item}>
						{s.success ? (
							<Checkmark16Regular className={styles.iconSuccess} aria-label="Succeeded" />
						) : (
							<DismissCircle16Regular className={styles.iconError} aria-label="Failed" />
						)}
						<Text size={200} className={styles.text}>{s.message}</Text>
					</div>
				))}
			</div>
		</ContentCard>
	);
};
