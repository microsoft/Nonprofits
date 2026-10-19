import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useStyles = makeStyles({
	infoCard: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: '12px',
		padding: '16px',
		color: tokens.colorNeutralForeground1,
		borderRadius: tokens.borderRadiusMedium,
		backgroundColor: tokens.colorNeutralBackground3,
		border: `1px solid ${tokens.colorNeutralStroke1}`,
	},
	infoIcon: {
		color: tokens.colorNeutralForeground3,
		flexShrink: '0',
	},
	infoContent: {
		display: 'flex',
		flexDirection: 'column',
		gap: '4px',
		flex: '1',
	},
	infoTitle: {
		fontSize: tokens.fontSizeBase300,
		fontWeight: tokens.fontWeightMedium,
		margin: '0',
		padding: '0',
	},
	infoDescription: {
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground2,
		lineHeight: tokens.lineHeightBase200,
		margin: '0',
		padding: '0',
	},
} satisfies Record<string, CSSProperties>);
