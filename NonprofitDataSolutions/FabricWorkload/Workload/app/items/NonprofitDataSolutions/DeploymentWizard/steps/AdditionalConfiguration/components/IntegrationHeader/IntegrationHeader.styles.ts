import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useIntegrationHeaderStyles = makeStyles({
	integrationHeader: {
		display: 'flex',
		alignItems: 'flex-start',
		justifyContent: 'space-between',
		gap: tokens.spacingHorizontalM,
		margin: '0',
		padding: '0',

		'@media (max-width: 768px)': {
			flexDirection: 'column',
			alignItems: 'flex-start',
			gap: tokens.spacingVerticalM,
		},
	},

	integrationInfo: {
		display: 'flex',
		alignItems: 'center',
		gap: tokens.spacingHorizontalS,
		flex: 1,
		margin: '0',
		padding: '0',
	},

	iconContainer: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: tokens.spacingVerticalXS,
		borderRadius: tokens.borderRadiusSmall,
		flexShrink: 0,
		color: tokens.colorBrandForeground2,
		width: '40px',
		height: '40px',
	},

	integrationDetails: {
		display: 'flex',
		flexDirection: 'column',
		gap: '2px',
		flex: 1,
		margin: '0',
		padding: '0',
	},

	integrationTitleRow: {
		display: 'flex',
		alignItems: 'center',
		gap: tokens.spacingHorizontalXS,
		margin: '0',
		padding: '0',
	},

	integrationTitle: {
		fontSize: tokens.fontSizeBase400,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
		margin: '0',
		padding: '0',
	},

	integrationSubtitle: {
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground2,
		margin: '0',
		padding: '0',
	},

	setupLink: {
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorBrandForeground1,
		textDecoration: 'none',
		display: 'flex',
		alignItems: 'center',
		gap: '4px',
		flexShrink: 0,
		margin: '0',
		padding: '4px',
		borderRadius: tokens.borderRadiusSmall,
		transition: 'color 0.2s ease-in-out',

		'&:hover': {
			color: tokens.colorBrandForeground2Hover,
		},

		'&:focus': {
			outline: `2px solid ${tokens.colorStrokeFocus2}`,
			outlineOffset: '2px',
		},
	},
} satisfies Record<string, CSSProperties | Record<string, CSSProperties>>);
