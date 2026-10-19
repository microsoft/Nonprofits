import { type FC, useCallback, useEffect, useState } from 'react';

import { Button, Text } from '@fluentui/react-components';
import { ChevronDown20Regular, ChevronRight20Regular } from '@fluentui/react-icons';

import { ItemsTable } from '../ItemsTable';
import { useCreatedItemsTableStyles } from './CreatedItemsTable.styles';
import type { CreatedItemsTableProps } from './CreatedItemsTable.types';

export const CreatedItemsTable: FC<CreatedItemsTableProps> = ({
	items,
	initiallyExpanded = false,
	openLinksInNewTab,
	currentWorkspaceId,
}) => {
	const styles = useCreatedItemsTableStyles();
	const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

	useEffect(() => {
		setIsExpanded(initiallyExpanded);
	}, [initiallyExpanded]);

	const toggleExpanded = useCallback(() => {
		setIsExpanded((prev) => !prev);
	}, []);

	// Computed values
	const hasItems = items.length > 0;
	const toggleHint = isExpanded ? 'Click to collapse' : 'Click to expand';

	if (!hasItems) {
		return null;
	}

	return (
		<div className={styles.createdItemsSection}>
			<Button
				appearance="transparent"
				className={styles.createdItemsToggleButton}
				onClick={toggleExpanded}
				aria-expanded={isExpanded}
				aria-controls="created-items-table"
				aria-label={`${isExpanded ? 'Collapse' : 'Expand'} created items list with ${items.length} items`}
			>
				<div className={styles.createdItemsToggleContent}>
					{isExpanded ? (
						<ChevronDown20Regular aria-hidden="true" />
					) : (
						<ChevronRight20Regular aria-hidden="true" />
					)}
					<Text className={styles.createdItemsTitle}>Deployed items ({items.length})</Text>
				</div>
				<Text className={styles.createdItemsToggleHint} aria-hidden="true">
					{toggleHint}
				</Text>
			</Button>

			{isExpanded && (
				<div className={styles.createdItemsTableWrapper} id="created-items-table">
					<ItemsTable
						items={items}
						openLinksInNewTab={openLinksInNewTab}
						currentWorkspaceId={currentWorkspaceId}
					/>
				</div>
			)}
		</div>
	);
};
