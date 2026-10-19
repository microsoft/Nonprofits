import { PackageItem } from '@originalInstaller/PackageInstallerItemModel';
import { DeploymentItemStatusEntry } from '@originalInstaller/deployment/DeploymentItemStatus';

export type SortColumn = 'type' | 'name' | 'status';

export interface PackageItemsTableProps {
	items: PackageItem[];
	itemStatuses?: DeploymentItemStatusEntry[];
	namePrefix?: string;
	duplicateNames?: Set<string>;
}
