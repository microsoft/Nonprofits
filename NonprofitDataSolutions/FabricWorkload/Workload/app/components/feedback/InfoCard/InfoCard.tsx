import type { FC } from 'react';

import { Text, mergeClasses } from '@fluentui/react-components';
import { Info24Regular } from '@fluentui/react-icons';

import { useStyles } from './InfoCard.styles';
import type { InfoCardProps } from './InfoCard.types';

// InfoCard component
export const InfoCard: FC<InfoCardProps> = ({ title, description, className }) => {
	const styles = useStyles();

	return (
		<aside className={mergeClasses(styles.infoCard, className)}>
			<div className={styles.infoIcon} role="img" aria-label="Information">
				<Info24Regular />
			</div>
			<div className={styles.infoContent}>
				<Text as="h4" className={styles.infoTitle}>
					{title}
				</Text>
				<Text as="p" className={styles.infoDescription}>
					{description}
				</Text>
			</div>
		</aside>
	);
};
