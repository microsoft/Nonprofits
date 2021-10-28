-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE PROC [Persisted].[ObtainActivityStatus] AS
-- ==============================================================================================================
-- Author:	Adatis
-- Description:	Performs a full data load. Incremental loads are not supported in this script
--	A Scratch Table is a temporary table used to store the data and remove duplicates. It is used instead of CTEs because it is more performante and reliable
--	We use CTAS as a work around for unsupported features, namely; Merge Statements & Joins on UPDATES/DELETES.
--  Although Insert/Update is a more performant approach, for simplicity, an alternative to MERGE is applied
-- ==============================================================================================================
BEGIN

	BEGIN TRY
		
		IF OBJECT_ID ('Scratch.ActivityStatus','U') IS NOT NULL 
			DROP TABLE [Scratch].[ActivityStatus];

		-- RE-CREATE CTAS AND POPULATE WITH NEW VALUES
		CREATE TABLE [Scratch].[ActivityStatus]
		WITH
		(
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS
		SELECT 
			[ActivityStatusChangeHash]
			,[IatiIdentifier]
			,[ActivityStatus]
			,[ActivityStatusDescription]
		FROM	
		-- CREATE A CHANGE HASH COLUMN TO COMPARE WITH EXISTING RECORDS IN THE PERSISTED TABLE
		(
			SELECT 
				HASHBYTES('SHA2_256', CONCAT_WS('|', 
										ISNULL(UPPER([iati-identifier]),'UKNNOWN'),			
										ISNULL(UPPER([activity-status]),'UKNNOWN'),
										ISNULL(UPPER([activity-status_description]),'UKNNOWN')
										))		AS [ActivityStatusChangeHash]
				,[iati-identifier]				AS [IatiIdentifier]
				,[activity-status]				AS [ActivityStatus]
				,[activity-status_description]	AS [ActivityStatusDescription]
		
			FROM 
			(		
				-- APPLY ROW NUMBER TO REMOVE DUPLICATES AND ONLY SELECT THE MOST RECENT RECORDS
				SELECT DISTINCT
					[iati-identifier]
					,[activity-status]
					,[activity-status_description]
					,ROW_NUMBER() OVER(PARTITION BY [iati-identifier] ORDER BY [iati-identifier] DESC) AS RowOrdinal
	    		FROM [External].[IATIActivityStatus]	 
			) A
			WHERE RowOrdinal = 1
		) B
		OPTION(LABEL = 'Scratch.ActivityStatus.Obtain');


		-- GET THE MAX IDENTITY KEY FROM THE PERSISTED TABLE
		DECLARE @maxKey INT = (SELECT ISNULL(MAX(ActivityStatusKey),0) FROM [Persisted].[ActivityStatus])

		-- CREATE A TEMP TABLE USING CTAS TO HANDLE MERGE OPERATIONS
		CREATE TABLE [Persisted].[ActivityStatus_Upsert]
		WITH
		(	
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS

		-- NEW ROWS AND NEW VERSIONS OF ROWS
		SELECT 
			ROW_NUMBER() OVER(ORDER BY [ActivityStatusChangeHash] DESC) + @maxKey AS  ActivityStatusKey
			,S.[ActivityStatusChangeHash]
			,S.[IatiIdentifier]
			,S.[ActivityStatus]
			,S.[ActivityStatusDescription]
			,GETDATE() AS [InsertedDate]
		FROM [Scratch].[ActivityStatus] AS S
		UNION ALL
		-- KEEP ROWS THAT ARE NOT BEING TOUCHED
		SELECT 
			P.ActivityStatusKey
			,P.[ActivityStatusChangeHash]
			,P.[IatiIdentifier]
			,P.[ActivityStatus]
			,P.[ActivityStatusDescription]
			,GETDATE() AS [InsertedDate]
		FROM [Persisted].[ActivityStatus] AS P
		WHERE NOT EXISTS
		(
			SELECT *
			FROM [Scratch].[ActivityStatus] S
			WHERE S.[ActivityStatusChangeHash] = P.[ActivityStatusChangeHash]
		)
		OPTION(LABEL = 'Persisted.ActivityStatus.Obtain');

		-- KEEP LATEST CTAS AND DELETE PREVIOUS ONE
		RENAME OBJECT [Persisted].[ActivityStatus]			TO [ActivityStatus_old];
		RENAME OBJECT [Persisted].[ActivityStatus_Upsert]	TO [ActivityStatus];
		DROP TABLE [Persisted].[ActivityStatus_old];
		

	END TRY

	BEGIN CATCH
		--CTAS FAILED, MARK PROCESS AS FAILED AND THROW ERROR
		DECLARE @ErrorMsg	VARCHAR(250)
		SET @ErrorMsg = 'Error loading table Persisted.ActivityStatus: ' + ERROR_MESSAGE()
		RAISERROR (@ErrorMsg, 16, 1)
	END CATCH

END


