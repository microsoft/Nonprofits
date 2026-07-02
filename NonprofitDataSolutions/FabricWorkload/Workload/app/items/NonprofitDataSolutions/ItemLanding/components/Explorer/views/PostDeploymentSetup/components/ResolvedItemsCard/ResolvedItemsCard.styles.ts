import { makeStyles, tokens } from '@fluentui/react-components';

export const useResolvedItemsCardStyles = makeStyles({
	row: {
		display: 'flex',
		flexWrap: 'wrap',
		columnGap: tokens.spacingHorizontalM,
		rowGap: tokens.spacingVerticalS,
	},
	badge: {
		display: 'flex',
		alignItems: 'center',
		gap: '6px',
		paddingLeft: tokens.spacingHorizontalS,
		paddingRight: tokens.spacingHorizontalS,
		paddingTop: tokens.spacingVerticalXS,
		paddingBottom: tokens.spacingVerticalXS,
		border: `1px solid ${tokens.colorNeutralStroke2}`,
		borderRadius: tokens.borderRadiusMedium,
	},
	badgeBlocking: {
		border: `1px solid ${tokens.colorStatusDangerBorder1}`,
		backgroundColor: tokens.colorStatusDangerBackground1,
	},
	iconOk: {
		color: tokens.colorStatusSuccessForeground1,
	},
	iconMissing: {
		color: tokens.colorStatusDangerForeground1,
	},
	label: {
		color: tokens.colorBrandForeground1,
	},
	labelMissing: {
		color: tokens.colorNeutralForeground1,
	},
});
