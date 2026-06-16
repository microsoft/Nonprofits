import { makeStyles } from '@fluentui/react-components';

export const useStyles = makeStyles({
	page: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0px',
		marginLeft: '-24px',
		marginRight: '-24px',
		marginTop: '-24px',
	},
	hero: {
		paddingLeft: '24px',
		paddingRight: '24px',
	},
	section: {
		display: 'flex',
		flexDirection: 'column',
		gap: '12px',
	},
	content: {
		padding: '24px',
		display: 'flex',
		flexDirection: 'column',
		gap: '24px',
		maxWidth: '1024px',
		margin: '0 auto',
		width: '100%',
		boxSizing: 'border-box',
	},
	heroActions: {
		display: 'flex',
		gap: '12px',
		marginTop: '16px',
		alignItems: 'center',
		flexWrap: 'wrap',
		justifyContent: 'center',
	},
	heroHint: {
		color: 'rgba(255, 255, 255, 0.75)',
		fontSize: '13px',
	},
	heroMetaText: {
		color: 'inherit',
	},
	heroOutlineButton: {
		color: 'white',
		borderTopColor: 'rgba(255,255,255,0.6)',
		borderRightColor: 'rgba(255,255,255,0.6)',
		borderBottomColor: 'rgba(255,255,255,0.6)',
		borderLeftColor: 'rgba(255,255,255,0.6)',
	},
	backBtn: {
		alignSelf: 'flex-start',
	},
	qualificationBadges: {
		display: 'flex',
		gap: '8px',
		flexWrap: 'wrap',
	},
	shiftTable: {
		tableLayout: 'auto !important' as any,
	},
	tableScroll: {
		overflowX: 'auto' as const,
	},
	nowrap: {
		whiteSpace: 'nowrap',
	},
	selectableRow: {
		cursor: 'pointer',
	},
	selectColumn: {
		width: '40px',
	},
	shiftColumn: {
		width: '80px',
	},
});
