import { makeStyles, tokens } from '@fluentui/react-components';

export const usePrerequisitesSectionStyles = makeStyles({
	prerequisitesSection: {
		display: 'flex',
		flexDirection: 'column',
		gap: '12px',
		padding: 0,
		margin: 0,
		listStyle: 'none',
	},
	prerequisiteItem: {
		display: 'flex',
		gap: '12px',
		padding: '12px',
		backgroundColor: tokens.colorNeutralBackground3,
		borderRadius: tokens.borderRadiusMedium
	},
	prerequisiteIcon: {
		fontSize: '24px',
		color: tokens.colorNeutralForeground2,
		flexShrink: 0,
		marginTop: '2px',
	},
	prerequisiteContent: {
		display: 'flex',
		flexDirection: 'column',
		gap: '2px',
	},
	prerequisiteTitle: {
		fontSize: tokens.fontSizeBase300,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
		margin: '0',
		padding: '0',
	},
	prerequisiteDescription: {
		fontSize: tokens.fontSizeBase200,
		color: tokens.colorNeutralForeground3,
		lineHeight: tokens.lineHeightBase200,
		margin: '0',
		padding: '0',
	},
});
