-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE PROC [Persisted].[ObtainActivityDate] 
AS
-- ==============================================================================================================
-- Author:	Adatis
-- Description:	Performs a full data load. Incremental loads are not supported in this script
--	A Scratch Table is a temporary table used to store the data and remove duplicates. It is used instead of CTEs because it is more performante and reliable
--	We use CTAS as a work around for unsupported features, namely; Merge Statements & Joins on UPDATES/DELETES.
--  Although Insert/Update is a more performant approach, for simplicity, an alternative to MERGE is applied
-- ==============================================================================================================
BEGIN

	BEGIN TRY

		IF OBJECT_ID ('Scratch.ActivityDate','U') IS NOT NULL 
			DROP TABLE [Scratch].[ActivityDate];

		-- RE-CREATE CTAS AND POPULATE WITH NEW VALUES
		CREATE TABLE [Scratch].[ActivityDate]
		WITH
		(
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS
		SELECT 
			[ActivityDateChangeHash]
			,[IatiIdentifier]
			,[StartPlanned]
			,[EndPlanned]
			,[StartActual]
			,[EndActual]
		FROM	
		-- CREATE A CHANGE HASH COLUMN TO COMPARE WITH EXISTING RECORDS IN THE PERSISTED TABLE
		(
			SELECT 
				HASHBYTES('SHA2_256', CONCAT_WS('|', 
										ISNULL(UPPER([iati-identifier]),'UKNNOWN'),			
										ISNULL(UPPER([start-planned]),'1900-01-01 00:00:00'),
										ISNULL(UPPER([end-planned]),'1900-01-01 00:00:00'),										
										ISNULL(UPPER([start-actual]),'1900-01-01 00:00:00'),
										ISNULL(UPPER([end-actual]),'1900-01-01 00:00:00')
										))
															AS [ActivityDateChangeHash]
				,[iati-identifier]							AS [IatiIdentifier]
				,CAST([start-planned] AS DATETIME2(7))		AS [StartPlanned]
				,CAST([end-planned] AS DATETIME2(7))		AS [EndPlanned]
				,CAST([start-actual] AS DATETIME2(7))		AS [StartActual]
				,CAST([end-actual] AS DATETIME2(7))			AS [EndActual]
			FROM 
			(		
				-- APPLY ROW NUMBER TO REMOVE DUPLICATES AND ONLY SELECT THE MOST RECENT RECORDS
				SELECT DISTINCT
					[iati-identifier]
					,[start-planned]
					,[end-planned]
					,[start-actual]
					,[end-actual]
					,ROW_NUMBER() OVER(PARTITION BY [iati-identifier] ORDER BY [start-planned], [end-planned], [start-actual], [end-actual] DESC) AS RowOrdinal
	    		FROM [External].[IATIActivityDate]	 
			) A
			WHERE RowOrdinal = 1
		) B
		OPTION(LABEL = 'Scratch.ActivityDate.Obtain');


		-- GET THE MAX IDENTITY KEY FROM THE PERSISTED TABLE
		DECLARE @maxKey INT = (SELECT ISNULL(MAX(ActivityDateKey),0) FROM [Persisted].[ActivityDate])

		-- CREATE A TEMP TABLE USING CTAS TO HANDLE MERGE OPERATIONS
		CREATE TABLE [Persisted].[ActivityDate_Upsert]
		WITH
		(	
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS
		-- NEW ROWS AND NEW VERSIONS OF ROWS
		SELECT 
			ROW_NUMBER() OVER(ORDER BY [ActivityDateChangeHash] DESC) + @maxKey AS  ActivityDateKey
			,S.[ActivityDateChangeHash]
			,S.[IatiIdentifier]
			,S.[StartPlanned]
			,S.[EndPlanned]
			,S.[StartActual]
			,S.[EndActual]
			,GETDATE() AS [InsertedDate]
		FROM [Scratch].[ActivityDate] AS S
		UNION ALL
		-- KEEP ROWS THAT ARE NOT BEING TOUCHED
		SELECT 
			P.ActivityDateKey
			,P.[ActivityDateChangeHash]
			,P.[IatiIdentifier]
			,P.[StartPlanned]
			,P.[EndPlanned]
			,P.[StartActual]
			,P.[EndActual]
			,GETDATE() AS [InsertedDate]
		FROM [Persisted].[ActivityDate] AS P
		WHERE NOT EXISTS
		(
			SELECT *
			FROM [Scratch].[ActivityDate] S
			WHERE S.[ActivityDateChangeHash] = P.[ActivityDateChangeHash]
		)
		OPTION(LABEL = 'Persisted.ActivityDate.Obtain');

		-- KEEP LATEST CTAS AND DELETE PREVIOUS ONE
		RENAME OBJECT [Persisted].[ActivityDate]			TO [ActivityDate_old];
		RENAME OBJECT [Persisted].[ActivityDate_Upsert]		TO [ActivityDate];
		DROP TABLE [Persisted].[ActivityDate_old];
		

	END TRY

	BEGIN CATCH
		--CTAS FAILED, MARK PROCESS AS FAILED AND THROW ERROR
		DECLARE @ErrorMsg	VARCHAR(250)
		SET @ErrorMsg = 'Error loading table Persisted.ActivityDate: ' + ERROR_MESSAGE()
		RAISERROR (@ErrorMsg, 16, 1)
	END CATCH

END