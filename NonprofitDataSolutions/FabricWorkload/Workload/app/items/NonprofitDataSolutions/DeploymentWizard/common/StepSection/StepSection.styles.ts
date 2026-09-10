import type { CSSProperties } from 'react';

import { makeStyles } from '@fluentui/react-components';

export const useStyles = makeStyles({
	container: {
		display: 'flex',
		flexDirection: 'column',
	},
	titleContainer: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		marginBottom: '12px',
		marginTop: '0',
	},
	title: {
		margin: '0',
	},
	subtitle: {
		margin: '0',
		marginBottom: '12px',
	},
	content: {
		display: 'flex',
		flexDirection: 'column',
		gap: '12px',
	},
} satisfies Record<string, CSSProperties>);
