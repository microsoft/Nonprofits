import type { DeployedItem } from '@src/items/PackageInstallerItem/PackageInstallerItemModel';

export type SqlDatabaseArgs = { server?: string; endpointId?: string };

export type ResolvedTargets = {
	goldLakehouse?: DeployedItem;
	silverLakehouse?: DeployedItem;
	semanticModel?: DeployedItem;
	report?: DeployedItem;
	orchestrationPipeline?: DeployedItem;
};

export enum PostDeploymentSetupPhase {
	Idle = 'idle',
	Running = 'running',
	Done = 'done',
	Error = 'error',
}

export type SetupSummaryLine = { message: string; success: boolean };

export type ResolvedItemEntry = {
	label: string;
	item?: DeployedItem;
	blocking: boolean;
};
