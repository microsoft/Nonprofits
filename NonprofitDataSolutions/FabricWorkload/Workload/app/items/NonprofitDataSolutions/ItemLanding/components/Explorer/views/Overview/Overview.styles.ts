import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useOverviewStyles = makeStyles({
	container: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		flexGrow: '1',
		width: '100%',
		minHeight: '100%',
		backgroundColor: tokens.colorNeutralBackground1,
		margin: '0',
		padding: '0',

		'& *': {
			boxSizing: 'border-box',
		},
	},

	content: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalXXL,
		maxWidth: '1200px',
		width: '100%',
		padding: `${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalXL}`,
		margin: '0',
	},

	welcomeText: {
		fontSize: tokens.fontSizeBase300,
		lineHeight: tokens.lineHeightBase400,
		color: tokens.colorNeutralForeground1,
		margin: '0',
		padding: '0',
		textAlign: 'justify',
	},

	errorMessageBar: {
		marginBottom: tokens.spacingVerticalL,
	},

	sectionTitle: {
		fontSize: tokens.fontSizeBase500,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
		marginBottom: tokens.spacingVerticalL,
	},

	skeletonItem1: {
		height: '88px',
		marginBottom: tokens.spacingVerticalXL,
	},
	skeletonItem2: {
		height: '200px',
		marginBottom: tokens.spacingVerticalXL,
	},
	skeletonItem3: {
		height: '340px',
	},
} satisfies Record<string, CSSProperties | Record<string, CSSProperties>>);
