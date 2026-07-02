import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useTableStyles = makeStyles({
	table: {
		marginTop: tokens.spacingVerticalM,
		marginBottom: tokens.spacingVerticalXL,
		fontSize: tokens.fontSizeBase300,
	},
	tableHeaderCell: {
		fontWeight: tokens.fontWeightSemibold,
	},
	iconHeaderCell: {
		width: '40px',
		textAlign: 'center',
		verticalAlign: 'middle',
	},
	iconHeader: {
		display: 'flex',
		flexGrow: 1,
	},
	iconCell: {
		width: '40px',
		paddingTop: tokens.spacingVerticalXS,
		paddingBottom: tokens.spacingVerticalXS,
		verticalAlign: 'top',
		textAlign: 'center',
	},
	typeCell: {
		verticalAlign: 'middle',
		width: '100px',
	},
	contentCell: {
		paddingTop: tokens.spacingVerticalXS,
		paddingBottom: tokens.spacingVerticalXS,
		verticalAlign: 'middle',
		minWidth: '350px',
		overflowX: 'hidden',
	},
	contentCellContent: {
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	statusCell: {
		paddingTop: tokens.spacingVerticalXS,
		paddingBottom: tokens.spacingVerticalXS,
		verticalAlign: 'middle',
		width: '110px',
	},
	itemIcon: {
		marginTop: '5px',
	},
	statusContainer: {
		display: 'flex',
		alignItems: 'center',
		gap: tokens.spacingHorizontalM,
	},
	errorMessage: {
		color: '#d13438',
		fontSize: tokens.fontSizeBase200,
		marginTop: tokens.spacingVerticalXS,
		fontStyle: 'italic',
	},
	sectionContainer: {
		marginTop: tokens.spacingVerticalM,
	},
	listContainer: {
		margin: `${tokens.spacingVerticalXS} 0`,
		paddingLeft: tokens.spacingHorizontalXL,
	},
	listItem: {
		marginBottom: '2px',
	},
	smallText: {
		fontSize: tokens.fontSizeBase200,
		color: '#605e5c',
	},
} satisfies Record<string, CSSProperties>);
