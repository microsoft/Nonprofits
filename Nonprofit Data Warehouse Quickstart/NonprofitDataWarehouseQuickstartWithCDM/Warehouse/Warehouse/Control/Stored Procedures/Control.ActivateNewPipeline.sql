-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.


CREATE PROC [Control].[ActivateNewPipeline]
	@PipelineRunId		VARCHAR(50),
	@PipelineName		VARCHAR(200),
	@EntityCode			VARCHAR(50),
	@Environment		VARCHAR(10)
AS

SET NOCOUNT ON;

BEGIN
	
	-- Convert parameters to their ID's etc.
	DECLARE @PipelineStatusTypeId INT, @StartTime [datetime];
	SELECT @PipelineStatusTypeId = PipelineStatusTypeId FROM [Control].PipelineStatusType WHERE [PipelineStatusTypeCode] = 'InProgress';
	SET @StartTime = SYSUTCDATETIME();

	DECLARE @EntityId INT;
	SET @EntityId = (SELECT EntityId From Control.Entity E WHERE E.EntityCode = @EntityCode);

	-- Insert new Pipeline Load
	INSERT INTO [Audit].[PipelineLoad]
		(StartTime, PipelineRunId, PipelineName, PipelineStatusTypeId, EntityId, Environment) 
	VALUES 
		(@StartTime, @PipelineRunId, @PipelineName, @PipelineStatusTypeId, @EntityId, @Environment);

	-- Return new Pipeline Load Id
	SELECT ISNULL(MAX(LoadId),0) + 1 AS LoadId FROM [Audit].[PipelineLoad];
END