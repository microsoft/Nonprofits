import { makeStyles, tokens } from '@fluentui/react-components';

export const useWorkspaceMoveMessageBarStyles = makeStyles({
	content: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: tokens.spacingHorizontalM,
		width: '100%',
	},
	text: {
		flex: 1,
	},
	button: {
		marginRight: tokens.spacingHorizontalM,
	},
});
