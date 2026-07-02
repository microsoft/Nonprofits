import { DeployedItem } from '@src/items/PackageInstallerItem/PackageInstallerItemModel';

export interface CreatedItemsTableProps {
	items: DeployedItem[];
	initiallyExpanded?: boolean;
	openLinksInNewTab?: boolean;
	currentWorkspaceId?: string;
}
