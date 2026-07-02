import React, { useCallback, useEffect, useRef } from 'react';

import { Wizard, WizardPanel, WizardStep } from '@fabric-msft/fabric-react';
import { Button, MessageBar, Text } from '@fluentui/react-components';
import {
	ArrowDownload16Regular,
	ChevronLeft16Regular,
	ChevronRight16Regular,
	Dismiss16Regular,
} from '@fluentui/react-icons';

import { Announce } from '@src/components/accessibility';
import { useFabricContext } from '@src/context/FabricContext';
import '@src/styles/wizard.scss';

import { callDialogClose, callDialogOpenMsgBox } from '@controller/DialogController';

import { useDownloadDeploymentLogs } from '@nds/hooks/useDownloadDeploymentLogs';

import { PageName, logPageView } from '../telemetry/PageViewTelemetry';
import { DeploymentWizardConfig, DeploymentWizardInternalProps } from './DeploymentWizard.model';
import { useStyles } from './DeploymentWizard.styles';
import { StepId } from './DeploymentWizard.types';
import { DeploymentProgressBar } from './common';
import {
	DeploymentProvider,
	WizardProvider,
	WorkspaceDataProvider,
	useDeployment,
	useWizard,
	useWorkspaceData,
} from './contexts';

const DeploymentWizardInternal: React.FC<DeploymentWizardInternalProps> = ({
	workloadClient,
	telemetryPageName,
	stepConfig,
}) => {
	const styles = useStyles();
	const wizardRef = useRef<HTMLElement>(null);

	// Use simplified context access - each context handles its own business logic
	const deployment = useDeployment();
	const workspaceData = useWorkspaceData();
	const wizardConfig = useWizard();
	const downloadDeploymentLogs = useDownloadDeploymentLogs();

	const { currentStepIndex, errorStepIndex } = wizardConfig.state;

	// Use steps from context - they are automatically managed based on selectedModules
	const steps = wizardConfig.state.steps;

	// Log page view once when workloadItem and currentWorkspace become available
	const hasLoggedPageView = useRef(false);

	useEffect(() => {
		const workloadItem = workspaceData.state.workloadItem;
		const currentWorkspace = workspaceData.state.currentWorkspace;

		if (workloadItem && currentWorkspace && !hasLoggedPageView.current) {
			logPageView({
				pageName: telemetryPageName,
				itemId: workloadItem.id,
				itemName: workloadItem.displayName,
				workspaceId: workloadItem.workspaceId,
				workspaceName: currentWorkspace.displayName,
			});

			hasLoggedPageView.current = true;
		}
	}, [workspaceData.state.workloadItem, workspaceData.state.currentWorkspace, telemetryPageName]);

	// Safety check: if no steps available, return empty state
	if (!steps || steps.length === 0) {
		throw new Error('No steps provided to Wizard');
	}

	// Fix accessibility: Remove ARIA tab roles since initial implementation of WizardSteps is not accessibility right
	useEffect(() => {
		try {
			if (!wizardRef.current) return;

			// Remove role from wizard step elements and their shadow DOM buttons
			wizardRef.current.querySelectorAll('fabric-wizard-step').forEach((step) => {
				step.removeAttribute('role');
				const button = (step as any).shadowRoot?.querySelector('button[role="tab"]');
				if (button) button.removeAttribute('role');
			});

			// Remove role from wizard panel elements
			wizardRef.current.querySelectorAll('fabric-wizard-panel').forEach((panel) => {
				panel.removeAttribute('role');
			});

			// Remove role from wizard's shadow DOM nav element
			const nav = (wizardRef.current as any).shadowRoot?.querySelector('nav[role="tablist"]');
			if (nav) {
				nav.removeAttribute('role');
				nav.removeAttribute('tabindex');
			}
		} catch (error) {
			// Log errors to help with debugging, but don't break the wizard
			logger.warn('ARIA role removal failed:', error);
		}
	}, [currentStepIndex, steps.length]);

	// Step state calculation function
	const getStepState = useCallback(
		(index: number) => {
			if (index === errorStepIndex) {
				// Step has an error
				return 'error';
			} else if (index < currentStepIndex) {
				// Past steps are always complete
				return 'complete';
			} else if (index === currentStepIndex && index === steps.length - 1) {
				// Current step is complete if it's the last step
				return 'complete';
			} else {
				// Current (non-last) and future steps are incomplete
				// This ensures connectors show when more steps are added
				return 'incomplete';
			}
		},
		[currentStepIndex, steps.length, errorStepIndex],
	);

	// Elegant navigation functions using context
	const onPreviousButtonClick = useCallback(() => {
		wizardConfig.actions.navigatePrevious();
	}, [wizardConfig.actions]);

	const onNextButtonClick = useCallback(
		async (currentIdx: number) => {
			const success = await wizardConfig.actions.navigateNext(deployment.state.selectedModules, deployment.state);

			if (success) {
				// Handle any step-specific logic after successful navigation
				await wizardConfig.actions.handleStepTransition(
					currentIdx + 1,
					deployment.actions,
					deployment.state.selectedModules,
				);
			}
		},
		[wizardConfig.actions, deployment.actions, deployment.state],
	);

	const notifyCloseBlocked = useCallback(async () => {
		const message = "Deployment can't be closed while it is in progress.";
		await callDialogOpenMsgBox(workloadClient, 'Deployment in progress', message, ['OK']);
	}, [workloadClient]);

	const handleDialogClose = useCallback(async () => {
		if (deployment.state.isDeploymentInProgress) {
			await notifyCloseBlocked();
			return;
		}

		await callDialogClose(workloadClient);
	}, [deployment.state.isDeploymentInProgress, notifyCloseBlocked, workloadClient]);

	const handleExportLogs = useCallback(() => {
		if (deployment.state.packageDeployment) {
			downloadDeploymentLogs(deployment.state.packageDeployment);
		}
	}, [deployment.state.packageDeployment, downloadDeploymentLogs]);

	return (
		<>
			{/* Live region to announce step changes to screen readers */}
			<Announce>
				Step {currentStepIndex + 1} of {steps.length}: {steps[currentStepIndex]?.title}
			</Announce>
			<Wizard linear={true} currentIndex={currentStepIndex} componentRef={wizardRef as any}>
				{steps.map((step, index) => {
					return (
						<WizardStep
							disabled
							tabIndex={-1}
							aria-disabled="true"
							key={index}
							slot="step"
							state={getStepState(index)}
							active={index === currentStepIndex}
							title={step.title}
						>
							<span slot="title">{step.title}</span>
						</WizardStep>
					);
				})}
				{/* Each step needs its own panel for Fabric wizard to work properly */}
				{steps.map((step, index) => {
					const isLastStep = index === steps.length - 1;
					const isCurrentStep = index === currentStepIndex;
					const hasError = !!(deployment.state.error || workspaceData.state.error);

					// Use step configuration functions with sensible defaults
					const shouldShowError = stepConfig.shouldShowError?.(step.id, isLastStep) ?? !isLastStep;
					const shouldDisablePrevious = stepConfig.shouldDisablePrevious?.(step.id) ?? false;
					const nextButtonText = stepConfig.getNextButtonText?.(step.id) ?? 'Next';
					const shouldShowExportLogs =
						stepConfig.shouldShowExportLogs?.(
							step.id,
							!!deployment.state.error,
							!!deployment.state.packageDeployment,
						) ?? false;
					const additionalNextDisabled =
						stepConfig.getAdditionalNextDisabledConditions?.(
							step.id,
							deployment.state,
							workspaceData.state,
						) ?? false;

					// Common button visibility logic
					const showPrevious = !hasError && !isLastStep && wizardConfig.state.canNavigatePrevious;
					const showNext = !hasError && !isLastStep;
					const showClose = hasError || isLastStep;

					return (
						<WizardPanel
							key={index}
							hidden={!isCurrentStep}
							active={isCurrentStep}
							style={{ display: isCurrentStep ? 'flex' : 'none' }}
						>
							{/* Move title content to the proper title slot */}
							<div slot="title" className={styles.titleContainer}>
								<div className={styles.headerRow}>
									<div className={styles.titleText}>
										<Text size={500} weight="semibold" className={styles.stepTitle}>
											{step.title}
										</Text>
										{step.details && (
											<Text size={300} className={styles.stepDetails}>
												{step.details}
											</Text>
										)}
									</div>
									<Button
										onClick={handleDialogClose}
										icon={<Dismiss16Regular />}
										appearance="subtle"
										aria-label="Close deployment wizard"
										className={styles.closeButton}
									/>
								</div>
								{deployment.state.isDeploymentInProgress && deployment.state.deploymentProgress && (
									<DeploymentProgressBar deploymentProgress={deployment.state.deploymentProgress} />
								)}
								{hasError && shouldShowError && (
									<MessageBar intent="error" role="alert" layout="multiline">
										{deployment.state.error || workspaceData.state.error}
									</MessageBar>
								)}
							</div>
							{/* Main panel content */}
							<div className={styles.panelContainer}>
								<div className={styles.contentContainer}>
									<step.component />
								</div>
							</div>
							<div slot="footer" className={styles.footer}>
								<div className={styles.footerButtonGroupLeft}>
									{shouldShowExportLogs && (
										<Button
											onClick={handleExportLogs}
											tabIndex={0}
											appearance="secondary"
											icon={<ArrowDownload16Regular />}
											className={styles.footerButton}
										>
											Export logs
										</Button>
									)}
									{showPrevious && (
										<Button
											onClick={onPreviousButtonClick}
											disabled={wizardConfig.state.isNavigating || shouldDisablePrevious}
											tabIndex={0}
											icon={<ChevronLeft16Regular />}
											className={styles.footerButton}
										>
											Previous
										</Button>
									)}
									{showNext && (
										<Button
											disabled={
												!wizardConfig.state.canNavigateNext ||
												wizardConfig.state.isNavigating ||
												additionalNextDisabled
											}
											onClick={() => onNextButtonClick(index)}
											tabIndex={0}
											appearance="primary"
											iconPosition="after"
											icon={<ChevronRight16Regular />}
											className={styles.footerButton}
										>
											{nextButtonText}
										</Button>
									)}
								</div>
								<div className={styles.footerButtonGroupRight}>
									<Button
										onClick={handleDialogClose}
										tabIndex={0}
										appearance={showClose ? 'primary' : 'secondary'}
										icon={showClose ? <Dismiss16Regular /> : undefined}
										className={styles.footerButton}
									>
										{showClose ? 'Close' : 'Cancel'}
									</Button>
								</div>
							</div>
						</WizardPanel>
					);
				})}
			</Wizard>
		</>
	);
};

