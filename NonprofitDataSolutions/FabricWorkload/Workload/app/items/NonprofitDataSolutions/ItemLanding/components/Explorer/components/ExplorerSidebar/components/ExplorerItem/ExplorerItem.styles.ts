import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useExplorerItemStyles = makeStyles({
	navigationItem: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'flex-start',
		padding: '8px 12px',
		minHeight: '36px',
		width: '100%',
		borderRadius: tokens.borderRadiusMedium,
		border: 'none',
		backgroundColor: 'transparent',
		cursor: 'pointer',
		textAlign: 'left',
		transition: 'background-color 0.1s ease',
		'&:hover': {
			backgroundColor: tokens.colorNeutralBackground3Hover,
		},
		'&:active': {
			backgroundColor: tokens.colorNeutralBackground3Pressed,
		},
	},
	navigationItemSelected: {
		position: 'relative',
		backgroundColor: tokens.colorNeutralBackground3Selected,
		'&:hover': {
			backgroundColor: tokens.colorNeutralBackground3Hover,
		},
		'&:active': {
			backgroundColor: tokens.colorNeutralBackground3Pressed,
		},
		'&::before': {
			content: '""',
			position: 'absolute',
			left: '0px',
			top: '50%',
			transform: 'translateY(-50%)',
			width: '3px',
			height: '20px',
			backgroundColor: tokens.colorBrandBackground,
			borderRadius: '0 2px 2px 0',
		},
	},
	navigationItemContent: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		width: '100%',
	},
	navigationItemIcon: {
		fontSize: '20px',
		color: tokens.colorNeutralForeground2,
		flexShrink: 0,
	},
	navigationItemIconSelected: {
		color: tokens.colorBrandForeground1,
		fontWeight: tokens.fontWeightSemibold,
	},
	navigationItemLabel: {
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground1,
		fontWeight: tokens.fontWeightRegular,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	'sr-only': {
		position: 'absolute',
		width: '1px',
		height: '1px',
		padding: '0',
		margin: '-1px',
		overflow: 'hidden',
		clip: 'rect(0, 0, 0, 0)',
		whiteSpace: 'nowrap',
		border: '0',
	},
} satisfies Record<string, CSSProperties | Record<string, CSSProperties>>);
