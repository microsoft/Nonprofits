import React from 'react';

import {
	Table,
	TableBody,
	TableCell,
	TableHeader,
	TableHeaderCell,
	TableRow,
	Text,
	mergeClasses,
} from '@fluentui/react-components';
import { DocumentRegular } from '@fluentui/react-icons';

import { FabricLink } from '@src/components/FabricLink';
import { useResolveMovedDeployedItem } from '@src/hooks/useResolveMovedDeployedItem';

import { getItemTypeIcon, getItemTypeLabel } from '@nds/helpers/UIHelper';

import { DeploymentItemStatusBadge } from '../DeploymentItemStatusBadge';
import { useItemsTableStyles } from './ItemsTable.styles';
import { ITEMS_TABLE_DEFAULT_COLUMNS, ItemsTableProps } from './ItemsTable.types';

export const ItemsTable: React.FC<ItemsTableProps> = ({
	items,
	tableAriaLabel = 'Created items table',
	openLinksInNewTab,
	currentWorkspaceId,
	enableMovedResolution,
}) => {
	const styles = useItemsTableStyles();
	const columns = ITEMS_TABLE_DEFAULT_COLUMNS;
	const { getLinkTarget } = useResolveMovedDeployedItem(currentWorkspaceId, {
		enableResolution: enableMovedResolution,
	});

	return (
		<Table aria-label={tableAriaLabel} className={styles.table}>
			<TableHeader>
				<TableRow>
					{columns.map((column) => (
						<TableHeaderCell
							key={column.columnKey}
							scope="col"
							className={mergeClasses(
								styles.tableHeaderCell,
								column.columnKey === 'icon' && styles.itemTypeCell,
								column.columnKey === 'type' && styles.typeCell,
								column.columnKey === 'status' && styles.statusCell,
							)}
						>
							{column.columnKey === 'icon' ? (
								<DocumentRegular className={styles.iconHeaderCell} fontSize={16} />
							) : (
								column.label
							)}
						</TableHeaderCell>
					))}
				</TableRow>
			</TableHeader>
			<TableBody>
				{items.map((item) => {
					const linkTarget = getLinkTarget(item);
					return (
						<TableRow key={`${item.type}:${item.sourceId}`}>
							<TableCell className={styles.itemTypeCell}>{getItemTypeIcon(item.type, 24, 24)}</TableCell>
							<TableCell>
								<div className={styles.nameCellContent}>
									{!linkTarget ? (
										<Text className={styles.tableBodyText}>{item.displayName}</Text>
									) : (
										<FabricLink
											type="item"
											itemType={item.type}
											itemId={linkTarget.itemId}
											workspaceId={linkTarget.workspaceId}
											openInNewTab={openLinksInNewTab}
											className={styles.tableLink}
										>
											{item.displayName}
										</FabricLink>
									)}
								</div>
							</TableCell>
							<TableCell className={styles.typeCell}>
								<Text className={styles.tableBodyText}>{getItemTypeLabel(item.type)}</Text>
							</TableCell>
							<TableCell className={styles.statusCell}>
								<DeploymentItemStatusBadge status={item.deploymentStatus} className={styles.statusBadge} />
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
};
