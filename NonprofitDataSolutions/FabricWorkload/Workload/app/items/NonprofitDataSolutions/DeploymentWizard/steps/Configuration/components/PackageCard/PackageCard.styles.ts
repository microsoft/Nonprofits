import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const usePackageCardStyles = makeStyles({
	packageCard: {
		cursor: 'pointer',
		padding: '16px 16px 16px 8px',
		border: `1px solid ${tokens.colorNeutralStroke2}`,
		borderRadius: tokens.borderRadiusMedium,
		backgroundColor: tokens.colorNeutralBackground1,
		'&:hover': {
			backgroundColor: tokens.colorNeutralBackground1Hover,
			border: `1px solid ${tokens.colorNeutralStroke2}`,
		},
	},
	selectedPackageCard: {
		backgroundColor: tokens.colorPaletteGreenBackground1,
		border: `1px solid ${tokens.colorPaletteGreenBorder1}`,
	},
	requiredPackageCard: {
		cursor: 'default',
		backgroundColor: tokens.colorPaletteGreenBackground1,
		border: `1px solid ${tokens.colorPaletteGreenBorder1}`,
		'&:hover': {
			backgroundColor: tokens.colorPaletteGreenBackground1,
			border: `1px solid ${tokens.colorPaletteGreenBorder1}`,
		},
	},
	packageContent: {
		display: 'flex',
		gap: '4px',
		alignItems: 'flex-start',
	},
	packageInfo: {
		display: 'flex',
		flexDirection: 'column',
		gap: '8px',
		flex: 1,
	},
	packageDetails: {
		display: 'flex',
		flexDirection: 'column',
		gap: '2px',
	},
	packageItems: {
		display: 'flex',
		flexWrap: 'wrap',
		gap: '6px',
	},
	packageItem: {
		padding: '4px 8px',
		backgroundColor: tokens.colorNeutralBackground4,
		borderRadius: tokens.borderRadiusMedium,
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground2,
		border: '1px solid transparent',
	},
	selectedPackageItem: {
		backgroundColor: tokens.colorNeutralBackground1,
		border: `1px solid ${tokens.colorNeutralStroke2}`,
	},
	checkboxContainer: {
		marginTop: '2px',
	},
	checkmarkIcon: {
		padding: '5px',
	},
	packageTitle: {
		fontSize: tokens.fontSizeBase400,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
		margin: '0',
		marginBottom: tokens.spacingVerticalXXS,
		padding: '0',
	},
	packageDescription: {
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground3,
		lineHeight: '16px',
		margin: '0',
		padding: '0',
	},
} satisfies Record<string, CSSProperties | Record<string, CSSProperties>>);
