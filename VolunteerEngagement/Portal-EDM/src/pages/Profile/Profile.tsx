import { useCallback, useEffect, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { useTranslation } from '@/i18n';
import {
	Avatar,
	Badge,
	Button,
	Card,
	Checkbox,
	Dialog,
	DialogActions,
	DialogBody,
	DialogContent,
	DialogSurface,
	DialogTitle,
	DialogTrigger,
	Divider,
	Dropdown,
	Field,
	Input,
	MessageBar,
	MessageBarBody,
	Option,
	Spinner,
	Tab,
	TabList,
	Table,
	TableBody,
	TableCell,
	TableHeader,
	TableHeaderCell,
	TableRow,
	Text,
	Title2,
} from '@fluentui/react-components';
import { Add24Regular, Calendar24Regular, Delete24Regular } from '@fluentui/react-icons';

import { HeroBanner, useHeroContentStyles } from '@/components/HeroBanner';
import { SignInButton } from '@/components/SignInButton';

import { useAuth } from '@/hooks/useAuth';

import {
	createAvailability,
	createUserPreference,
	createUserQualification,
	deleteAvailability,
	deleteUserPreference,
	deleteUserQualification,
	fetchAvailabilities,
	fetchContactDetails,
	fetchPreferenceTypes,
	fetchQualificationTypes,
	fetchUserPreferences,
	fetchUserQualifications,
	updateContactDetails,
} from '@/services/api';

import type {
	Availability,
	ContactDetails,
	PortalUser,
	PreferenceType,
	QualificationType,
	UserPreference,
	UserQualification,
} from '@/types';
import { DAYS_OF_WEEK } from '@/types';

import { buildAvailabilityPayload, buildContactUpdateFields, parseWorkingDays } from './Profile.model';
import { useStyles } from './Profile.styles';
import { PATH_TO_TAB, ProfileTab, TAB_TO_PATH } from './Profile.types';

export default function Profile() {
	const styles = useStyles();
	const hero = useHeroContentStyles();
	const { user, isAuthenticated, loading: authLoading } = useAuth();
	const { t } = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const normalizedPath = location.pathname.replace(/\/$/, '') || '/';
	const activeTab = PATH_TO_TAB[normalizedPath] ?? ProfileTab.Info;

	useEffect(() => {
		const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
		document.title = fullName ? `${t('MSVE_SPA/Nav/Profile')}: ${fullName}` : t('MSVE_SPA/Nav/Profile');
	}, [t, user]);

	if (authLoading) {
		return (
			<div className={styles.loadingState}>
				<Spinner label={t('MSVE_SPA/Common/Loading')} />
			</div>
		);
	}

	if (!isAuthenticated || !user) {
		return (
			<div className={styles.centered}>
				<Title2>{t('MSVE_SPA/Profile/Title')}</Title2>
				<Text size={400} className={styles.centeredText}>
					{t('MSVE_SPA/Profile/SignInPrompt')}
				</Text>
				<SignInButton returnUrl="/profile" className={styles.signInButton} />
			</div>
		);
	}

	const fullName = `${user.firstName} ${user.lastName}`.trim() || user.userName;

	return (
		<div className={styles.page}>
			<HeroBanner
				title={fullName}
				icon={<Avatar name={fullName} size={72} color="neutral" className={hero.avatar} />}
			>
				{user.userName && user.userName !== fullName && (
					<span className={hero.secondaryText}>{user.userName}</span>
				)}
			</HeroBanner>

			<div className={styles.content}>
				<div className={styles.tabScroll}>
					<TabList
						selectedValue={activeTab}
						className={styles.tabList}
						onTabSelect={(_, data) => {
							const path = TAB_TO_PATH[data.value as ProfileTab];
							if (path) navigate(path);
						}}
					>
						<Tab value={ProfileTab.Info}>{t('MSVE_SPA/Profile/TabContactInfo')}</Tab>
						<Tab value={ProfileTab.Availability}>{t('MSVE_SPA/Profile/TabAvailability')}</Tab>
						<Tab value={ProfileTab.PreferencesAndQualifications}>{t('MSVE_SPA/Profile/TabPrefsQuals')}</Tab>
					</TabList>
				</div>

				{activeTab === ProfileTab.Info && <ContactInfoTab user={user} />}
				{activeTab === ProfileTab.Availability && <AvailabilityTab contactId={user.contactId} />}
				{activeTab === ProfileTab.PreferencesAndQualifications && <PrefsQualsTab contactId={user.contactId} />}
			</div>
		</div>
	);
}

function ContactInfoTab({ user }: { user: PortalUser }) {
	const styles = useStyles();
	const { t } = useTranslation();
	const [contact, setContact] = useState<ContactDetails | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);
		fetchContactDetails(user.contactId)
			.then((data) => {
				if (!cancelled) setContact(data);
			})
			.catch((e) => {
				if (!cancelled) setError(e?.message ?? t('MSVE_SPA/Error/FailedToLoadContact'));
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [t, user.contactId]);

	function setField<K extends keyof ContactDetails>(key: K, value: ContactDetails[K]) {
		setContact((c) => (c ? { ...c, [key]: value } : c));
		setSuccess(false);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!contact) return;
		setSaving(true);
		setError(null);
		setSuccess(false);
		try {
			await updateContactDetails(user.contactId, buildContactUpdateFields(contact));
			setSuccess(true);
		} catch (err: any) {
			setError(err?.message ?? t('MSVE_SPA/Error/FailedToUpdateProfile'));
		} finally {
			setSaving(false);
		}
	}

	if (loading) {
		return <Spinner label={t('MSVE_SPA/Profile/LoadingContact')} />;
	}
	if (error && !contact) {
		return (
			<MessageBar intent="error">
				<MessageBarBody>{error}</MessageBarBody>
			</MessageBar>
		);
	}
	if (!contact) return null;

	return (
		<form className={styles.section} onSubmit={handleSubmit}>
			{error && (
				<MessageBar intent="error">
					<MessageBarBody>{error}</MessageBarBody>
				</MessageBar>
			)}
			{success && (
				<MessageBar intent="success">
					<MessageBarBody>{t('MSVE_SPA/Profile/ProfileUpdated')}</MessageBarBody>
				</MessageBar>
			)}

			<Title2>{t('MSVE_SPA/Profile/ContactInformation')}</Title2>
			<Card role="group" aria-label={t('MSVE_SPA/Profile/ContactInformation')}>
				<div className={styles.twoCol}>
					<Field label={t('MSVE_SPA/Profile/FirstName')} required>
						<Input
							id="firstname"
							value={contact.firstname ?? ''}
							onChange={(_, d) => setField('firstname', d.value)}
						/>
					</Field>
					<Field label={t('MSVE_SPA/Profile/LastName')} required>
						<Input
							id="lastname"
							value={contact.lastname ?? ''}
							onChange={(_, d) => setField('lastname', d.value)}
						/>
					</Field>
					<Field label={t('MSVE_SPA/Profile/PhoneNumber')}>
						<Input
							id="telephone1"
							placeholder={t('MSVE_SPA/Profile/PhonePlaceholder')}
							value={contact.telephone1 ?? ''}
							onChange={(_, d) => setField('telephone1', d.value)}
						/>
					</Field>
					<Field label={t('MSVE_SPA/Profile/Email')}>
						<Input
							id="emailaddress1"
							type="email"
							value={contact.emailaddress1 ?? ''}
							onChange={(_, d) => setField('emailaddress1', d.value)}
						/>
					</Field>
				</div>
			</Card>

			<Title2>{t('MSVE_SPA/Profile/Address')}</Title2>
			<Card role="group" aria-label={t('MSVE_SPA/Profile/Address')}>
				<div className={styles.section}>
					<Field label={t('MSVE_SPA/Profile/Street')}>
						<Input
							id="address1_line1"
							value={contact.address1_line1 ?? ''}
							onChange={(_, d) => setField('address1_line1', d.value)}
						/>
					</Field>
					<Field label={t('MSVE_SPA/Profile/Street2')}>
						<Input
							id="address1_line2"
							value={contact.address1_line2 ?? ''}
							onChange={(_, d) => setField('address1_line2', d.value)}
						/>
					</Field>
					<div className={styles.twoCol}>
						<Field label={t('MSVE_SPA/Profile/City')}>
							<Input
								id="address1_city"
								value={contact.address1_city ?? ''}
								onChange={(_, d) => setField('address1_city', d.value)}
							/>
						</Field>
						<Field label={t('MSVE_SPA/Profile/StateProvince')}>
							<Input
								id="address1_stateorprovince"
								value={contact.address1_stateorprovince ?? ''}
								onChange={(_, d) => setField('address1_stateorprovince', d.value)}
							/>
						</Field>
						<Field label={t('MSVE_SPA/Profile/ZipPostalCode')}>
							<Input
								id="address1_postalcode"
								value={contact.address1_postalcode ?? ''}
								onChange={(_, d) => setField('address1_postalcode', d.value)}
							/>
						</Field>
						<Field label={t('MSVE_SPA/Profile/CountryRegion')}>
							<Input
								id="address1_country"
								value={contact.address1_country ?? ''}
								onChange={(_, d) => setField('address1_country', d.value)}
							/>
						</Field>
					</div>
				</div>
			</Card>

			<Title2>{t('MSVE_SPA/Profile/PreferredContactMethod')}</Title2>
			<Card role="group" aria-label={t('MSVE_SPA/Profile/PreferredContactMethod')}>
				<Checkbox
					label={t('MSVE_SPA/Profile/ContactEmail')}
					checked={!contact.donotemail}
					onChange={(_, d) => setField('donotemail', !d.checked)}
				/>
				<Checkbox
					label={t('MSVE_SPA/Profile/ContactFax')}
					checked={!contact.donotfax}
					onChange={(_, d) => setField('donotfax', !d.checked)}
				/>
				<Checkbox
					label={t('MSVE_SPA/Profile/ContactPhone')}
					checked={!contact.donotphone}
					onChange={(_, d) => setField('donotphone', !d.checked)}
				/>
				<Checkbox
					label={t('MSVE_SPA/Profile/ContactMail')}
					checked={!contact.donotpostalmail}
					onChange={(_, d) => setField('donotpostalmail', !d.checked)}
				/>
			</Card>

			<div>
				<Button type="submit" appearance="primary" disabled={saving}>
					{saving ? t('MSVE_SPA/Common/Updating') : t('MSVE_SPA/Common/Update')}
				</Button>
			</div>
		</form>
	);
}

