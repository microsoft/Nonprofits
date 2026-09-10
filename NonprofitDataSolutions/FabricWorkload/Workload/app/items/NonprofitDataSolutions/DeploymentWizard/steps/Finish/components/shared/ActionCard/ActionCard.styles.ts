import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useActionCardStyles = makeStyles({
	card: {
		transition: 'all 0.2s ease',
		border: `1px solid ${tokens.colorNeutralStroke2}`,
		boxShadow: `${tokens.shadow4} !important`,
		display: 'flex',
		flexDirection: 'column',
		width: '100%',
	},
	cardActionable: {
		cursor: 'pointer',
		'&:hover': {
			backgroundColor: 'white',
			boxShadow: `${tokens.shadow8} !important`,
		},
		'&:active': {
			backgroundColor: 'white',
			boxShadow: `${tokens.shadow8} !important`,
		},
	},
	cardContent: {
		display: 'flex',
		alignItems: 'flex-stretch',
		gap: tokens.spacingHorizontalM,
		flex: 1,
	},
	iconWrapper: {
		flexShrink: 0,
		padding: tokens.spacingVerticalXS,
		borderRadius: tokens.borderRadiusSmall,
		width: '32px',
		height: '32px',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},
	icon: {
		color: tokens.colorBrandForeground1,
		fontSize: '16px',
	},
	textContent: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalXXS,
		flex: 1,
	},
	title: {
		fontSize: tokens.fontSizeBase300,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
		margin: '0',
		lineHeight: tokens.lineHeightBase300,
	},
	description: {
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground3,
		margin: '0',
		lineHeight: tokens.lineHeightBase200,
	},
	button: {
		marginTop: 'auto',
		alignSelf: 'flex-start',
	},
} satisfies Record<string, CSSProperties | Record<string, CSSProperties>>);
