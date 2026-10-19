import { ReactNode } from 'react';

import type { StepId, WizardStepConfig } from '../../DeploymentWizard.types';
import { ModuleType } from '../../types/ModuleType';

export interface WizardState {
	// Wizard navigation
	currentStepIndex: number;
	steps: WizardStepConfig[];

	canNavigateNext: boolean;
	canNavigatePrevious: boolean;
	isNavigating: boolean;

	errorStepIndex: number | null;

	// Validation messages
	configurationValidation: {
		deploymentName?: string;
		selectedLakehouse?: string;
		selectedConnection?: string;
		selectedLocation?: string;
	};
}

export type WizardAction =
	| { type: 'SET_CURRENT_STEP_INDEX'; payload: number }
	| { type: 'SET_STEPS'; payload: WizardStepConfig[] }
	| { type: 'UPDATE_STEPS_FOR_MODULES'; payload: Set<ModuleType> }
	| { type: 'SET_NAVIGATING'; payload: boolean }
	| { type: 'SET_ERROR_STEP_INDEX'; payload: number | null }
	| {
			type: 'SET_VALIDATION_MESSAGE';
			payload: { field: keyof WizardState['configurationValidation']; message?: string };
	  }
	| { type: 'RESET_VALIDATION' };

export interface WizardContextValue {
	state: WizardState;
	actions: {
		// Navigation actions
		navigateNext: (
			selectedModules?: Set<ModuleType>,
			deploymentState?: any,
			fromStepIndex?: number,
		) => Promise<boolean>;
		navigatePrevious: () => void;
		handleStepTransition: (
			stepIndex: number,
			deploymentActions?: any,
			selectedModules?: Set<ModuleType>,
		) => Promise<void>;

		// Validation actions
		_setValidationMessage: (field: keyof WizardState['configurationValidation'], message?: string) => void;
		_validateStep: (stepId: StepId, selectedModules: Set<ModuleType>, deploymentState: any) => Promise<boolean>;
		_resetValidation: () => void;
		_setErrorStepIndex: (stepIndex: number | null) => void;
	};
}

export interface WizardProviderProps {
	children: ReactNode;
}
