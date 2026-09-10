import type React from 'react';

import { WorkloadClientAPI } from '@ms-fabric/workload-client';

export interface DeploymentWizardProps {
	workloadClient: WorkloadClientAPI;
}

// Step IDs enum for type safety and reusability
export enum StepId {
	Overview = 'step-0',
	Configuration = 'step-1',
	AdditionalConfiguration = 'step-2',
	Review = 'step-3',
	Deploy = 'step-4',
	Finish = 'step-5',
}

export interface WizardStepConfig {
	id: StepId;
	title: string;
	details?: string;
	component: React.ComponentType;
}
