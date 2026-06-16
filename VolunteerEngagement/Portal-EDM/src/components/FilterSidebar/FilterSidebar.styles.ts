import { makeStyles, tokens } from '@fluentui/react-components';

export const useFilterSidebarStyles = makeStyles({
	sidebar: {
		padding: '16px',
		backgroundColor: tokens.colorNeutralBackground2,
		borderRadius: tokens.borderRadiusMedium,
		display: 'flex',
		flexDirection: 'column',
		gap: '16px',
	},
	header: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
	},
	field: {
		display: 'flex',
		flexDirection: 'column',
		gap: '4px',
	},
	actions: {
		display: 'flex',
		gap: '8px',
	},
});
