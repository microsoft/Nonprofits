import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useModulesSectionStyles = makeStyles({
	modulesList: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalM,
	},

	moduleItem: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: tokens.spacingVerticalS,
		borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,

		'&:last-child': {
			borderBottom: 'none',
		},
	},

	moduleInfo: {
		flex: '1',
		display: 'flex',
		alignItems: 'center',
		gap: tokens.spacingHorizontalS,
	},

	moduleHeader: {
		display: 'flex',
		alignItems: 'center',
		gap: tokens.spacingHorizontalS,
	},

	moduleIcon: {
		fontSize: tokens.fontSizeBase400,
		color: tokens.colorNeutralForeground2,
	},

	moduleDetails: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalXXS,
	},

	moduleName: {
		fontSize: tokens.fontSizeBase300,
		fontWeight: tokens.fontWeightMedium,
		color: tokens.colorNeutralForeground1,
		lineHeight: tokens.lineHeightBase300,
	},

	moduleType: {
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground2,
		lineHeight: tokens.lineHeightBase200,
	},

	moduleStatus: {
		display: 'flex',
		alignItems: 'center',
	},
} satisfies Record<string, CSSProperties | Record<string, CSSProperties>>);
