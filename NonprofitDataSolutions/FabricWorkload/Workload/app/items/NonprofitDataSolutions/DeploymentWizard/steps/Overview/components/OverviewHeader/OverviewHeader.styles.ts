import { makeStyles, tokens } from '@fluentui/react-components';

export const useOverviewHeaderStyles = makeStyles({
	introSection: {
		display: 'flex',
		flexDirection: 'column',
		gap: '12px',
	},
	headerRow: {
		display: 'flex',
		alignItems: 'center',
		gap: '12px',
	},
	iconContainer: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: '12px',
		flexShrink: 0,
	},
	icon: {
		width: '35px',
		height: '35px',
		display: 'block',
	},
	titleSection: {
		display: 'flex',
		flexDirection: 'column',
	},
	title: {
		fontSize: tokens.fontSizeHero800,
		fontWeight: tokens.fontWeightSemibold,
		color: tokens.colorNeutralForeground1,
		lineHeight: 1,
		margin: '0 0 6px',
	},
	subtitle: {
		fontSize: tokens.fontSizeBase300,
		lineHeight: tokens.lineHeightBase300,
		color: tokens.colorNeutralForeground2,
		margin: '0',
	},
	description: {
		margin: '0',
		fontSize: tokens.fontSizeBase300,
		color: tokens.colorNeutralForeground2,
		lineHeight: tokens.lineHeightBase300,
	},
});
