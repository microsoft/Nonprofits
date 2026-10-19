import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useSectionContainerStyles = makeStyles({
	section: {
		backgroundColor: tokens.colorNeutralBackground1,
		border: `1px solid ${tokens.colorNeutralStroke2}`,
		borderRadius: tokens.borderRadiusXLarge,
		padding: tokens.spacingVerticalL,
	},

	sectionTitle: {
		fontSize: tokens.fontSizeBase400,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
		marginTop: '0',
		marginBottom: tokens.spacingVerticalXL,
	},

	content: {
		display: 'flex',
		flexDirection: 'column',
	},
} satisfies Record<string, CSSProperties>);
