-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE TABLE [Persisted].[ActivityDate]
(
	[ActivityDateKey]	        INT 	        NOT NULL,
    [ActivityDateChangeHash]	BINARY(32)		NOT NULL,
	[IatiIdentifier]	        NVARCHAR(50)	NOT NULL,
    [StartPlanned]		        DATETIME2(7)		NULL,
    [EndPlanned]		        DATETIME2(7)		NULL,
    [StartActual]		        DATETIME2(7)		NULL,
    [EndActual]			        DATETIME2(7)		NULL,
	[InsertedDate]		        DATETIME2(7)		NULL
) 
WITH
( CLUSTERED COLUMNSTORE INDEX
, DISTRIBUTION = ROUND_ROBIN
);