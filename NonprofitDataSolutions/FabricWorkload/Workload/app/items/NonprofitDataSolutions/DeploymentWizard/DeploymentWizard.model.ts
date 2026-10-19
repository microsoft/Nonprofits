import { PageName } from '../telemetry/PageViewTelemetry';
import type { DeploymentWizardProps } from './DeploymentWizard.types';
import { DeploymentProvider, DeploymentState, WizardProvider, WorkspaceDataState } from './contexts';

export const DEPLOYMENT_WIZARD_ROUTE = '/package-deployment/:itemObjectId/';

export interface DeploymentWizardConfig {
	packageId: string;
	telemetryPageName: PageName;
	DeploymentProviderComponent: typeof DeploymentProvider;
	WizardProviderComponent: typeof WizardProvider;
	// Step behavior configuration
	stepConfig?: {
		// Determine if step should show error message in header (default: true for all except last step)
		shouldShowError?: (stepId: string, isLastStep: boolean) => boolean;
		// Determine if Previous button should be disabled for this step (default: false)
		shouldDisablePrevious?: (stepId: string) => boolean;
		// Get Next button text for a specific step (default: 'Next')
		getNextButtonText?: (stepId: string) => string;
		// Determine if step should show Export Logs button (default: false)
		shouldShowExportLogs?: (stepId: string, hasError: boolean, hasDeployment: boolean) => boolean;
		// Additional disabled conditions for Next button (default: false)
		getAdditionalNextDisabledConditions?: (stepId: string, deploymentState: DeploymentState, workspaceState: WorkspaceDataState) => boolean;
	};
}

export interface DeploymentWizardInternalProps extends DeploymentWizardProps {
	telemetryPageName: PageName;
	stepConfig: NonNullable<DeploymentWizardConfig['stepConfig']>;
}
