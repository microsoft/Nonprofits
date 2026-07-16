import type { ResourceCardData } from '../shared/ResourceCard/ResourceCard.types';
import type { QuickStartData, QuickStartStepData } from './components/QuickStartSection/QuickStartSection.types';

export const overviewSuccessCommonLabels = {
	resourcesTitle: 'Resources',
};

export const quickStartData: QuickStartData = {
	title: 'Quick start guide',
	buttonText: 'Start deployment',
};

export const quickStartSteps: QuickStartStepData[] = [
	{
		id: 'open-deployments',
		number: '01',
		title: 'View the deployed items in your workspace.',
		buttonText: 'Open deployments',
	},
	{
		id: 'open-orchestration',
		number: '02',
		title: 'Trigger the orchestration data pipeline to ingest, transform, and enrich your data.',
		buttonText: 'Open pipeline',
	},
	{
		id: 'open-semanticmodel',
		number: '03',
		title: 'Refresh the fundraising semantic model to update the data schema for the report.',
		buttonText: 'Open semantic model',
	},
	{
		id: 'open-report',
		number: '04',
		title: 'Get constituent, engagement, and segmentation insights in the Fundraising intelligence report.',
		buttonText: 'Open report',
	},
];

export const resources: ResourceCardData[] = [
	{
		id: 'docs',
		title: 'Use',
		description: 'Understand how to make the most of Nonprofit data solutions',
		imagePath: '/assets/images/overview-resources-use.webp',
		link: 'https://aka.ms/nds/docs',
	},
	{
		id: 'extend',
		title: 'Extend',
		description: "Learn how to customize your solution to meet your organization's needs",
		imagePath: '/assets/images/overview-resources-extend.webp',
		link: 'https://aka.ms/nds/docs/extend',
	},
	{
		id: 'troubleshooting',
		title: 'Troubleshoot',
		description: 'Find answers to common issues and learn how to access support',
		imagePath: '/assets/images/overview-resources-troubleshoot.webp',
		link: 'https://aka.ms/nds/docs/tsg',
	},
];
