-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE PROC [Persisted].[ObtainDescription] AS
-- ==============================================================================================================
-- Author:	Adatis
-- Description:	Performs a full data load. Incremental loads are not supported in this script
--	A Scratch Table is a temporary table used to store the data and remove duplicates. It is used instead of CTEs because it is more performante and reliable
--	We use CTAS as a work around for unsupported features, namely; Merge Statements & Joins on UPDATES/DELETES.
--  Although Insert/Update is a more performant approach, for simplicity, an alternative to MERGE is applied
-- ==============================================================================================================
BEGIN

	BEGIN TRY
		
		IF OBJECT_ID ('Scratch.Description','U') IS NOT NULL 
			DROP TABLE [Scratch].[Description];

		-- RE-CREATE CTAS AND POPULATE WITH NEW VALUES
		CREATE TABLE [Scratch].[Description]
		WITH
		(
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS
		SELECT 
			[DescriptionChangeHash]
			,[IatiIdentifier]
			,[DescriptionNarrative]
		FROM	
		-- CREATE A CHANGE HASH COLUMN TO COMPARE WITH EXISTING RECORDS IN THE PERSISTED TABLE
		(
			SELECT 
				HASHBYTES('SHA2_256', CONCAT_WS('|', 
										ISNULL(UPPER([iati-identifier]),'UKNNOWN'),			
										ISNULL(UPPER([description_narrative]),'UNKNOWN')
										))	AS [DescriptionChangeHash]
				,[iati-identifier]			AS [IatiIdentifier]
				,[description_narrative]	AS [DescriptionNarrative]
			FROM 
			(		
				-- APPLY ROW NUMBER TO REMOVE DUPLICATES AND ONLY SELECT THE MOST RECENT RECORDS
				SELECT DISTINCT
					[iati-identifier]
					,[description_narrative]
					,ROW_NUMBER() OVER(PARTITION BY [iati-identifier] ORDER BY [iati-identifier] DESC) AS RowOrdinal
	    		FROM [External].[IATIDescription]	 
			) A
			WHERE RowOrdinal = 1
		) B
		OPTION(LABEL = 'Scratch.Description.Obtain');


		-- GET THE MAX IDENTITY KEY FROM THE PERSISTED TABLE
		DECLARE @maxKey INT = (SELECT ISNULL(MAX(DescriptionKey),0) FROM [Persisted].[Description])

		-- CREATE A TEMP TABLE USING CTAS TO HANDLE MERGE OPERATIONS
		CREATE TABLE [Persisted].[Description_Upsert]
		WITH
		(	
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS

		-- NEW ROWS AND NEW VERSIONS OF ROWS
		SELECT 
			ROW_NUMBER() OVER(ORDER BY [DescriptionChangeHash] DESC) + @maxKey AS  DescriptionKey
			,S.[DescriptionChangeHash]
			,S.[IatiIdentifier]
			,S.[DescriptionNarrative]
			,GETDATE() AS [InsertedDate]
		FROM [Scratch].[Description] AS S
		UNION ALL
		-- KEEP ROWS THAT ARE NOT BEING TOUCHED
		SELECT 
			P.DescriptionKey
			,P.[DescriptionChangeHash]
			,P.[IatiIdentifier]
			,P.[DescriptionNarrative]
			,GETDATE() AS [InsertedDate]
		FROM [Persisted].[Description] AS P
		WHERE NOT EXISTS
		(
			SELECT *
			FROM [Scratch].[Description] S
			WHERE S.[DescriptionChangeHash] = P.[DescriptionChangeHash]
		)
		OPTION(LABEL = 'Persisted.Description.Obtain');

		-- KEEP LATEST CTAS AND DELETE PREVIOUS ONE
		RENAME OBJECT [Persisted].[Description]			TO [Description_old];
		RENAME OBJECT [Persisted].[Description_Upsert]	TO [Description];
		DROP TABLE [Persisted].[Description_old];
		

	END TRY

	BEGIN CATCH
		--CTAS FAILED, MARK PROCESS AS FAILED AND THROW ERROR
		DECLARE @ErrorMsg	VARCHAR(250)
		SET @ErrorMsg = 'Error loading table Persisted.Description: ' + ERROR_MESSAGE()
		RAISERROR (@ErrorMsg, 16, 1)
	END CATCH

END