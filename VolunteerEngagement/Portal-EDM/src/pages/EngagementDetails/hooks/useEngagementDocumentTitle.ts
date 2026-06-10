import { useEffect } from 'react';

import { useTranslation } from '@/i18n';

import type { Engagement } from '@/types';

interface UseEngagementDocumentTitleOptions {
	engagement: Engagement | null;
	id?: string;
	loading: boolean;
}

export function useEngagementDocumentTitle({ engagement, id, loading }: UseEngagementDocumentTitleOptions) {
	const { t } = useTranslation();

	useEffect(() => {
		if (engagement?.msnfp_engagementopportunitytitle) {
			document.title = engagement.msnfp_engagementopportunitytitle;
		} else if (!loading && id) {
			document.title = t('MSVE_SPA/NotFound/Title');
		}
	}, [engagement?.msnfp_engagementopportunitytitle, id, loading, t]);
}
