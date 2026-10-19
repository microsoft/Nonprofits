import { makeStyles, tokens } from '@fluentui/react-components';

export const useSqlEndpointCardStyles = makeStyles({
	grid: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: tokens.spacingHorizontalM,
	},
	column: {
		display: 'flex',
		flexDirection: 'column',
		gap: tokens.spacingVerticalS,
	},
	columnHeader: {
		textTransform: 'uppercase' as const,
		letterSpacing: '0.05em',
		color: tokens.colorNeutralForeground3,
	},
	fieldLabel: {
		color: tokens.colorBrandForeground1,
	},
});
