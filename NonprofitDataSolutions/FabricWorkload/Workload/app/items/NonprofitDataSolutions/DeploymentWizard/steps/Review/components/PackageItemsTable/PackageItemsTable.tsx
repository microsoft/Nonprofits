import React, { useCallback, useMemo, useState } from 'react';

import {
	Accordion,
	AccordionHeader,
	AccordionItem,
	AccordionPanel,
	Badge,
	Body1,
	Caption1,
	Table,
	TableBody,
	TableCell,
	TableHeader,
	TableHeaderCell,
	TableRow,
	mergeClasses,
	tokens,
} from '@fluentui/react-components';
import {
	CheckmarkCircle20Filled,
	CircleHint20Regular,
	Clock20Regular,
	DocumentRegular,
	ErrorCircle20Filled,
} from '@fluentui/react-icons';

import { PackageItem } from '@originalInstaller/PackageInstallerItemModel';
import { DeploymentItemLifecycle, DeploymentItemStatusEntry } from '@originalInstaller/deployment/DeploymentItemStatus';

import { getItemTypeIcon, getItemTypeLabel } from '@nds/helpers/UIHelper';

import { useTableStyles } from './PackageItemsTable.styles';
import type { PackageItemsTableProps, SortColumn } from './PackageItemsTable.types';

// Constants
const ICON_SIZE = 24;

const getStatusIcon = (status: DeploymentItemLifecycle | null) => {
	if (!status) return null;

	switch (status) {
		case 'succeeded':
			return <CheckmarkCircle20Filled style={{ color: tokens.colorPaletteGreenForeground1 }} />;
		case 'failed':
			return <ErrorCircle20Filled style={{ color: tokens.colorPaletteRedForeground1 }} />;
		case 'in-progress':
			return <Clock20Regular style={{ color: tokens.colorBrandForeground1 }} />;
		case 'pending':
		default:
			return <CircleHint20Regular style={{ color: tokens.colorNeutralForeground2 }} />;
	}
};

const getStatusBadge = (status: DeploymentItemLifecycle | null) => {
	if (!status) return null;

	const configs = {
		succeeded: { appearance: 'filled', color: 'success', label: 'Succeeded' },
		failed: { appearance: 'filled', color: 'danger', label: 'Failed' },
		'in-progress': { appearance: 'filled', color: 'informative', label: 'In progress' },
		pending: { appearance: 'filled', color: 'informative', label: 'Pending' },
	} as const;

	const config = configs[status];

	return (
		<Badge appearance={config.appearance} color={config.color}>
			{config.label}
		</Badge>
	);
};

