import type { ComponentType } from 'react';

import { ModuleType } from '@src/items/NonprofitDataSolutions/DeploymentWizard/types/ModuleType';
import { ModuleInstallationStatus } from '@src/items/PackageInstallerItem/PackageInstallerItemModel';

import { FundraisingDeploymentInfo } from '../../../../hooks/useLatestDeployment';

export interface DeploymentsProps {
	deployment?: FundraisingDeploymentInfo | null;
}

export interface ModuleItem {
	id: ModuleType;
	name: string;
	type: 'Required' | 'Optional';
	icon: ComponentType<any>;
	status?: ModuleInstallationStatus;
}
