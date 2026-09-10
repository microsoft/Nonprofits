import {
	ArrowClockwise20Regular,
	ChartMultiple20Regular,
	Database20Regular,
	DocumentError20Regular,
	Lightbulb20Regular,
	Mail20Regular,
	Play20Regular,
	QuestionCircle20Regular,
} from '@fluentui/react-icons';

import type { DocumentationLink } from './components/DocumentationSection';
import type { FinalMessageProps } from './components/FinalMessage';
import type { ActionCardProps } from './components/shared/ActionCard';

export const finishLabels = {
	nextSteps: {
		sectionTitle: 'Next steps',
		ariaLabel: 'Recommended next steps',
		refreshMessage: 'Refresh the page to view your artifacts in the destination folder',
	},
	recommendedActions: {
		sectionTitle: 'Recommended actions',
		ariaLabel: 'Recommended actions',
	},
	documentation: {
		sectionTitle: 'Documentation',
		openInNewTabLabel: 'Opens in new tab',
	},
};

export const successMessage: FinalMessageProps = {
	type: 'success',
	title: 'Deployment completed successfully!',
	description:
		'Your Fundraising capability has been deployed. All items including lakehouses, notebooks, data pipelines, and Power BI reports are now available in your workspace.',
};

export const errorMessage: FinalMessageProps = {
	type: 'error',
	title: 'Deployment failed',
	description:
		'The Fundraising solutions deployment encountered errors and could not be completed. Please review the error details below and follow the troubleshooting steps to resolve the issues.',
};

export const nextSteps: ActionCardProps[] = [
	{
		icon: Play20Regular,
		title: 'Run orchestration pipeline',
		description: 'Execute the pipeline to ingest, transform and generate insights from your fundraising data',
		//link: 'https://docs.microsoft.com/fabric/data-orchestration/quickstart',
		//buttonText: 'Open Pipeline',
	},
	{
		icon: ChartMultiple20Regular,
		title: 'Review fundraising intelligence insights',
		description: 'Explore the Power BI report to discover key metrics and trends',
		//link: 'https://powerbi.microsoft.com/reports/fundraising-insights',
		//buttonText: 'Open Report',
	},
	{
		icon: Database20Regular,
		title: 'Bring your own data',
		description: "Connect your organization's data sources",
		//link: 'https://docs.microsoft.com/fabric/data-integration/connect-sources',
		//buttonText: 'Learn more',
	},
	{
		icon: Lightbulb20Regular,
		title: 'Create your own fundraising insights',
		description: 'Build custom reports and dashboards tailored to your needs',
		//link: 'https://docs.microsoft.com/powerbi/create-reports/desktop-getting-started',
		//buttonText: 'Learn more',
	},
];

export const recommendedActions: ActionCardProps[] = [
	{
		icon: ArrowClockwise20Regular,
		title: 'Retry deployment',
		description: 'Attempt the deployment process again after reviewing the errors',
	},
	{
		icon: DocumentError20Regular,
		title: 'Review error logs',
		description: 'Check the detailed error information to identify the root cause',
	},
	{
		icon: QuestionCircle20Regular,
		title: 'Check prerequisites',
		description: 'Verify workspace permissions, capacity settings, and network connectivity',
	},
	{
		icon: Mail20Regular,
		title: 'Contact support',
		description: 'Reach out to your administrator or Microsoft support for assistance',
	},
];

export const documentationLinks: DocumentationLink[] = [
	{
		title: 'Getting started guide',
		url: 'https://aka.ms/nds/docs',
	},
	{
		title: 'Data pipeline documentation',
		url: 'https://aka.ms/nds/docs/datapipeline',
	},
	{
		title: 'Power BI integration',
		url: 'https://aka.ms/nds/docs/PBIintegration',
	},
];
