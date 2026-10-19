import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useItemsTableStyles = makeStyles({
	table: {
		fontSize: tokens.fontSizeBase300,
		marginTop: tokens.spacingVerticalM,
		marginBottom: tokens.spacingVerticalM,
	},
	tableHeaderCell: {
		fontWeight: tokens.fontWeightSemibold,
	},
	tableBodyText: {
		fontWeight: tokens.fontWeightRegular,
	},
	tableLink: {
		fontSize: tokens.fontSizeBase300,
	},
	iconHeaderCell: {
		marginLeft: '13px',
	},
	statusBadge: {
		fontSize: tokens.fontSizeBase300,
	},
	itemTypeCell: { maxWidth: '40px', width: '40px', textAlign: 'center' },
	nameCellContent: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
	typeCell: { width: '100px' },
	statusCell: { width: '110px' },
} satisfies Record<string, CSSProperties>);
