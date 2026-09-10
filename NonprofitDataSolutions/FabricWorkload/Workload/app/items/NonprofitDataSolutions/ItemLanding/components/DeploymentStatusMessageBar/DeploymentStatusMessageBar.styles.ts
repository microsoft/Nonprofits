import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useDeploymentStatusMessageBarStyles = makeStyles({
	messageBarContent: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: tokens.spacingHorizontalM,
		paddingRight: tokens.spacingHorizontalM,
	},
	messageText: {
		flex: '1',
	},
	actionButton: {
		flexShrink: '0',
	},
} satisfies Record<string, CSSProperties>);
