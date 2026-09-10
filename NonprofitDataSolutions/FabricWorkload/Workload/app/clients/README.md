# Microsoft Fabric Platform API Wrappers

This directory contains comprehensive TypeScript API wrappers for the Microsoft Fabric Platform REST APIs. These wrappers provide a strongly-typed, easy-to-use interface for interacting with Fabric platform services from your workload applications.

## Overview

The API wrappers are built on top of the `@ms-fabric/workload-client` SDK and provide:

- **Type Safety**: Complete TypeScript interfaces for all API models
- **Multiple Authentication Methods**: Support for user tokens, service principals, and custom tokens
- **Error Handling**: Standardized error handling and reporting
- **Pagination**: Automatic pagination support for list operations
- **Utility Methods**: Helper methods for common operations
- **Centralized Scope Management**: OAuth scopes organized by controller and functionality

## Architecture

### Core Components

- **`FabricPlatformClient`**: Abstract base class providing common HTTP client functionality with flexible authentication
- **`FabricAuthenticationService`**: Service handling multiple authentication methods (user token, service principal, custom token)
- **`FabricPlatformTypes`**: Comprehensive TypeScript type definitions including authentication configurations
- **`FabricPlatformAPIClient`**: Unified client that aggregates all individual controllers
- **`FabricPlatformScopes`**: Centralized OAuth scope definitions and management
- **Individual Controllers**: Specialized controllers for each API domain

### Controllers

| Controller                        | Purpose               | Key Features                                                |
| --------------------------------- | --------------------- | ----------------------------------------------------------- |
| `WorkspaceController`             | Workspace management  | CRUD operations, role assignments, capacity management      |
| `ItemController`                  | Item management       | CRUD operations, definition management, search capabilities |
| `FolderController`                | Folder hierarchy      | CRUD operations, path utilities, hierarchy management       |
| `CapacityController`              | Capacity management   | Capacity info, workload management, workspace assignments   |
| `JobSchedulerController`          | Job scheduling        | Schedule management, job execution, status tracking         |
| `OneLakeShortcutController`       | OneLake shortcuts     | Shortcut creation/management for external data sources      |
| `LongRunningOperationsController` | Operation tracking    | Progress monitoring, polling utilities                      |
| `SparkLivyController`             | Spark Livy operations | Batch jobs, interactive sessions, statement management      |

### Authentication Methods

The API wrappers support multiple authentication methods:

1. **User Token Authentication** (Default): Uses WorkloadClientAPI for interactive scenarios
2. **Service Principal Authentication**: Uses Azure AD client credentials flow for server-to-server scenarios
3. **Custom Token Authentication**: Uses pre-acquired access tokens for specialized scenarios

### OAuth Scopes

Centralized scope management ensures proper permissions for each controller:

- **Item Operations**: `Item.Read.All`, `Item.ReadWrite.All`, `Item.Execute.All`
- **Workspace Operations**: `Workspace.Read.All`, `Workspace.ReadWrite.All`
- **Capacity Operations**: `Capacity.Read.All`, `Capacity.ReadWrite.All`
- **OneLake Operations**: `OneLake.Read.All`, `OneLake.ReadWrite.All`
- **Lakehouse Operations**: `Lakehouse.Execute.All`, `Lakehouse.Read.All`
- **Code Operations**: `Code.AccessStorage.All`, `Code.AccessAzureKeyvault.All`, etc.

## Quick Start

### User Token Authentication (Default)

```typescript
import { FabricPlatformAPIClient, WorkloadClientAPI } from './controller';

// Initialize the workload client (typically provided by Fabric platform)
const workloadClient = new WorkloadClientAPI();

// Create the comprehensive API client
const fabricAPI = FabricPlatformAPIClient.create(workloadClient);

// Use the APIs
const workspaces = await fabricAPI.workspaces.getAllWorkspaces();
```

### Service Principal Authentication

```typescript
import { FabricPlatformAPIClient } from './controller';

// Create client with service principal authentication
const fabricAPI = FabricPlatformAPIClient.createWithServicePrincipal(
	'your-client-id',
	'your-client-secret',
	'your-tenant-id',
);

// Use the APIs (same interface as user token auth)
const workspaces = await fabricAPI.workspaces.getAllWorkspaces();
```

### Custom Token Authentication

```typescript
import { FabricPlatformAPIClient } from './controller';

// Create client with pre-acquired token
const fabricAPI =
	FabricPlatformAPIClient.createWithCustomToken('your-access-token');

// Use the APIs
const workspaces = await fabricAPI.workspaces.getAllWorkspaces();
const items = await fabricAPI.items.getAllItems(workspaceId);
```

## Key Features

- **🔐 Multiple Authentication Methods**: User tokens, service principals, and custom tokens
- **🎯 Specialized Controllers**: Dedicated controllers for each Fabric service area
- **📊 Spark Livy Integration**: Complete support for Spark batch jobs and interactive sessions
- **🔒 Centralized OAuth Scopes**: Organized permissions by functionality and controller
- **🔄 Automatic Pagination**: Seamless handling of large result sets
- **💪 Type Safety**: Full TypeScript support with comprehensive type definitions
- **⚡ Runtime Configuration**: Update authentication settings without recreating clients
- **🛠️ Utility Methods**: Helper functions for common operations and error handling

