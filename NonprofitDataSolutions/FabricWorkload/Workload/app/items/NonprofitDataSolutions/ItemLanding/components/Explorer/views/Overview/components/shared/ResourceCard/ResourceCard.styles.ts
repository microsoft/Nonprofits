import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useResourceCardStyles = makeStyles({
	resourceCardLink: {
		textDecoration: 'none',
		color: 'inherit',
		borderRadius: tokens.borderRadiusMedium,
		display: 'block',

		'&:hover': {
			textDecoration: 'none',
		},

		'&:active': {
			textDecoration: 'none',
		},
	},

	resourceCard: {
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		gap: '0',
		height: '250px',
		borderRadius: tokens.borderRadiusMedium,
		overflow: 'hidden',
		transition: 'all 0.2s ease-in-out',
		cursor: 'pointer',
		border: 'none',
		margin: '0',
		padding: '0',

		'&:hover': {
			transform: 'scale(1.02)',
			boxShadow: tokens.shadow8,
		},
	},

	cardImageContainer: {
		height: '156px',
		backgroundSize: 'cover',
		backgroundPosition: 'center center',
		flexShrink: '0',
	},

	cardContent: {
		position: 'relative',
		flexGrow: '1',
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'flex-end',
		padding: tokens.spacingVerticalL,
	},

	cardTitle: {
		fontSize: tokens.fontSizeBase400,
		fontWeight: tokens.fontWeightSemibold,
		marginTop: '0',
		marginBottom: tokens.spacingVerticalXS,
	},

	cardDescription: {
		fontSize: tokens.fontSizeBase300,
		lineHeight: tokens.lineHeightBase300,
	},
} satisfies Record<string, CSSProperties | Record<string, CSSProperties>>);
