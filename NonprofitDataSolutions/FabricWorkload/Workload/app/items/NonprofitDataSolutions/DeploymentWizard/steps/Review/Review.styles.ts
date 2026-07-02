import type { CSSProperties } from 'react';

import { makeStyles } from '@fluentui/react-components';

export const useStyles = makeStyles({
	heading: {
		fontSize: '16px',
		fontWeight: 600,
		display: 'flex',
		marginBottom: '10px',
		lineHeight: '18px',
	},
	summary: {
		marginTop: '12px',
		marginBottom: '16px',
		lineHeight: '18px',
	},
	summaryLabel: {
		fontWeight: 600,
		marginRight: '4px',
	},
	summaryValue: {
		overflowWrap: 'break-word',
	},
} satisfies Record<string, CSSProperties>);
