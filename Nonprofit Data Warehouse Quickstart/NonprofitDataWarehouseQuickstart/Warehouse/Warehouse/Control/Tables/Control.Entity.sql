-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE TABLE [Control].[Entity]
(
	[EntityId]					INT	IDENTITY (1, 1) NOT NULL PRIMARY KEY NONCLUSTERED NOT ENFORCED,
    [EntityCode]				VARCHAR(50)			NOT NULL,
    [EntityName]				VARCHAR(100)		NOT NULL,
	[SourceContainer]			VARCHAR(50)				NULL,
	[SourceFolderPath]			VARCHAR(200)			NULL,
    [SourceFileName]			VARCHAR(75)				NULL,
	[TargetContainer]			VARCHAR(50)				NULL,
	[TargetFolderPath]			VARCHAR(200)			NULL,
    [TargetFileName]			VARCHAR(75)				NULL,
	[TargetSchema]				VARCHAR(50)				NULL,
	[TargetTable]				VARCHAR(50)				NULL,
	[TargetStoredProcedure]		VARCHAR(50)				NULL,
	[SourceSystemId]			INT					NOT NULL,
	[CurationStageId]			INT					NOT NULL,
	[Active]					BIT					NOT NULL
)
WITH (DISTRIBUTION = ROUND_ROBIN, HEAP)


