import { WorkloadClientAPI } from '@ms-fabric/workload-client';

import { CentralizedTokenManager } from './CentralizedTokenManager';
import { ConnectionClient } from './ConnectionClient';
import { FabricArtifactClient } from './FabricArtifactClient';
import { AZURE_STORAGE_SCOPES, FABRIC_BASE_SCOPES } from './FabricPlatformScopes';
import { FolderClient } from './FolderClient';
import { ItemClient } from './ItemClient';
import { JobSchedulerClient } from './JobSchedulerClient';
import { LakehouseClient } from './LakehouseClient';
import { OneLakeClient } from './OneLakeClient';
import { WorkspaceClient } from './WorkspaceClient';

// Create centralized token manager with all Fabric API scopes
// Only include Fabric API scopes - cannot mix multiple resource scopes in one token request
const FABRIC_API_SCOPES = [
	FABRIC_BASE_SCOPES.NOTEBOOK_READWRITE,
	FABRIC_BASE_SCOPES.LAKEHOUSE_READWRITE,
	FABRIC_BASE_SCOPES.DATAPIPELINE_READWRITE,
	FABRIC_BASE_SCOPES.REPORT_READWRITE,
	FABRIC_BASE_SCOPES.SEMANTICMODEL_READWRITE,
	FABRIC_BASE_SCOPES.WORKSPACE_READWRITE,
	FABRIC_BASE_SCOPES.CONNECTION_READ,
	FABRIC_BASE_SCOPES.EXTEND,
];

const ONE_LAKE_STORAGE_SCOPES = [AZURE_STORAGE_SCOPES.USER_IMPERSONATION];

/**
 * Comprehensive Fabric Platform API Client
 * Provides unified access to all Fabric platform APIs through individual clients
 * Uses centralized token management for better performance and reduced authentication overhead
 */
export class FabricPlatformAPIClient {
	public readonly workspaces: WorkspaceClient;
	public readonly items: ItemClient;
	public readonly lakehouse: LakehouseClient;
	public readonly folders: FolderClient;
	public readonly connections: ConnectionClient;
	public readonly scheduler: JobSchedulerClient;
	public readonly oneLake: OneLakeClient;
	public readonly artifacts: FabricArtifactClient;

	private readonly tokenManager: CentralizedTokenManager;
	private readonly azureStorageTokenManager: CentralizedTokenManager;

	constructor(workloadClient: WorkloadClientAPI) {
		this.tokenManager = new CentralizedTokenManager(workloadClient, FABRIC_API_SCOPES);
		this.azureStorageTokenManager = new CentralizedTokenManager(workloadClient, ONE_LAKE_STORAGE_SCOPES);

		// Initialize all clients with shared token provider for centralized authentication
		this.workspaces = new WorkspaceClient(workloadClient, this.tokenManager);
		this.items = new ItemClient(workloadClient, this.tokenManager);
		this.lakehouse = new LakehouseClient(workloadClient, this.tokenManager);
		this.folders = new FolderClient(workloadClient, this.tokenManager);
		this.connections = new ConnectionClient(workloadClient, this.tokenManager);
		this.scheduler = new JobSchedulerClient(workloadClient, this.tokenManager);
		this.oneLake = new OneLakeClient(workloadClient, this.azureStorageTokenManager);
		this.artifacts = new FabricArtifactClient(workloadClient, this.tokenManager);
	}

	/**
	 * Factory method to create a new FabricPlatformAPIClient instance
	 * @param workloadClient The WorkloadClientAPI instance
	 * @returns FabricPlatformAPIClient
	 */
	static create(workloadClient: WorkloadClientAPI): FabricPlatformAPIClient {
		return new FabricPlatformAPIClient(workloadClient);
	}
}

/**
 * Usage Examples:
 * 
 * ```typescript
 * import { FabricPlatformAPIClient } from './controller';
 * import { WorkloadClientAPI } from '@ms-fabric/workload-client';
 * 
 * // Method 1: User Token Authentication (default)
 * // Initialize the workload client (this is typically done by the Fabric platform)
 * const workloadClient = new WorkloadClientAPI();
 * const fabricAPI = FabricPlatformAPIClient.create(workloadClient);
 * 
 * // Method 2: Service Principal Authentication
 * const fabricAPIWithServicePrincipal = FabricPlatformAPIClient.createWithServicePrincipal(
 *   'your-client-id',
 *   'your-client-secret',
 *   'your-tenant-id'
 * );
 * 
 * // Method 3: Custom Token Authentication
 * const fabricAPIWithCustomToken = FabricPlatformAPIClient.createWithCustomToken('your-access-token');
 * 
 * // Use individual clients (works the same regardless of authentication method)
 * const workspaces = await fabricAPI.workspaces.getAllWorkspaces();
 * const items = await fabricAPI.items.getAllItems(workspaceId);
 * const capacity = await fabricAPI.capacities.getCapacity(capacityId);
 * 
 * // Advanced token management
 * const tokenManager = fabricAPI.getTokenManager();
 * const token = await tokenManager.getToken();
 * const status = tokenManager.getTokenStatus();
 * await tokenManager.refreshToken();
 * 
 * // Connection operations
 * const connections = await fabricAPI.connections.getAllConnections();
 * const connection = await fabricAPI.connections.getConnection(connectionId);
 * const adlsConnections = await fabricAPI.connections.getConnectionsByType('AdlsGen2');
 * const newConnection = await fabricAPI.connections.createConnection({
 *   displayName: 'My ADLS Connection',
 *   connectionType: 'AdlsGen2',
 *   description: 'Connection to Azure Data Lake Storage Gen2'
 * });
 * 
 * // Spark operations
 * const sparkSettings = await fabricAPI.spark.getWorkspaceSparkSettings(workspaceId);
 * const customPools = await fabricAPI.spark.getAllCustomPools(workspaceId);
 * const livySessions = await fabricAPI.spark.getAllLivySessions(workspaceId);
 * 
 * // Spark Livy operations (lower-level API)
 * const batchResponse = await fabricAPI.sparkLivy.createBatch(workspaceId, lakehouseId, batchRequest);
 * const sessions = await fabricAPI.sparkLivy.listSessions(workspaceId, lakehouseId);
 * 
 * // Or use clients directly for more specific use cases
 * import { WorkspaceClient, SparkClient, SparkLivyClient, FabricPlatformClient } from './clients';
 * 
 * // User token authentication (legacy)
 * const workspaceClient = new WorkspaceClient(workloadClient);
 * import { WorkspaceClient, SparkClient, SparkLivyClient, FabricPlatformClient } from './client';
 * 
 * // User token authentication (legacy)
 * const workspaceClient = new WorkspaceClient(workloadClient);
>>>>>>> origin/dev/preview/wdkv2:Workload/app/clients/FabricPlatformAPIClient.ts
 * 
 * // Service principal authentication
 * const authConfig = FabricPlatformClient.createServicePrincipalAuth(
 *   'client-id', 'client-secret', 'tenant-id'
 * );
 * const sparkController = new SparkController(authConfig);
 * const sparkLivyController = new SparkLivyController(authConfig);
 * 
 * const workspace = await workspaceController.getWorkspace(workspaceId);
 * const sparkSettings = await sparkController.getWorkspaceSparkSettings(workspaceId);
 * const batch = await sparkLivyController.getBatch(workspaceId, lakehouseId, batchId);
 * ```
 */
