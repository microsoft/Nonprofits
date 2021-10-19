-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE TABLE [Persisted].[RecipientRegion]
(
	[RecipientRegionKey]		INT     		NOT NULL,
    [RecipientRegionChangeHash]	BINARY(32)		NOT NULL,
	[IatiIdentifier]			NVARCHAR(50) 	NOT NULL,
    [RecipientRegionCode]		NVARCHAR(100) 		NULL,
    [RecipientRegion]			NVARCHAR(4000) 		NULL,
    [RecipientRegionPercentage]	DECIMAL(18,4) 		NULL,
    [RecipientRegionVocabulary]	NVARCHAR(100) 		NULL,
	[InsertedDate]				DATETIME2(7)		NULL
)
WITH
( CLUSTERED COLUMNSTORE INDEX
, DISTRIBUTION = ROUND_ROBIN
);