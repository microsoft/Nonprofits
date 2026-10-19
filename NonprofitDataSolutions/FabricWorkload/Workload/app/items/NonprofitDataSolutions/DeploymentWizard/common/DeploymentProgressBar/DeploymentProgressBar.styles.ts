import type { CSSProperties } from 'react';

import { makeStyles } from '@fluentui/react-components';

export const useStyles = makeStyles({
	progressBar: {
		padding: '12px 0',
	},
	progressTitle: {
		display: 'inline-block',
		fontSize: '14px',
		fontWeight: 600,
		marginBottom: '8px',
	},
	progressBarElement: {
		marginBottom: '8px',
	},
	progressStep: {
		fontSize: '12px',
		color: '#605e5c',
		marginTop: '4px',
	},
} satisfies Record<string, CSSProperties>);
