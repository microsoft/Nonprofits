-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE EXTERNAL TABLE [External].[IATIBudget]
(
	[iati-identifier]					NVARCHAR(50) 		NOT NULL,
    [budget_type]						NVARCHAR(100) 			NULL,
    [budget_period-start_iso-date]		NVARCHAR(50) 			NULL,
    [budget_period-end_iso-date]		NVARCHAR(50) 			NULL,
    [budget_value_currency]				NVARCHAR(100) 			NULL,
    [budget_value-date]					NVARCHAR(50) 			NULL,
    [budget_value]						NVARCHAR(50)			NULL
)
WITH
( 
    LOCATION = '/RAW/IATI/Budget/',
    DATA_SOURCE = ExternalDataSourceADLS,
    FILE_FORMAT = ExternalFileFormatParquet,
    REJECT_TYPE = VALUE,
    REJECT_VALUE = 0
);
