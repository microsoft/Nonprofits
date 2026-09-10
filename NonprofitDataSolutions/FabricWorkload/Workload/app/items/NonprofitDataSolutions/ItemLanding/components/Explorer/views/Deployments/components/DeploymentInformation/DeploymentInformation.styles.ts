import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useDeploymentInformationStyles = makeStyles({
	infoGrid: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr 1fr',
		gap: tokens.spacingHorizontalL,

		'@media (max-width: 768px)': {
			gridTemplateColumns: '1fr',
			gap: tokens.spacingVerticalM,
		},
	},
	infoItem: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalXS,
	},

	infoHeader: {
		display: 'flex',
		alignItems: 'center',
		gap: tokens.spacingHorizontalXS,
	},

	icon: {
		fontSize: tokens.fontSizeBase300,
		color: tokens.colorNeutralForeground2,
	},

	infoLabel: {
		fontSize: tokens.fontSizeBase300,
		color: tokens.colorNeutralForeground2,
		fontWeight: tokens.fontWeightRegular,
	},

	infoValue: {
		fontSize: tokens.fontSizeBase300,
		color: tokens.colorNeutralForeground1,
		fontWeight: tokens.fontWeightMedium,
	},
} satisfies Record<string, CSSProperties | Record<string, CSSProperties>>);
