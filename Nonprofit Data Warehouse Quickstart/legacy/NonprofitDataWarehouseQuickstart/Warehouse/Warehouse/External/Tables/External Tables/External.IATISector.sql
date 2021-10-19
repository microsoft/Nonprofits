-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE EXTERNAL TABLE [External].[IATISector]
(	
	[iati-identifier]	NVARCHAR(100)	NOT NULL,
    [name]				NVARCHAR(4000)		NULL,
    [sector_code]		NVARCHAR(100)		NULL,
    [category-name]		NVARCHAR(100)		NULL,
    [sector_percentage]	NVARCHAR(100)   		NULL
)
WITH
( 
    LOCATION = '/RAW/IATI/Sector/',
    DATA_SOURCE = ExternalDataSourceADLS,
    FILE_FORMAT = ExternalFileFormatParquet,
    REJECT_TYPE = VALUE,
    REJECT_VALUE = 0
);