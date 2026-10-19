import { makeStyles, tokens } from '@fluentui/react-components';

export const usePostDeploymentSetupStyles = makeStyles({
	root: {
		width: '1200px',
		maxWidth: '100%',
		marginLeft: 'auto',
		marginRight: 'auto',
		paddingLeft: tokens.spacingHorizontalXXL,
		paddingRight: tokens.spacingHorizontalXXL,
		paddingTop: tokens.spacingVerticalXL,
		paddingBottom: tokens.spacingVerticalXL,
		boxSizing: 'border-box',
	},
	header: {
		marginBottom: tokens.spacingVerticalL,
	},
	subtitle: {
		maxWidth: '680px',
		display: 'block',
		color: tokens.colorNeutralForeground2,
	},
	cardsContainer: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalXL,
	},
	messageContent: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalXXS,
	},
	list: {
		margin: '0',
		paddingLeft: tokens.spacingHorizontalL,
	},
	actions: {
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: tokens.spacingHorizontalS,
		marginTop: tokens.spacingVerticalL,
	},
});
