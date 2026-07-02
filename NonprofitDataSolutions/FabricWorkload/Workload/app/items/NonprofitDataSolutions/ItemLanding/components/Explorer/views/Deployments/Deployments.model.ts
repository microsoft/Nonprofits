import { ModuleInstallationStatuses } from '@originalInstaller/PackageInstallerItemModel';

import { ModuleType } from '@nds/DeploymentWizard/types/ModuleType';

import type { ModuleItem } from './Deployments.types';

export const deploymentsLabels = {
	mainAriaLabel: 'Deployment details',
	pageTitle: 'Deployment details',
	loadingContent: 'Loading content',
	itemsTitle: 'Items',
	itemsTableAriaLabel: 'Items',
	itemCreationFailed: 'Item creation failed',
	downloadLogs: 'Download logs',
	noDeploymentTitle: 'No deployment data available',
	noDeploymentMessage: 'There is no deployment information to display at this time.',
};

/**
 * Get modules model with status based on selected modules and their installation statuses
 */
export const getModulesModel = (
	modulesModel: ModuleItem[],
	selectedModules: ModuleType[],
	moduleInstallationStatuses: ModuleInstallationStatuses = {},
): ModuleItem[] =>
	modulesModel
		.filter((module) => selectedModules.includes(module.id))
		.map((module) => ({
			...module,
			status: moduleInstallationStatuses[module.id],
		}));
