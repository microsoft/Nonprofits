import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useFinalMessageStyles = makeStyles({
	successContainer: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: tokens.spacingHorizontalL,
		padding: tokens.spacingVerticalXL,
		backgroundColor: tokens.colorStatusSuccessBackground1,
		borderRadius: tokens.borderRadiusMedium,
		border: `1px solid ${tokens.colorPaletteGreenBorder1}`,
	},
	errorContainer: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: tokens.spacingHorizontalL,
		padding: tokens.spacingVerticalXL,
		backgroundColor: tokens.colorPaletteRedBackground1,
		borderRadius: tokens.borderRadiusMedium,
		border: `1px solid ${tokens.colorPaletteRedBorder1}`,
	},
	successIcon: {
		fontSize: '24px',
		color: tokens.colorPaletteGreenForeground1,
		flexShrink: 0,
		marginTop: '2px',
	},
	errorIcon: {
		fontSize: '24px',
		color: tokens.colorPaletteRedForeground1,
		flexShrink: '0',
		marginTop: '2px',
	},
	content: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalS,
		flex: '1',
	},
	title: {
		fontSize: tokens.fontSizeBase500,
		fontWeight: tokens.fontWeightSemibold,
		lineHeight: tokens.lineHeightBase500,
		margin: '0',
	},
	description: {
		fontSize: tokens.fontSizeBase300,
		lineHeight: tokens.lineHeightBase300,
		color: tokens.colorNeutralForeground2,
		margin: '0',
	},
} satisfies Record<string, CSSProperties>);
