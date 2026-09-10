import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useInfoBoxStyles = makeStyles({
	infoBox: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: tokens.spacingHorizontalM,
		padding: tokens.spacingVerticalM,
		borderRadius: tokens.borderRadiusMedium,
		backgroundColor: tokens.colorPaletteGreenBackground1,
		border: `1px solid ${tokens.colorPaletteGreenBorder1}`,
		margin: '0',
	},

	infoIcon: {
		color: tokens.colorPaletteGreenForeground1,
		flexShrink: '0',
		marginTop: '2px',
	},

	infoContent: {
		display: 'flex',
		flexDirection: 'column',
		gap: '4px',
		flex: '1',
		margin: '0',
		padding: '0',
	},

	infoTitle: {
		fontSize: tokens.fontSizeBase200,
		fontWeight: tokens.fontWeightMedium,
		color: tokens.colorNeutralForeground1,
		margin: '0',
		padding: '0',
	},

	infoDescription: {
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground1,
		lineHeight: tokens.lineHeightBase200,
		margin: '0',
		padding: '0',
	},
} satisfies Record<string, CSSProperties>);
