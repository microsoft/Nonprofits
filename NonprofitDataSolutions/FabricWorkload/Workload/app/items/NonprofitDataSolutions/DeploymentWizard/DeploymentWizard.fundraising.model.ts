import { StepId } from './DeploymentWizard.types';
import type { WizardStepConfig } from './DeploymentWizard.types';
import { AdditionalConfiguration, Configuration, Finish, Overview, Review } from './steps';
import { ModuleType } from './types/ModuleType';

// Helper function to check if additional configuration is needed for selected packages
export const needsAdditionalConfiguration = (selectedPackages: Set<ModuleType>): boolean => {
	return (
		selectedPackages.has(ModuleType.Fundraising_Dynamics365) ||
		selectedPackages.has(ModuleType.Fundraising_SalesforceNPSP)
	);
};

// Function to generate steps configuration based on selected packages
export const getWizardSteps = (selectedPackages: Set<ModuleType>): WizardStepConfig[] => {
	return [
		{
			id: StepId.Overview,
			title: 'Overview',
			details: 'Nonprofit data solutions',
			component: Overview,
		},
		{
			id: StepId.Configuration,
			title: 'Configuration',
			details: 'Complete the following information',
			component: Configuration,
		},
		// Conditionally add Additional Configuration step if needed packages are selected
		...(needsAdditionalConfiguration(selectedPackages)
			? [
					{
						id: StepId.AdditionalConfiguration,
						title: 'Additional configuration',
						details: 'Additional deployment settings',
						component: AdditionalConfiguration,
					},
				]
			: []),
		{
			id: StepId.Review,
			title: 'Review',
			details: 'Review your deployment configuration',
			component: Review,
		},
		{
			id: StepId.Deploy,
			title: 'Deploy',
			details: 'Deployment in progress',
			component: Review,
		},
		{
			id: StepId.Finish,
			title: 'Finish',
			details: 'Deployment completed successfully',
			component: Finish,
		},
	];
};
