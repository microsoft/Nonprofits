import type { FC } from 'react';

import { Text, mergeClasses } from '@fluentui/react-components';
import { CheckmarkCircle16Regular, DismissCircle16Regular } from '@fluentui/react-icons';

import { ContentCard } from '@src/items/NonprofitDataSolutions/ItemLanding/components/Explorer/components/ContentCard';
import { Shimmer } from '@src/items/NonprofitDataSolutions/ItemLanding/components/Explorer/components/Shimmer';

import type { ResolvedItemsCardProps } from './ResolvedItemsCard.types';
import { useResolvedItemsCardStyles } from './ResolvedItemsCard.styles';

export const ResolvedItemsCard: FC<ResolvedItemsCardProps> = ({ isLoading, entries }) => {
	const styles = useResolvedItemsCardStyles();

	return (
		<ContentCard title="Resolved items in current workspace">
			{isLoading ? (
				<div className={styles.row} aria-busy="true" aria-label="Loading resolved items">
					{[75, 90, 105, 120, 135].map((w) => (
						<div key={w} className={styles.badge}>
							<Shimmer width="16px" height="16px" round />
							<Shimmer width={`${w}px`} height="16px" />
						</div>
					))}
				</div>
			) : (
				<div className={styles.row} role="list" aria-label="Resolved items">
					{entries.map(({ label, item, blocking }) => (
						<div key={label} role="listitem" className={mergeClasses(styles.badge, !item?.id && blocking && styles.badgeBlocking)}>
							{item?.id ? (
								<CheckmarkCircle16Regular className={styles.iconOk} aria-label="Resolved" />
							) : (
								<DismissCircle16Regular className={styles.iconMissing} aria-label={blocking ? 'Missing (blocking)' : 'Missing'} />
							)}
							<Text size={200} className={item?.id ? styles.label : styles.labelMissing}>
								{label}
							</Text>
						</div>
					))}
				</div>
			)}
		</ContentCard>
	);
};
