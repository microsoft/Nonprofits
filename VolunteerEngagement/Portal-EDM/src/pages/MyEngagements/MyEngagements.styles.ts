import { makeStyles, tokens } from '@fluentui/react-components';

export const useStyles = makeStyles({
	page: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0px',
		marginLeft: '-24px',
		marginRight: '-24px',
		marginTop: '-24px',
	},
	content: {
		padding: '24px',
		display: 'flex',
		flexDirection: 'column',
		gap: '16px',
		maxWidth: '1024px',
		margin: '0 auto',
		width: '100%',
		boxSizing: 'border-box',
		textAlign: 'center',
	},
	cards: {
		display: 'flex',
		flexDirection: 'column',
		gap: '12px',
	},
	card: {
		cursor: 'pointer',
		transition: 'box-shadow 0.2s',
		'&:hover': {
			boxShadow: tokens.shadow8,
		},
	},
	cardMeta: {
		display: 'flex',
		gap: '16px',
		marginTop: '8px',
		flexWrap: 'wrap',
		justifyContent: 'center',
	},
	metaItem: {
		display: 'flex',
		alignItems: 'center',
		gap: '4px',
	},
	empty: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		textAlign: 'center',
		padding: '48px',
	},
	emptyHint: {
		display: 'block',
		marginTop: '8px',
		color: tokens.colorNeutralForeground3,
	},
	emptyAction: {
		marginTop: '16px',
	},
	loadingState: {
		padding: '64px',
		textAlign: 'center',
	},
	loginPrompt: {
		textAlign: 'center',
		padding: '64px 24px',
	},
	loginPromptText: {
		display: 'block',
		marginTop: '16px',
	},
	signInButton: {
		marginTop: '16px',
	},
	statIcon: {
		verticalAlign: 'middle',
		marginRight: '4px',
	},
	centeredTabs: {
		justifyContent: 'center',
	},
});
