import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useErrorDetailsCardStyles = makeStyles({
	errorCard: {
		padding: tokens.spacingHorizontalL,
		backgroundColor: tokens.colorNeutralBackground1,
		border: `1px solid ${tokens.colorNeutralStroke2}`,
		borderRadius: tokens.borderRadiusMedium,
		boxShadow: 'none !important',
	},
	header: {
		display: 'flex',
		alignItems: 'center',
		gap: tokens.spacingHorizontalS,
	},
	errorIcon: {
		color: tokens.colorStatusWarningBorderActive,
		fontSize: '24px',
	},
	title: {
		fontWeight: tokens.fontWeightSemibold,
		fontSize: tokens.fontSizeBase400,
		color: tokens.colorNeutralForeground1,
	},
	content: {
		display: 'flex',
		flexDirection: 'column',
		color: tokens.colorNeutralForeground3,
		gap: tokens.spacingVerticalS,
	},
	detailRow: {
		display: 'flex',
		gap: tokens.spacingVerticalXXS,
	},
	errorText: {
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground3,
		lineHeight: tokens.lineHeightBase300,
		wordBreak: 'break-word',
	},
	detailPanel: {
		backgroundColor: tokens.colorNeutralBackground3,
		padding: tokens.spacingHorizontalXS,
		borderRadius: tokens.borderRadiusSmall,
	},
} satisfies Record<string, CSSProperties>);
