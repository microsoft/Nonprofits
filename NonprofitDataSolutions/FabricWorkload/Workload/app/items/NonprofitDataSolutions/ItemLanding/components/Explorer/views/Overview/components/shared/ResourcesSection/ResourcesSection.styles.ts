import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useResourcesSectionStyles = makeStyles({
	resourcesSection: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalL,
		border: `1px solid ${tokens.colorNeutralStroke1}`,
		padding: tokens.spacingVerticalXL,
		borderRadius: tokens.borderRadiusLarge,
	},

	sectionTitle: {
		fontSize: tokens.fontSizeBase600,
		lineHeight: tokens.lineHeightBase600,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
		margin: '0',
	},

	resourcesGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
		gap: tokens.spacingHorizontalL,
		'@media (max-width: 768px)': {
			gridTemplateColumns: '1fr',
			gap: tokens.spacingVerticalL,
		},
	},
} satisfies Record<string, CSSProperties | Record<string, CSSProperties>>);
