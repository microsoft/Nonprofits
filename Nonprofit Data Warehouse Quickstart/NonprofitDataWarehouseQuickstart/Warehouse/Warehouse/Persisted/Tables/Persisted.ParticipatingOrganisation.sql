-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE TABLE [Persisted].[ParticipatingOrganisation]
(
	[ParticipatingOrganisationKey]	        INT     		NOT NULL,
    [ParticipatingOrganisationChangeHash]	BINARY(32)		NOT NULL,
	[IatiIdentifier]				        NVARCHAR(50) 	NOT NULL,
    [ParticipatingOrg]				        NVARCHAR(100) 		NULL,
    [ParticipatingOrgRole]			        NVARCHAR(100) 		NULL,
    [ParticipatingOrgType]			        NVARCHAR(100) 		NULL,
    [ParticipatingOrgRef]			        NVARCHAR(100) 		NULL,
	[InsertedDate]					        DATETIME2(7)		NULL
)			
WITH
( CLUSTERED COLUMNSTORE INDEX
, DISTRIBUTION = ROUND_ROBIN
);
