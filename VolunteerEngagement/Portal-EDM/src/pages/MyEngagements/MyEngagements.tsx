import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useTranslation } from '@/i18n';
import { Button, Card, CardHeader, Spinner, Tab, TabList, Text, Title1 } from '@fluentui/react-components';
import { ArrowRight24Regular, CheckmarkCircle24Regular, Clock24Regular } from '@fluentui/react-icons';

import { HeroBanner, useHeroContentStyles } from '@/components/HeroBanner';
import { SignInButton } from '@/components/SignInButton';
import { StatusBadge, StatusBadgeType } from '@/components/StatusBadge';

import { useAuth } from '@/hooks/useAuth';

import { fetchMyParticipations, fetchPublicEngagementByPrivateId } from '@/services/api';

import { EngagementOpportunityStatus, ParticipationStatus } from '@/types';

import { useStyles } from './MyEngagements.styles';
import { type EnrichedParticipation, MyEngagementsTab } from './MyEngagements.types';

function isCanceledParticipation(participation: EnrichedParticipation) {
	return (
		participation.msnfp_status === ParticipationStatus.Canceled ||
		participation.msnfp_status === ParticipationStatus.Dismissed
	);
}

function isClosedOrCancelledEngagement(participation: EnrichedParticipation) {
	const status = participation.engagement?.msnfp_engagementopportunitystatus;
	return status === EngagementOpportunityStatus.Closed || status === EngagementOpportunityStatus.Cancelled;
}

function getEngagementBoundaryTime(participation: EnrichedParticipation) {
	const engagement = participation.engagement;
	if (!engagement) {
		return null;
	}

	const dateValue = engagement.msnfp_multipledays ? engagement.msnfp_endingdate : engagement.msnfp_startingdate;
	const time = new Date(dateValue).getTime();
	return Number.isNaN(time) ? null : time;
}

function isUpcomingParticipation(participation: EnrichedParticipation, now: number) {
	const engagement = participation.engagement;
	const boundaryTime = getEngagementBoundaryTime(participation);
	return (
		!isCanceledParticipation(participation) &&
		engagement?.msnfp_engagementopportunitystatus === EngagementOpportunityStatus.PublishToWeb &&
		boundaryTime !== null &&
		boundaryTime >= now
	);
}

function isPastParticipation(participation: EnrichedParticipation, now: number) {
	const boundaryTime = getEngagementBoundaryTime(participation);
	if (isCanceledParticipation(participation) || isClosedOrCancelledEngagement(participation)) {
		return true;
	}

	return !participation.engagement || boundaryTime === null || boundaryTime < now;
}

