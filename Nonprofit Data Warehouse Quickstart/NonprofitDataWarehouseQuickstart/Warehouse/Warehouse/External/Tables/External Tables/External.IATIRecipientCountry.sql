-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE EXTERNAL TABLE [External].[IATIRecipientCountry]
(
	[iati-identifier] 				NVARCHAR(50) 	NOT NULL,
	[recipient-country_code] 		NVARCHAR(100) 		NULL,
	[recipient-country_percentage] 	NVARCHAR(100) 		NULL,
	[recipient-country] 			NVARCHAR(4000) 		NULL

)
WITH
( 
    LOCATION = '/RAW/IATI/RecipientCountry/',
    DATA_SOURCE = ExternalDataSourceADLS,
    FILE_FORMAT = ExternalFileFormatParquet,
    REJECT_TYPE = VALUE,
    REJECT_VALUE = 0
);
