import { makeStyles, tokens } from '@fluentui/react-components';

export const useDeploymentIncludesStyles = makeStyles({
	deploymentCard: {
		padding: tokens.spacingVerticalL,
		backgroundColor: tokens.colorNeutralBackground1,
		borderRadius: tokens.borderRadiusMedium,
		border: `1px solid ${tokens.colorNeutralStroke2}`,
	},
	deploymentGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(2, 1fr)',
		gap: '12px',
		padding: 0,
		margin: 0,
		listStyle: 'none',
	},
	deploymentItem: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
	},
	checkIcon: {
		color: tokens.colorPaletteGreenForeground1,
		fontSize: '20px',
		flexShrink: 0,
		marginTop: '2px',
	},
	deploymentText: {
		fontSize: tokens.fontSizeBase300,
		color: tokens.colorNeutralForeground2,
		lineHeight: tokens.lineHeightBase300,
		margin: '0',
		padding: '0',
	},
});
