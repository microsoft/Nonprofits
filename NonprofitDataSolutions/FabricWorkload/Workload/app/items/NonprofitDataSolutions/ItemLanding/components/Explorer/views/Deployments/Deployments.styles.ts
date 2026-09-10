import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useDeploymentsStyles = makeStyles({
	container: {
		display: 'flex',
		flexDirection: 'column',
		width: '100%',
		height: '100%',
		backgroundColor: tokens.colorNeutralBackground1,
		overflow: 'auto',
	},

	header: {
		display: 'flex',
		flexDirection: 'column',
		padding: `0 0 ${tokens.spacingVerticalXL}`,
	},

	title: {
		fontSize: tokens.fontSizeBase600,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
		lineHeight: tokens.lineHeightBase600,
		margin: '0',
	},

	subtitle: {
		fontSize: tokens.fontSizeBase300,
		color: tokens.colorNeutralForeground2,
		lineHeight: tokens.lineHeightBase300,
		marginTop: tokens.spacingVerticalXS,
	},

	content: {
		flex: '1',
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalXXL,
		overflowY: 'auto',
		paddingRight: tokens.spacingHorizontalS,
		scrollbarGutter: 'stable',
	},
} satisfies Record<string, CSSProperties>);
