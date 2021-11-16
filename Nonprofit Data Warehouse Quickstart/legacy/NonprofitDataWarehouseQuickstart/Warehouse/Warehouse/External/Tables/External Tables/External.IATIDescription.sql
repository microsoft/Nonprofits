-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE EXTERNAL TABLE [External].[IATIDescription]
(
	[iati-identifier] 			NVARCHAR(50) 		NOT NULL,
	[description_narrative] 	NVARCHAR(4000) 		NULL
)
WITH
( 
    LOCATION = '/RAW/IATI/Description/',
    DATA_SOURCE = ExternalDataSourceADLS,
    FILE_FORMAT = ExternalFileFormatParquet,
    REJECT_TYPE = VALUE,
    REJECT_VALUE = 0
);
