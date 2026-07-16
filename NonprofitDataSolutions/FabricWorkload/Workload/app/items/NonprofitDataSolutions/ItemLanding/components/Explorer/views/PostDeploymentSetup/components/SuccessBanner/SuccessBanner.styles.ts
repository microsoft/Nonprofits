import { makeStyles, tokens } from '@fluentui/react-components';

export const useSuccessBannerStyles = makeStyles({
	root: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: tokens.spacingHorizontalM,
		padding: tokens.spacingHorizontalL,
		borderRadius: tokens.borderRadiusMedium,
		backgroundColor: tokens.colorStatusSuccessBackground1,
		border: `1px solid ${tokens.colorStatusSuccessBorder1}`,
	},
	icon: {
		color: tokens.colorStatusSuccessForeground1,
		flexShrink: '0',
		marginTop: '2px',
	},
	title: {
		display: 'block',
		color: tokens.colorStatusSuccessForeground1,
	},
	subtitle: {
		display: 'block',
		color: tokens.colorStatusSuccessForeground1,
		opacity: '0.8',
		marginTop: '2px',
	},
});