export const PackageItemsTable: React.FC<PackageItemsTableProps> = ({
	items,
	itemStatuses,
	namePrefix,
	duplicateNames,
}) => {
	const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
	const [sortDirection, setSortDirection] = useState<'ascending' | 'descending'>('ascending');
	const styles = useTableStyles();

	// Helper function to format display name with prefix
	const getDisplayName = useCallback(
		(item: PackageItem): string => {
			return namePrefix ? `${namePrefix}_${item.displayName}` : item.displayName;
		},
		[namePrefix],
	);

	// Helper function to find status for a package item
	const getItemStatus = useCallback(
		(packageItem: PackageItem): DeploymentItemStatusEntry | null => {
			if (!itemStatuses || itemStatuses.length === 0) {
				return null;
			}

			return (
				itemStatuses.find(
					(status) =>
						status.packageItem.sourceId === packageItem.sourceId &&
						status.packageItem.type === packageItem.type,
				) || null
			);
		},
		[itemStatuses],
	);

	// Helper function to check if an item has a duplicate name
	const hasDuplicateName = useCallback(
		(item: PackageItem): boolean => {
			if (!duplicateNames || duplicateNames.size === 0) {
				return false;
			}
			const displayName = getDisplayName(item);
			return duplicateNames.has(displayName);
		},
		[duplicateNames, getDisplayName],
	);

	const handleSort = (column: SortColumn) => {
		if (sortColumn === column) {
			setSortDirection((prev) => (prev === 'ascending' ? 'descending' : 'ascending'));
		} else {
			setSortColumn(column);
			setSortDirection('ascending');
		}
	};

	// Create stable items with original index for reliable React keys
	const stableItems = useMemo(() => {
		return (items || []).map((item, index) => ({
			...item,
			_stableId: `${item.type}_${item.displayName}_${index}`,
		}));
	}, [items]);

	const sortedItems = useMemo(() => {
		if (!stableItems?.length || !sortColumn) return stableItems || [];

		return [...stableItems].sort((a, b) => {
			let comparison = 0;

			if (sortColumn === 'type') {
				comparison = a.type.toLowerCase().localeCompare(b.type.toLowerCase());
			} else if (sortColumn === 'name') {
				const aDisplayName = getDisplayName(a);
				const bDisplayName = getDisplayName(b);
				comparison = aDisplayName.toLowerCase().localeCompare(bDisplayName.toLowerCase());
			} else if (sortColumn === 'status') {
				const aStatus = getItemStatus(a)?.status;
				const bStatus = getItemStatus(b)?.status;

				// Custom status ordering: failed, in-progress, succeeded, pending, no-status
				const statusOrder = { failed: 0, 'in-progress': 1, succeeded: 2, pending: 3 };
				const aOrder = aStatus ? statusOrder[aStatus] : 4;
				const bOrder = bStatus ? statusOrder[bStatus] : 4;
				comparison = aOrder - bOrder;
			}

			return sortDirection === 'ascending' ? comparison : -comparison;
		});
	}, [stableItems, sortColumn, sortDirection, getItemStatus, getDisplayName]);

	// Helper function to format schedule details
	const getScheduleDetails = (config: any) => {
		if (config.type === 'Daily' && config.times) {
			return ` at ${config.times.join(', ')}`;
		}
		if (config.type === 'Weekly' && config.weekdays && config.times) {
			return ` on ${config.weekdays.join(', ')} at ${config.times.join(', ')}`;
		}
		if (config.type === 'Cron' && config.interval) {
			return ` every ${config.interval} minutes`;
		}
		return '';
	};

	const renderDataFiles = (files: { path: string }[]) => (
		<div className={styles.sectionContainer}>
			<Accordion collapsible>
				<AccordionItem value="dataFiles">
					<AccordionHeader>
						<Caption1 block>
							<strong>Sample data files ({files.length})</strong>
						</Caption1>
					</AccordionHeader>
					<AccordionPanel>
						<ul className={styles.listContainer}>
							{files.map((file, index) => (
								<li key={file.path || index} className={styles.listItem}>
									<Caption1 block className={styles.smallText}>
										{file.path}
									</Caption1>
								</li>
							))}
						</ul>
					</AccordionPanel>
				</AccordionItem>
			</Accordion>
		</div>
	);

	const renderSchedules = (schedules: { jobType: string; enabled: boolean; configuration: any }[]) => (
		<div className={styles.sectionContainer}>
			<Caption1 block>
				<strong>Schedules ({schedules.length}):</strong>
			</Caption1>
			<ul className={styles.listContainer}>
				{schedules.map((schedule, index) => {
					const details = getScheduleDetails(schedule.configuration);
					const scheduleId = `${schedule.jobType}-${schedule.configuration.type}-${index}`;

					return (
						<li key={scheduleId} className={styles.listItem}>
							<Caption1 block className={styles.smallText}>
								{schedule.jobType} - {schedule.configuration.type}
								{details}
								{!schedule.enabled && ' (Disabled)'}
							</Caption1>
						</li>
					);
				})}
			</ul>
		</div>
	);

	return (
		<Table sortable className={styles.table}>
			<TableHeader>
				<TableRow>
					<TableHeaderCell className={mergeClasses(styles.tableHeaderCell, styles.iconHeaderCell)}>
						<DocumentRegular className={styles.iconHeader} fontSize={16} />
					</TableHeaderCell>
					<TableHeaderCell
						className={mergeClasses(styles.tableHeaderCell, styles.contentCell)}
						sortDirection={sortColumn === 'name' ? sortDirection : undefined}
						onClick={() => handleSort('name')}
					>
						Name
					</TableHeaderCell>
					<TableHeaderCell
						className={mergeClasses(styles.tableHeaderCell, styles.typeCell)}
						sortDirection={sortColumn === 'type' ? sortDirection : undefined}
						onClick={() => handleSort('type')}
					>
						Type
					</TableHeaderCell>
					{itemStatuses && itemStatuses.length > 0 && (
						<TableHeaderCell
							className={mergeClasses(styles.tableHeaderCell, styles.statusCell)}
							sortDirection={sortColumn === 'status' ? sortDirection : undefined}
							onClick={() => handleSort('status')}
						>
							Status
						</TableHeaderCell>
					)}
				</TableRow>
			</TableHeader>
			<TableBody>
				{sortedItems.map((item) => {
					const itemStatus = getItemStatus(item);

					return (
						<TableRow key={(item as any)._stableId}>
							<TableCell className={styles.iconCell}>
								{getItemTypeIcon(item.type, ICON_SIZE, ICON_SIZE, styles.itemIcon)}
							</TableCell>
							<TableCell className={styles.contentCell}>
								<Body1 block className={styles.contentCellContent}>
									{getDisplayName(item)}
								</Body1>
								{hasDuplicateName(item) && (
									<div className={styles.errorMessage}>
										Warning: An item with this name already exists in the workspace
									</div>
								)}
								{itemStatus?.errorMessage && (
									<div className={styles.errorMessage}>Error: {itemStatus.errorMessage}</div>
								)}
								{item.data?.files?.length > 0 && renderDataFiles(item.data.files)}
								{item.schedules?.length > 0 && renderSchedules(item.schedules)}
							</TableCell>
							<TableCell className={styles.typeCell}>{getItemTypeLabel(item.type)}</TableCell>
							{itemStatuses && itemStatuses.length > 0 && (
								<TableCell className={styles.statusCell}>
									{itemStatus && (
										<div className={styles.statusContainer}>
											{getStatusIcon(itemStatus.status)}
											{getStatusBadge(itemStatus.status)}
										</div>
									)}
								</TableCell>
							)}
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
};
