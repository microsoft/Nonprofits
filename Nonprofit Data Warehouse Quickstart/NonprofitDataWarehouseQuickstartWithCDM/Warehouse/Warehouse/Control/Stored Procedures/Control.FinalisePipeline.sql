-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE PROC [Control].[FinalisePipeline] 
	@PipelineRunId		VARCHAR(50),
	@PipelineInfo		VARCHAR(1000),
	@PipelineStatusType VARCHAR(10),
	@Environment		VARCHAR(10)
AS

SET NOCOUNT ON;

BEGIN

	-- Convert parameters to their ID's etc.
	DECLARE @PipelineStatusTypeId INT, @EndTime [datetime]
	SET @PipelineStatusTypeId = (SELECT PipelineStatusTypeId FROM [Control].PipelineStatusType WHERE [PipelineStatusTypeCode] = @PipelineStatusType)
	SET @EndTime = SYSUTCDATETIME();

	-- Update Pipeline Load
	UPDATE [Audit].[PipelineLoad] 
		SET 
			PipelineStatusTypeId = @PipelineStatusTypeId,
			PipelineInfo = @PipelineInfo,
			EndTime = @EndTime,
			Duration = DateDiff(Second, StartTime, @EndTime),
			Environment = @Environment
	WHERE 
		PipelineRunId = @PipelineRunId

END