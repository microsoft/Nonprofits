import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useConfigurationCardStyles = makeStyles({
	// Screen reader only utility
	'sr-only': {
		position: 'absolute',
		width: '1px',
		height: '1px',
		padding: '0',
		margin: '-1px',
		overflow: 'hidden',
		clip: 'rect(0, 0, 0, 0)',
		whiteSpace: 'nowrap',
		border: '0',
	},

	configurationCard: {
		padding: tokens.spacingVerticalL,
		borderRadius: tokens.borderRadiusMedium,
		border: `1px solid ${tokens.colorNeutralStroke2}`,
		backgroundColor: tokens.colorNeutralBackground1,
		display: 'flex',
		flexDirection: 'column',
		position: 'relative',
		gap: tokens.spacingVerticalL,
		margin: '0',
	},

	cardPositionedLink: {
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorBrandForeground1,
		textDecoration: 'none',
		display: 'flex',
		alignItems: 'center',
		gap: '4px',
		position: 'absolute',
		top: tokens.spacingVerticalM,
		right: tokens.spacingHorizontalM,
		padding: '4px',
		borderRadius: tokens.borderRadiusSmall,
		transition: 'color 0.2s ease-in-out',

		'&:hover': {
			color: tokens.colorBrandForeground2Hover,
		},

		'&:focus': {
			outline: `2px solid ${tokens.colorStrokeFocus2}`,
			outlineOffset: '2px',
		},
	},

	// Form fields
	fieldRow: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalXS,
		margin: '0',
		padding: '0',
	},

	fieldDescription: {
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground2,
		margin: '0',
		padding: '0',
		lineHeight: tokens.lineHeightBase200,
	},
} satisfies Record<string, CSSProperties | Record<string, CSSProperties>>);
