-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE PROC [Persisted].[ObtainBudget] AS
-- ==============================================================================================================
-- Author:	Adatis
-- Description:	Performs a full data load. Incremental loads are not supported in this script
--	A Scratch Table is a temporary table used to store the data and remove duplicates. It is used instead of CTEs because it is more performante and reliable
--	We use CTAS as a work around for unsupported features, namely; Merge Statements & Joins on UPDATES/DELETES.
--  Although Insert/Update is a more performant approach, for simplicity, an alternative to MERGE is applied
-- ==============================================================================================================
BEGIN

	BEGIN TRY
		
		IF OBJECT_ID ('Scratch.Budget','U') IS NOT NULL 
			DROP TABLE [Scratch].[Budget];

		-- RE-CREATE CTAS AND POPULATE WITH NEW VALUES
		CREATE TABLE [Scratch].[Budget]
		WITH
		(
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS
		SELECT 
			[BudgetChangeHash]
			,[IatiIdentifier]
			,[BudgetType]
			,[BudgetPeriodStartIsoDate]
			,[BudgetPeriodEndIsoDate]
			,[BudgetValueCurrency]
			,[BudgetValueDate]
			,[BudgetValue]
		FROM	
		-- CREATE A CHANGE HASH COLUMN TO COMPARE WITH EXISTING RECORDS IN THE PERSISTED TABLE
		(
			SELECT 
				HASHBYTES('SHA2_256', CONCAT_WS('|', 
										ISNULL(UPPER([iati-identifier]),'UKNNOWN'),	
										ISNULL(UPPER([budget_type]),'UKNNOWN'),		
										ISNULL(UPPER([budget_period-start_iso-date]),'1900-01-01 00:00:00'),
										ISNULL(UPPER([budget_period-end_iso-date]),'1900-01-01 00:00:00'),
										ISNULL(UPPER([budget_value_currency]),'UKNNOWN'),	
										ISNULL(UPPER([budget_value-date]),'1900-01-01 00:00:00'),
										ISNULL(UPPER([budget_value]),0)
										))									AS	[BudgetChangeHash]
					,[iati-identifier]										AS  [IatiIdentifier]
					,[budget_type]											AS  [BudgetType]
					,CAST([budget_period-start_iso-date] AS DATETIME2(7))	AS	[BudgetPeriodStartIsoDate]
					,CAST([budget_period-end_iso-date] AS DATETIME2(7))		AS  [BudgetPeriodEndIsoDate]
					,[budget_value_currency]								AS	[BudgetValueCurrency]	
					,CAST([budget_value-date] AS DATETIME2(7))				AS	[BudgetValueDate]
					,CAST([budget_value] AS DECIMAL(18,4))					AS	[BudgetValue]
			FROM 
			(		
				-- APPLY ROW NUMBER TO REMOVE DUPLICATES AND ONLY SELECT THE MOST RECENT RECORDS
				SELECT DISTINCT
					[iati-identifier]
					,[budget_type]
					,[budget_period-start_iso-date]
					,[budget_period-end_iso-date]
					,[budget_value_currency]
					,[budget_value-date]
					,[budget_value]
					,ROW_NUMBER() OVER(PARTITION BY [iati-identifier],[budget_type], [budget_period-start_iso-date], [budget_period-end_iso-date], [budget_value-date] ORDER BY [budget_period-start_iso-date], [budget_period-end_iso-date], [budget_value_currency], [budget_value-date] DESC) AS RowOrdinal
	    		FROM [External].[IATIBudget]	 
			) A
			WHERE RowOrdinal = 1
		) B
		OPTION(LABEL = 'Scratch.Budget.Obtain');


		-- GET THE MAX IDENTITY KEY FROM THE PERSISTED TABLE
		DECLARE @maxKey INT = (SELECT ISNULL(MAX(BudgetKey),0) FROM [Persisted].[Budget])

		-- CREATE A TEMP TABLE USING CTAS TO HANDLE MERGE OPERATIONS
		CREATE TABLE [Persisted].[Budget_Upsert]
		WITH
		(	
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS

		-- NEW ROWS AND NEW VERSIONS OF ROWS
		SELECT 
			ROW_NUMBER() OVER(ORDER BY [BudgetChangeHash] DESC) + @maxKey AS  BudgetKey
			,S.[BudgetChangeHash]
			,S.[IatiIdentifier]
			,S.[BudgetType]
			,S.[BudgetPeriodStartIsoDate]
			,S.[BudgetPeriodEndIsoDate]
			,S.[BudgetValueCurrency]
			,S.[BudgetValueDate]
			,S.[BudgetValue]
			,GETDATE() AS [InsertedDate]
		FROM [Scratch].[Budget] AS S
		UNION ALL
		-- KEEP ROWS THAT ARE NOT BEING TOUCHED
		SELECT 
			P.BudgetKey
			,P.[BudgetChangeHash]
			,P.[IatiIdentifier]
			,P.[BudgetType]
			,P.[BudgetPeriodStartIsoDate]
			,P.[BudgetPeriodEndIsoDate]
			,P.[BudgetValueCurrency]
			,P.[BudgetValueDate]
			,P.[BudgetValue]
			,GETDATE() AS [InsertedDate]
		FROM [Persisted].[Budget] AS P
		WHERE NOT EXISTS
		(
			SELECT *
			FROM [Scratch].[Budget] S
			WHERE S.[BudgetChangeHash] = P.[BudgetChangeHash]
		)
		OPTION(LABEL = 'Persisted.Budget.Obtain');

		-- KEEP LATEST CTAS AND DELETE PREVIOUS ONE
		RENAME OBJECT [Persisted].[Budget]			TO [Budget_old];
		RENAME OBJECT [Persisted].[Budget_Upsert]		TO [Budget];
		DROP TABLE [Persisted].[Budget_old];
		

	END TRY

	BEGIN CATCH
		--CTAS FAILED, MARK PROCESS AS FAILED AND THROW ERROR
		DECLARE @ErrorMsg	VARCHAR(250)
		SET @ErrorMsg = 'Error loading table Persisted.Budget: ' + ERROR_MESSAGE()
		RAISERROR (@ErrorMsg, 16, 1)
	END CATCH

END