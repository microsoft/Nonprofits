-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.


CREATE PROC [Persisted].[ObtainTitle] AS
-- ==============================================================================================================
-- Author:	Adatis
-- Description:	Performs a full data load. Incremental loads are not supported in this script
--	A Scratch Table is a temporary table used to store the data and remove duplicates. It is used instead of CTEs because it is more performante and reliable
--	We use CTAS as a work around for unsupported features, namely; Merge Statements & Joins on UPDATES/DELETES.
--  Although Insert/Update is a more performant approach, for simplicity, an alternative to MERGE is applied
-- ==============================================================================================================
BEGIN

	BEGIN TRY
		
		IF OBJECT_ID ('Scratch.Title','U') IS NOT NULL 
			DROP TABLE [Scratch].[Title];

		-- RE-CREATE CTAS AND POPULATE WITH NEW VALUES
		CREATE TABLE [Scratch].[Title]
		WITH
		(
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS
		SELECT 
			[TitleChangeHash]
			,[IatiIdentifier]
			,[TitleNarrative]
		FROM	
		-- CREATE A CHANGE HASH COLUMN TO COMPARE WITH EXISTING RECORDS IN THE PERSISTED TABLE
		(
			SELECT 
				HASHBYTES('SHA2_256', CONCAT_WS('|', 
										ISNULL(UPPER([iati-identifier]),'UKNNOWN'),			
										ISNULL(UPPER([title_narrative]),'UKNNOWN')
										))			AS [TitleChangeHash]
				,[iati-identifier]					AS [IatiIdentifier]
				,[title_narrative]					AS [TitleNarrative]
			FROM
			(		
				-- APPLY ROW NUMBER TO REMOVE DUPLICATES AND ONLY SELECT THE MOST RECENT RECORDS
				SELECT DISTINCT
					[iati-identifier]
					,[title_narrative]
					,ROW_NUMBER() OVER(PARTITION BY [iati-identifier] ORDER BY [iati-identifier] DESC) AS RowOrdinal
	    		FROM [External].[IATITitle]	 
			) A
			WHERE RowOrdinal = 1
		) B
		OPTION(LABEL = 'Scratch.Title.Obtain');


		-- GET THE MAX IDENTITY KEY FROM THE PERSISTED TABLE
		DECLARE @maxKey INT = (SELECT ISNULL(MAX(TitleKey),0) FROM [Persisted].[Title])

		-- CREATE A TEMP TABLE USING CTAS TO HANDLE MERGE OPERATIONS
		CREATE TABLE [Persisted].[Title_Upsert]
		WITH
		(	
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS

		-- NEW ROWS AND NEW VERSIONS OF ROWS
		SELECT 
			ROW_NUMBER() OVER(ORDER BY [TitleChangeHash] DESC) + @maxKey AS  TitleKey
			,S.[TitleChangeHash]
			,S.[IatiIdentifier]
			,S.[TitleNarrative]
			,GETDATE() AS [InsertedDate]
		FROM [Scratch].[Title] AS S
		UNION ALL
		-- KEEP ROWS THAT ARE NOT BEING TOUCHED
		SELECT 
			P.TitleKey
			,P.[TitleChangeHash]
			,P.[IatiIdentifier]
			,P.[TitleNarrative]
			,GETDATE() AS [InsertedDate]
		FROM [Persisted].[Title] AS P
		WHERE NOT EXISTS
		(
			SELECT *
			FROM [Scratch].[Title] S
			WHERE S.[TitleChangeHash] = P.[TitleChangeHash]
		)
		OPTION(LABEL = 'Persisted.Title.Obtain');

		-- KEEP LATEST CTAS AND DELETE PREVIOUS ONE
		RENAME OBJECT [Persisted].[Title]			TO [Title_old];
		RENAME OBJECT [Persisted].[Title_Upsert]	TO [Title];
		DROP TABLE [Persisted].[Title_old];
		

	END TRY

	BEGIN CATCH
		--CTAS FAILED, MARK PROCESS AS FAILED AND THROW ERROR
		DECLARE @ErrorMsg	VARCHAR(250)
		SET @ErrorMsg = 'Error loading table Persisted.Title: ' + ERROR_MESSAGE()
		RAISERROR (@ErrorMsg, 16, 1)
	END CATCH

END