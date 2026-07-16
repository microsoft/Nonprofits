import { DeploymentItemStatus } from '@src/items/PackageInstallerItem/PackageInstallerItemModel';

export interface DeploymentItemStatusBadgeProps {
	status: DeploymentItemStatus;
	className?: string;
}
