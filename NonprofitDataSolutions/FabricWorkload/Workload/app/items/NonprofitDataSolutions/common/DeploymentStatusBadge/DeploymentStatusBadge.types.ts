import { DeploymentStatus } from '@src/items/PackageInstallerItem/PackageInstallerItemModel';

export interface DeploymentStatusBadgeProps {
	status: DeploymentStatus;
	className?: string;
}
