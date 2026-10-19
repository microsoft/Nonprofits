import * as Yup from 'yup';

import { StepId } from '../../DeploymentWizard.types';
import { ModuleType } from '../../types/ModuleType';
import { DeploymentState } from '../DeploymentContext';

// Define validation schemas for each step
export const stepValidationSchemas = {
	[StepId.Configuration]: Yup.object({
		deploymentName: Yup.string()
			.required('Deployment name is required')
			.matches(
				/^[a-zA-Z][a-zA-Z0-9_]*$/,
				'Deployment name must start with a letter and contain only letters, numbers, and underscores',
			),
	}),

	[StepId.AdditionalConfiguration]: Yup.object().shape({
		selectedLakehouse: Yup.string().when('$needsDynamics365', {
			is: true,
			then: (schema) => schema.required('Lakehouse is required for Dynamics 365 integration'),
			otherwise: (schema) => schema.notRequired(),
		}),
		selectedConnection: Yup.string().when('$needsSalesforce', {
			is: true,
			then: (schema) => schema.required('Salesforce connection is required'),
			otherwise: (schema) => schema.notRequired(),
		}),
	}),
} as const;

// Type for step IDs that have validation
export type ValidatedStepId = keyof typeof stepValidationSchemas;

// Helper function to check if a step has validation
export const hasValidation = (stepId: StepId): stepId is ValidatedStepId => {
	return stepId in stepValidationSchemas;
};

// Helper function to get validation context based on selected modules
export const getValidationContext = (selectedModules: Set<ModuleType>) => ({
	needsDynamics365: selectedModules.has(ModuleType.Fundraising_Dynamics365),
	needsSalesforce: selectedModules.has(ModuleType.Fundraising_SalesforceNPSP),
});

// Helper function to extract step data for validation
export const getStepValidationData = (state: DeploymentState, stepId: ValidatedStepId) => {
	// Return only relevant fields for each step to avoid unnecessary validation
	switch (stepId) {
		case StepId.Configuration:
			return {
				deploymentName: state.deploymentName,
			};
		case StepId.AdditionalConfiguration:
			return {
				selectedLakehouse: state.selectedLakehouse,
				selectedConnection: state.selectedConnection,
			};
		default:
			return {
				deploymentName: state.deploymentName,
				selectedLakehouse: state.selectedLakehouse,
				selectedConnection: state.selectedConnection,
			};
	}
};
