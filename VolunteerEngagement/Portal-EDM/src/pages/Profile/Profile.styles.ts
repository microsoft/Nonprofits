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
		padding: '32px 24px',
		display: 'flex',
		flexDirection: 'column',
		gap: '24px',
		maxWidth: '832px',
		margin: '0 auto',
		width: '100%',
		boxSizing: 'border-box',
	},
	section: {
		display: 'flex',
		flexDirection: 'column',
		gap: '12px',
	},
	sectionHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: '8px',
		'@media (max-width: 480px)': {
			flexDirection: 'column',
			alignItems: 'flex-start',
		},
	},
	twoCol: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: '16px',
		'@media (max-width: 768px)': {
			gridTemplateColumns: '1fr',
		},
	},
	formRow: {
		display: 'flex',
		gap: '12px',
		flexWrap: 'wrap',
	},
	chipRow: {
		display: 'flex',
		gap: '8px',
		flexWrap: 'wrap',
		alignItems: 'center',
	},
	preferenceItem: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '2px',
	},
	compactDeleteButton: {
		minWidth: 'auto',
		padding: '2px',
	},
	emptyState: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		textAlign: 'center',
		padding: '40px 32px',
		gap: '8px',
		color: tokens.colorNeutralForeground3,
	},
	emptyIcon: {
		fontSize: '48px',
	},
	pillButton: {
		borderRadius: '60px',
	},
	signInButton: {
		borderRadius: '60px',
		marginTop: '16px',
	},
	centered: {
		textAlign: 'center',
		padding: '64px 24px',
	},
	centeredText: {
		display: 'block',
		marginTop: '16px',
		textAlign: 'center',
	},
	loadingState: {
		padding: '64px',
		textAlign: 'center',
	},
	tabScroll: {
		overflowX: 'auto',
		overflowY: 'visible',
		// Hide scrollbar visually but keep it functional
		scrollbarWidth: 'none' as const,
		'&::-webkit-scrollbar': { display: 'none' },
		// Negative margins to bleed past padding on very narrow screens
		'@media (max-width: 480px)': {
			marginLeft: '-8px',
			marginRight: '-8px',
			paddingLeft: '8px',
			paddingRight: '8px',
		},
	},
	tabList: {
		minWidth: 'max-content',
		overflow: 'visible',
	},
	dateField: {
		minWidth: '200px',
	},
	actionColumn: {
		width: '60px',
	},
});
