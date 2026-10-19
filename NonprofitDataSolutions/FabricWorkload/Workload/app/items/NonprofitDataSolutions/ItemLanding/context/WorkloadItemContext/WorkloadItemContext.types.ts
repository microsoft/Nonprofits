import { ReactNode } from 'react';

import { NavigationResult, OpenUIResult } from '@ms-fabric/workload-client';

import { FundraisingItem } from '@src/hooks/useWorkloadItem';

import { FundraisingDeploymentInfo } from '../../hooks/useLatestDeployment';
import type { WorkloadItemConfig } from './WorkloadItemContext.config';

export interface WorkloadItemState {
	workloadItem: FundraisingItem | null;
	latestDeployment: FundraisingDeploymentInfo | null;
	isLoading: boolean;
	error: string | null;
	enableNewDeployment: boolean;
	pageId?: string;
}

export interface WorkloadItemActions {
	openDeploymentWizard: () => Promise<OpenUIResult>;
	openItemSettings: () => Promise<void>;
	reloadData: () => Promise<void>;
}

export interface WorkloadItemNavigation {
	goToOverview: () => Promise<NavigationResult>;
	goToDeployments: () => Promise<NavigationResult>;
	goToPostDeploymentSetup: () => Promise<NavigationResult>;
	openExternalLink: (url: string) => Promise<void>;
}

export interface WorkloadItemContextValue {
	config: WorkloadItemConfig; // Expose config to components
	state: WorkloadItemState;
	actions: WorkloadItemActions;
	navigation: WorkloadItemNavigation;
}

export interface WorkloadItemProviderProps {
	children: ReactNode;
	config: WorkloadItemConfig;
}
