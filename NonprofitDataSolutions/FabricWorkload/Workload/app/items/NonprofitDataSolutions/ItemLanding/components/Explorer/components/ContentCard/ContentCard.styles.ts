import { makeStyles, tokens } from '@fluentui/react-components';

export const useContentCardStyles = makeStyles({
	card: {
		border: `1px solid ${tokens.colorNeutralStroke2}`,
		borderRadius: tokens.borderRadiusMedium,
		overflow: 'hidden',
	},
	header: {
		paddingLeft: tokens.spacingHorizontalM,
		paddingRight: tokens.spacingHorizontalM,
		paddingTop: '10px',
		paddingBottom: '10px',
		backgroundColor: tokens.colorNeutralBackground2,
		borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
		borderLeft: `3px solid ${tokens.colorBrandStroke1}`,
	},
	body: {
		paddingLeft: tokens.spacingHorizontalM,
		paddingRight: tokens.spacingHorizontalM,
		paddingTop: tokens.spacingVerticalM,
		paddingBottom: tokens.spacingVerticalM,
	},
});
