-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE TABLE [Audit].[PipelineLoad] (
    [LoadId]				INT	IDENTITY (1, 1) NOT NULL PRIMARY KEY NONCLUSTERED NOT ENFORCED,
    [PipelineRunId]			VARCHAR (50)	        NULL,
    [Environment]           VARCHAR (10)	        NULL,
    [PipelineName]			VARCHAR (200)	        NULL,
    [PipelineInfo]			VARCHAR (1000)	        NULL,
    [PipelineStatusTypeId]	INT				    NOT NULL,
	[EntityId]				INT				        NULL,
    [StartTime]				DATETIME		    NOT NULL,
    [EndTime]				DATETIME		        NULL,
    [Duration]				INT				        NULL
)
WITH (DISTRIBUTION = ROUND_ROBIN, CLUSTERED COLUMNSTORE INDEX)



