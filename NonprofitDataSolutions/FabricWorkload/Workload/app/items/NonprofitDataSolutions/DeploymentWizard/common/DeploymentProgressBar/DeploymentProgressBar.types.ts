export interface DeploymentProgressData {
	progress: number;
	currentStep: string;
}

export interface DeploymentProgressBarProps {
	deploymentProgress: DeploymentProgressData;
}
