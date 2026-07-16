import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';

import { getWizardSteps } from '../../DeploymentWizard.fundraising.model';
import { StepId } from '../../DeploymentWizard.types';
import { ModuleType } from '../../types/ModuleType';
import { useDeployment } from '../DeploymentContext';
import {
	ValidatedStepId,
	getStepValidationData,
	getValidationContext,
	hasValidation,
	stepValidationSchemas,
} from './WizardContext.model';
import type { WizardAction, WizardContextValue, WizardProviderProps, WizardState } from './WizardContext.types';

// Initial state - steps will be set from DeploymentContext
const initialState: WizardState = {
	currentStepIndex: 0,
	canNavigateNext: true,
	canNavigatePrevious: false,
	isNavigating: false,
	steps: [],
	errorStepIndex: null,
	configurationValidation: {},
};

// Reducer
function wizardReducer(state: WizardState, action: WizardAction): WizardState {
	logger.debug('[Wizard Context]', action.type, action);

	switch (action.type) {
		case 'SET_CURRENT_STEP_INDEX':
			return {
				...state,
				currentStepIndex: action.payload,
				canNavigateNext: action.payload < state.steps.length - 1,
				canNavigatePrevious: action.payload > 0,
			};
		case 'SET_STEPS':
			return {
				...state,
				steps: action.payload,
				canNavigateNext: action.payload.length > 1, // Always allow navigation from step 0 if there are multiple steps
			};
		case 'UPDATE_STEPS_FOR_MODULES':
			const newSteps = getWizardSteps(action.payload);
			return {
				...state,
				steps: newSteps,
				canNavigateNext: newSteps.length > 1,
			};
		case 'SET_NAVIGATING':
			return { ...state, isNavigating: action.payload };
		case 'SET_ERROR_STEP_INDEX':
			return { ...state, errorStepIndex: action.payload };
		case 'SET_VALIDATION_MESSAGE':
			return {
				...state,
				configurationValidation: {
					...state.configurationValidation,
					[action.payload.field]: action.payload.message,
				},
			};
		case 'RESET_VALIDATION':
			return { ...state, configurationValidation: {} };
		default:
			return state;
	}
}

// Create context
const WizardContext = createContext<WizardContextValue | undefined>(undefined);

