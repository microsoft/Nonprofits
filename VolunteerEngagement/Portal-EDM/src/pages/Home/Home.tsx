import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useTranslation } from '@/i18n';
import { Button, Dropdown, Input, Option, Spinner, Text } from '@fluentui/react-components';
import { Filter24Regular, Search24Regular } from '@fluentui/react-icons';

import { EngagementCard } from '@/components/EngagementCard';
import { FilterSidebar, type Filters } from '@/components/FilterSidebar';
import { HeroBanner, useHeroContentStyles } from '@/components/HeroBanner';

import { useAuth } from '@/hooks/useAuth';

import { fetchEngagements, fetchMyParticipations, fetchPreferenceTypes, fetchQualificationTypes } from '@/services/api';

import type { Engagement, Participation, PreferenceType, QualificationType } from '@/types';

import { filterAndSortEngagements } from './Home.model';
import { useStyles } from './Home.styles';
import { SortBy, emptyFilters } from './Home.types';

export default function Home() {
	const styles = useStyles();
	const hero = useHeroContentStyles();
	const navigate = useNavigate();
	const { user } = useAuth();
	const { t } = useTranslation();
	const [engagements, setEngagements] = useState<Engagement[]>([]);
	const [filtered, setFiltered] = useState<Engagement[]>([]);
	const [preferences, setPreferences] = useState<PreferenceType[]>([]);
	const [qualifications, setQualifications] = useState<QualificationType[]>([]);
	const [participations, setParticipations] = useState<Participation[]>([]);
	const [loading, setLoading] = useState(true);
	const [filters, setFilters] = useState<Filters>(emptyFilters);
	const [sortBy, setSortBy] = useState<SortBy>(SortBy.StartDate);
	const [heroSearch, setHeroSearch] = useState('');
	const [filtersOpen, setFiltersOpen] = useState(false);
	const contactId = user?.contactId;

	useEffect(() => {
		let cancelled = false;

		const load = async () => {
			setLoading(true);
			try {
				const [engs, prefs, quals] = await Promise.all([
					fetchEngagements(),
					fetchPreferenceTypes(),
					fetchQualificationTypes(),
				]);

				if (cancelled) {
					return;
				}

				setEngagements(engs);
				setFiltered(engs);
				setPreferences(prefs);
				setQualifications(quals);
			} catch (err) {
				console.error('Error loading engagements:', err);
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};
		load();

		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		let cancelled = false;

		if (!contactId) {
			setParticipations([]);
			return;
		}

		const loadParticipations = async () => {
			try {
				const parts = await fetchMyParticipations(contactId);
				if (!cancelled) {
					setParticipations(parts);
				}
			} catch {
				if (!cancelled) {
					setParticipations([]);
				}
			}
		};

		loadParticipations();

		return () => {
			cancelled = true;
		};
	}, [contactId]);

	const applyFilters = useCallback(() => {
		setFiltered(filterAndSortEngagements(engagements, filters, sortBy));
	}, [engagements, filters, sortBy]);

	useEffect(() => {
		applyFilters();
	}, [applyFilters]);

	const handleClear = () => {
		setFilters(emptyFilters);
	};

	return (
		<div className={styles.page}>
			<HeroBanner title={t('MSVE_SPA/Home/Title')} subtitle={t('MSVE_SPA/Home/Subtitle')} className={styles.hero}>
				<div className={hero.search}>
					<Input
						aria-label={t('MSVE_SPA/Home/SearchAriaLabel')}
						className={hero.searchInput}
						placeholder={t('MSVE_SPA/Home/SearchPlaceholder')}
						value={heroSearch}
						onChange={(_, data) => setHeroSearch(data.value)}
						onKeyDown={(e) => {
							if (e.key === 'Enter' && heroSearch.trim()) {
								navigate(`/search?q=${encodeURIComponent(heroSearch.trim())}`);
							}
						}}
						contentAfter={
							<Button
								aria-label={t('MSVE_SPA/Common/Search')}
								appearance="transparent"
								icon={<Search24Regular />}
								size="small"
								onClick={() => {
									if (heroSearch.trim()) {
										navigate(`/search?q=${encodeURIComponent(heroSearch.trim())}`);
									}
								}}
							/>
						}
					/>
				</div>
			</HeroBanner>

			<div className={styles.body}>
				<div className={`${styles.sidebar} ${filtersOpen ? styles.sidebarOpen : ''}`}>
					<FilterSidebar
						filters={filters}
						onFiltersChange={setFilters}
						preferences={preferences}
						qualifications={qualifications}
						onApply={applyFilters}
						onClear={handleClear}
					/>
				</div>

				<div className={styles.main}>
					<div className={styles.toolbar}>
						<div className={styles.toolbarLeft}>
							<Button
								className={styles.filterToggle}
								icon={<Filter24Regular />}
								appearance="secondary"
								size="small"
								onClick={() => setFiltersOpen((o) => !o)}
							>
								{filtersOpen ? t('MSVE_SPA/Filter/HideFilters') : t('MSVE_SPA/Filter/Title')}
							</Button>
							<Text size={400} weight="medium" aria-live="polite">
								{loading
									? t('MSVE_SPA/Common/Loading')
									: filtered.length === 1
										? t('MSVE_SPA/Home/EngagementCount_one')
										: t('MSVE_SPA/Home/EngagementsCount', { count: filtered.length })}
							</Text>
						</div>
						<Dropdown
							aria-label={t('MSVE_SPA/Home/SortBy')}
							placeholder={t('MSVE_SPA/Home/SortBy')}
							value={
								sortBy === SortBy.StartDate
									? t('MSVE_SPA/Home/SortStartDate')
									: sortBy === SortBy.EndDate
										? t('MSVE_SPA/Home/SortEndDate')
										: t('MSVE_SPA/Home/SortName')
							}
							onOptionSelect={(_, data) => setSortBy(data.optionValue as SortBy)}
						>
							<Option value={SortBy.StartDate}>{t('MSVE_SPA/Home/SortStartDate')}</Option>
							<Option value={SortBy.EndDate}>{t('MSVE_SPA/Home/SortEndDate')}</Option>
							<Option value={SortBy.Title}>{t('MSVE_SPA/Home/SortName')}</Option>
						</Dropdown>
					</div>

					{loading ? (
						<Spinner label={t('MSVE_SPA/Home/LoadingEngagements')} />
					) : filtered.length === 0 ? (
						<div className={styles.empty}>
							<Text size={500}>{t('MSVE_SPA/Home/NoEngagements')}</Text>
							<Text size={300} align="center" className={styles.emptyHint}>
								{t('MSVE_SPA/Home/NoEngagementsHint')}
							</Text>
						</div>
					) : (
						<div className={styles.cards}>
							{filtered.map((eng) => {
								const part = participations.find(
									(p) =>
										p._msnfp_engagementopportunityid_value ===
										eng._msnfp_engagementopportunityid_value,
								);
								return (
									<EngagementCard
										key={eng.msnfp_publicengagementopportunityid}
										engagement={eng}
										participationStatus={part?.msnfp_status}
									/>
								);
							})}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
