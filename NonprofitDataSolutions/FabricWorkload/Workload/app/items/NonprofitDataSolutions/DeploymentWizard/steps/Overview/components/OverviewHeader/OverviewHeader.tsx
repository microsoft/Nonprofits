import React from 'react';

import { Text } from '@fluentui/react-components';

// Helpers
import { getIcon } from '@nds/helpers/UIHelper';

// Styles
import { useOverviewHeaderStyles } from './OverviewHeader.styles';
// Types
import type { OverviewHeaderProps } from './OverviewHeader.types';

export const OverviewHeader: React.FC<OverviewHeaderProps> = ({ data }) => {
	const styles = useOverviewHeaderStyles();

	return (
		<header className={styles.introSection}>
			<div className={styles.headerRow}>
				<div className={styles.iconContainer} aria-hidden="true">
					{getIcon(data.iconName, 40, 40, styles.icon)}
				</div>
				<div className={styles.titleSection}>
					<Text as="h1" id="overview-title" className={styles.title}>
						{data.title}
					</Text>
					<Text as="p" className={styles.subtitle}>
						{data.subtitle}
					</Text>
				</div>
			</div>

			<Text as="p" className={styles.description}>
				{data.description}
			</Text>
		</header>
	);
};