export const WizardProvider: React.FC<WizardProviderProps> = ({ children }) => {
	const deploymentContext = useDeployment();

	// Get selectedModules from DeploymentContext, fallback to default if not available
	const selectedModules = deploymentContext.state.selectedModules;
	const initialSteps = getWizardSteps(selectedModules);

	const [state, dispatch] = useReducer(wizardReducer, {
		...initialState,
		steps: initialSteps,
		canNavigateNext: initialSteps.length > 1,
	});

	// Update wizard steps when selectedModules change
	useEffect(() => {
		const newSteps = getWizardSteps(selectedModules);
		// Only update if steps actually changed to avoid unnecessary re-renders
		const stepsChanged =
			state.steps.length !== newSteps.length ||
			state.steps.some((step, index) => step.id !== newSteps[index]?.id);

		if (stepsChanged) {
			dispatch({ type: 'UPDATE_STEPS_FOR_MODULES', payload: selectedModules });
		}
	}, [selectedModules, state.steps.length, state.steps.map((s) => s.id).join(',')]);

	// Validation actions
	const _setValidationMessage = useCallback(
		(field: keyof WizardState['configurationValidation'], message?: string) => {
			dispatch({ type: 'SET_VALIDATION_MESSAGE', payload: { field, message } });
		},
		[],
	);

	const _resetValidation = useCallback(() => {
		dispatch({ type: 'RESET_VALIDATION' });
	}, []);

	const _setErrorStepIndex = useCallback((stepIndex: number | null) => {
		dispatch({ type: 'SET_ERROR_STEP_INDEX', payload: stepIndex });
	}, []);

	// Step validation function - will be called with data from deployment context
	const _validateStep = useCallback(
		async (stepId: StepId, selectedModules: Set<ModuleType>, deploymentState: any): Promise<boolean> => {
			// Check if this step has validation rules
			if (!hasValidation(stepId)) {
				return true; // No validation needed for this step
			}

			const schema = stepValidationSchemas[stepId as ValidatedStepId];
			const stepData = getStepValidationData(deploymentState, stepId as ValidatedStepId);
			const context = getValidationContext(selectedModules);

			try {
				// Validate the step data
				await schema.validate(stepData, {
					abortEarly: false,
					context,
				});

				// Clear validation messages for this step's fields
				Object.keys(stepData).forEach((field) => {
					_setValidationMessage(field as keyof WizardState['configurationValidation'], undefined);
				});

				return true;
			} catch (error: any) {
				// Set validation messages for failed fields
				error.inner?.reverse().forEach((err: any) => {
					_setValidationMessage(err.path as keyof WizardState['configurationValidation'], err.message);
				});
				return false;
			}
		},
		[_setValidationMessage],
	);

	// Navigation functions
	const navigateNext = useCallback(
		async (
			selectedModules?: Set<ModuleType>,
			deploymentState?: any,
			fromStepIndex?: number, // Add optional parameter to override current step index
		): Promise<boolean> => {
			// Use provided step index or fall back to state
			const currentStepIndex = fromStepIndex ?? state.currentStepIndex;
			const canNavigate = fromStepIndex !== undefined || state.canNavigateNext;

			if (!canNavigate || state.isNavigating) {
				return false;
			}

			dispatch({ type: 'SET_NAVIGATING', payload: true });

			try {
				// Use the current wizard steps (already synchronized with selectedModules)
				const currentStep = state.steps[currentStepIndex];

				if (!currentStep) {
					return false;
				}

				// Validate current step before proceeding if deployment state is provided
				if (deploymentState) {
					const isValid = await _validateStep(currentStep.id, selectedModules, deploymentState);
					if (!isValid) {
						logger.info(`Step ${currentStepIndex} validation failed`);
						return false;
					}
				}
				const nextStepIndex = currentStepIndex + 1;

				// Update state
				dispatch({ type: 'SET_CURRENT_STEP_INDEX', payload: nextStepIndex });

				return true;
			} finally {
				dispatch({ type: 'SET_NAVIGATING', payload: false });
			}
		},
		[state.canNavigateNext, state.isNavigating, state.currentStepIndex, state.steps, _validateStep],
	);

	const navigatePrevious = useCallback(() => {
		if (!state.canNavigatePrevious || state.isNavigating) {
			return;
		}

		const previousStepIndex = state.currentStepIndex - 1;
		dispatch({ type: 'SET_CURRENT_STEP_INDEX', payload: previousStepIndex });

		logger.info(`Navigate back to step ${previousStepIndex}`);
	}, [state.canNavigatePrevious, state.isNavigating, state.currentStepIndex, state.steps.length]);
	const handleStepTransition = useCallback(
		async (currentStepIndex: number, deploymentActions?: any, selectedModules?: Set<ModuleType>): Promise<void> => {
			const deployStepIndex = state.steps.findIndex((step) => step.id === StepId.Deploy);
			const reviewStepIndex = state.steps.findIndex((step) => step.id === StepId.Review);

			// Refresh validation when transitioning to Review step
			if (currentStepIndex === reviewStepIndex && reviewStepIndex !== -1 && deploymentActions) {
				await deploymentActions.refreshItemNameValidation();
			}

			// Start deployment when we are ON the Deploy step
			if (currentStepIndex === deployStepIndex && deployStepIndex !== -1 && deploymentActions) {
				dispatch({ type: 'SET_CURRENT_STEP_INDEX', payload: currentStepIndex });

				const result = await deploymentActions.startDeployment();

				if (!result.success) _setErrorStepIndex(deployStepIndex);

				await navigateNext(selectedModules, deploymentActions, currentStepIndex);
			}
		},
		[state.steps, state.currentStepIndex, navigateNext, _validateStep],
	);

	// Steps will be managed externally by providing selectedModules to navigation functions

	const contextValue: WizardContextValue = {
		state,
		actions: {
			navigateNext,
			navigatePrevious,
			handleStepTransition,
			_setValidationMessage,
			_validateStep,
			_resetValidation,
			_setErrorStepIndex,
		},
	};

	return <WizardContext.Provider value={contextValue}>{children}</WizardContext.Provider>;
};

// Hook to use the context
export const useWizard = (): WizardContextValue => {
	const context = useContext(WizardContext);

	if (!context) {
		throw new Error('useWizard hook must be used within a WizardProvider');
	}
	return context;
};

export default WizardContext;
