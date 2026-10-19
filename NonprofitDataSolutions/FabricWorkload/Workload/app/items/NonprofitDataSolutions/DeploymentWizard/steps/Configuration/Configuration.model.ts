import { ModuleType } from '../../types/ModuleType';

export const configurationLabels = {
	basicConfiguration: {
		sectionTitle: 'Basic configuration',
		deploymentName: {
			label: 'Deployment name',
			placeholder: 'Enter deployment name',
			helpText: 'This name will be used as a prefix for all deployed artifacts',
		},
		location: {
			label: 'Location',
			placeholder: 'Select location',
			helpText: 'The location where we will deploy artifacts',
		},
	},
	requiredPackages: {
		sectionTitle: 'Required packages',
		badgeLabel: 'Always included',
		badgeAriaLabel: 'Required packages status: Always included',
		listAriaLabel: 'Required packages list',
	},
	optionalPackages: {
		sectionTitle: 'Optional packages',
		badgeLabel: (count: number) => `${count} selected`,
		badgeAriaLabel: (selectedCount: number, totalCount: number) =>
			`Optional packages status: ${selectedCount} of ${totalCount} packages selected`,
		listAriaLabel: (selectedCount: number, totalCount: number) =>
			`Optional packages selection. ${selectedCount} of ${totalCount} packages selected`,
		importantNote: {
			title: 'Important note:',
			description: 'Optional packages cannot be added after deployment. Select all packages you want to include now.',
		},
	},
};

export interface PackageItem {
	id: ModuleType;
	name: string;
	description: string;
	items: string[];
}

export const requiredPackages: PackageItem[] = [
	{
		id: ModuleType.Fundraising_Core,
		name: 'Fundraising core',
		description:
			'Essential lakehouses, notebooks, and pipelines for fundraising analytics built on a medallion architecture.',
		items: [
			'Silver lakehouse',
			'Gold lakehouse',
			'Orchestration pipelines',
			'Enrichment logic',
			'Semantic model',
			'Power BI report',
		],
	},
];

export const optionalPackages: PackageItem[] = [
	{
		id: ModuleType.Fundraising_Dynamics365,
		name: 'Dynamics 365 Sales with Common Data Model for Nonprofits',
		description: 'Ingest your data aligned to the Common Data Model for Nonprofits',
		items: [
			'Common Data Model for Nonprofits mapping',
			'Data synchronization via Link Dataverse to Microsoft Fabric',
		],
	},
	{
		id: ModuleType.Fundraising_SalesforceNPSP,
		name: 'Salesforce Nonprofit Success Pack',
		description: 'Ingest your Salesforce Nonprofit Success Pack data',
		items: ['Bronze lakehouse', 'Salesforce object mapping', 'Pulling data via Salesforce objects connector'],
	},
	{
		id: ModuleType.Fundraising_SampleData,
		name: 'Sample data',
		description: 'View the full solution and capabilities with sample data',
		items: ['Sample campaigns', 'Sample donors', 'Sample engagements', 'Sample transactions'],
	},
];
