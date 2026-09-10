import React from 'react';

import { Badge } from '@fluentui/react-components';

import { useSectionBadgeStyles } from './SectionBadge.styles';
import type { SectionBadgeProps } from './SectionBadge.types';

export const SectionBadge: React.FC<SectionBadgeProps> = ({ children, ariaLabel }) => {
	const styles = useSectionBadgeStyles();

	return (
		<Badge
			appearance="tint"
			color="informative"
			size="large"
			shape="square"
			className={styles.sectionBadge}
			role="status"
			aria-label={ariaLabel}
		>
			{children}
		</Badge>
	);
};
