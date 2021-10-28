-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE VIEW [Audit].[ExecutionLog]
AS
SELECT
     pl.[LoadId]
    ,pl.[PipelineRunId]
    ,pl.[Environment]
    ,pl.[PipelineName]
    ,pl.[PipelineInfo]
    ,cps.[PipelineStatusTypeName] AS PipelineStatus
	,pl.[EntityId]
    ,pl.[StartTime]
    ,pl.[EndTime]
    ,pl.[Duration]
FROM [Audit].[PipelineLoad] pl
JOIN [Control].[PipelineStatusType] cps 
  ON pl.PipelineStatusTypeId = cps.PipelineStatusTypeId