function AvailabilityTab({ contactId }: { contactId: string }) {
	const styles = useStyles();
	const { t } = useTranslation();
	const [items, setItems] = useState<Availability[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [form, setForm] = useState<{
		msnfp_availabilitytitle: string;
		msnfp_startperiod: string;
		msnfp_endperiod: string;
		selectedDays: Set<number>;
	}>({
		msnfp_availabilitytitle: '',
		msnfp_startperiod: '',
		msnfp_endperiod: '',
		selectedDays: new Set([844060000, 844060001, 844060002, 844060003, 844060004]),
	});

	const load = useCallback(async () => {
		try {
			const data = await fetchAvailabilities(contactId);
			setItems(data);
		} catch {
			setError(t('MSVE_SPA/Error/FailedToLoadAvailability'));
		} finally {
			setLoading(false);
		}
	}, [contactId, t]);

	useEffect(() => {
		load();
	}, [load]);

	const handleAdd = async () => {
		try {
			await createAvailability(contactId, buildAvailabilityPayload(form));
			setDialogOpen(false);
			setForm({
				msnfp_availabilitytitle: '',
				msnfp_startperiod: '',
				msnfp_endperiod: '',
				selectedDays: new Set([844060000, 844060001, 844060002, 844060003, 844060004]),
			});
			await load();
		} catch {
			setError(t('MSVE_SPA/Error/FailedToCreateAvailability'));
		}
	};

	const handleDelete = async (id: string) => {
		try {
			await deleteAvailability(id);
			await load();
		} catch {
			setError(t('MSVE_SPA/Error/FailedToDeleteAvailability'));
		}
	};

	if (loading) return <Spinner label={t('MSVE_SPA/Profile/LoadingAvailability')} />;

	return (
		<div className={styles.section}>
			{error && (
				<MessageBar intent="error">
					<MessageBarBody>{error}</MessageBarBody>
				</MessageBar>
			)}
			<div className={styles.sectionHeader}>
				<Title2>{t('MSVE_SPA/Profile/AvailabilitySchedule')}</Title2>
				<Dialog open={dialogOpen} onOpenChange={(_, d) => setDialogOpen(d.open)}>
					<DialogTrigger disableButtonEnhancement>
						<Button appearance="primary" icon={<Add24Regular />} className={styles.pillButton}>
							{t('MSVE_SPA/Profile/AddAvailability')}
						</Button>
					</DialogTrigger>
					<DialogSurface>
						<DialogBody>
							<DialogTitle>{t('MSVE_SPA/Profile/AddAvailability')}</DialogTitle>
							<DialogContent>
								<div className={styles.section}>
									<Field label={t('MSVE_SPA/Profile/AvailabilityTitle')}>
										<Input
											value={form.msnfp_availabilitytitle}
											onChange={(_, d) => setForm({ ...form, msnfp_availabilitytitle: d.value })}
											placeholder={t('MSVE_SPA/Profile/AvailabilityTitlePlaceholder')}
										/>
									</Field>
									<div className={styles.formRow}>
										<Field label={t('MSVE_SPA/Profile/From')} required className={styles.dateField}>
											<Input
												type="date"
												value={form.msnfp_startperiod}
												onChange={(_, d) => setForm({ ...form, msnfp_startperiod: d.value })}
											/>
										</Field>
										<Field label={t('MSVE_SPA/Profile/To')} required className={styles.dateField}>
											<Input
												type="date"
												value={form.msnfp_endperiod}
												onChange={(_, d) => setForm({ ...form, msnfp_endperiod: d.value })}
											/>
										</Field>
									</div>
									<Text size={300} weight="medium">
										{t('MSVE_SPA/Profile/WorkingDays')}
									</Text>
									<div className={styles.chipRow}>
										{DAYS_OF_WEEK.map((day) => (
											<Checkbox
												key={day.value}
												label={t(`MSVE_SPA/Day/${day.label}`)}
												checked={form.selectedDays.has(day.value)}
												onChange={(_, d) => {
													const next = new Set(form.selectedDays);
													if (d.checked) next.add(day.value);
													else next.delete(day.value);
													setForm({ ...form, selectedDays: next });
												}}
											/>
										))}
									</div>
								</div>
							</DialogContent>
							<DialogActions>
								<DialogTrigger disableButtonEnhancement>
									<Button appearance="secondary">{t('MSVE_SPA/Common/Cancel')}</Button>
								</DialogTrigger>
								<Button
									appearance="primary"
									onClick={handleAdd}
									disabled={!form.msnfp_startperiod || !form.msnfp_endperiod}
								>
									{t('MSVE_SPA/Common/Save')}
								</Button>
							</DialogActions>
						</DialogBody>
					</DialogSurface>
				</Dialog>
			</div>

			{items.length === 0 ? (
				<div className={styles.emptyState}>
					<Calendar24Regular className={styles.emptyIcon} />
					<Text size={400} weight="medium">
						{t('MSVE_SPA/Profile/NoAvailability')}
					</Text>
					<Text size={300}>{t('MSVE_SPA/Profile/NoAvailabilityHint')}</Text>
				</div>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHeaderCell>{t('MSVE_SPA/Profile/TitleHeader')}</TableHeaderCell>
							<TableHeaderCell>{t('MSVE_SPA/Profile/FromHeader')}</TableHeaderCell>
							<TableHeaderCell>{t('MSVE_SPA/Profile/ToHeader')}</TableHeaderCell>
							<TableHeaderCell>{t('MSVE_SPA/Profile/DaysHeader')}</TableHeaderCell>
							<TableHeaderCell className={styles.actionColumn} />
						</TableRow>
					</TableHeader>
					<TableBody>
						{items.map((item) => {
							const days = parseWorkingDays(item.msnfp_workingdays);
							return (
								<TableRow key={item.msnfp_availabilityid}>
									<TableCell>
										<Text weight="medium">{item.msnfp_availabilitytitle ?? ''}</Text>
									</TableCell>
									<TableCell>
										{item.msnfp_startperiod
											? new Date(item.msnfp_startperiod).toLocaleDateString()
											: '—'}
									</TableCell>
									<TableCell>
										{item.msnfp_endperiod
											? new Date(item.msnfp_endperiod).toLocaleDateString()
											: '—'}
									</TableCell>
									<TableCell>
										<div className={styles.chipRow}>
											{DAYS_OF_WEEK.filter((d) => days.has(d.value)).map((d) => (
												<Badge key={d.value} appearance="outline" size="small">
													{t(`MSVE_SPA/Day/${d.label}`)}
												</Badge>
											))}
										</div>
									</TableCell>
									<TableCell>
										<Button
											icon={<Delete24Regular />}
											appearance="subtle"
											size="small"
											aria-label={t('MSVE_SPA/Profile/DeleteAvailability', {
												title: item.msnfp_availabilitytitle ?? '',
											})}
											onClick={() => handleDelete(item.msnfp_availabilityid)}
										/>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			)}
		</div>
	);
}

function PrefsQualsTab({ contactId }: { contactId: string }) {
	const styles = useStyles();
	const { t } = useTranslation();
	const [preferences, setPreferences] = useState<UserPreference[]>([]);
	const [qualifications, setQualifications] = useState<UserQualification[]>([]);
	const [prefTypes, setPrefTypes] = useState<PreferenceType[]>([]);
	const [qualTypes, setQualTypes] = useState<QualificationType[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [prefDialogOpen, setPrefDialogOpen] = useState(false);
	const [qualDialogOpen, setQualDialogOpen] = useState(false);
	const [selectedPrefType, setSelectedPrefType] = useState('');
	const [qualForm, setQualForm] = useState({ typeId: '', startDate: '', endDate: '' });

	const load = useCallback(async () => {
		try {
			const [prefs, quals, pt, qt] = await Promise.all([
				fetchUserPreferences(contactId),
				fetchUserQualifications(contactId),
				fetchPreferenceTypes(),
				fetchQualificationTypes(),
			]);
			setPreferences(prefs);
			setQualifications(quals);
			setPrefTypes(pt);
			setQualTypes(qt);
		} catch {
			setError(t('MSVE_SPA/Error/FailedToLoadProfile'));
		} finally {
			setLoading(false);
		}
	}, [contactId, t]);

	useEffect(() => {
		load();
	}, [load]);

	const handleAddPref = async () => {
		if (!selectedPrefType) return;
		const pt = prefTypes.find((p) => p.msnfp_preferencetypeid === selectedPrefType);
		try {
			await createUserPreference(contactId, selectedPrefType, pt?.msnfp_preferencetypetitle ?? '');
			setPrefDialogOpen(false);
			setSelectedPrefType('');
			await load();
		} catch {
			setError(t('MSVE_SPA/Error/FailedToAddPreference'));
		}
	};

	const handleDeletePref = async (id: string) => {
		try {
			await deleteUserPreference(id);
			await load();
		} catch {
			setError(t('MSVE_SPA/Error/FailedToDeletePreference'));
		}
	};

	const handleAddQual = async () => {
		if (!qualForm.typeId) return;
		const qt = qualTypes.find((q) => q.msnfp_qualificationtypeid === qualForm.typeId);
		try {
			await createUserQualification(
				contactId,
				qualForm.typeId,
				qualForm.startDate,
				qualForm.endDate,
				qt?.msnfp_qualificationtypetitle,
			);
			setQualDialogOpen(false);
			setQualForm({ typeId: '', startDate: '', endDate: '' });
			await load();
		} catch {
			setError(t('MSVE_SPA/Error/FailedToAddQualification'));
		}
	};

	const handleDeleteQual = async (id: string) => {
		try {
			await deleteUserQualification(id);
			await load();
		} catch {
			setError(t('MSVE_SPA/Error/FailedToDeleteQualification'));
		}
	};

	const getPrefTypeName = (id: string) =>
		prefTypes.find((p) => p.msnfp_preferencetypeid === id)?.msnfp_preferencetypetitle ?? id;
	const getQualTypeName = (id: string) =>
		qualTypes.find((q) => q.msnfp_qualificationtypeid === id)?.msnfp_qualificationtypetitle ?? id;

	if (loading) return <Spinner label={t('MSVE_SPA/Common/Loading')} />;

	return (
		<div className={styles.section}>
			{error && (
				<MessageBar intent="error">
					<MessageBarBody>{error}</MessageBarBody>
				</MessageBar>
			)}

			{/* Preferences */}
			<div className={styles.sectionHeader}>
				<Title2>{t('MSVE_SPA/Profile/Preferences')}</Title2>
				<Dialog open={prefDialogOpen} onOpenChange={(_, d) => setPrefDialogOpen(d.open)}>
					<DialogTrigger disableButtonEnhancement>
						<Button appearance="primary" icon={<Add24Regular />} size="small" className={styles.pillButton}>
							{t('MSVE_SPA/Common/Add')}
						</Button>
					</DialogTrigger>
					<DialogSurface>
						<DialogBody>
							<DialogTitle>{t('MSVE_SPA/Profile/AddPreference')}</DialogTitle>
							<DialogContent>
								<Dropdown
									aria-label={t('MSVE_SPA/Profile/SelectPreferenceType')}
									placeholder={t('MSVE_SPA/Profile/SelectPreferenceType')}
									value={
										prefTypes.find((p) => p.msnfp_preferencetypeid === selectedPrefType)
											?.msnfp_preferencetypetitle ?? ''
									}
									onOptionSelect={(_, data) => setSelectedPrefType(data.optionValue as string)}
								>
									{prefTypes.map((pt) => (
										<Option key={pt.msnfp_preferencetypeid} value={pt.msnfp_preferencetypeid}>
											{pt.msnfp_preferencetypetitle}
										</Option>
									))}
								</Dropdown>
							</DialogContent>
							<DialogActions>
								<DialogTrigger disableButtonEnhancement>
									<Button appearance="secondary">{t('MSVE_SPA/Common/Cancel')}</Button>
								</DialogTrigger>
								<Button appearance="primary" onClick={handleAddPref}>
									{t('MSVE_SPA/Common/Save')}
								</Button>
							</DialogActions>
						</DialogBody>
					</DialogSurface>
				</Dialog>
			</div>

			{preferences.length === 0 ? (
				<Text className={styles.emptyState}>{t('MSVE_SPA/Profile/NoPreferences')}</Text>
			) : (
				<div className={styles.chipRow}>
					{preferences.map((p) => {
						const preferenceName = getPrefTypeName(p._msnfp_preferencetypeid_value);

						return (
							<div key={p.msnfp_preferenceid} className={styles.preferenceItem}>
								<Badge appearance="filled" color="brand" size="large">
									{preferenceName}
								</Badge>
								<Button
									aria-label={t('MSVE_SPA/Profile/DeletePreference', { name: preferenceName })}
									icon={<Delete24Regular />}
									appearance="transparent"
									size="small"
									onClick={() => handleDeletePref(p.msnfp_preferenceid)}
									className={styles.compactDeleteButton}
								/>
							</div>
						);
					})}
				</div>
			)}

			<Divider />

			{/* Qualifications */}
			<div className={styles.sectionHeader}>
				<Title2>{t('MSVE_SPA/Profile/Qualifications')}</Title2>
				<Dialog open={qualDialogOpen} onOpenChange={(_, d) => setQualDialogOpen(d.open)}>
					<DialogTrigger disableButtonEnhancement>
						<Button appearance="primary" icon={<Add24Regular />} size="small" className={styles.pillButton}>
							{t('MSVE_SPA/Common/Add')}
						</Button>
					</DialogTrigger>
					<DialogSurface>
						<DialogBody>
							<DialogTitle>{t('MSVE_SPA/Profile/AddQualification')}</DialogTitle>
							<DialogContent>
								<div className={styles.section}>
									<Dropdown
										aria-label={t('MSVE_SPA/Profile/SelectQualificationType')}
										placeholder={t('MSVE_SPA/Profile/SelectQualificationType')}
										value={
											qualTypes.find((q) => q.msnfp_qualificationtypeid === qualForm.typeId)
												?.msnfp_qualificationtypetitle ?? ''
										}
										onOptionSelect={(_, data) =>
											setQualForm({ ...qualForm, typeId: data.optionValue as string })
										}
									>
										{qualTypes.map((qt) => (
											<Option
												key={qt.msnfp_qualificationtypeid}
												value={qt.msnfp_qualificationtypeid}
											>
												{qt.msnfp_qualificationtypetitle}
											</Option>
										))}
									</Dropdown>
									<div className={styles.formRow}>
										<Field label={t('MSVE_SPA/Profile/StartDate')} className={styles.dateField}>
											<Input
												type="date"
												value={qualForm.startDate}
												onChange={(_, d) => setQualForm({ ...qualForm, startDate: d.value })}
											/>
										</Field>
										<Field label={t('MSVE_SPA/Profile/EndDate')} className={styles.dateField}>
											<Input
												type="date"
												value={qualForm.endDate}
												onChange={(_, d) => setQualForm({ ...qualForm, endDate: d.value })}
											/>
										</Field>
									</div>
								</div>
							</DialogContent>
							<DialogActions>
								<DialogTrigger disableButtonEnhancement>
									<Button appearance="secondary">{t('MSVE_SPA/Common/Cancel')}</Button>
								</DialogTrigger>
								<Button appearance="primary" onClick={handleAddQual}>
									{t('MSVE_SPA/Common/Save')}
								</Button>
							</DialogActions>
						</DialogBody>
					</DialogSurface>
				</Dialog>
			</div>

			{qualifications.length === 0 ? (
				<Text className={styles.emptyState}>{t('MSVE_SPA/Profile/NoQualifications')}</Text>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHeaderCell>{t('MSVE_SPA/Profile/QualificationHeader')}</TableHeaderCell>
							<TableHeaderCell>{t('MSVE_SPA/Profile/StartDate')}</TableHeaderCell>
							<TableHeaderCell>{t('MSVE_SPA/Profile/EndDate')}</TableHeaderCell>
							<TableHeaderCell className={styles.actionColumn} />
						</TableRow>
					</TableHeader>
					<TableBody>
						{qualifications.map((q) => {
							const qualificationName =
								q.msnfp_qualificationtitle ||
								(q._msnfp_typeid_value ? getQualTypeName(q._msnfp_typeid_value) : '—');

							return (
								<TableRow key={q.msnfp_qualificationid}>
									<TableCell>
										<Text weight="medium">{qualificationName}</Text>
									</TableCell>
									<TableCell>
										{q.msnfp_startdate ? new Date(q.msnfp_startdate).toLocaleDateString() : '—'}
									</TableCell>
									<TableCell>
										{q.msnfp_enddate ? new Date(q.msnfp_enddate).toLocaleDateString() : '—'}
									</TableCell>
									<TableCell>
										<Button
											aria-label={t('MSVE_SPA/Profile/DeleteQualification', {
												name: qualificationName,
											})}
											icon={<Delete24Regular />}
											appearance="subtle"
											size="small"
											onClick={() => handleDeleteQual(q.msnfp_qualificationid)}
										/>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			)}
		</div>
	);
}
