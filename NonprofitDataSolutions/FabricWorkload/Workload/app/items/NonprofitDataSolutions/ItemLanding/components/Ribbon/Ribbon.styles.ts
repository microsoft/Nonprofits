import type { CSSProperties } from 'react';

import { makeStyles } from '@fluentui/react-components';

export const useRibbonStyles = makeStyles({
	toolbar: {
		height: '40px',
		padding: '0 5px',
	},
	divider: {
		padding: '0 4px',
	},
} satisfies Record<string, CSSProperties>);
