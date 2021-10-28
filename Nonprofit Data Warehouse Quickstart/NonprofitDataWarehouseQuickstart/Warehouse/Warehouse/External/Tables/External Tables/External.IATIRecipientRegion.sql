-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE EXTERNAL TABLE [External].[IATIRecipientRegion]
(
	[iati-identifier]				NVARCHAR(50) 	NOT NULL,
    [recipient-region_code]			NVARCHAR(100) 		NULL,
    [recipient-region]				NVARCHAR(4000) 		NULL,
    [recipient-region_percentage]	NVARCHAR(50) 		NULL,
    [recipient-region_vocabulary]	NVARCHAR(100) 		NULL
)
WITH
( 
    LOCATION = '/RAW/IATI/RecipientRegion/',
    DATA_SOURCE = ExternalDataSourceADLS,
    FILE_FORMAT = ExternalFileFormatParquet,
    REJECT_TYPE = VALUE,
    REJECT_VALUE = 0
);
