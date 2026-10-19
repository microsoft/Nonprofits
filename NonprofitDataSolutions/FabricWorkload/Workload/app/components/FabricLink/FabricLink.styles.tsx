import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useFabricLinkStyles = makeStyles({
	link: {
		fontSize: tokens.fontSizeBase200,
	},
} satisfies Record<string, CSSProperties>);
