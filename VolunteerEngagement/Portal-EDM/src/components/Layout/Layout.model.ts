import type { NavItemDef } from './Layout.types';

export const navItems: NavItemDef[] = [
	{ text: 'MSVE_SPA/Nav/Home', path: '/', activePaths: ['/', '/opportunities'] },
	{ text: 'MSVE_SPA/Nav/MyEngagements', path: '/my-engagements', requiresAuth: true },
	{
		text: 'MSVE_SPA/Nav/Profile',
		path: '/profile',
		requiresAuth: true,
		activePaths: ['/profile', '/profile-availability', '/profile-prefandqual'],
	},
];
