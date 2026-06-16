import React, { useEffect, useState } from 'react';

import { useNavigate, useSearchParams } from 'react-router-dom';

import { useTranslation } from '@/i18n';
import { Button, Input, Spinner, Text, Title1 } from '@fluentui/react-components';
import { Home24Regular, SearchInfo24Regular } from '@fluentui/react-icons';

import { EngagementCard } from '@/components/EngagementCard';

import { fetchEngagements } from '@/services/api';

import type { Engagement } from '@/types';

import { useStyles } from './Search.styles';

export default function Search() {
	const styles = useStyles();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const query = searchParams.get('q') ?? '';
	const [input, setInput] = useState(query);
	const [results, setResults] = useState<Engagement[]>([]);
	const [loading, setLoading] = useState(false);
	const [searched, setSearched] = useState(false);
	const { t } = useTranslation();

	const doSearch = async (q: string) => {
		if (!q.trim()) return;
		setLoading(true);
		setSearched(true);
		try {
			const all = await fetchEngagements();
			const lower = q.toLowerCase();
			const filtered = all.filter(
				(e) =>
					e.msnfp_engagementopportunitytitle?.toLowerCase().includes(lower) ||
					e.msnfp_shortdescription?.toLowerCase().includes(lower) ||
					e.msnfp_locationname?.toLowerCase().includes(lower) ||
					e.msnfp_locationcitystate?.toLowerCase().includes(lower),
			);
			setResults(filtered);
		} catch (err) {
			console.error('Search error:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (query) {
			doSearch(query);
		}
	}, [query]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setSearchParams({ q: input });
	};

	return (
		<div className={styles.page}>
			<Title1>{t('MSVE_SPA/Search/Title')}</Title1>

			<form onSubmit={handleSubmit} className={styles.searchBar}>
				<Input
					placeholder={t('MSVE_SPA/Search/Placeholder')}
					value={input}
					onChange={(_, data) => setInput(data.value)}
					className={styles.searchInput}
				/>
				<Button appearance="primary" type="submit">
					{t('MSVE_SPA/Common/Search')}
				</Button>
			</form>

			{loading ? (
				<Spinner label={t('MSVE_SPA/Search/Searching')} />
			) : searched ? (
				results.length > 0 ? (
					<>
						<Text size={400} weight="medium">
							{results.length === 1
								? t('MSVE_SPA/Search/ResultCount_one', { query })
								: t('MSVE_SPA/Search/ResultsCount', { count: results.length, query })}
						</Text>
						<div className={styles.results}>
							{results.map((eng) => (
								<EngagementCard key={eng.msnfp_publicengagementopportunityid} engagement={eng} />
							))}
						</div>
					</>
				) : (
					<div className={styles.empty}>
						<SearchInfo24Regular className={styles.emptyIcon} />
						<Text size={500} weight="semibold">
							{t('MSVE_SPA/Search/NoResults')}
						</Text>
						<Text size={300} className={styles.emptyHint}>
							{t('MSVE_SPA/Search/NoResultsHint')}
						</Text>
						<Button
							appearance="primary"
							icon={<Home24Regular />}
							onClick={() => navigate('/')}
							className={styles.emptyAction}
						>
							{t('MSVE_SPA/Common/BrowseEngagements')}
						</Button>
					</div>
				)
			) : null}
		</div>
	);
}
