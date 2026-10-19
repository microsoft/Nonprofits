/**
 * Microsoft Fabric Platform API Scopes
 * Centralized definitions for OAuth scopes used by different clients
 * Based on official Microsoft Fabric REST API documentation
 */

// Base Fabric API scopes
export const FABRIC_BASE_SCOPES = {
	// Generic item operations
	// ITEM_READ: 'https://api.fabric.microsoft.com/Item.Read.All',
	// ITEM_READWRITE: 'https://api.fabric.microsoft.com/Item.ReadWrite.All',
	// ITEM_EXECUTE: 'https://api.fabric.microsoft.com/Item.Execute.All',
	// ITEM_RESHARE: 'https://api.fabric.microsoft.com/Item.Reshare.All',

	// Workspace operations
	// WORKSPACE_READ: 'https://api.fabric.microsoft.com/Workspace.Read.All',
	WORKSPACE_READWRITE: 'https://api.fabric.microsoft.com/Workspace.ReadWrite.All',

	// Capacity operations
	// CAPACITY_READ: 'https://api.fabric.microsoft.com/Capacity.Read.All',
	// CAPACITY_READWRITE: 'https://api.fabric.microsoft.com/Capacity.ReadWrite.All',

	// OneLake operations
	// ONELAKE_READ: 'https://api.fabric.microsoft.com/OneLake.Read.All',
	// ONELAKE_READWRITE: 'https://api.fabric.microsoft.com/OneLake.ReadWrite.All',

	// Lakehouse operations
	// LAKEHOUSE_READ: 'https://api.fabric.microsoft.com/Lakehouse.Read.All',
	LAKEHOUSE_READWRITE: 'https://api.fabric.microsoft.com/Lakehouse.ReadWrite.All',
	// LAKEHOUSE_EXECUTE: 'https://api.fabric.microsoft.com/Lakehouse.Execute.All',
	// LAKEHOUSE_RESHARE: 'https://api.fabric.microsoft.com/Lakehouse.Reshare.All',

	// Warehouse operations
	// WAREHOUSE_READ: 'https://api.fabric.microsoft.com/Warehouse.Read.All',
	// WAREHOUSE_READWRITE: 'https://api.fabric.microsoft.com/Warehouse.ReadWrite.All',
	// WAREHOUSE_EXECUTE: 'https://api.fabric.microsoft.com/Warehouse.Execute.All',
	// WAREHOUSE_RESHARE: 'https://api.fabric.microsoft.com/Warehouse.Reshare.All',

	// Notebook operations
	// NOTEBOOK_READ: 'https://api.fabric.microsoft.com/Notebook.Read.All',
	NOTEBOOK_READWRITE: 'https://api.fabric.microsoft.com/Notebook.ReadWrite.All',
	// NOTEBOOK_EXECUTE: 'https://api.fabric.microsoft.com/Notebook.Execute.All',
	// NOTEBOOK_RESHARE: 'https://api.fabric.microsoft.com/Notebook.Reshare.All',

	// Report operations
	// REPORT_READ: 'https://api.fabric.microsoft.com/Report.Read.All',
	REPORT_READWRITE: 'https://api.fabric.microsoft.com/Report.ReadWrite.All',
	// REPORT_RESHARE: 'https://api.fabric.microsoft.com/Report.Reshare.All',

	// Semantic Model operations (formerly called Dataset)
	// SEMANTICMODEL_READ: 'https://api.fabric.microsoft.com/SemanticModel.Read.All',
	SEMANTICMODEL_READWRITE: 'https://api.fabric.microsoft.com/SemanticModel.ReadWrite.All',
	// SEMANTICMODEL_EXECUTE: 'https://api.fabric.microsoft.com/SemanticModel.Execute.All',
	// SEMANTICMODEL_RESHARE: 'https://api.fabric.microsoft.com/SemanticModel.Reshare.All',

	// Dataflow operations
	// DATAFLOW_READ: 'https://api.fabric.microsoft.com/Dataflow.Read.All',
	// DATAFLOW_READWRITE: 'https://api.fabric.microsoft.com/Dataflow.ReadWrite.All',
	// DATAFLOW_RESHARE: 'https://api.fabric.microsoft.com/Dataflow.Reshare.All',

	// Data Pipeline operations
	// DATAPIPELINE_READ: 'https://api.fabric.microsoft.com/DataPipeline.Read.All',
	DATAPIPELINE_READWRITE: 'https://api.fabric.microsoft.com/DataPipeline.ReadWrite.All',
	// DATAPIPELINE_EXECUTE: 'https://api.fabric.microsoft.com/DataPipeline.Execute.All',
	// DATAPIPELINE_RESHARE: 'https://api.fabric.microsoft.com/DataPipeline.Reshare.All',

	// KQL Database operations
	// KQLDATABASE_READ: 'https://api.fabric.microsoft.com/KQLDatabase.Read.All',
	// KQLDATABASE_READWRITE: 'https://api.fabric.microsoft.com/KQLDatabase.ReadWrite.All',
	// KQLDATABASE_EXECUTE: 'https://api.fabric.microsoft.com/KQLDatabase.Execute.All',
	// KQLDATABASE_RESHARE: 'https://api.fabric.microsoft.com/KQLDatabase.Reshare.All',

	// ML Model operations
	// MLMODEL_READ: 'https://api.fabric.microsoft.com/MLModel.Read.All',
	// MLMODEL_READWRITE: 'https://api.fabric.microsoft.com/MLModel.ReadWrite.All',
	// MLMODEL_EXECUTE: 'https://api.fabric.microsoft.com/MLModel.Execute.All',
	// MLMODEL_RESHARE: 'https://api.fabric.microsoft.com/MLModel.Reshare.All',

	// ML Experiment operations
	// MLEXPERIMENT_READ: 'https://api.fabric.microsoft.com/MLExperiment.Read.All',
	// MLEXPERIMENT_READWRITE: 'https://api.fabric.microsoft.com/MLExperiment.ReadWrite.All',
	// MLEXPERIMENT_RESHARE: 'https://api.fabric.microsoft.com/MLExperiment.Reshare.All',

	// Code operations for Spark and compute scenarios
	// CODE_ACCESS_STORAGE: 'https://api.fabric.microsoft.com/Code.AccessStorage.All',
	// CODE_ACCESS_KEYVAULT: 'https://api.fabric.microsoft.com/Code.AccessAzureKeyvault.All',
	// CODE_ACCESS_DATA_EXPLORER: 'https://api.fabric.microsoft.com/Code.AccessAzureDataExplorer.All',
	// CODE_ACCESS_DATA_LAKE: 'https://api.fabric.microsoft.com/Code.AccessAzureDataLake.All',
	// CODE_ACCESS_FABRIC: 'https://api.fabric.microsoft.com/Code.AccessFabric.All',

	// Connection operations
	CONNECTION_READ: 'https://api.fabric.microsoft.com/Connection.Read.All',
	// CONNECTION_READWRITE: 'https://api.fabric.microsoft.com/Connection.ReadWrite.All',

	EXTEND: 'https://api.fabric.microsoft.com/Fabric.Extend',
};

/**
 * Azure Storage scopes - separate resource, cannot be mixed with Fabric API scopes
 * Must be requested in a separate token request
 */
export const AZURE_STORAGE_SCOPES = {
	USER_IMPERSONATION: 'https://storage.azure.com/user_impersonation',
};
