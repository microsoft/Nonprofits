-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE EXTERNAL TABLE [External].[IATIParticipatingOrganisation]
(
	[iati-identifier]			NVARCHAR(50) 	NOT NULL,
    [participating-org]			NVARCHAR(100) 		NULL,
    [participating-org_role]	NVARCHAR(100) 		NULL,
    [participating-org_type]	NVARCHAR(100) 		NULL,
    [participating-org_ref]		NVARCHAR(100) 		NULL
)			
WITH
( 
    LOCATION = '/RAW/IATI/ParticipatingOrganisation/',
    DATA_SOURCE = ExternalDataSourceADLS,
    FILE_FORMAT = ExternalFileFormatParquet,
    REJECT_TYPE = VALUE,
    REJECT_VALUE = 0
);