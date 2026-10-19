import { makeStyles, tokens } from '@fluentui/react-components';

export const useWorkspaceMappingCardStyles = makeStyles({
	layout: {
		display: 'flex',
		alignItems: 'stretch',
		gap: tokens.spacingHorizontalM,
	},
	card: {
		flex: '1',
		padding: tokens.spacingHorizontalM,
		borderRadius: tokens.borderRadiusMedium,
		border: `1px solid ${tokens.colorNeutralStroke2}`,
		backgroundColor: tokens.colorNeutralBackground2,
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalXS,
	},
	cardCurrent: {
		border: `1px solid ${tokens.colorBrandStroke1}`,
		backgroundColor: tokens.colorBrandBackground2,
	},
	label: {
		textTransform: 'uppercase' as const,
		letterSpacing: '0.05em',
		color: tokens.colorNeutralForeground3,
	},
	labelCurrent: {
		color: tokens.colorBrandForeground1,
	},
	id: {
		color: tokens.colorNeutralForeground3,
	},
	arrow: {
		display: 'flex',
		alignItems: 'center',
	},
});
