-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE EXTERNAL TABLE [External].[IATITransaction]
(
	[iati-identifier]								NVARCHAR(200) 	NOT NULL,
	[default-currency]								NVARCHAR(200) 		NULL,
	[transaction_aid-type]							NVARCHAR(200) 		NULL,
	[transaction_disbursement-channel]				NVARCHAR(200) 		NULL,
	[transaction_description_narrative]				NVARCHAR(4000) 		NULL,
	[transaction_flow-type]							NVARCHAR(200) 		NULL,
	[transaction_provider-org_provider-activity-id]	NVARCHAR(200) 		NULL,
	[transaction_provider-org_ref]					NVARCHAR(200) 		NULL,
	[transaction-provider-org-type]					NVARCHAR(200) 		NULL,
	[transaction_provider-org]						NVARCHAR(200) 		NULL,
	[transaction_receiver-org_receiver-activity-id]	NVARCHAR(200) 		NULL,	
	[transaction_receiver-org_ref]					NVARCHAR(200) 		NULL,
	[transaction_receiver-org-type]					NVARCHAR(200) 		NULL,
	[transaction_receiver-org]						NVARCHAR(200) 		NULL,
	[transaction-recipient-country]					NVARCHAR(200) 		NULL,
	[transaction_recipient-region]					NVARCHAR(200) 		NULL,
	[transaction-sector]							NVARCHAR(200) 		NULL,
	[transaction-sector-category]					NVARCHAR(200) 		NULL,
	[transaction_tied-status]						NVARCHAR(200) 		NULL,
	[transaction_transaction-date_iso-date]			NVARCHAR(200) 		NULL,
	[transaction-type]								NVARCHAR(200) 		NULL,
	[transaction_value_currency]					NVARCHAR(200) 		NULL,
	[transaction_value-date]						NVARCHAR(200)		NULL,
	[transaction_value]								NVARCHAR(200) 		NULL		
)
WITH
( 
    LOCATION = '/RAW/IATI/Transaction/',
    DATA_SOURCE = ExternalDataSourceADLS,
    FILE_FORMAT = ExternalFileFormatParquet,
    REJECT_TYPE = VALUE,
    REJECT_VALUE = 0
);