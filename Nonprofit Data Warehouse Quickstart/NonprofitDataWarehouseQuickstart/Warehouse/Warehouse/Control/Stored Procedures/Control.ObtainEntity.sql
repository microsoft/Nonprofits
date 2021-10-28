-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE PROCEDURE [Control].[ObtainEntity]
	@CurationStageCode	VARCHAR(25),
	@SourceSystemCode	VARCHAR(25),
	@EntityCode			VARCHAR(25)
AS

SET NOCOUNT ON;

BEGIN
	SELECT 
		E.[EntityCode]
		,E.[EntityName]
		,E.[SourceContainer]
		,E.[SourceFolderPath]
		,E.[SourceFileName]
		,E.[TargetContainer]
		,E.[TargetFolderPath]
		,E.[TargetFileName]
		,E.[TargetSchema]
		,E.[TargetTable]
		,E.[TargetStoredProcedure]
		,SS.[SourceSystemCode]
	FROM 
		[Control].[Entity] E
		INNER JOIN [Control].[SourceSystem] SS ON SS.[SourceSystemId] = E.[SourceSystemId]
		INNER JOIN [Control].[CurationStage] CS ON CS.[CurationStageId] = E.[CurationStageId]
	WHERE
		[CurationStageCode] = @CurationStageCode AND
		[Active] = 1 AND
		([EntityCode] = COALESCE(@EntityCode,[EntityCode]) 
		OR [SourceSystemCode] = COALESCE(@SourceSystemCode,[SourceSystemCode]))
END
