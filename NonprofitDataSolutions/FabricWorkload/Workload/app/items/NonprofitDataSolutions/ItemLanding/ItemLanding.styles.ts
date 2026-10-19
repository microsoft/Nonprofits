import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useItemLandingStyles = makeStyles({
	'*': {
		boxSizing: 'border-box',
		margin: '0',
		padding: '0',
	},
	itemLandingContainer: {
		display: 'flex',
		flexDirection: 'column',
		height: '100vh',
		backgroundColor: tokens.colorNeutralBackground3,
		overflow: 'hidden',
		padding: '0 8px 8px 8px',
		gap: '8px',
		position: 'relative',
	},
	ribbonContainer: {
		flexShrink: '0',
		borderRadius: tokens.borderRadiusMedium,
		background: 'white',
		boxShadow: tokens.shadow4,
	},
	explorerContainer: {
		flex: '1',
		display: 'flex',
		overflow: 'hidden',
		borderRadius: tokens.borderRadiusMedium,
		background: 'white',
		boxShadow: tokens.shadow4,
	},
} satisfies Record<string, CSSProperties>);
