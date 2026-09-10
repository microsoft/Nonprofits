import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useExplorerStyles = makeStyles({
	explorerContainer: {
		display: 'flex',
		width: '100%',
		height: '100%',
		flexGrow: '1',
		backgroundColor: tokens.colorNeutralBackground1,
	},
	mainContent: {
		flex: '1',
		display: 'flex',
		flexDirection: 'column',
		overflow: 'auto',
		padding: '16px',
	},
} satisfies Record<string, CSSProperties>);
