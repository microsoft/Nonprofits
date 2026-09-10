import { FC } from 'react';

import { Text } from '@fluentui/react-components';
import { CheckmarkCircle16Regular } from '@fluentui/react-icons';

import { useTablesPreviewStyles } from './TablesPreview.styles';
import type { TablesPreviewProps } from './TablesPreview.types';

export const TablesPreview: FC<TablesPreviewProps> = ({ tablesLabel, tablesLabelId, tablesAriaLabel, tables }) => {
	const styles = useTablesPreviewStyles();

	return (
		<div className={styles.tablesSection} role="region" aria-labelledby={tablesLabelId}>
			<Text as="p" id={tablesLabelId} className={styles.tablesLabel}>
				{tablesLabel}
			</Text>
			<ul className={styles.tablesGrid} aria-label={tablesAriaLabel}>
				{tables.map((table) => (
					<li key={table} className={styles.tableChip}>
						<CheckmarkCircle16Regular className={styles.tableChipIcon} aria-hidden="true" />
						<Text as="span" className={styles.tableChipText}>
							{table}
						</Text>
					</li>
				))}
			</ul>
		</div>
	);
};
