-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE TABLE [Persisted].[Sector]
(	
	[SectorKey]			INT     		NOT NULL, 
    [SectorChangeHash]	BINARY(32)		NOT NULL, 
	[IatiIdentifier]	NVARCHAR(50)	NOT NULL,
    [Name]				NVARCHAR(4000)		NULL,
    [SectorCode]		NVARCHAR(50)		NULL,
    [CategoryName]		NVARCHAR(100)		NULL,
    [SectorPercentage]	DECIMAL(18,4) 		NULL,
	[InsertedDate]		DATETIME2(7)		NULL
)
WITH
( CLUSTERED COLUMNSTORE INDEX
, DISTRIBUTION = ROUND_ROBIN
);