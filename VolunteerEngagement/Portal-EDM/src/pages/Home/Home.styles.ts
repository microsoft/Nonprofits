import { makeStyles, tokens } from '@fluentui/react-components';

export const useStyles = makeStyles({
	page: {
		display: 'flex',
		flexDirection: 'column',
		gap: '24px',
	},
	hero: {
		backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.35)), url(/homeHero.png)',
		marginLeft: '-24px',
		marginRight: '-24px',
		marginTop: '-24px',
	},
	body: {
		display: 'flex',
		gap: '24px',
		'@media (max-width: 640px)': {
			flexDirection: 'column',
		},
	},
	sidebar: {
		width: '288px',
		flexShrink: 0,
		'@media (max-width: 640px)': {
			width: '100%',
			display: 'none',
		},
	},
	sidebarOpen: {
		'@media (max-width: 640px)': {
			display: 'block',
		},
	},
	main: {
		flexGrow: 1,
		display: 'flex',
		flexDirection: 'column',
		gap: '16px',
	},
	toolbar: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: '8px',
		'@media (max-width: 480px)': {
			flexDirection: 'column',
			alignItems: 'flex-start',
			gap: '8px',
		},
	},
	toolbarLeft: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		flexWrap: 'wrap',
	},
	filterToggle: {
		display: 'none',
		'@media (max-width: 640px)': {
			display: 'inline-flex',
		},
	},
	cards: {
		display: 'flex',
		flexDirection: 'column',
		gap: '12px',
	},
	empty: {
		textAlign: 'center',
		padding: '64px 24px',
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
	},
	emptyHint: {
		display: 'block',
		marginTop: '8px',
		color: tokens.colorNeutralForeground3,
	},
});
