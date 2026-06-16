import { makeStyles, tokens } from '@fluentui/react-components';

export const useEngagementCardStyles = makeStyles({
	card: {
		width: '100%',
		cursor: 'pointer',
		transition: 'box-shadow 0.2s',
		'&:hover': {
			boxShadow: tokens.shadow8,
		},
	},
	meta: {
		display: 'flex',
		flexWrap: 'wrap',
		gap: '16px',
		marginTop: '8px',
	},
	metaItem: {
		display: 'flex',
		alignItems: 'center',
		gap: '4px',
	},
	mutedText: {
		color: tokens.colorNeutralForeground3,
	},
	footer: {
		alignItems: 'center',
	},
});
