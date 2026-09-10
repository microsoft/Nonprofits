import { type FC, useId } from 'react';

import { Text, mergeClasses } from '@fluentui/react-components';

import { useContentCardStyles } from './ContentCard.styles';
import type { ContentCardProps } from './ContentCard.types';

export const ContentCard: FC<ContentCardProps> = ({ title, children, className }) => {
	const styles = useContentCardStyles();
	const headingId = useId();

	return (
		<section aria-labelledby={headingId} className={mergeClasses(styles.card, className)}>
			<div className={styles.header}>
				<Text as="h3" id={headingId} weight="semibold" size={200}>{title}</Text>
			</div>
			<div className={styles.body}>{children}</div>
		</section>
	);
};
