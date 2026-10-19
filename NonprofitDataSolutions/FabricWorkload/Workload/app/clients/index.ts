// Main API Client Infrastructure
export { FabricPlatformClient, TokenProvider } from './FabricPlatformClient';
export { FabricPlatformAPIClient } from './FabricPlatformAPIClient';
export { CentralizedTokenManager } from './CentralizedTokenManager';
export * from './FabricPlatformTypes';

// API Controllers
export { WorkspaceClient as WorkspaceController } from './WorkspaceClient';
export { ItemClient as ItemController } from './ItemClient';
export { FolderClient } from './FolderClient';
export { JobSchedulerClient as JobSchedulerController } from './JobSchedulerClient';

// Re-export WorkloadClientAPI for convenience
export { WorkloadClientAPI } from '@ms-fabric/workload-client';
