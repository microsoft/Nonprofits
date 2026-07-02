import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useOptionalPackagesSectionStyles = makeStyles({
	packagesGroup: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalS,
	},
} satisfies Record<string, CSSProperties>);
