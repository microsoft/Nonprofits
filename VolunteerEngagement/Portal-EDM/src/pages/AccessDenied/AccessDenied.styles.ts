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
	icon: {
		width: '64px',
		height: '64px',
		color: tokens.colorPaletteRedForeground1,
	},
	mutedText: {
		color: tokens.colorNeutralForeground3,
	},
	actions: {
		display: 'flex',
		gap: '12px',
	},
});
