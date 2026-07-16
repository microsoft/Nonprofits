import { ReactNode } from 'react';

import { WorkloadClientAPI } from '@ms-fabric/workload-client';

import { ContextProps } from '@src/App';

import { ItemWithDefinition } from '@controller/ItemCRUDController';

import { PackageInstallerItemDefinition } from '@originalInstaller/PackageInstallerItemModel';

export interface WorkspaceDataState {
	// Loading states
	isLoadingData: boolean;

	// Core data
	workloadItem?: ItemWithDefinition<PackageInstallerItemDefinition>;

	// Fabric resources
	lakehouses: Array<{ label: string; value: string }>;
	connections: Array<{ label: string; value: string }>;
	folders: Array<{ label: string; value: string; parentFolderId?: string }>;
	currentWorkspace?: { id: string; displayName: string; description: string };

	// Error states
	error?: string;
}

export type WorkspaceDataAction =
	| { type: 'SET_LOADING'; payload: boolean }
	| { type: 'SET_WORKLOAD_ITEM'; payload: ItemWithDefinition<PackageInstallerItemDefinition> }
	| { type: 'UPDATE_ITEM_DEFINITION'; payload: Partial<PackageInstallerItemDefinition> }
	| { type: 'SET_ERROR'; payload?: string }
	| { type: 'SET_LAKEHOUSES'; payload: Array<{ label: string; value: string }> }
	| { type: 'SET_CONNECTIONS'; payload: Array<{ label: string; value: string }> }
	| { type: 'SET_FOLDERS'; payload: Array<{ label: string; value: string; parentFolderId?: string }> }
	| { type: 'SET_CURRENT_WORKSPACE'; payload?: { id: string; displayName: string; description: string } };

export interface WorkspaceDataContextValue {
	state: WorkspaceDataState;
	workloadClient: WorkloadClientAPI;
	actions: {
		// Data loading actions
		loadData: (pageContext: ContextProps) => Promise<void>;
		saveItem: (definition?: PackageInstallerItemDefinition) => Promise<any>;
		updateItemDefinition: (updates: Partial<PackageInstallerItemDefinition>) => void;

		// Resource loading
		loadLakehouses: (workspaceId: string) => Promise<void>;
		loadConnections: () => Promise<void>;
		loadWorkspaceFolders: (workspaceId: string) => Promise<void>;
		loadCurrentWorkspace: (workspaceId: string) => Promise<void>;
	};
}

export interface WorkspaceDataProviderProps {
	children: ReactNode;
	workloadClient: WorkloadClientAPI;
}
