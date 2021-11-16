-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE PROC [Persisted].[ObtainReportingOrganisation] AS
-- ==============================================================================================================
-- Author:	Adatis
-- Description:	Performs a full data load. Incremental loads are not supported in this script
--	A Scratch Table is a temporary table used to store the data and remove duplicates. It is used instead of CTEs because it is more performante and reliable
--	We use CTAS as a work around for unsupported features, namely; Merge Statements & Joins on UPDATES/DELETES.
--  Although Insert/Update is a more performant approach, for simplicity, an alternative to MERGE is applied
-- ==============================================================================================================
BEGIN

	BEGIN TRY
		
		IF OBJECT_ID ('Scratch.ReportingOrganisation','U') IS NOT NULL 
			DROP TABLE [Scratch].[ReportingOrganisation];

		-- RE-CREATE CTAS AND POPULATE WITH NEW VALUES
		CREATE TABLE [Scratch].[ReportingOrganisation]
		WITH
		(
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS
		SELECT 
			[ReportingOrganisationChangeHash]
			,[IatiIdentifier]
			,[ReportingOrgRef]
			,[ReportingOrg]
			,[ReportingOrgType]
			,[ReportingOrgSecondaryReporter]
		FROM	
		-- CREATE A CHANGE HASH COLUMN TO COMPARE WITH EXISTING RECORDS IN THE PERSISTED TABLE
		(
			SELECT 
				HASHBYTES('SHA2_256', CONCAT_WS('|', 
										ISNULL(UPPER([iati-identifier]),'UKNNOWN'),			
										ISNULL(UPPER([reporting-org_ref]),'UKNNOWN'),
										ISNULL(UPPER([reporting-org]),'UKNNOWN'),										
										ISNULL(UPPER([reporting-org_type]),'UKNNOWN'),
										ISNULL(UPPER([reporting-org_secondary-reporter]),'UKNNOWN')
										))			AS [ReportingOrganisationChangeHash]
				,[iati-identifier]					AS [IatiIdentifier]
				,[reporting-org_ref]				AS [ReportingOrgRef]
				,[reporting-org]					AS [ReportingOrg]
				,[reporting-org_type]				AS [ReportingOrgType]
				,[reporting-org_secondary-reporter]	AS [ReportingOrgSecondaryReporter]
			FROM
			(		
				-- APPLY ROW NUMBER TO REMOVE DUPLICATES AND ONLY SELECT THE MOST RECENT RECORDS
				SELECT DISTINCT
					[iati-identifier]
					,[reporting-org_ref]
					,[reporting-org]
					,[reporting-org_type]
					,[reporting-org_secondary-reporter]
					,ROW_NUMBER() OVER(PARTITION BY [iati-identifier] ORDER BY [iati-identifier] DESC) AS RowOrdinal
	    		FROM [External].[IATIReportingOrganisation]	 
			) A
			WHERE RowOrdinal = 1
		) B
		OPTION(LABEL = 'Scratch.ReportingOrganisation.Obtain');


		-- GET THE MAX IDENTITY KEY FROM THE PERSISTED TABLE
		DECLARE @maxKey INT = (SELECT ISNULL(MAX(ReportingOrganisationKey),0) FROM [Persisted].[ReportingOrganisation])

		-- CREATE A TEMP TABLE USING CTAS TO HANDLE MERGE OPERATIONS
		CREATE TABLE [Persisted].[ReportingOrganisation_Upsert]
		WITH
		(	
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS

		-- NEW ROWS AND NEW VERSIONS OF ROWS
		SELECT 
			ROW_NUMBER() OVER(ORDER BY [ReportingOrganisationChangeHash] DESC) + @maxKey AS  ReportingOrganisationKey
			,S.[ReportingOrganisationChangeHash]
			,S.[IatiIdentifier]
			,S.[ReportingOrgRef]
			,S.[ReportingOrg]
			,S.[ReportingOrgType]
			,S.[ReportingOrgSecondaryReporter]
			,GETDATE() AS [InsertedDate]
		FROM [Scratch].[ReportingOrganisation] AS S
		UNION ALL
		-- KEEP ROWS THAT ARE NOT BEING TOUCHED
		SELECT 
			P.ReportingOrganisationKey
			,P.[ReportingOrganisationChangeHash]
			,P.[IatiIdentifier]
			,P.[ReportingOrgRef]
			,P.[ReportingOrg]
			,P.[ReportingOrgType]
			,P.[ReportingOrgSecondaryReporter]
			,GETDATE() AS [InsertedDate]
		FROM [Persisted].[ReportingOrganisation] AS P
		WHERE NOT EXISTS
		(
			SELECT *
			FROM [Scratch].[ReportingOrganisation] S
			WHERE S.[ReportingOrganisationChangeHash] = P.[ReportingOrganisationChangeHash]
		)
		OPTION(LABEL = 'Persisted.ReportingOrganisation.Obtain');

		-- KEEP LATEST CTAS AND DELETE PREVIOUS ONE
		RENAME OBJECT [Persisted].[ReportingOrganisation]			TO [ReportingOrganisation_old];
		RENAME OBJECT [Persisted].[ReportingOrganisation_Upsert]	TO [ReportingOrganisation];
		DROP TABLE [Persisted].[ReportingOrganisation_old];
		

	END TRY

	BEGIN CATCH
		--CTAS FAILED, MARK PROCESS AS FAILED AND THROW ERROR
		DECLARE @ErrorMsg	VARCHAR(250)
		SET @ErrorMsg = 'Error loading table Persisted.ReportingOrganisation: ' + ERROR_MESSAGE()
		RAISERROR (@ErrorMsg, 16, 1)
	END CATCH

END