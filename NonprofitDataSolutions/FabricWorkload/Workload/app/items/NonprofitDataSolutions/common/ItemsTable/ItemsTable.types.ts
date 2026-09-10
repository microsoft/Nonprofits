import { DeployedItem } from '@src/items/PackageInstallerItem/PackageInstallerItemModel';

export interface ItemsTableColumn {
	columnKey: string;
	label: string;
}

export interface ItemsTableProps {
	items: DeployedItem[];
	tableAriaLabel?: string;
	openLinksInNewTab?: boolean;
	/**
	 * When provided, the table will avoid linking to items that belong to a different workspace (e.g., after a Fabric Deployment Pipeline move).
	 * It will attempt to resolve the matching item in the current workspace by `type + displayName`.
	 */
	currentWorkspaceId?: string;
	/**
	 * When false, moved-item remapping is disabled and links keep pointing to the original workspace/item IDs.
	 * Intended to support an explicit user-driven post-deployment setup step.
	 */
	enableMovedResolution?: boolean;
}

export const ITEMS_TABLE_DEFAULT_COLUMNS: ItemsTableColumn[] = [
	{ columnKey: 'icon', label: '' },
	{ columnKey: 'name', label: 'Name' },
	{ columnKey: 'type', label: 'Type' },
	{ columnKey: 'status', label: 'Status' },
];
