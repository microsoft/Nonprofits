-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE TABLE [Persisted].[Description]
(
	[DescriptionKey]		INT				NOT NULL,
	[DescriptionChangeHash]	BINARY(32)		NOT NULL,
	[IatiIdentifier] 		NVARCHAR(50) 	NOT NULL,
	[DescriptionNarrative] 	NVARCHAR(4000) 		NULL,
	[InsertedDate]			DATETIME2(7)		NULL
)
WITH
( CLUSTERED COLUMNSTORE INDEX
, DISTRIBUTION = ROUND_ROBIN
);