import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useTablesPreviewStyles = makeStyles({
	tablesSection: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalXS,
		margin: '0',
		padding: '0',
	},

	tablesLabel: {
		fontSize: tokens.fontSizeBase200,
		fontWeight: tokens.fontWeightMedium,
		color: tokens.colorNeutralForeground1,
		margin: '0',
		padding: '0',
	},

	tablesGrid: {
		display: 'flex',
		flexWrap: 'wrap',
		gap: tokens.spacingVerticalXS,
		margin: '0',
		padding: '0',

		'@media (max-width: 768px)': {
			gap: '6px',
		},
	},

	tableChip: {
		display: 'flex',
		alignItems: 'center',
		borderRadius: tokens.borderRadiusMedium,
		gap: '6px',
		padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
		backgroundColor: tokens.colorNeutralBackground1,
		border: `1px solid ${tokens.colorNeutralStroke2}`,
		margin: '0',

		'@media (max-width: 768px)': {
			padding: `4px ${tokens.spacingHorizontalXXS}`,
		},
	},

	tableChipIcon: {
		color: tokens.colorPaletteGreenForeground1,
		flexShrink: '0',
	},

	tableChipText: {
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground1,
		margin: '0',
		padding: '0',
		whiteSpace: 'nowrap',
	},
} satisfies Record<string, CSSProperties | Record<string, CSSProperties>>);
