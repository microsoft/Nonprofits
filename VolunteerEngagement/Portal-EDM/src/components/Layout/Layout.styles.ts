import { makeStyles, tokens } from '@fluentui/react-components';

export const useLayoutStyles = makeStyles({
	root: {
		display: 'flex',
		flexDirection: 'column',
		flex: '1 1 auto',
	},
	skipLink: {
		position: 'absolute',
		top: '-40px',
		left: '0',
		backgroundColor: tokens.colorNeutralBackground1,
		color: tokens.colorBrandForeground1,
		padding: '8px 16px',
		zIndex: 200,
		fontSize: '14px',
		fontWeight: 600,
		textDecoration: 'none',
		border: `2px solid ${tokens.colorBrandForeground1}`,
		'&:focus': {
			top: '0',
		},
	},
	header: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '0 24px',
		height: '48px',
		borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
		backgroundColor: tokens.colorNeutralBackground1,
		position: 'sticky',
		top: 0,
		zIndex: 100,
	},
	brandSection: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		cursor: 'pointer',
		flexShrink: 0,
	},
	brandIcon: {
		color: tokens.colorBrandForeground1,
	},
	brandText: {
		color: tokens.colorBrandForeground1,
	},
	nav: {
		display: 'flex',
		alignItems: 'center',
		gap: '0px',
		marginLeft: '24px',
		'@media (max-width: 810px)': {
			display: 'none',
		},
	},
	navLink: {
		padding: '12px 16px',
		cursor: 'pointer',
		color: tokens.colorNeutralForeground2,
		textDecoration: 'none',
		whiteSpace: 'nowrap',
		borderBottom: '2px solid transparent',
		'&:hover': {
			color: tokens.colorNeutralForeground1,
			borderBottomColor: tokens.colorNeutralStroke1,
		},
	},
	navLinkActive: {
		color: tokens.colorBrandForeground1,
		borderBottomColor: tokens.colorBrandForeground1,
		fontWeight: 600,
	},
	rightSection: {
		display: 'flex',
		alignItems: 'center',
		gap: '4px',
		marginLeft: 'auto',
		flexShrink: 1,
		minWidth: 0,
		overflow: 'hidden',
	},
	divider: {
		width: '1px',
		height: '24px',
		backgroundColor: tokens.colorNeutralStroke2,
		margin: '0 8px',
		'@media (max-width: 810px)': {
			display: 'none',
		},
	},
	userMenuTrigger: {
		display: 'flex',
		alignItems: 'center',
		gap: '4px',
		cursor: 'pointer',
		padding: '6px 8px',
		borderRadius: tokens.borderRadiusMedium,
		minWidth: 0,
		'&:hover': {
			backgroundColor: tokens.colorNeutralBackground1Hover,
		},
		'@media (max-width: 810px)': {
			padding: '4px',
			overflow: 'visible',
		},
	},
	userIconMobile: {
		display: 'none',
		flexShrink: 0,
		'@media (max-width: 810px)': {
			display: 'inline',
		},
	},
	userNameText: {
		'@media (max-width: 810px)': {
			display: 'none',
		},
	},
	signInLink: {
		color: tokens.colorNeutralForeground2,
		cursor: 'pointer',
		padding: '6px 12px',
		borderRadius: tokens.borderRadiusMedium,
		textDecoration: 'none',
		whiteSpace: 'nowrap',
		'&:hover': {
			color: tokens.colorNeutralForeground1,
			backgroundColor: tokens.colorNeutralBackground1Hover,
		},
	},
	mobileMenuBtn: {
		display: 'none',
		cursor: 'pointer',
		background: 'none',
		border: 'none',
		padding: '4px',
		color: 'inherit',
		flexShrink: 0,
		'@media (max-width: 810px)': {
			display: 'flex',
			alignItems: 'center',
		},
	},
	mobileNav: {
		display: 'none',
		'@media (max-width: 810px)': {
			display: 'flex',
			flexDirection: 'column',
			padding: '8px 0',
			borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
			backgroundColor: tokens.colorNeutralBackground2,
		},
	},
	mobileNavLink: {
		padding: '12px 24px',
		cursor: 'pointer',
		color: tokens.colorNeutralForeground2,
		'&:hover': {
			backgroundColor: tokens.colorNeutralBackground1Hover,
			color: tokens.colorNeutralForeground1,
		},
	},
	mobileNavLinkActive: {
		color: tokens.colorBrandForeground1,
		fontWeight: 600,
	},
	main: {
		padding: '24px',
		display: 'flex',
		flexDirection: 'column',
		flex: 1,
	},
});
