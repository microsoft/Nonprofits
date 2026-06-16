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
		color: tokens.colorPaletteGreenForeground1,
	},
	description: {
		color: tokens.colorNeutralForeground3,
		maxWidth: '500px',
		textAlign: 'center',
	},
	actions: {
		display: 'flex',
		gap: '12px',
		marginTop: '16px',
	},
});
