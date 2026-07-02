import { makeStyles, tokens } from '@fluentui/react-components';

export const useSolutionFeaturesStyles = makeStyles({
	featuresGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(2, 1fr)',
		gap: '16px',
		padding: 0,
		margin: 0,
		listStyle: 'none',
	},
	featureCard: {
		display: 'flex',
		gap: '16px',
		padding: '16px',
		backgroundColor: tokens.colorNeutralBackground1,
		borderRadius: tokens.borderRadiusMedium,
		border: `1px solid ${tokens.colorNeutralStroke2}`,
	},
	featureIcon: {
		fontSize: '24px',
		padding: '8px',
		color: tokens.colorBrandForeground2,
		flexShrink: 0,
	},
	featureContent: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalXS,
	},
	featureTitle: {
		fontSize: tokens.fontSizeBase300,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
		margin: '0',
	},
	featureDescription: {
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground3,
		lineHeight: tokens.lineHeightBase200,
		margin: '0',
		padding: '0',
	},
});


	// featureCard: {
	// 	display: 'flex',
	// 	alignItems: 'flex-start',
	// 	gap: '16px',
	// 	padding: '16px',
	// 	borderRadius: tokens.borderRadiusMedium,
	// 	border: `1px solid ${tokens.colorNeutralStroke2}`,
	// 	backgroundColor: tokens.colorNeutralBackground1,
	// },

	// featureIcon: {
	// 	padding: '8px',
	// 	borderRadius: tokens.borderRadiusSmall,
	// 	flexShrink: 0,
	// 	color: tokens.colorBrandForeground2,
	// },