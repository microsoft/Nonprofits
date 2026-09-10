import { type FC, useCallback, useState } from 'react';

import { Button, Text, mergeClasses } from '@fluentui/react-components';
import { ChevronDoubleLeftRegular } from '@fluentui/react-icons';

import { explorerSidebarLabels } from './ExplorerSidebar.model';
import { useExplorerSidebarStyles } from './ExplorerSidebar.styles';
import type { ExplorerSidebarProps } from './ExplorerSidebar.types';
import { ExplorerItem } from './components/ExplorerItem';

export const ExplorerSidebar: FC<ExplorerSidebarProps> = ({ items, selectedItemId, onItemSelect }) => {
	const styles = useExplorerSidebarStyles();
	const [isCollapsed, setIsCollapsed] = useState(false);

	// Event handlers
	const toggleSidebar = useCallback(() => {
		setIsCollapsed((prev) => !prev);
	}, []);

	return (
		<aside
			className={mergeClasses(styles.sidebar, isCollapsed && styles.sidebarCollapsed)}
			role="complementary"
			aria-label={
				isCollapsed ? explorerSidebarLabels.ariaLabelCollapsed : explorerSidebarLabels.ariaLabelExpanded
			}
		>
			{/* Header */}
			<div className={isCollapsed ? styles.sidebarHeaderCollapsed : styles.sidebarHeader}>
				<Text
					className={mergeClasses(styles.sidebarTitle, isCollapsed && styles.sidebarTitleRotated)}
					role="heading"
					aria-level={1}
				>
					{explorerSidebarLabels.title}
				</Text>
				<Button
					appearance="transparent"
					size="small"
					className={styles.collapseButton}
					onClick={toggleSidebar}
					aria-label={
						isCollapsed
							? explorerSidebarLabels.ariaLabelExpandButton
							: explorerSidebarLabels.ariaLabelCollapseButton
					}
					aria-expanded={!isCollapsed}
					aria-controls="explorer-navigation"
				>
					<ChevronDoubleLeftRegular
						className={mergeClasses(
							styles.collapseButtonIcon,
							isCollapsed && styles.collapseButtonIconRotated,
						)}
						aria-hidden="true"
					/>
				</Button>
			</div>

			{/* Sidebar Content */}
			{!isCollapsed && (
				<div id="explorer-navigation">
					<div className={styles.sidebarContent}>
						<nav
							className={styles.navigation}
							role="navigation"
							aria-label={explorerSidebarLabels.ariaLabelNavigation}
						>
							{items.map((item) => (
								<ExplorerItem
									key={item.id}
									{...item}
									isSelected={selectedItemId === item.id}
									onItemSelect={onItemSelect}
								/>
							))}
						</nav>
					</div>
				</div>
			)}
		</aside>
	);
};
