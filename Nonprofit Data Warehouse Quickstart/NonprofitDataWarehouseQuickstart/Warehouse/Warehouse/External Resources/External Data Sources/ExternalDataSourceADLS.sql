-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

-- CREATE AN EXTERNAL DATA SOURCE
-- TYPE: HADOOP - PolyBase uses Hadoop APIs to access data in Azure Data Lake Storage.
-- LOCATION: Provide Data Lake Storage Gen2 account name and URI 
-- CREDENTIAL: Provide the credential created in the previous step.
--
-- SQLCMD Mode Enabled with StorageRootUri parameter defined like below
-- Variables required to be passed in during the deployment process are:
-- :SETVAR StorageRootUri "abfss://<container>@<accountname>.dfs.core.windows.net"
--

CREATE EXTERNAL DATA SOURCE [ExternalDataSourceADLS] WITH
(  
	TYPE = HADOOP,
	LOCATION = '%STORAGE_ROOT_URI%',
	CREDENTIAL = DatabaseScopedCredentialADLS
)