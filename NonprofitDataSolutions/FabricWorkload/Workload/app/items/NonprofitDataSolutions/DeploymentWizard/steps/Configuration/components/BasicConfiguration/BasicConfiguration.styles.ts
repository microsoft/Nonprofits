import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useBasicConfigurationStyles = makeStyles({
	field: {
		display: 'flex',
		flexDirection: 'column',
		gap: '4px',
	},
	helpText: {
		color: tokens.colorNeutralForeground3,
		fontSize: tokens.fontSizeBase200,
		marginTop: '4px',
	},
	readOnlyInput: {
		backgroundColor: tokens.colorNeutralBackground6,
		cursor: 'not-allowed',
		color: tokens.colorNeutralForeground2,
	},
	locationIcon: {
		color: `${tokens.colorNeutralForegroundDisabled} !important`,
		fill: `${tokens.colorNeutralForegroundDisabled} !important`,
		'& path': {
			color: `${tokens.colorNeutralForegroundDisabled} !important`,
			fill: `${tokens.colorNeutralForegroundDisabled} !important`,
		},
	},
} satisfies Record<string, CSSProperties | Record<string, CSSProperties>>);
