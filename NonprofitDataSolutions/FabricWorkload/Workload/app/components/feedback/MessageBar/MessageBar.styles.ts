import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useMessageBarStyles = makeStyles({
	title: {
		marginRight: tokens.spacingHorizontalXS,
	},
	description: {
		fontSize: tokens.fontSizeBase200,
	},
} satisfies Record<string, CSSProperties>);
