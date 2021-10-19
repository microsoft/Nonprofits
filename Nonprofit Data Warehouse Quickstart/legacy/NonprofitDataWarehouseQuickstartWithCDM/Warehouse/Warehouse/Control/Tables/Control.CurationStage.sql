-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.


CREATE TABLE [Control].[CurationStage] 
(
    [CurationStageId]	INT IDENTITY (1, 1) NOT NULL PRIMARY KEY NONCLUSTERED NOT ENFORCED,
	[CurationStageCode] VARCHAR (10)        NOT NULL
)
WITH (DISTRIBUTION = ROUND_ROBIN, HEAP)

