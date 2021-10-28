-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE TABLE [Control].[PipelineStatusType] 
(
    [PipelineStatusTypeId]	 INT IDENTITY (1, 1) NOT NULL PRIMARY KEY NONCLUSTERED NOT ENFORCED,
	[PipelineStatusTypeCode] VARCHAR (10)        NOT NULL,
    [PipelineStatusTypeName] VARCHAR (50)        NOT NULL
)
WITH (DISTRIBUTION = ROUND_ROBIN, HEAP)

