-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE EXTERNAL TABLE [External].[IATIActivityStatus]
(
	[iati-identifier]					NVARCHAR(50) 		NOT NULL,
    [activity-status]					NVARCHAR(50) 			NULL,
    [activity-status_description]		NVARCHAR(100) 			NULL
)
WITH
( 
    LOCATION = '/RAW/IATI/ActivityStatus/',
    DATA_SOURCE = ExternalDataSourceADLS,
    FILE_FORMAT = ExternalFileFormatParquet,
    REJECT_TYPE = VALUE,
    REJECT_VALUE = 0
);
