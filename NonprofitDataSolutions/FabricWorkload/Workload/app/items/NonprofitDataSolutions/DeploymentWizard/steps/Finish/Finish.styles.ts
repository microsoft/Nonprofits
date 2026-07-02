import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useFinishStepStyles = makeStyles({
	finishStepContainer: {
		display: 'flex',
		flexDirection: 'column',
		gap: '20px',
	},
	sectionHeading: {
		fontSize: '16px',
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
		margin: '0',
		marginBottom: '12px',
	},
	nextStepsCardGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
		gap: tokens.spacingHorizontalM,
		listStyle: 'none',
		margin: '0',
		padding: '0',
		'@media (min-width: 768px)': {
			gridTemplateColumns: 'repeat(2, 1fr)',
		},
		'@media (min-width: 1200px)': {
			gridTemplateColumns: 'repeat(3, 1fr)',
		},
	},
	listItem: {
		display: 'flex',
		listStyle: 'none',
		margin: '0',
		padding: '0',
	},
	documentationLinksContainer: {
		display: 'flex',
		flexDirection: 'column',
		gap: '4px',
	},
	documentationLinkItem: {
		display: 'flex',
		alignItems: 'center',
		gap: '6px',
		fontSize: '14px',
		color: tokens.colorBrandForegroundLink,
		textDecoration: 'none',
		padding: '2px 0',
		'&:hover': {
			color: tokens.colorBrandForegroundLinkHover,
			textDecoration: 'underline',
		},
	},
} satisfies Record<string, CSSProperties | Record<string, CSSProperties>>);
