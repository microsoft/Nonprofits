import { ReactNode } from 'react';

import { WorkloadClientAPI } from '@ms-fabric/workload-client';

import { Package, PackageDeployment } from '@originalInstaller/PackageInstallerItemModel';
import {
	DeploymentItemStatusEntry,
	DeploymentItemStatusUpdate,
} from '@originalInstaller/deployment/DeploymentItemStatus';
import { PackageInstallerContext } from '@originalInstaller/package/PackageInstallerContext';

import { ModuleType } from '../../types/ModuleType';

export interface DeploymentState {
	originalPackage: Package | null; // Store the loaded package
	modifiedPackage: Package | null; // Store the modified package for saving

	isDeploymentInProgress: boolean;
	deploymentProgress?: {
		currentStep: string;
		progress: number;
	};

	itemStatuses: DeploymentItemStatusEntry[];
	packageDeployment?: PackageDeployment;
	installerContext: PackageInstallerContext | null;
	error?: string;

	// User selections
	deploymentName: string;
	selectedLakehouse: string;
	selectedConnection: string;
	selectedLocation: string;
	selectedModules: Set<ModuleType>;
	hasDuplicateNames: boolean;
	duplicateNames: Set<string>;
}

export type DeploymentAction =
	| { type: 'SET_DEPLOYMENT_IN_PROGRESS'; payload: boolean }
	| { type: 'SET_DEPLOYMENT_PROGRESS'; payload?: DeploymentState['deploymentProgress'] }
	| { type: 'SET_ERROR'; payload?: string }
	| { type: 'SET_ITEM_STATUSES'; payload: DeploymentItemStatusEntry[] }
	| { type: 'UPSERT_ITEM_STATUS'; payload: DeploymentItemStatusUpdate }
	| { type: 'SET_DEPLOYMENT'; payload?: PackageDeployment }
	| { type: 'SET_INSTALLER_CONTEXT'; payload: PackageInstallerContext }
	| { type: 'SET_ORIGINAL_PACKAGE'; payload: Package | null }
	| { type: 'SET_MODIFIED_PACKAGE'; payload: Package | null }
	| { type: 'SET_DEPLOYMENT_NAME'; payload: string }
	| { type: 'SET_SELECTED_LAKEHOUSE'; payload: string }
	| { type: 'SET_SELECTED_CONNECTION'; payload: string }
	| { type: 'SET_SELECTED_LOCATION'; payload: string }
	| { type: 'ADD_MODULE'; payload: ModuleType }
	| { type: 'REMOVE_MODULE'; payload: ModuleType }
	| { type: 'SET_HAS_DUPLICATE_NAMES'; payload: boolean }
	| { type: 'SET_DUPLICATE_NAMES'; payload: Set<string> };

export interface DeploymentContextValue {
	state: DeploymentState;
	actions: {
		setPackageDeployment: (deployment?: PackageDeployment) => void;
		setModifiedPackage: (modifiedPackage: Package) => void;
		addDeployment: () => Promise<void>;
		startDeployment: () => Promise<{ success: boolean; error?: string }>;

		// User selection actions
		setDeploymentName: (name: string) => void;
		setSelectedLakehouse: (lakehouse: string) => void;
		setSelectedConnection: (connection: string) => void;
		setSelectedLocation: (location: string) => void;
		addModule: (moduleType: ModuleType) => void;
		removeModule: (moduleType: ModuleType) => void;
		setHasDuplicateNames: (hasDuplicates: boolean) => void;
		refreshItemNameValidation: () => Promise<void>;
	};
}

export interface DeploymentProviderProps {
	packageId: string;
	children: ReactNode;
	workloadClient: WorkloadClientAPI;
}
