﻿-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE EXTERNAL TABLE [External].[IATITitle]
(
	[iati-identifier] 	NVARCHAR(50) 	NOT NULL,
	[title_narrative] 	NVARCHAR(4000) 		NULL
)
WITH
( 
    LOCATION = '/RAW/IATI/Title/',
    DATA_SOURCE = ExternalDataSourceADLS,
    FILE_FORMAT = ExternalFileFormatParquet,
    REJECT_TYPE = VALUE,
    REJECT_VALUE = 0
);
