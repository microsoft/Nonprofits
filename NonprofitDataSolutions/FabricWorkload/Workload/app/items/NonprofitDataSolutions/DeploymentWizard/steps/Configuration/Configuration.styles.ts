import type { CSSProperties } from 'react';

import { makeStyles } from '@fluentui/react-components';

export const useNewConfigurationStyles = makeStyles({
	container: {
		display: 'flex',
		flexDirection: 'column',
		gap: '24px',
	},
} satisfies Record<string, CSSProperties>);
