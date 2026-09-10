import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useHeroSectionStyles = makeStyles({
	heroSection: {
		display: 'flex',
		alignItems: 'center',
		backgroundColor: tokens.colorBrandBackground,
		backgroundImage: `linear-gradient(135deg, ${tokens.colorBrandBackground} 0%, ${tokens.colorBrandBackgroundHover} 100%), url(/assets/images/elevate-banner.webp)`,
		backgroundRepeat: 'no-repeat',
		backgroundPosition: 'right bottom',
		backgroundSize: 'contain',
		backgroundBlendMode: 'normal, normal',
		width: '100%',
		padding: tokens.spacingVerticalXL,
		borderRadius: tokens.borderRadiusLarge,
		marginBottom: tokens.spacingVerticalL,
		minHeight: '140px',
		margin: '0',
		position: 'relative',
		'&::before': {
			content: '""',
			position: 'absolute',
			top: '0',
			left: '0',
			right: '0',
			bottom: '0',
			backgroundImage: 'url(/assets/images/elevate-banner-dark.webp)',
			backgroundRepeat: 'no-repeat',
			backgroundPosition: 'right bottom',
			backgroundSize: 'contain',
			opacity: 0.15,
			borderRadius: tokens.borderRadiusLarge,
			pointerEvents: 'none',
		},
		'@media (max-width: 480px)': {
			padding: `${tokens.spacingVerticalXL} ${tokens.spacingHorizontalM}`,
		},
	},

	heroContent: {
		display: 'flex',
		alignItems: 'center',
		gap: tokens.spacingHorizontalL,
		width: '100%',
		margin: '0',
		padding: '0',
		position: 'relative',
		zIndex: 1,
		'@media (max-width: 768px)': {
			flexDirection: 'column',
			textAlign: 'center',
			gap: tokens.spacingVerticalL,
		},
	},

	heroIcon: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: '42px',
		height: '42px',
		backgroundColor: tokens.colorNeutralBackground1,
		borderRadius: tokens.borderRadiusLarge,
		color: tokens.colorNeutralForegroundOnBrand,
		fontSize: '32px',
		flexShrink: 0,
		margin: '0',
		padding: '0',
	},

	heroText: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalS,
		flex: 1,
		margin: '0',
		padding: '0',
	},

	heroTitle: {
		fontSize: tokens.fontSizeHero700,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForegroundOnBrand,
		lineHeight: tokens.lineHeightHero700,
		margin: '0',
		padding: '0',
		'@media (max-width: 768px)': {
			fontSize: tokens.fontSizeHero700,
		},
		'@media (max-width: 480px)': {
			fontSize: tokens.fontSizeHero700,
		},
	},

	heroSubtitle: {
		fontSize: tokens.fontSizeBase400,
		color: tokens.colorNeutralForegroundOnBrand,
		lineHeight: tokens.lineHeightBase400,
		margin: '0',
		padding: '0',
	},

	heroVersion: {
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForegroundOnBrand,
		lineHeight: tokens.lineHeightBase200,
		margin: '0',
		padding: '0',
		opacity: 0.9,
	},
} satisfies Record<string, CSSProperties | Record<string, CSSProperties>>);
