import { Box16Regular } from '@fluentui/react-icons';

import { ModuleType } from '@nds/DeploymentWizard/types/ModuleType';

import type { ModuleItem } from './Deployments.types';

export const modulesModel: ModuleItem[] = [
	{
		id: ModuleType.Fundraising_Core,
		name: 'Fundraising core',
		type: 'Required',
		icon: Box16Regular,
	},
	{
		id: ModuleType.Fundraising_Dynamics365,
		name: 'Dynamics 365 Sales with Common Data Model for Nonprofits',
		type: 'Optional',
		icon: Box16Regular,
	},
	{
		id: ModuleType.Fundraising_SalesforceNPSP,
		name: 'Salesforce Nonprofit Success Pack',
		type: 'Optional',
		icon: Box16Regular,
	},
	{
		id: ModuleType.Fundraising_SampleData,
		name: 'Sample data',
		type: 'Optional',
		icon: Box16Regular,
	},
];
