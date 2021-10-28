-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE PROC [Persisted].[ObtainRecipientRegion] AS
-- ==============================================================================================================
-- Author:	Adatis
-- Description:	Performs a full data load. Incremental loads are not supported in this script
--	A Scratch Table is a temporary table used to store the data and remove duplicates. It is used instead of CTEs because it is more performante and reliable
--	We use CTAS as a work around for unsupported features, namely; Merge Statements & Joins on UPDATES/DELETES.
--  Although Insert/Update is a more performant approach, for simplicity, an alternative to MERGE is applied
-- ==============================================================================================================
BEGIN

	BEGIN TRY
		
		IF OBJECT_ID ('Scratch.RecipientRegion','U') IS NOT NULL 
			DROP TABLE [Scratch].[RecipientRegion];

		-- RE-CREATE CTAS AND POPULATE WITH NEW VALUES
		CREATE TABLE [Scratch].[RecipientRegion]
		WITH
		(
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS
		SELECT 
			[RecipientRegionChangeHash]
			,[IatiIdentifier]
			,[RecipientRegionCode]
			,[RecipientRegion]
			,[RecipientRegionPercentage]
			,[RecipientRegionVocabulary]		
		FROM	
		-- CREATE A CHANGE HASH COLUMN TO COMPARE WITH EXISTING RECORDS IN THE PERSISTED TABLE
		(
			SELECT 
				HASHBYTES('SHA2_256', CONCAT_WS('|', 
										ISNULL(UPPER([iati-identifier]),'UKNNOWN'),	
										ISNULL(UPPER([recipient-region_code]),'UKNNOWN'),	
										ISNULL(UPPER([recipient-region]),'UKNNOWN'),
										ISNULL(UPPER([recipient-region_percentage]),0),
										ISNULL(UPPER([recipient-region_vocabulary]),'UKNNOWN')
										))								AS [RecipientRegionChangeHash]
				,[iati-identifier]										AS [IatiIdentifier]
				,[recipient-region_code]								AS [RecipientRegionCode]
				,[recipient-region]										AS [RecipientRegion]
				,CAST([recipient-region_percentage]	AS DECIMAL(18,4))	AS [RecipientRegionPercentage]
				,[recipient-region_vocabulary]							AS [RecipientRegionVocabulary]
			FROM 
			(		
				-- APPLY ROW NUMBER TO REMOVE DUPLICATES AND ONLY SELECT THE MOST RECENT RECORDS
				SELECT DISTINCT
					[iati-identifier]
					,[recipient-region_code]
					,[recipient-region]
					,CAST([recipient-region_percentage] AS DECIMAL(18,4)) AS [recipient-region_percentage]
					,[recipient-region_vocabulary]
					,ROW_NUMBER() OVER(PARTITION BY [iati-identifier], [recipient-region_code] ORDER BY [iati-identifier] DESC) AS RowOrdinal
	    		FROM [External].[IATIRecipientRegion]	 
			) A
			WHERE RowOrdinal = 1
		) B
		OPTION(LABEL = 'Scratch.RecipientRegion.Obtain');


		-- GET THE MAX IDENTITY KEY FROM THE PERSISTED TABLE
		DECLARE @maxKey INT = (SELECT ISNULL(MAX(RecipientRegionKey),0) FROM [Persisted].[RecipientRegion])

		-- CREATE A TEMP TABLE USING CTAS TO HANDLE MERGE OPERATIONS
		CREATE TABLE [Persisted].[RecipientRegion_Upsert]
		WITH
		(	
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS

		-- NEW ROWS AND NEW VERSIONS OF ROWS
		SELECT 
			ROW_NUMBER() OVER(ORDER BY [RecipientRegionChangeHash] DESC) + @maxKey AS  RecipientRegionKey
			,S.[RecipientRegionChangeHash]
			,S.[IatiIdentifier]
			,S.[RecipientRegionCode]
			,S.[RecipientRegion]
			,S.[RecipientRegionPercentage]
			,S.[RecipientRegionVocabulary]		
			,GETDATE() AS [InsertedDate]
		FROM [Scratch].[RecipientRegion] AS S
		UNION ALL
		-- KEEP ROWS THAT ARE NOT BEING TOUCHED
		SELECT 
			P.RecipientRegionKey
			,P.[RecipientRegionChangeHash]
			,P.[IatiIdentifier]
			,P.[RecipientRegionCode]
			,P.[RecipientRegion]
			,P.[RecipientRegionPercentage]
			,P.[RecipientRegionVocabulary]	
			,GETDATE() AS [InsertedDate]
		FROM [Persisted].[RecipientRegion] AS P
		WHERE NOT EXISTS
		(
			SELECT *
			FROM [Scratch].[RecipientRegion] S
			WHERE S.[RecipientRegionChangeHash] = P.[RecipientRegionChangeHash]
		)
		OPTION(LABEL = 'Persisted.RecipientRegion.Obtain');

		-- KEEP LATEST CTAS AND DELETE PREVIOUS ONE
		RENAME OBJECT [Persisted].[RecipientRegion]			TO [RecipientRegion_old];
		RENAME OBJECT [Persisted].[RecipientRegion_Upsert]	TO [RecipientRegion];
		DROP TABLE [Persisted].[RecipientRegion_old];
		

	END TRY

	BEGIN CATCH
		--CTAS FAILED, MARK PROCESS AS FAILED AND THROW ERROR
		DECLARE @ErrorMsg	VARCHAR(250)
		SET @ErrorMsg = 'Error loading table Persisted.RecipientRegion: ' + ERROR_MESSAGE()
		RAISERROR (@ErrorMsg, 16, 1)
	END CATCH

END