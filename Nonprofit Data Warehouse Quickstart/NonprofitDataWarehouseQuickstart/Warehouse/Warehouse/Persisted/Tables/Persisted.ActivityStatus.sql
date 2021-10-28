-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE TABLE  [Persisted].[ActivityStatus]
(
	[ActivityStatusKey]			INT				NOT NULL,
	[ActivityStatusChangeHash]	BINARY(32)		NOT NULL,
	[IatiIdentifier]			NVARCHAR(50) 	NOT NULL,
    [ActivityStatus]			NVARCHAR(50) 		NULL,
    [ActivityStatusDescription]	NVARCHAR(100) 		NULL,
	[InsertedDate]				DATETIME2(7)		NULL
)
WITH
( CLUSTERED COLUMNSTORE INDEX
, DISTRIBUTION = ROUND_ROBIN
);