### Individual Controller Usage

#### With User Token Authentication

```typescript
import { WorkspaceController, WorkloadClientAPI } from './controller';

const workloadClient = new WorkloadClientAPI();
const workspaceController = new WorkspaceController(workloadClient);

// Get workspace details
const workspace = await workspaceController.getWorkspace(workspaceId);

// Create a new workspace
const newWorkspace = await workspaceController.createWorkspace({
	displayName: 'My New Workspace',
	description: 'A workspace for my project',
});
```

#### With Service Principal Authentication

```typescript
import { SparkLivyController, FabricPlatformClient } from './controller';

// Create authentication config
const authConfig = FabricPlatformClient.createServicePrincipalAuth(
	'client-id',
	'client-secret',
	'tenant-id',
);

// Create controller with service principal auth
const sparkController = new SparkLivyController(authConfig);

// Use the controller
const batches = await sparkController.listBatches(workspaceId, lakehouseId);
```

## Examples

### Workspace Management

```typescript
// List all workspaces
const workspaces = await fabricAPI.workspaces.getAllWorkspaces();

// Get a specific workspace
const workspace = await fabricAPI.workspaces.getWorkspace(workspaceId);

// Update workspace
await fabricAPI.workspaces.updateWorkspace(workspaceId, {
	displayName: 'Updated Name',
	description: 'Updated description',
});

// Assign workspace to capacity
await fabricAPI.workspaces.assignToCapacity(workspaceId, capacityId);
```

### Item Management

```typescript
// List items in workspace
const items = await fabricAPI.items.getAllItems(workspaceId);

// Search items by name
const reports = await fabricAPI.items.searchByName(workspaceId, 'Sales Report');

// Get items by type
const notebooks = await fabricAPI.items.getItemsByType(workspaceId, 'Notebook');

// Create new item
const newItem = await fabricAPI.items.createItem(workspaceId, {
	displayName: 'My Report',
	type: 'Report',
	description: 'Monthly sales report',
});
```

### Job Scheduling

```typescript
// Create a schedule
const schedule = await fabricAPI.scheduler.createItemSchedule(
	workspaceId,
	itemId,
	'Refresh',
	{
		enabled: true,
		configuration: {
			type: 'Daily',
			startDateTime: '2024-01-01T09:00:00Z',
			endDateTime: '2024-12-31T09:00:00Z',
			localTimeZoneId: 'UTC',
			times: ['09:00:00'],
		},
	},
);

// Run job on-demand
await fabricAPI.scheduler.runOnDemandItemJob(workspaceId, itemId, 'Refresh');

// Get job instances
const jobInstances = await fabricAPI.scheduler.getAllItemJobInstances(
	workspaceId,
	itemId,
);
```

### Spark Livy Operations

```typescript
// Create a Spark batch job
const batchRequest = {
	name: 'My Batch Job',
	file: 'abfss://workspace@onelake.dfs.fabric.microsoft.com/lakehouse/Files/my_script.py',
	args: ['arg1', 'arg2'],
	conf: {
		'spark.executor.memory': '2g',
		'spark.executor.cores': '2',
	},
};

const batch = await fabricAPI.sparkLivy.createBatch(
	workspaceId,
	lakehouseId,
	batchRequest,
);

// List all batch jobs
const batches = await fabricAPI.sparkLivy.listBatches(workspaceId, lakehouseId);

// Get batch job status
const batchStatus = await fabricAPI.sparkLivy.getBatch(
	workspaceId,
	lakehouseId,
	batch.id,
);

// Get batch job logs
const logs = await fabricAPI.sparkLivy.getBatchLogs(
	workspaceId,
	lakehouseId,
	batch.id,
);

// Create an interactive Spark session
const sessionRequest = {
	name: 'My Interactive Session',
	kind: 'pyspark',
	conf: {
		'spark.executor.memory': '1g',
	},
};

const session = await fabricAPI.sparkLivy.createSession(
	workspaceId,
	lakehouseId,
	sessionRequest,
);

// Submit code to session
const statement = await fabricAPI.sparkLivy.submitStatement(
	workspaceId,
	lakehouseId,
	session.id,
	{ code: 'df = spark.read.table("my_table")\ndf.show()' },
);

// Get statement result
const result = await fabricAPI.sparkLivy.getStatement(
	workspaceId,
	lakehouseId,
	session.id,
	statement.id,
);
```

### OneLake Shortcuts

```typescript
// Create a OneLake shortcut
const shortcut = await fabricAPI.shortcuts.createOneLakeShortcut(
	workspaceId,
	lakehouseId,
	'shared_data',
	'/Files/shared_data',
	sourceWorkspaceId,
	sourceLakehouseId,
	'/Files/source_data',
);

// Create ADLS Gen2 shortcut
const adlsShortcut = await fabricAPI.shortcuts.createAdlsGen2Shortcut(
	workspaceId,
	lakehouseId,
	'external_data',
	'/Files/external_data',
	adlsConnectionId,
	'/container/folder',
);
```

