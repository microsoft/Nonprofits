import { makeStyles, tokens } from '@fluentui/react-components';

export const useSetupSummaryCardStyles = makeStyles({
	list: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalS,
	},
	item: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: tokens.spacingHorizontalS,
	},
	iconSuccess: {
		color: tokens.colorStatusSuccessForeground1,
		flexShrink: '0',
		marginTop: '2px',
	},
	iconError: {
		color: tokens.colorStatusDangerForeground1,
		flexShrink: '0',
		marginTop: '2px',
	},
	text: {
		lineHeight: '18px',
	},
});
