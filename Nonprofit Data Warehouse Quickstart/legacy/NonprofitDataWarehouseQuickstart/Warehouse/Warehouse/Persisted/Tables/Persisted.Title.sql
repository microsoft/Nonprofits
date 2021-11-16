-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE TABLE [Persisted].[Title]
(
	[TitleKey]			INT				NOT NULL,
	[TitleChangeHash]	BINARY(32)		NOT NULL,
	[IatiIdentifier] 	NVARCHAR(50) 	NOT NULL,
	[TitleNarrative] 	NVARCHAR(4000) 		NULL,
	[InsertedDate]		DATETIME2(7)		NULL
)
WITH
( CLUSTERED COLUMNSTORE INDEX
, DISTRIBUTION = ROUND_ROBIN
);