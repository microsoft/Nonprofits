import { makeStyles, tokens } from '@fluentui/react-components';

export const useStyles = makeStyles({
	page: {
		display: 'flex',
		flexDirection: 'column',
		gap: '24px',
		maxWidth: '1024px',
		margin: '0 auto',
		width: '100%',
		boxSizing: 'border-box',
	},
	searchBar: {
		display: 'flex',
		gap: '12px',
		maxWidth: '640px',
	},
	searchInput: {
		flexGrow: 1,
	},
	results: {
		display: 'flex',
		flexDirection: 'column',
		gap: '12px',
	},
	empty: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		textAlign: 'center',
		padding: '64px 24px',
		gap: '12px',
	},
	emptyIcon: {
		width: '48px',
		height: '48px',
		color: tokens.colorNeutralForeground3,
		marginBottom: '4px',
	},
	emptyHint: {
		color: tokens.colorNeutralForeground3,
	},
	emptyAction: {
		marginTop: '8px',
	},
});
