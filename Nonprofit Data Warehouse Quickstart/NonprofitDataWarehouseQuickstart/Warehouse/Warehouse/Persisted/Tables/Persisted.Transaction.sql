-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE TABLE [Persisted].[Transaction]
(
	[TransactionKey]								INT				NOT NULL, 
	[TransactionChangeHash]							BINARY(32)		NOT NULL, 
	[IatiIdentifier]								NVARCHAR(50) 	NOT NULL,
	[DefaultCurrency]								NVARCHAR(10) 		NULL,
	[TransactionAidType]							NVARCHAR(100) 		NULL,
	[TransactionDisbursementChannel]				NVARCHAR(100) 		NULL,
	[TransactionDescriptionNarrative]				NVARCHAR(4000) 		NULL,
	[TransactionFlowType]							NVARCHAR(100) 		NULL,
	[TransactionProviderOrgProviderActivityId]		NVARCHAR(100) 		NULL,
	[TransactionProviderOrgRef]						NVARCHAR(100) 		NULL,
	[TransactionProviderOrgType]					NVARCHAR(100) 		NULL,
	[TransactionProviderOrg]						NVARCHAR(100) 		NULL,
	[TransactionReceiverOrgReceiverActivityId]		NVARCHAR(100) 		NULL,	
	[TransactionReceiverOrgRef]						NVARCHAR(100) 		NULL,
	[TransactionReceiverOrgType]					NVARCHAR(100) 		NULL,
	[TransactionReceiverOrg]						NVARCHAR(100) 		NULL,
	[TransactionRecipientCountry]					NVARCHAR(100) 		NULL,
	[TransactionRecipientRegion]					NVARCHAR(100) 		NULL,
	[TransactionSector]								NVARCHAR(100) 		NULL,
	[TransactionSectorCategory]						NVARCHAR(100) 		NULL,
	[TransactionTiedStatus]							NVARCHAR(100) 		NULL,
	[TransactionIsoDate]							DATETIME2(7) 		NULL,
	[TransactionType]								NVARCHAR(100) 		NULL,
	[TransactionValueCurrency]						NVARCHAR(10) 		NULL,
	[TransactionValueDate]							DATETIME2(7) 		NULL,
	[TransactionValue]								DECIMAL(18,4) 		NULL,
	[InsertedDate]									DATETIME2(7)		NULL		
)
WITH
( CLUSTERED COLUMNSTORE INDEX
, DISTRIBUTION = ROUND_ROBIN
);