export default function MyEngagements() {
	const styles = useStyles();
	const hero = useHeroContentStyles();
	const navigate = useNavigate();
	const { user, isAuthenticated, loading: authLoading } = useAuth();
	const { t } = useTranslation();

	const [participations, setParticipations] = useState<EnrichedParticipation[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<MyEngagementsTab>(MyEngagementsTab.Upcoming);

	useEffect(() => {
		if (!user) {
			setLoading(false);
			return;
		}
		const load = async () => {
			try {
				const parts = await fetchMyParticipations(user.contactId);

				const enriched: EnrichedParticipation[] = await Promise.all(
					parts.map(async (p) => {
						try {
							const eng = await fetchPublicEngagementByPrivateId(p._msnfp_engagementopportunityid_value);
							return { ...p, engagement: eng ?? undefined } as EnrichedParticipation;
						} catch {
							return { ...p } as EnrichedParticipation;
						}
					}),
				);

				setParticipations(enriched);
			} catch (err) {
				console.error('Error loading participations:', err);
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [user]);

	if (authLoading) {
		return (
			<div className={styles.loadingState}>
				<Spinner label={t('MSVE_SPA/Common/Loading')} />
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<div className={styles.loginPrompt}>
				<Title1>{t('MSVE_SPA/MyEngagements/Title')}</Title1>
				<Text size={400} className={styles.loginPromptText}>
					{t('MSVE_SPA/MyEngagements/SignInPrompt')}
				</Text>
				<SignInButton returnUrl="/my-engagements" className={styles.signInButton} />
			</div>
		);
	}

	const now = Date.now();
	const activeParticipations = participations.filter((p) => isUpcomingParticipation(p, now));

	const canceledParticipations = participations.filter((p) => isPastParticipation(p, now));

	const displayList = activeTab === MyEngagementsTab.Upcoming ? activeParticipations : canceledParticipations;

	return (
		<div className={styles.page}>
			<HeroBanner title={t('MSVE_SPA/MyEngagements/Title')}>
				<div className={hero.stats}>
					<div className={hero.stat}>
						<div className={hero.statValue}>
							<Clock24Regular className={styles.statIcon} />
							{activeParticipations.length}
						</div>
						<Text className={hero.statLabel}>{t('MSVE_SPA/MyEngagements/Active')}</Text>
					</div>
					<div className={hero.stat}>
						<div className={hero.statValue}>
							<CheckmarkCircle24Regular className={styles.statIcon} />
							{participations.length}
						</div>
						<Text className={hero.statLabel}>{t('MSVE_SPA/MyEngagements/Total')}</Text>
					</div>
				</div>
			</HeroBanner>
			<div className={styles.content}>
				<TabList
					selectedValue={activeTab}
					onTabSelect={(_, data) => setActiveTab(data.value as MyEngagementsTab)}
					className={styles.centeredTabs}
				>
					<Tab value={MyEngagementsTab.Upcoming}>
						{t('MSVE_SPA/MyEngagements/ActiveTab', { count: activeParticipations.length })}
					</Tab>
					<Tab value={MyEngagementsTab.Past}>
						{t('MSVE_SPA/MyEngagements/PastTab', { count: canceledParticipations.length })}
					</Tab>
				</TabList>

				<div aria-live="polite">
					{loading ? (
						<Spinner label={t('MSVE_SPA/MyEngagements/Loading')} />
					) : displayList.length === 0 ? (
						<div className={styles.empty}>
							<Text size={500}>
								{activeTab === MyEngagementsTab.Upcoming
									? t('MSVE_SPA/MyEngagements/NoActive')
									: t('MSVE_SPA/MyEngagements/NoPast')}
							</Text>
							<Text size={300} className={styles.emptyHint}>
								{activeTab === MyEngagementsTab.Upcoming
									? t('MSVE_SPA/MyEngagements/NoActiveHint')
									: t('MSVE_SPA/MyEngagements/NoPastHint')}
							</Text>
							{activeTab === MyEngagementsTab.Upcoming && (
								<Button
									appearance="primary"
									className={styles.emptyAction}
									onClick={() => navigate('/')}
								>
									{t('MSVE_SPA/Common/BrowseEngagements')}
								</Button>
							)}
						</div>
					) : (
						<div className={styles.cards}>
							{displayList.map((p) => (
								<Card
									key={p.msnfp_participationid}
									className={styles.card}
									onClick={() => {
										if (p.engagement) {
											navigate(`/engagement/${p.engagement.msnfp_publicengagementopportunityid}`);
										}
									}}
								>
									<CardHeader
										header={
											<Text weight="semibold" size={400}>
												{p.engagement?.msnfp_engagementopportunitytitle ??
													t('MSVE_SPA/MyEngagements/Engagement')}
											</Text>
										}
										description={
											<div className={styles.cardMeta}>
												<StatusBadge
													status={p.msnfp_status}
													type={StatusBadgeType.Participation}
												/>
												{p.engagement && (
													<div className={styles.metaItem}>
														<Clock24Regular />
														<Text size={200}>
															{new Date(
																p.engagement.msnfp_startingdate,
															).toLocaleDateString()}{' '}
															–{' '}
															{new Date(
																p.engagement.msnfp_endingdate,
															).toLocaleDateString()}
														</Text>
													</div>
												)}
											</div>
										}
										action={
											<Button icon={<ArrowRight24Regular />} appearance="subtle" size="small">
												{t('MSVE_SPA/Common/View')}
											</Button>
										}
									/>
								</Card>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
