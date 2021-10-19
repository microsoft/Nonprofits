-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE TABLE [Persisted].[ReportingOrganisation]
(
	[ReportingOrganisationKey]		    INT     		NOT NULL,
    [ReportingOrganisationChangeHash]	BINARY(32)		NOT NULL,
	[IatiIdentifier]				    NVARCHAR(50) 	NOT NULL,
    [ReportingOrgRef]				    NVARCHAR(100) 		NULL,
    [ReportingOrg]					    NVARCHAR(100) 		NULL,
    [ReportingOrgType]				    NVARCHAR(100) 		NULL,
    [ReportingOrgSecondaryReporter]	    NVARCHAR(5) 		NULL,
	[InsertedDate]					    DATETIME2(7)		NULL	
)
WITH
( CLUSTERED COLUMNSTORE INDEX
, DISTRIBUTION = ROUND_ROBIN
);