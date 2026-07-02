import type { CSSProperties } from 'react';

import { makeStyles, tokens } from '@fluentui/react-components';

export const useQuickStartSectionStyles = makeStyles({
	quickStartSection: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalM,
		padding: tokens.spacingVerticalXL,
		backgroundColor: tokens.colorNeutralBackground3,
		borderRadius: tokens.borderRadiusLarge,
	},

	sectionTitle: {
		fontSize: tokens.fontSizeBase400,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
		margin: '0',
	},

	startButton: {
		alignSelf: 'flex-start',
	},

	stepsContainer: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
		gap: tokens.spacingHorizontalS,
		'@media (max-width: 768px)': {
			gridTemplateColumns: '1fr',
			gap: tokens.spacingVerticalS,
		},
	},

	stepItem: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalS,
	},

	stepItemNumber: {
		fontSize: tokens.fontSizeBase300,
		fontWeight: tokens.fontWeightRegular,
		color: tokens.colorBrandForeground1,
		marginBottom: tokens.spacingVerticalXS,
	},

	stepTitle: {
		fontSize: tokens.fontSizeBase300,
		fontWeight: tokens.fontWeightRegular,
		color: tokens.colorNeutralForeground1,
		lineHeight: tokens.lineHeightBase300,
		margin: '0',
		flex: '1',
	},

	stepButton: {
		alignSelf: 'flex-start',
		fontWeight: tokens.fontWeightSemibold,
	},

	stepMissingText: {
		color: tokens.colorNeutralForeground2,
		fontSize: tokens.fontSizeBase200,
		lineHeight: tokens.lineHeightBase200,
		marginTop: tokens.spacingVerticalXS,
	},
} satisfies Record<string, CSSProperties | Record<string, CSSProperties>>);
