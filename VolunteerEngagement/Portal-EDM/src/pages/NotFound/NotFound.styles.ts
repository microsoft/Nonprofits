import { makeStyles, tokens } from '@fluentui/react-components';

export const useStyles = makeStyles({
	page: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		textAlign: 'center',
		padding: '64px 24px',
		gap: '16px',
		flex: 1,
	},
	code: {
		fontSize: '96px',
		fontWeight: 700,
		color: tokens.colorBrandForeground1,
		marginBottom: '8px',
	},
	mutedText: {
		color: tokens.colorNeutralForeground3,
	},
});
