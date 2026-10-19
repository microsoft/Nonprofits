import {
	ChartMultiple24Regular,
	DatabaseSearch24Regular,
	Document24Regular,
	Flash24Regular,
} from '@fluentui/react-icons';

import type { HeaderData } from './components/OverviewHeader/OverviewHeader.types';
import type { Prerequisite } from './components/PrerequisitesSection/PrerequisitesSection.types';
import type { Feature } from './components/SolutionFeatures/SolutionFeatures.types';

export const overviewLabels = {
	solutionFeatures: {
		sectionTitle: 'Solution includes',
		ariaLabel: 'Solution includes',
	},
	deploymentIncludes: {
		sectionTitle: 'This deployment includes',
		ariaLabel: 'Items included in this deployment',
		includedItemLabel: 'Included',
	},
	prerequisites: {
		sectionTitle: 'Prerequisites',
		ariaLabel: 'System and access requirements',
		requirementLabel: 'Requirement',
	},
	estimatedTime: {
		title: 'Estimated deployment time',
		description:
			'The deployment process typically takes 3-5 minutes. You can monitor the progress on the next step.',
	},
};

export const headerData: HeaderData = {
	iconName: 'nonprofit',
	title: 'Fundraising',
	subtitle: 'Pre-configured data solution',
	description:
		'Deploy a comprehensive data and analytics solution designed specifically for nonprofits. This data solution provides end-to-end capabilities to ingest, standardize, enrich, and visualize fundraising data to reveal actionable insights.',
};

export const features: Feature[] = [
	{
		icon: DatabaseSearch24Regular,
		title: 'Lakehouses',
		description: 'Centralized data storage with schema optimized for fundraising analytics',
	},
	{
		icon: Document24Regular,
		title: 'Notebooks',
		description: 'Ready-to-use data ingestion and transformation logic',
	},
	{
		icon: Flash24Regular,
		title: 'Pipelines',
		description: 'Orchestrated workflows for continuous data processing',
	},
	{
		icon: ChartMultiple24Regular,
		title: 'Power BI report',
		description: 'Interactive report with key fundraising metrics and insights',
	},
];

export const deploymentItems: string[] = [
	'Lakehouse optimized with fundraising data schema',
	'Data ingestion notebooks for constituent and campaign data',
	'Transformation notebooks for data cleansing and enrichment',
	'Orchestration pipeline for end-to-end automation',
	'Power BI semantic model with pre-defined relationships',
	'Out-of-the-box reporting for constituent, engagement, and segmentation data',
];

export const prerequisites: Prerequisite[] = [
	{
		requirement: 'Workspace permissions',
		description: 'Admin or Contributor role in the target workspace',
	},
	{
		requirement: 'Fabric capacity',
		description: 'Active Fabric capacity assigned to the workspace',
	},
	{
		requirement: 'Power BI license',
		description: 'Power BI Pro or Premium Per User license',
	},
];
