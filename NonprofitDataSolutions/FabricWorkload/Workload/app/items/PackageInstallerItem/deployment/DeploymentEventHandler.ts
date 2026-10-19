import { Item } from '../../../clients/FabricPlatformTypes';
import { PackageItem, PackageItemPart } from '../PackageInstallerItemModel';
import { DeploymentContext } from './DeploymentContext';

export interface DeploymentEventHandler {
	preItemPartCreation: (
		itemDefinition: PackageItem | undefined,
		itemPart: PackageItemPart,
		payloadData: string,
		depContext: DeploymentContext,
	) => Promise<string>;

	postItemPartCreation: (
		itemDefinition: PackageItem,
		createdItem: Item | undefined,
		error: Error | unknown | undefined,
		depContext: DeploymentContext,
	) => Promise<void>;
}
