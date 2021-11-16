-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE PROC [Persisted].[ObtainRecipientCountry] AS
-- ==============================================================================================================
-- Author:	Adatis
-- Description:	Performs a full data load. Incremental loads are not supported in this script
--	A Scratch Table is a temporary table used to store the data and remove duplicates. It is used instead of CTEs because it is more performante and reliable
--	We use CTAS as a work around for unsupported features, namely; Merge Statements & Joins on UPDATES/DELETES.
--  Although Insert/Update is a more performant approach, for simplicity, an alternative to MERGE is applied
-- ==============================================================================================================
BEGIN

	BEGIN TRY
		
		IF OBJECT_ID ('Scratch.RecipientCountry','U') IS NOT NULL 
			DROP TABLE [Scratch].[RecipientCountry];

		-- RE-CREATE CTAS AND POPULATE WITH NEW VALUES
		CREATE TABLE [Scratch].[RecipientCountry]
		WITH
		(
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS
		SELECT 
			[RecipientCountryChangeHash]
			,[IatiIdentifier]
			,[RecipientCountryCode]
			,[RecipientCountryPercentage]
			,[RecipientCountry] 				
		FROM	
		-- CREATE A CHANGE HASH COLUMN TO COMPARE WITH EXISTING RECORDS IN THE PERSISTED TABLE
		(
			SELECT 
				HASHBYTES('SHA2_256', CONCAT_WS('|', 
										ISNULL(UPPER([iati-identifier]),'UKNNOWN'),	
										ISNULL(UPPER([recipient-country_code]),'UKNNOWN'),	
										ISNULL(UPPER([recipient-country_percentage]),'UKNNOWN'),	
										ISNULL(UPPER([recipient-country]),'UKNNOWN')
										))		AS [RecipientCountryChangeHash]
				,[iati-identifier]				AS [IatiIdentifier]
				,[recipient-country_code]		AS [RecipientCountryCode]
				,[recipient-country_percentage] AS [RecipientCountryPercentage]
				,[recipient-country]			AS [RecipientCountry]
			FROM 
			(		
				-- APPLY ROW NUMBER TO REMOVE DUPLICATES AND ONLY SELECT THE MOST RECENT RECORDS
				SELECT DISTINCT
					[iati-identifier]
					,[recipient-country_code]
					,CAST([recipient-country_percentage] AS DECIMAL(18,4)) AS [recipient-country_percentage]
					,[recipient-country]
					,ROW_NUMBER() OVER(PARTITION BY [iati-identifier], [recipient-country_code] ORDER BY [iati-identifier] DESC) AS RowOrdinal
	    		FROM [External].[IATIRecipientCountry]	
			) A
			WHERE RowOrdinal = 1
		) B
		OPTION(LABEL = 'Scratch.RecipientCountry.Obtain');


		-- GET THE MAX IDENTITY KEY FROM THE PERSISTED TABLE
		DECLARE @maxKey INT = (SELECT ISNULL(MAX(RecipientCountryKey),0) FROM [Persisted].[RecipientCountry])

		-- CREATE A TEMP TABLE USING CTAS TO HANDLE MERGE OPERATIONS
		CREATE TABLE [Persisted].[RecipientCountry_Upsert]
		WITH
		(	
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS

		-- NEW ROWS AND NEW VERSIONS OF ROWS
		SELECT 
			ROW_NUMBER() OVER(ORDER BY [RecipientCountryChangeHash] DESC) + @maxKey AS  RecipientCountryKey
			,S.[RecipientCountryChangeHash]
			,S.[IatiIdentifier]
			,S.[RecipientCountryCode]
			,S.[RecipientCountryPercentage]
			,S.[RecipientCountry] 	
			,GETDATE() AS [InsertedDate]
		FROM [Scratch].[RecipientCountry] AS S
		UNION ALL
		-- KEEP ROWS THAT ARE NOT BEING TOUCHED
		SELECT 
			P.RecipientCountryKey
			,P.[RecipientCountryChangeHash]
			,P.[IatiIdentifier]
			,P.[RecipientCountryCode]
			,P.[RecipientCountryPercentage]
			,P.[RecipientCountry] 
			,GETDATE() AS [InsertedDate]
		FROM [Persisted].[RecipientCountry] AS P
		WHERE NOT EXISTS
		(
			SELECT *
			FROM [Scratch].[RecipientCountry] S
			WHERE S.[RecipientCountryChangeHash] = P.[RecipientCountryChangeHash]
		)
		OPTION(LABEL = 'Persisted.RecipientCountry.Obtain');

		-- KEEP LATEST CTAS AND DELETE PREVIOUS ONE
		RENAME OBJECT [Persisted].[RecipientCountry]			TO [RecipientCountry_old];
		RENAME OBJECT [Persisted].[RecipientCountry_Upsert]		TO [RecipientCountry];
		DROP TABLE [Persisted].[RecipientCountry_old];
		

	END TRY

	BEGIN CATCH
		--CTAS FAILED, MARK PROCESS AS FAILED AND THROW ERROR
		DECLARE @ErrorMsg	VARCHAR(250)
		SET @ErrorMsg = 'Error loading table Persisted.RecipientCountry: ' + ERROR_MESSAGE()
		RAISERROR (@ErrorMsg, 16, 1)
	END CATCH

END
