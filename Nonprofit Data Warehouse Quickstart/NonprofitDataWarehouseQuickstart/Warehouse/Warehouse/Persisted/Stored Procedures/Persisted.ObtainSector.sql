-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE PROC [Persisted].[ObtainSector] AS
-- ==============================================================================================================
-- Author:	Adatis
-- Description:	Performs a full data load. Incremental loads are not supported in this script
--	A Scratch Table is a temporary table used to store the data and remove duplicates. It is used instead of CTEs because it is more performante and reliable
--	We use CTAS as a work around for unsupported features, namely; Merge Statements & Joins on UPDATES/DELETES.
--  Although Insert/Update is a more performant approach, for simplicity, an alternative to MERGE is applied
-- ==============================================================================================================
BEGIN

	BEGIN TRY
		
		IF OBJECT_ID ('Scratch.Sector','U') IS NOT NULL 
			DROP TABLE [Scratch].[Sector];

		-- RE-CREATE CTAS AND POPULATE WITH NEW VALUES
		CREATE TABLE [Scratch].[Sector]
		WITH
		(
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS
		SELECT 
			[SectorChangeHash]
			,[IatiIdentifier]
			,[Name]
			,[SectorCode]
			,[CategoryName]
			,[SectorPercentage]
		FROM	
		-- CREATE A CHANGE HASH COLUMN TO COMPARE WITH EXISTING RECORDS IN THE PERSISTED TABLE
		(
			SELECT 
				HASHBYTES('SHA2_256', CONCAT_WS('|', 
										ISNULL(UPPER([iati-identifier]),'UKNNOWN'),			
										ISNULL(UPPER([name]),'UKNNOWN'),
										ISNULL(UPPER([sector_code]),'UKNNOWN'),										
										ISNULL(UPPER([category-name]),'UKNNOWN'),
										ISNULL(UPPER([sector_percentage]),0)
										))					AS [SectorChangeHash]
				,[iati-identifier]							AS [IatiIdentifier]
				,[name]										AS [Name]
				,[sector_code]								AS [SectorCode]
				,[category-name]							AS [CategoryName]
				,CAST([sector_percentage] AS DECIMAL(18,4))	AS [SectorPercentage]
			FROM
			(		
				-- APPLY ROW NUMBER TO REMOVE DUPLICATES AND ONLY SELECT THE MOST RECENT RECORDS
				SELECT DISTINCT
					[iati-identifier]
					,[name]				
					,[sector_code]
					,[category-name]
					,[sector_percentage]
					,ROW_NUMBER() OVER(PARTITION BY [iati-identifier], [sector_code] ORDER BY [iati-identifier] DESC) AS RowOrdinal
	    		FROM [External].[IATISector]
			) A
			WHERE RowOrdinal = 1
		) B
		OPTION(LABEL = 'Scratch.Sector.Obtain');


		-- GET THE MAX IDENTITY KEY FROM THE PERSISTED TABLE
		DECLARE @maxKey INT = (SELECT ISNULL(MAX(SectorKey),0) FROM [Persisted].[Sector])

		-- CREATE A TEMP TABLE USING CTAS TO HANDLE MERGE OPERATIONS
		CREATE TABLE [Persisted].[Sector_Upsert]
		WITH
		(	
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS

		-- NEW ROWS AND NEW VERSIONS OF ROWS
		SELECT 
			ROW_NUMBER() OVER(ORDER BY [SectorChangeHash] DESC) + @maxKey AS  SectorKey
			,S.[SectorChangeHash]
			,S.[IatiIdentifier]
			,S.[Name]
			,S.[SectorCode]
			,S.[CategoryName]
			,S.[SectorPercentage]
			,GETDATE() AS [InsertedDate]
		FROM [Scratch].[Sector] AS S
		UNION ALL
		-- KEEP ROWS THAT ARE NOT BEING TOUCHED
		SELECT 
			P.SectorKey
			,P.[SectorChangeHash]
			,P.[IatiIdentifier]
			,P.[Name]
			,P.[SectorCode]
			,P.[CategoryName]
			,P.[SectorPercentage]
			,GETDATE() AS [InsertedDate]
		FROM [Persisted].[Sector] AS P
		WHERE NOT EXISTS
		(
			SELECT *
			FROM [Scratch].[Sector] S
			WHERE S.[SectorChangeHash] = P.[SectorChangeHash]
		)
		OPTION(LABEL = 'Persisted.Sector.Obtain');

		-- KEEP LATEST CTAS AND DELETE PREVIOUS ONE
		RENAME OBJECT [Persisted].[Sector]			TO [Sector_old];
		RENAME OBJECT [Persisted].[Sector_Upsert]	TO [Sector];
		DROP TABLE [Persisted].[Sector_old];
		

	END TRY

	BEGIN CATCH
		--CTAS FAILED, MARK PROCESS AS FAILED AND THROW ERROR
		DECLARE @ErrorMsg	VARCHAR(250)
		SET @ErrorMsg = 'Error loading table Persisted.Sector: ' + ERROR_MESSAGE()
		RAISERROR (@ErrorMsg, 16, 1)
	END CATCH

END
