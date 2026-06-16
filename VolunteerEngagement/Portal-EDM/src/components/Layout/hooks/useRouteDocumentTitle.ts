import { useEffect } from 'react';

import { useLocation } from 'react-router-dom';

import { useTranslation } from '@/i18n';

function getRouteTitleKey(pathname: string, search: string): string | null {
	const path = pathname.replace(/\/$/, '') || '/';

	if (path === '/' || path === '/opportunities') return 'MSVE_SPA/Nav/Home';
	if (path === '/my-engagements') return 'MSVE_SPA/Nav/MyEngagements';
	if (path === '/profile' || path === '/profile-availability' || path === '/profile-prefandqual') {
		return 'MSVE_SPA/Nav/Profile';
	}
	if (path === '/search') return 'MSVE_SPA/Nav/Search';
	if (path === '/access-denied') return 'MSVE_SPA/AccessDenied/Title';
	if (path === '/success') {
		return new URLSearchParams(search).get('action') === 'cancel'
			? 'MSVE_SPA/Success/CancelTitle'
			: 'MSVE_SPA/Success/ApplyTitle';
	}
	if (path.startsWith('/engagement/')) return null;

	return 'MSVE_SPA/NotFound/Title';
}

export function useRouteDocumentTitle() {
	const location = useLocation();
	const { t } = useTranslation();

	useEffect(() => {
		const titleKey = getRouteTitleKey(location.pathname, location.search);
		if (titleKey) {
			document.title = t(titleKey);
		}
	}, [location.pathname, location.search, t]);
}
