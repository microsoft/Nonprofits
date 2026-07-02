import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useSectionBadgeStyles = makeStyles({
	sectionBadge: {
		border: 'none !important',
		borderRadius: tokens.borderRadiusMedium,
		'&::after': {
			display: 'none',
		},
	},
} satisfies Record<string, CSSProperties | Record<string, CSSProperties>>);
