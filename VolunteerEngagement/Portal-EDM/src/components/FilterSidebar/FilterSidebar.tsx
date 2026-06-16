import React from 'react';

import { useTranslation } from '@/i18n';
import { Button, Divider, Dropdown, Input, Option, Text } from '@fluentui/react-components';
import { Dismiss24Regular, Filter24Regular } from '@fluentui/react-icons';

import { useFilterSidebarStyles } from './FilterSidebar.styles';
import type { FilterSidebarProps, Filters } from './FilterSidebar.types';

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
	filters,
	onFiltersChange,
	preferences,
	qualifications,
	onApply,
	onClear,
}) => {
	const styles = useFilterSidebarStyles();
	const { t } = useTranslation();

	const update = (field: keyof Filters, value: string | string[]) => {
		onFiltersChange({ ...filters, [field]: value });
	};

	return (
		<div className={styles.sidebar}>
			<div className={styles.header}>
				<Filter24Regular />
				<Text size={500} weight="semibold">
					{t('MSVE_SPA/Filter/Title')}
				</Text>
			</div>

			<Divider />

			<div className={styles.field}>
				<Text size={300} weight="medium">
					{t('MSVE_SPA/Filter/Search')}
				</Text>
				<Input
					aria-label={t('MSVE_SPA/Filter/SearchAriaLabel')}
					placeholder={t('MSVE_SPA/Filter/SearchPlaceholder')}
					value={filters.search}
					onChange={(_, data) => update('search', data.value)}
				/>
			</div>

			<div className={styles.field}>
				<Text size={300} weight="medium">
					{t('MSVE_SPA/Filter/Location')}
				</Text>
				<Input
					aria-label={t('MSVE_SPA/Filter/LocationAriaLabel')}
					placeholder={t('MSVE_SPA/Filter/LocationPlaceholder')}
					value={filters.location}
					onChange={(_, data) => update('location', data.value)}
				/>
			</div>

			<div className={styles.field}>
				<Text size={300} weight="medium">
					{t('MSVE_SPA/Filter/StartDate')}
				</Text>
				<Input
					type="date"
					aria-label={t('MSVE_SPA/Filter/StartDate')}
					value={filters.startDate}
					onChange={(_, data) => update('startDate', data.value)}
				/>
			</div>

			<div className={styles.field}>
				<Text size={300} weight="medium">
					{t('MSVE_SPA/Filter/EndDate')}
				</Text>
				<Input
					type="date"
					aria-label={t('MSVE_SPA/Filter/EndDate')}
					value={filters.endDate}
					onChange={(_, data) => update('endDate', data.value)}
				/>
			</div>

			{preferences.length > 0 && (
				<div className={styles.field}>
					<Text size={300} weight="medium">
						{t('MSVE_SPA/Filter/Preferences')}
					</Text>
					<Dropdown
						aria-label={t('MSVE_SPA/Filter/SelectPreferences')}
						placeholder={t('MSVE_SPA/Filter/SelectPreferences')}
						multiselect
						selectedOptions={filters.preferences}
						onOptionSelect={(_, data) => {
							update('preferences', data.selectedOptions);
						}}
					>
						{preferences.map((pref) => (
							<Option key={pref.msnfp_preferencetypeid} value={pref.msnfp_preferencetypetitle}>
								{pref.msnfp_preferencetypetitle}
							</Option>
						))}
					</Dropdown>
				</div>
			)}

			{qualifications.length > 0 && (
				<div className={styles.field}>
					<Text size={300} weight="medium">
						{t('MSVE_SPA/Filter/Qualifications')}
					</Text>
					<Dropdown
						aria-label={t('MSVE_SPA/Filter/SelectQualifications')}
						placeholder={t('MSVE_SPA/Filter/SelectQualifications')}
						multiselect
						selectedOptions={filters.qualifications}
						onOptionSelect={(_, data) => {
							update('qualifications', data.selectedOptions);
						}}
					>
						{qualifications.map((qual) => (
							<Option key={qual.msnfp_qualificationtypeid} value={qual.msnfp_qualificationtypetitle}>
								{qual.msnfp_qualificationtypetitle}
							</Option>
						))}
					</Dropdown>
				</div>
			)}

			<div className={styles.actions}>
				<Button appearance="primary" onClick={onApply}>
					{t('MSVE_SPA/Filter/ApplyFilters')}
				</Button>
				<Button appearance="subtle" icon={<Dismiss24Regular />} onClick={onClear}>
					{t('MSVE_SPA/Filter/ClearAll')}
				</Button>
			</div>
		</div>
	);
};
