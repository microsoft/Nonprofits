import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useCreatedItemsTableStyles = makeStyles({
	createdItemsSection: {
		border: `1px solid ${tokens.colorNeutralStroke2}`,
		borderRadius: tokens.borderRadiusMedium,
		backgroundColor: tokens.colorNeutralBackground1,
		overflow: 'hidden',
	},
	createdItemsToggleButton: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '16px',
		backgroundColor: tokens.colorNeutralBackground3,
		border: 'none',
		cursor: 'pointer',
		width: '100%',
		textAlign: 'left',
		'&:hover': {
			backgroundColor: tokens.colorNeutralBackground3Hover,
		},
	},
	createdItemsToggleContent: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
	},
	createdItemsTitle: {
		fontSize: tokens.fontSizeBase200,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
		margin: '0',
	},
	createdItemsToggleHint: {
		fontSize: tokens.fontSizeBase100,
		color: tokens.colorNeutralForeground2,
	},
	createdItemsTableWrapper: {
		backgroundColor: tokens.colorNeutralBackground1,
	},
	itemStatusIndicator: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
	},
	itemStatusDot: {
		width: '8px',
		height: '8px',
		borderRadius: '50%',
		backgroundColor: tokens.colorNeutralForeground2BrandSelected,
	},
} satisfies Record<string, CSSProperties | Record<string, CSSProperties>>);
