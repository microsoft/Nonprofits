import { useEffect, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { useTranslation } from '@/i18n';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import {
	Badge,
	Button,
	Card,
	Checkbox,
	Divider,
	MessageBar,
	MessageBarBody,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHeader,
	TableHeaderCell,
	TableRow,
	Text,
	Title2,
} from '@fluentui/react-components';
import {
	ArrowLeft24Regular,
	CalendarLtr24Regular,
	Globe24Regular,
	Location24Regular,
	People24Regular,
} from '@fluentui/react-icons';
import parse from 'html-react-parser';

import { HeroBanner, useHeroContentStyles } from '@/components/HeroBanner';
import { SignInButton } from '@/components/SignInButton';
import { StatusBadge, StatusBadgeType } from '@/components/StatusBadge';

import { useAuth } from '@/hooks/useAuth';
import {
	createParticipation,
	createParticipationSchedule,
	fetchEngagement,
	fetchEngagementRequiredQualifications,
	fetchEngagementSchedules,
	fetchParticipation,
	fetchParticipationSchedules,
	fetchQualificationTypes,
	markContactAsVolunteer,
	updateParticipationStatus,
	updateScheduleStatus,
} from '@/services/api';

import type {
	Engagement,
	EngagementRequiredQualification,
	EngagementSchedule,
	Participation,
	ParticipationSchedule,
	QualificationType,
} from '@/types';
import { LocationType, ParticipationStatus, ScheduleStatus, getLocationLabel } from '@/types';

import { useStyles } from './EngagementDetails.styles';
import { useEngagementDocumentTitle } from './hooks/useEngagementDocumentTitle';

export default function EngagementDetails() {
	const styles = useStyles();
	const hero = useHeroContentStyles();
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { user, isAuthenticated } = useAuth();
	const { t } = useTranslation();

	const [engagement, setEngagement] = useState<Engagement | null>(null);
	const [participation, setParticipation] = useState<Participation | null>(null);
	const [pSchedules, setPSchedules] = useState<ParticipationSchedule[]>([]);
	const [eSchedules, setESchedules] = useState<EngagementSchedule[]>([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [selectedShifts, setSelectedShifts] = useState<Set<string>>(new Set());
	const [requiredQuals, setRequiredQuals] = useState<EngagementRequiredQualification[]>([]);
	const [qualTypes, setQualTypes] = useState<QualificationType[]>([]);
	const contactId = user?.contactId;
	const engagementOppId = engagement?._msnfp_engagementopportunityid_value;

	useEngagementDocumentTitle({ engagement, id, loading });

	useEffect(() => {
		if (!id) return;
		let cancelled = false;

		const load = async () => {
			try {
				setLoading(true);
				setError(null);

				const eng = await fetchEngagement(id);
				if (cancelled) return;
				setEngagement(eng);

				const qt = await fetchQualificationTypes();
				if (cancelled) return;
				setQualTypes(qt);

				if (eng._msnfp_engagementopportunityid_value) {
					const rq = await fetchEngagementRequiredQualifications(eng._msnfp_engagementopportunityid_value);
					if (cancelled) return;
					setRequiredQuals(rq);
				}
			} catch (err) {
				console.error('Error loading engagement:', err);
				if (!cancelled) {
					setError(t('MSVE_SPA/Error/FailedToLoadEngagement'));
				}
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
	}, [id, t]);

	useEffect(() => {
		let cancelled = false;

		if (!contactId || !engagementOppId) {
			setParticipation(null);
			setPSchedules([]);
			setESchedules([]);
			return;
		}

		const loadParticipationState = async () => {
			try {
				const [part, es] = await Promise.all([
					fetchParticipation(contactId, engagementOppId),
					fetchEngagementSchedules(engagementOppId),
				]);

				if (cancelled) return;
				setParticipation(part);
				setESchedules(es);

				if (part) {
					const ps = await fetchParticipationSchedules(part.msnfp_participationid);
					if (!cancelled) {
						setPSchedules(ps);
					}
				} else if (!cancelled) {
					setPSchedules([]);
				}
			} catch (err) {
				console.error('Error loading participation state:', err);
			}
		};

		loadParticipationState();

		return () => {
			cancelled = true;
		};
	}, [contactId, engagementOppId]);

	const handleApply = async () => {
		if (!user || !engagement) return;
		setActionLoading(true);
		try {
			await markContactAsVolunteer(user.contactId);
			const part = await createParticipation(engagement._msnfp_engagementopportunityid_value, user.contactId);
			setParticipation(part);
			navigate('/success?action=apply');
		} catch (err) {
			console.error('Error applying:', err);
			setError(t('MSVE_SPA/Error/FailedToApply'));
		} finally {
			setActionLoading(false);
		}
	};

	const handleCancelParticipation = async () => {
		if (!participation) return;
		setActionLoading(true);
		try {
			await updateParticipationStatus(participation.msnfp_participationid, ParticipationStatus.Canceled);
			setParticipation({
				...participation,
				msnfp_status: ParticipationStatus.Canceled,
			});
		} catch (err) {
			console.error('Error canceling:', err);
			setError(t('MSVE_SPA/Error/FailedToCancelParticipation'));
		} finally {
			setActionLoading(false);
		}
	};

	const handleBookShifts = async () => {
		if (!participation || selectedShifts.size === 0) return;
		setActionLoading(true);
		try {
			for (const scheduleId of selectedShifts) {
				const existingSchedule = getShiftPSchedule(scheduleId);
				if (existingSchedule?.msnfp_schedulestatus === ScheduleStatus.Canceled) {
					await updateScheduleStatus(
						existingSchedule.msnfp_participationscheduleid,
						ScheduleStatus.Registered,
					);
				} else if (!existingSchedule) {
					await createParticipationSchedule(participation.msnfp_participationid, scheduleId);
				}
			}
			const ps = await fetchParticipationSchedules(participation.msnfp_participationid);
			setPSchedules(ps);
			setSelectedShifts(new Set());
		} catch (err) {
			console.error('Error booking shifts:', err);
			setError(t('MSVE_SPA/Error/FailedToBookShifts'));
		} finally {
			setActionLoading(false);
		}
	};

	const handleCancelShift = async (scheduleId: string) => {
		setActionLoading(true);
		try {
			await updateScheduleStatus(scheduleId, ScheduleStatus.Canceled);
			if (participation && engagement?.msnfp_shifts === false) {
				await updateParticipationStatus(participation.msnfp_participationid, ParticipationStatus.Canceled);
				setParticipation({
					...participation,
					msnfp_status: ParticipationStatus.Canceled,
				});
			}
			setPSchedules((prev) =>
				prev.map((s) =>
					s.msnfp_participationscheduleid === scheduleId
						? { ...s, msnfp_schedulestatus: ScheduleStatus.Canceled }
						: s,
				),
			);
		} catch (err) {
			console.error('Error canceling shift:', err);
			setError(t('MSVE_SPA/Error/FailedToCancelShift'));
		} finally {
			setActionLoading(false);
		}
	};

	const toggleShift = (scheduleId: string) => {
		setSelectedShifts((prev) => {
			const next = new Set(prev);
			if (next.has(scheduleId)) {
				next.delete(scheduleId);
			} else {
				next.add(scheduleId);
			}
			return next;
		});
	};

	const setShiftSelected = (scheduleId: string, selected: boolean) => {
		setSelectedShifts((prev) => {
			const next = new Set(prev);
			if (selected) {
				next.add(scheduleId);
			} else {
				next.delete(scheduleId);
			}
			return next;
		});
	};

	const isShiftBooked = (eScheduleId: string) =>
		pSchedules.some(
			(ps) =>
				ps._msnfp_engagementopportunityscheduleid_value === eScheduleId &&
				ps.msnfp_schedulestatus !== ScheduleStatus.Canceled,
		);

	const getShiftPSchedule = (eScheduleId: string) =>
		pSchedules.find((ps) => ps._msnfp_engagementopportunityscheduleid_value === eScheduleId);

	const canSelectShift = (eScheduleId: string) => isApproved && !isShiftBooked(eScheduleId);
	const getRemainingCapacity = (schedule: EngagementSchedule) =>
		Math.max((schedule.msnfp_maximum ?? 0) - (schedule.msnfp_number ?? 0), 0);

	if (loading) {
		return <Spinner label={t('MSVE_SPA/Engagement/Loading')} />;
	}

	if (!engagement) {
		return (
			<div className={styles.page}>
				<MessageBar intent="error">
					<MessageBarBody>{t('MSVE_SPA/Engagement/NotFound')}</MessageBarBody>
				</MessageBar>
				<Button icon={<ArrowLeft24Regular />} onClick={() => navigate('/')}>
					{t('MSVE_SPA/Engagement/BackToHome')}
				</Button>
			</div>
		);
	}

	const startDate = new Date(engagement.msnfp_startingdate).toLocaleDateString();
	const endDate = new Date(engagement.msnfp_endingdate).toLocaleDateString();
	const canApply = isAuthenticated && !participation;
	const isActive =
		participation &&
		participation.msnfp_status !== ParticipationStatus.Canceled &&
		participation.msnfp_status !== ParticipationStatus.Dismissed;
	const isApproved = participation?.msnfp_status === ParticipationStatus.Accepted;
	const isPendingApproval = participation?.msnfp_status === ParticipationStatus.Applied;
	const descriptionHtml = engagement.msnfp_description ? sanitizeHtml(engagement.msnfp_description) : '';

	return (
		<div className={styles.page}>
			<HeroBanner title={engagement.msnfp_engagementopportunitytitle} className={styles.hero}>
				<div className={hero.meta}>
					<div className={hero.metaItem}>
						<CalendarLtr24Regular />
						<Text className={styles.heroMetaText}>
							{startDate} – {endDate}
						</Text>
					</div>
					<div className={hero.metaItem}>
						{engagement.msnfp_locationtype === LocationType.Virtual ? (
							<Globe24Regular />
						) : (
							<Location24Regular />
						)}
						<Text className={styles.heroMetaText}>
							{getLocationLabel(engagement.msnfp_locationtype, t)}
						</Text>
					</div>
					{engagement.msnfp_locationname && (
						<div className={hero.metaItem}>
							<Text className={styles.heroMetaText}>{engagement.msnfp_locationname}</Text>
						</div>
					)}
					<div className={hero.metaItem}>
						<People24Regular />
						<Text className={styles.heroMetaText}>
							{t('MSVE_SPA/Common/VolunteersNeeded', { count: engagement.msnfp_maximum })}
						</Text>
					</div>
				</div>
				{participation && (
					<div className={hero.status}>
						<StatusBadge
							status={participation.msnfp_status}
							type={StatusBadgeType.Participation}
							size="extra-large"
						/>
					</div>
				)}
				<div className={styles.heroActions}>
					{!isAuthenticated && (
						<SignInButton label={t('MSVE_SPA/Auth/SignInToApply')} returnUrl={window.location.pathname} />
					)}
					{canApply && (
						<Button appearance="primary" onClick={handleApply} disabled={actionLoading}>
							{t('MSVE_SPA/Engagement/ApplyNow')}
						</Button>
					)}
					{isActive && (
						<Button
							appearance="outline"
							className={styles.heroOutlineButton}
							onClick={handleCancelParticipation}
							disabled={actionLoading}
						>
							{t('MSVE_SPA/Engagement/CancelParticipation')}
						</Button>
					)}
				</div>
				{!isAuthenticated && (
					<Text size={200} className={styles.heroHint}>
						{t('MSVE_SPA/Auth/SignInHint')}
					</Text>
				)}
			</HeroBanner>

			<div className={styles.content}>
				<Button
					className={styles.backBtn}
					appearance="subtle"
					icon={<ArrowLeft24Regular />}
					onClick={() => navigate('/')}
				>
					{t('MSVE_SPA/Engagement/BackToEngagements')}
				</Button>

				{error && (
					<MessageBar intent="error">
						<MessageBarBody>{error}</MessageBarBody>
					</MessageBar>
				)}

				<div className={styles.section}>
					<Title2>{t('MSVE_SPA/Engagement/AboutTitle')}</Title2>
					<Text size={400}>{engagement.msnfp_shortdescription}</Text>
					{descriptionHtml && <div>{parse(descriptionHtml)}</div>}
				</div>

				{requiredQuals.length > 0 && (
					<>
						<Divider />
						<div className={styles.section}>
							<Title2>{t('MSVE_SPA/Engagement/RequiredQualifications')}</Title2>
							<div className={styles.qualificationBadges}>
								{requiredQuals.map((rq) => {
									const qt = qualTypes.find(
										(q) => q.msnfp_qualificationtypeid === rq._msnfp_qualificationtypeid_value,
									);
									return (
										<Badge
											key={rq.msnfp_engagementopportunityparticipantqualid}
											appearance="tint"
											color="important"
										>
											{qt?.msnfp_qualificationtypetitle ?? t('MSVE_SPA/Engagement/Qualification')}
										</Badge>
									);
								})}
							</div>
						</div>
					</>
				)}

				{isActive && eSchedules.length > 0 && (
					<>
						<Divider />
						<div className={styles.section}>
							<Title2>{t('MSVE_SPA/Engagement/AvailableShifts')}</Title2>
							{isPendingApproval && (
								<MessageBar intent="warning">
									<MessageBarBody>{t('MSVE_SPA/Engagement/PendingApproval')}</MessageBarBody>
								</MessageBar>
							)}
							<Card>
								<div className={styles.tableScroll}>
									<Table className={styles.shiftTable}>
										<TableHeader>
											<TableRow>
												<TableHeaderCell className={styles.selectColumn} />
												<TableHeaderCell className={styles.shiftColumn}>
													{t('MSVE_SPA/Engagement/ShiftHeader')}
												</TableHeaderCell>
												<TableHeaderCell className={styles.nowrap}>
													{t('MSVE_SPA/Engagement/StartHeader')}
												</TableHeaderCell>
												<TableHeaderCell>
													{t('MSVE_SPA/Engagement/CapacityHeader')}
												</TableHeaderCell>
												<TableHeaderCell>
													{t('MSVE_SPA/Engagement/StatusHeader')}
												</TableHeaderCell>
												<TableHeaderCell>
													{t('MSVE_SPA/Engagement/ActionsHeader')}
												</TableHeaderCell>
											</TableRow>
										</TableHeader>
										<TableBody>
											{eSchedules.map((es) => {
												const scheduleId = es.msnfp_engagementopportunityscheduleid;
												const ps = getShiftPSchedule(scheduleId);
												const selectable = !actionLoading && canSelectShift(scheduleId);
												return (
													<TableRow
														key={scheduleId}
														className={selectable ? styles.selectableRow : undefined}
														onClick={() => {
															if (selectable) {
																toggleShift(scheduleId);
															}
														}}
													>
														<TableCell>
															{canSelectShift(scheduleId) && (
																<Checkbox
																	checked={selectedShifts.has(scheduleId)}
																	disabled={actionLoading}
																	onClick={(event) => event.stopPropagation()}
																	onChange={(_, data) =>
																		setShiftSelected(
																			scheduleId,
																			data.checked === true,
																		)
																	}
																/>
															)}
														</TableCell>
														<TableCell>
															<Text weight="medium">
																{es.msnfp_shiftname}
															</Text>
														</TableCell>
														<TableCell className={styles.nowrap}>
															{new Date(es.msnfp_startperiod).toLocaleString()}
														</TableCell>
														<TableCell>{t('MSVE_SPA/Engagement/CapacityNeeded', { count: getRemainingCapacity(es) })}</TableCell>
														<TableCell>
															{ps ? (
																<StatusBadge
																	status={ps.msnfp_schedulestatus}
																	type={StatusBadgeType.Schedule}
																/>
															) : (
																<Badge
																	appearance="tint"
																	color="informative"
																>
																	Available
																</Badge>
															)}
														</TableCell>
														<TableCell>
															{ps &&
																ps.msnfp_schedulestatus ===
																	ScheduleStatus.Registered && (
																	<Button
																		size="small"
																		appearance="subtle"
																		onClick={() =>
																			handleCancelShift(
																				ps.msnfp_participationscheduleid,
																			)
																		}
																		disabled={actionLoading}
																	>
																		{t('MSVE_SPA/Common/Cancel')}
																	</Button>
																)}
														</TableCell>
													</TableRow>
												);
											})}
										</TableBody>
									</Table>
								</div>
							</Card>
							{isApproved && (
								<Button
									appearance="primary"
									onClick={handleBookShifts}
									disabled={actionLoading || selectedShifts.size === 0}
								>
									{selectedShifts.size <= 1
										? t('MSVE_SPA/Engagement/BookShift_one')
										: t('MSVE_SPA/Engagement/BookShifts', { count: selectedShifts.size })}
								</Button>
							)}
						</div>
					</>
				)}
			</div>
		</div>
	);
}
