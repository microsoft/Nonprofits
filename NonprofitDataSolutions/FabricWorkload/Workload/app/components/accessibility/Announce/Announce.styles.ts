import type { CSSProperties } from 'react';

import { makeStyles } from '@fluentui/react-components';

export const useAnnounceStyles = makeStyles({
	root: {
		position: 'absolute',
		clip: 'rect(0 0 0 0)',
		clipPath: 'inset(50%)',
		width: '1px',
		height: '1px',
		overflow: 'hidden',
		whiteSpace: 'nowrap',
	},
} satisfies Record<string, CSSProperties>);
