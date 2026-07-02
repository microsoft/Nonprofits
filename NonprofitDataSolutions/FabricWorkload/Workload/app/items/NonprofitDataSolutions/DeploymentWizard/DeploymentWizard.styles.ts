import type { CSSProperties } from 'react';

import { makeStyles } from '@fluentui/react-components';

export const useStyles = makeStyles({
	panelContainer: {
		display: 'flex',
		flexDirection: 'column',
		flexGrow: 1,
		paddingBottom: '0', // Footer will handle its own padding
	},
	stepTitle: {
		marginBottom: '8px',
	},
	stepDetails: {
		marginBottom: '16px',
		color: '#666',
	},
	titleContainer: {
		display: 'flex',
		flexDirection: 'column',
		paddingTop: '24px',
	},
	headerRow: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		gap: '12px',
	},
	titleText: {
		display: 'flex',
		flexDirection: 'column',
		flex: 1,
	},
	contentContainer: {
		flex: 1,
		height: '0',
		display: 'flex',
		flexDirection: 'column',
		gap: '24px',
		minHeight: '0',
		overflowY: 'auto',
		overflowX: 'hidden',
		paddingRight: '10px',
	},
	closeButton: {
		minWidth: '32px',
	},
	footer: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: '16px',
		flexShrink: 0,
		width: '100%',
		height: '100%',
		minHeight: '100%',
		maxHeight: '100%',
	},
	footerButton: {
		minWidth: 'initial',
	},
	footerButtonGroupLeft: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
	},
	footerButtonGroupRight: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
	},
} satisfies Record<string, CSSProperties>);
