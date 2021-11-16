-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE EXTERNAL TABLE [External].[IATIActivityDate]
(
	[iati-identifier]	NVARCHAR(50)	NOT NULL,
    [start-planned]		NVARCHAR(50)   		NULL,
    [end-planned]		NVARCHAR(50)   		NULL,
    [start-actual]		NVARCHAR(50)   		NULL,
    [end-actual]		NVARCHAR(50)   		NULL
) 
WITH
( 
    LOCATION = '/RAW/IATI/ActivityDate/',
    DATA_SOURCE = ExternalDataSourceADLS,
    FILE_FORMAT = ExternalFileFormatParquet,
    REJECT_TYPE = VALUE,
    REJECT_VALUE = 0
);