import { ModuleInstallationStatus } from '@src/items/PackageInstallerItem/PackageInstallerItemModel';

export interface ModuleStatusBadgeProps {
	status?: ModuleInstallationStatus;
	className?: string;
}
