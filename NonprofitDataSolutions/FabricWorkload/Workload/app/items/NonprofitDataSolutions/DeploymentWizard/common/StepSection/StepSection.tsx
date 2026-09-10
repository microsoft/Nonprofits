import type { FC } from 'react';

import { Text } from '@fluentui/react-components';

import { useStyles } from './StepSection.styles';
import type { StepSectionProps } from './StepSection.types';

// Step Section component
export const StepSection: FC<StepSectionProps> = ({ title, titleBadge, subtitle, children }) => {
	const styles = useStyles();

	return (
		<div className={styles.container}>
			<div className={styles.titleContainer}>
				<Text block as="h3" size={400} weight="semibold" className={styles.title}>
					{title}
				</Text>
				{titleBadge && titleBadge}
			</div>
			{subtitle && <div className={styles.subtitle}>{subtitle}</div>}
			<div className={styles.content}>{children}</div>
		</div>
	);
};