// Factory function to create deployment wizard with specific config
const createDeploymentWizard = (config: DeploymentWizardConfig): React.FC => {
	// Default step configuration for standard wizard behavior
	const defaultStepConfig: NonNullable<DeploymentWizardConfig['stepConfig']> = {
		shouldShowError: (stepId, isLastStep) => !isLastStep,
		shouldDisablePrevious: (stepId) => stepId === StepId.Deploy,
		getNextButtonText: (stepId) => (stepId === StepId.Review ? 'Deploy' : 'Next'),
		shouldShowExportLogs: (stepId, hasError, hasDeployment) =>
			stepId === StepId.Finish && hasError && hasDeployment,
		getAdditionalNextDisabledConditions: (stepId, deploymentState, workspaceState) => {
			// Block on Deploy step (deployment in progress)
			if (stepId === StepId.Deploy) return true;
			// Block on data loading for steps that depend on workspace data
			if (stepId !== StepId.Overview && workspaceState.isLoadingData) return true;
			// Block deployment if there are duplicate names on Review step
			if (stepId === StepId.Review && deploymentState.hasDuplicateNames) return true;
			return false;
		},
	};

	const stepConfig = { ...defaultStepConfig, ...config.stepConfig };

	return () => {
		const { workloadClient } = useFabricContext();
		const { DeploymentProviderComponent, WizardProviderComponent, packageId, telemetryPageName } = config;

		return (
			<WorkspaceDataProvider workloadClient={workloadClient}>
				<DeploymentProviderComponent workloadClient={workloadClient} packageId={packageId}>
					<WizardProviderComponent>
						<DeploymentWizardInternal
							workloadClient={workloadClient}
							telemetryPageName={telemetryPageName}
							stepConfig={stepConfig}
						/>
					</WizardProviderComponent>
				</DeploymentProviderComponent>
			</WorkspaceDataProvider>
		);
	};
};

// Main exported component that wraps with stacked context providers
export const DeploymentWizard: React.FC = createDeploymentWizard({
	packageId: 'Fundraising',
	telemetryPageName: PageName.FundraisingDeploymentWizard,
	DeploymentProviderComponent: DeploymentProvider,
	WizardProviderComponent: WizardProvider,
});

// Example: Create Grants deployment wizard with different providers and custom step behavior
// export const GrantsDeploymentWizard: React.FC = createDeploymentWizard({
// 	packageId: 'Grants',
// 	telemetryPageName: PageName.GrantsDeploymentWizard,
// 	DeploymentProviderComponent: GrantsDeploymentProvider,
// 	WizardProviderComponent: GrantsWizardProvider,
// 	stepConfig: {
// 		// Override specific behaviors for Grants
// 		getNextButtonText: (stepId) => {
// 			if (stepId === 'grants-review') return 'Start Deployment';
// 			return 'Next';
// 		},
// 		getAdditionalNextDisabledConditions: (stepId, deploymentState) => {
// 			// Custom Grants validation logic
// 			if (stepId === 'grants-configure' && !deploymentState.isConfigValid) return true;
// 			return false;
// 		},
// 	},
// });
