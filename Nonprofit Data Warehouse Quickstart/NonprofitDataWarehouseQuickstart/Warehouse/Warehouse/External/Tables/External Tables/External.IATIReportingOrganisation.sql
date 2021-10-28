-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE EXTERNAL TABLE [External].[IATIReportingOrganisation]
(
	[iati-identifier]					NVARCHAR(50) 	NOT NULL,
    [reporting-org_ref]					NVARCHAR(100) 		NULL,
    [reporting-org]						NVARCHAR(100) 		NULL,
    [reporting-org_type]				NVARCHAR(100) 		NULL,
    [reporting-org_secondary-reporter]	NVARCHAR(5) 		NULL	
)
WITH
( 
    LOCATION = '/RAW/IATI/ReportingOrganisation/',
    DATA_SOURCE = ExternalDataSourceADLS,
    FILE_FORMAT = ExternalFileFormatParquet,
    REJECT_TYPE = VALUE,
    REJECT_VALUE = 0
);