### Long Running Operations

```typescript
// Poll operation until completion
const result = await fabricAPI.operations.waitForSuccess(operationId);

// Track progress with callback
const result = await fabricAPI.operations.trackProgress(
	operationId,
	(progress, status) => {
		console.log(`Operation ${status}: ${progress}% complete`);
	},
);

// Wait for multiple operations
const results = await fabricAPI.operations.waitForMultiple([op1, op2, op3]);
```

### Capacity Management

```typescript
// List all capacities
const capacities = await fabricAPI.capacities.getAllCapacities();

// Get active capacities
const activeCapacities = await fabricAPI.capacities.getActiveCapacities();

// Enable workload on capacity
await fabricAPI.capacities.enableCapacityWorkload(
	capacityId,
	'DataEngineering',
);

// Assign workspace to capacity
await fabricAPI.capacities.assignWorkspaceToCapacity(capacityId, workspaceId);
```

## Authentication Configuration

### Runtime Configuration Updates

You can update authentication configuration at runtime for individual controllers:

```typescript
import { FabricPlatformClient } from './controller';

// Create controller with user token
const workspaceController = new WorkspaceController(workloadClient);

// Switch to service principal authentication
const authConfig = FabricPlatformClient.createServicePrincipalAuth(
	'client-id',
	'client-secret',
	'tenant-id',
);

workspaceController.updateAuthenticationConfig(authConfig);

// Now all subsequent calls use service principal auth
const workspaces = await workspaceController.getAllWorkspaces();
```

### Authentication Status Checking

```typescript
// Check authentication method
if (controller.isServicePrincipalAuth()) {
	console.log('Using service principal authentication');
} else if (controller.isUserTokenAuth()) {
	console.log('Using user token authentication');
}
```

### Custom OAuth Scopes

```typescript
import { CONTROLLER_SCOPES, FABRIC_BASE_SCOPES } from './controller';

// Use predefined controller scopes
const sparkController = new SparkLivyController(
	workloadClient,
	CONTROLLER_SCOPES.SPARK_LIVY,
);

// Create custom scope combination
const customScopes = [
	FABRIC_BASE_SCOPES.ITEM_READWRITE,
	FABRIC_BASE_SCOPES.LAKEHOUSE_EXECUTE,
	FABRIC_BASE_SCOPES.CODE_ACCESS_STORAGE,
].join(' ');

const customController = new SparkLivyController(workloadClient, customScopes);
```

## Error Handling

All API methods throw typed errors that can be caught and handled:

```typescript
try {
	const workspace = await fabricAPI.workspaces.getWorkspace(workspaceId);
} catch (error) {
	if (error.status === 404) {
		console.log('Workspace not found');
	} else if (error.status === 403) {
		console.log('Access denied');
	} else {
		console.error('API Error:', error.message);
	}
}
```

## Pagination

Large result sets are automatically paginated. Use the `getAll*` methods for automatic pagination handling:

```typescript
// Automatically handles pagination
const allWorkspaces = await fabricAPI.workspaces.getAllWorkspaces();

// Manual pagination control
let continuationToken: string | undefined;
do {
	const result = await fabricAPI.workspaces.listWorkspaces(continuationToken);
	processWorkspaces(result.value);
	continuationToken = result.continuationToken;
} while (continuationToken);
```

## Type Safety

All API responses are strongly typed:

```typescript
import { Workspace, Item, Capacity } from './controller';

const workspace: Workspace =
	await fabricAPI.workspaces.getWorkspace(workspaceId);
const items: Item[] = await fabricAPI.items.getAllItems(workspaceId);
const capacity: Capacity = await fabricAPI.capacities.getCapacity(capacityId);
```

## Contributing

When adding new API endpoints:

1. Add type definitions to `FabricPlatformTypes.ts`
2. Create or update the appropriate controller
3. Add controller-specific scopes to `FabricPlatformScopes.ts`
4. Add the controller to `FabricPlatformAPIClient.ts`
5. Export from `index.ts`
6. Update this README with examples
7. Test with both user token and service principal authentication

### Adding New OAuth Scopes

When adding new functionality that requires additional permissions:

1. Add base scopes to `FABRIC_BASE_SCOPES` in `FabricPlatformScopes.ts`
2. Create or update controller-specific scope combinations in `CONTROLLER_SCOPES`
3. Use the centralized scopes in your controller constructor
4. Document the required permissions in your controller's JSDoc comments
5. Add the controller to `FabricPlatformAPIClient.ts`
6. Export from `index.ts`
7. Update this README with examples

## API Reference

For detailed API documentation, refer to:

- [Microsoft Fabric REST API Documentation](https://learn.microsoft.com/en-us/rest/api/fabric/)
- [Fabric Platform API Specifications](https://github.com/microsoft/fabric-rest-api-specs)

## License

This code is part of the Microsoft Fabric Workload Development Kit and follows the same licensing terms.
