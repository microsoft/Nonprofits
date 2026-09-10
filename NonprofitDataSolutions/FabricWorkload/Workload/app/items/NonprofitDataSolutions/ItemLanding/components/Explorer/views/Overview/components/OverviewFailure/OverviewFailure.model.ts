import type { ResourceCardData } from '../shared/ResourceCard/ResourceCard.types';

export const overviewFailureLabels = {
	welcomeSectionId: 'welcome-section',
	getWelcomeText: (displayName: string) =>
		`We encountered an issue deploying the ${displayName} capability of Nonprofit data solutions. Please follow the troubleshooting steps below to resolve the deployment issue.`,
	helpAndSupportTitle: 'Help and support',
};

export const helpResources: ResourceCardData[] = [
	{
		id: '1',
		title: 'Deployment troubleshooting',
		description: 'Find answers to common deployment errors',
		imagePath: '/assets/images/overview-resources-troubleshoot.webp',
		link: 'https://aka.ms/nds/docs/tsg',
	},
	{
		id: '2',
		title: 'Documentation and guides',
		description: 'Access comprehensive setup guides and best practices',
		imagePath: '/assets/images/overview-documentation-guides.webp',
		link: 'https://aka.ms/nds/docs/deploy',
	},
	{
		id: '3',
		title: 'Contact support',
		description: 'Get help from our support team',
		imagePath: '/assets/images/overview-support.webp',
		link: 'https://aka.ms/nds/fabricsupport',
	},
];
