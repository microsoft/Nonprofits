import { makeStyles } from '@fluentui/react-components';

export const useHeroBannerStyles = makeStyles({
	hero: {
		textAlign: 'center',
		paddingTop: '48px',
		paddingBottom: '40px',
		paddingLeft: '24px',
		paddingRight: '24px',
		backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45)), url(/homeHero.png)',
		backgroundSize: 'cover',
		backgroundPosition: 'center',
		backgroundRepeat: 'no-repeat',
		color: 'white',
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		gap: '8px',
		minHeight: '240px',
		'@media (max-width: 640px)': {
			minHeight: '200px',
			paddingTop: '32px',
			paddingBottom: '28px',
		},
	},
	subtitle: {
		display: 'block',
		fontWeight: 600,
		fontSize: '14px',
		lineHeight: '20px',
		opacity: 0.9,
	},
	title: {
		display: 'block',
		color: 'white',
		fontWeight: 600,
		fontSize: '32px',
		lineHeight: '40px',
		margin: 0,
		overflowWrap: 'break-word' as const,
		wordBreak: 'break-word' as const,
		maxWidth: '100%',
		'@media (max-width: 640px)': {
			fontSize: '22px',
		},
	},
});

export const useHeroContentStyles = makeStyles({
	meta: {
		display: 'flex',
		flexWrap: 'wrap',
		gap: '20px',
		justifyContent: 'center',
		marginTop: '20px',
		color: 'rgba(255, 255, 255, 0.92)',
	},
	metaItem: {
		display: 'flex',
		alignItems: 'center',
		gap: '6px',
	},
	status: {
		marginTop: '16px',
	},
	search: {
		display: 'flex',
		justifyContent: 'center',
		marginTop: '24px',
	},
	searchInput: {
		width: '384px',
		'@media (max-width: 768px)': {
			width: '100%',
		},
	},
	stats: {
		display: 'flex',
		justifyContent: 'center',
		gap: '48px',
		marginTop: '20px',
		'@media (max-width: 768px)': {
			gap: '24px',
		},
	},
	stat: {
		textAlign: 'center',
		color: 'white',
	},
	statValue: {
		fontSize: '28px',
		fontWeight: 600,
	},
	statLabel: {
		color: 'rgba(255, 255, 255, 0.85)',
	},
	avatar: {
		borderRadius: '50%',
		boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
	},
	secondaryText: {
		color: 'rgba(255, 255, 255, 0.85)',
		fontSize: '16px',
		wordBreak: 'break-all' as const,
		overflowWrap: 'anywhere' as const,
		maxWidth: '100%',
		'@media (max-width: 480px)': {
			fontSize: '13px',
		},
	},
});
