-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE PROC [Persisted].[ObtainSanitation] AS
-- ==============================================================================================================
-- Author:	Adatis
-- Description:	Performs a full data load. Incremental loads are not supported in this script
--	A Scratch Table is a temporary table used to store the data and remove duplicates. It is used instead of CTEs because it is more performante and reliable
--	We use CTAS as a work around for unsupported features, namely; Merge Statements & Joins on UPDATES/DELETES.
--  Although Insert/Update is a more performant approach, for simplicity, an alternative to MERGE is applied
-- ==============================================================================================================
BEGIN

	BEGIN TRY
		
		IF OBJECT_ID ('Scratch.Sanitation','U') IS NOT NULL 
			DROP TABLE [Scratch].[Sanitation];

		-- RE-CREATE CTAS AND POPULATE WITH NEW VALUES
		CREATE TABLE [Scratch].[Sanitation]
		WITH
		(
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS
		SELECT 
			[SanitationChangeHash]
			,[GhoCode]
			,[GhoDisplay]
			,[GhoUrl]
			,[PublishStateCode]
			,[PublishStateDisplay]
			,[YearCode]
			,[YearDisplay]
			,[RegionCode]
			,[RegionDisplay]	
			,[CountryCode]
			,[CountryDisplay]
			,[ResidenceAreaTypeCode]
			,[ResidenceAreaTypeDisplay]
			,[DisplayValue]
			,[Numeric]
		FROM	
		-- CREATE A CHANGE HASH COLUMN TO COMPARE WITH EXISTING RECORDS IN THE PERSISTED TABLE
		(
			SELECT 
				HASHBYTES('SHA2_256', CONCAT_WS('|', 
										ISNULL(UPPER([GHO_CODE]), 'UNKNOWN'),
										ISNULL(UPPER([GHO_DISPLAY]),'UKNNOWN'),
										ISNULL(UPPER([GHO_URL]),'UKNNOWN'),
										ISNULL(UPPER([PUBLISHSTATE_CODE]),'UKNNOWN'),
										ISNULL(UPPER([PUBLISHSTATE_DISPLAY]),'UKNNOWN'),
										ISNULL([YEAR_CODE], 0),
										ISNULL([YEAR_DISPLAY],0),
										ISNULL(UPPER([REGION_CODE]),'UKNNOWN'),
										ISNULL(UPPER([REGION_DISPLAY]),'UKNNOWN'),
										ISNULL(UPPER([COUNTRY_DISPLAY]),'UKNNOWN'),		
										ISNULL(UPPER([RESIDENCEAREATYPE_DISPLAY]),'UKNNOWN'),										
										ISNULL(UPPER([Display_Value]),0),
										ISNULL([Numeric], 0)
										))			AS [SanitationChangeHash]
				,[GHO_CODE]							AS [GhoCode]
				,[GHO_DISPLAY]						AS [GhoDisplay]
				,[GHO_URL]							AS [GhoUrl]
				,[PUBLISHSTATE_CODE]				AS [PublishStateCode]
				,[PUBLISHSTATE_DISPLAY]				AS [PublishStateDisplay]
				,CAST([YEAR_CODE] AS INT)			AS [YearCode]
				,CAST([YEAR_DISPLAY] AS INT)		AS [YearDisplay]
				,[REGION_CODE]						AS [RegionCode]
				,[REGION_DISPLAY]					AS [RegionDisplay]
				,[COUNTRY_CODE]						AS [CountryCode]
				,[COUNTRY_DISPLAY]					AS [CountryDisplay]
				,[RESIDENCEAREATYPE_CODE]			AS [ResidenceAreaTypeCode]
				,[RESIDENCEAREATYPE_DISPLAY]		AS [ResidenceAreaTypeDisplay]
				,CAST([Display_Value] AS INT)		AS [DisplayValue]
				,CAST([Numeric] AS DECIMAL(9,5))	AS [Numeric]
			FROM
			(		
				-- APPLY ROW NUMBER TO REMOVE DUPLICATES AND ONLY SELECT THE MOST RECENT RECORDS
				SELECT DISTINCT
					[GHO_CODE]
					,[GHO_DISPLAY]
					,[GHO_URL]
					,[PUBLISHSTATE_CODE]
					,[PUBLISHSTATE_DISPLAY]
					,[PUBLISHSTATE_URL]
					,[YEAR_CODE]	
					,[YEAR_DISPLAY]
					,[YEAR_URL]
					,[REGION_CODE]
					,[REGION_DISPLAY]	
					,[REGION_URL]
					,[COUNTRY_CODE]
					,[COUNTRY_DISPLAY]
					,[COUNTRY_URL]
					,[RESIDENCEAREATYPE_CODE]
					,[RESIDENCEAREATYPE_DISPLAY]
					,[RESIDENCEAREATYPE_URL]
					,[Display_Value]
					,[Numeric]
					,[Low]
					,[High]
					,[StdErr]
					,[StdDev]
					,[Comments]
					,ROW_NUMBER() OVER(PARTITION BY [GHO_CODE], [PUBLISHSTATE_CODE], [YEAR_CODE], [REGION_CODE], [COUNTRY_CODE], [RESIDENCEAREATYPE_CODE] ORDER BY [YEAR_CODE], [COUNTRY_CODE] DESC) AS RowOrdinal
	    		FROM [External].[WHOSanitation]	 
			) A
			WHERE RowOrdinal = 1
		) B
		OPTION(LABEL = 'Scratch.Sanitation.Obtain');


		-- GET THE MAX IDENTITY KEY FROM THE PERSISTED TABLE
		DECLARE @maxKey INT = (SELECT ISNULL(MAX(SanitationKey),0) FROM [Persisted].[Sanitation])

		-- CREATE A TEMP TABLE USING CTAS TO HANDLE MERGE OPERATIONS
		CREATE TABLE [Persisted].[Sanitation_Upsert]
		WITH
		(	
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS

		-- NEW ROWS AND NEW VERSIONS OF ROWS
		SELECT 
			ROW_NUMBER() OVER(ORDER BY [SanitationChangeHash] DESC) + @maxKey AS  SanitationKey
			,S.[SanitationChangeHash]
			,S.[GhoCode]
			,S.[GhoDisplay]
			,S.[GhoUrl]
			,S.[PublishStateCode]
			,S.[PublishStateDisplay]
			,S.[YearCode]
			,S.[YearDisplay]
			,S.[RegionCode]
			,S.[RegionDisplay]	
			,S.[CountryCode]
			,S.[CountryDisplay]
			,S.[ResidenceAreaTypeCode]
			,S.[ResidenceAreaTypeDisplay]
			,S.[DisplayValue]
			,S.[Numeric]
			,GETDATE() AS [InsertedDate]
		FROM [Scratch].[Sanitation] AS S
		UNION ALL
		-- KEEP ROWS THAT ARE NOT BEING TOUCHED
		SELECT 
			P.SanitationKey
			,P.[SanitationChangeHash]
			,P.[GhoCode]
			,P.[GhoDisplay]
			,P.[GhoUrl]
			,P.[PublishStateCode]
			,P.[PublishStateDisplay]
			,P.[YearCode]
			,P.[YearDisplay]
			,P.[RegionCode]
			,P.[RegionDisplay]	
			,P.[CountryCode]
			,P.[CountryDisplay]
			,P.[ResidenceAreaTypeCode]
			,P.[ResidenceAreaTypeDisplay]
			,P.[DisplayValue]
			,P.[Numeric]
			,GETDATE() AS [InsertedDate]
		FROM [Persisted].[Sanitation] AS P
		WHERE NOT EXISTS
		(
			SELECT *
			FROM [Scratch].[Sanitation] S
			WHERE S.[SanitationChangeHash] = P.[SanitationChangeHash]
		)
		OPTION(LABEL = 'Persisted.Sanitation.Obtain');

		-- KEEP LATEST CTAS AND DELETE PREVIOUS ONE
		RENAME OBJECT [Persisted].[Sanitation]			TO [Sanitation_old];
		RENAME OBJECT [Persisted].[Sanitation_Upsert]	TO [Sanitation];
		DROP TABLE [Persisted].[Sanitation_old];
		

	END TRY

	BEGIN CATCH
		--CTAS FAILED, MARK PROCESS AS FAILED AND THROW ERROR
		DECLARE @ErrorMsg	VARCHAR(250)
		SET @ErrorMsg = 'Error loading table Persisted.Sanitation: ' + ERROR_MESSAGE()
		RAISERROR (@ErrorMsg, 16, 1)
	END CATCH

END
