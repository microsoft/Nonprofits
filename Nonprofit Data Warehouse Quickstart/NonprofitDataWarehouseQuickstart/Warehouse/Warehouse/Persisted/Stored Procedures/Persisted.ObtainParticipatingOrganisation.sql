-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE PROC [Persisted].[ObtainParticipatingOrganisation] AS
-- ==============================================================================================================
-- Author:	Adatis
-- Description:	Performs a full data load. Incremental loads are not supported in this script
--	A Scratch Table is a temporary table used to store the data and remove duplicates. It is used instead of CTEs because it is more performante and reliable
--	We use CTAS as a work around for unsupported features, namely; Merge Statements & Joins on UPDATES/DELETES.
--  Although Insert/Update is a more performant approach, for simplicity, an alternative to MERGE is applied
-- ==============================================================================================================
BEGIN

	BEGIN TRY
		
		IF OBJECT_ID ('Scratch.ParticipatingOrganisation','U') IS NOT NULL 
			DROP TABLE [Scratch].[ParticipatingOrganisation];

		-- RE-CREATE CTAS AND POPULATE WITH NEW VALUES
		CREATE TABLE [Scratch].[ParticipatingOrganisation]
		WITH
		(
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS
		SELECT 
			[ParticipatingOrganisationChangeHash]
			,[IatiIdentifier]
			,[ParticipatingOrg]
			,[ParticipatingOrgRole]
			,[ParticipatingOrgType]
			,[ParticipatingOrgRef]
		FROM	
		-- CREATE A CHANGE HASH COLUMN TO COMPARE WITH EXISTING RECORDS IN THE PERSISTED TABLE
		(
			SELECT 
				HASHBYTES('SHA2_256', CONCAT_WS('|', 
										ISNULL(UPPER([iati-identifier]),'UKNNOWN'),	
										ISNULL(UPPER([participating-org]),'UKNNOWN'),	
										ISNULL(UPPER([participating-org_role]),'UKNNOWN'),	
										ISNULL(UPPER([participating-org_type]),'UKNNOWN'),	
										ISNULL(UPPER([participating-org_ref]),'UKNNOWN')
										))	AS [ParticipatingOrganisationChangeHash]
				,[iati-identifier]			AS [IatiIdentifier]
				,[participating-org]		AS [ParticipatingOrg]
				,[participating-org_role]	AS [ParticipatingOrgRole]
				,[participating-org_type]	AS [ParticipatingOrgType]
				,[participating-org_ref]	AS [ParticipatingOrgRef]
			FROM 
			(		
				-- APPLY ROW NUMBER TO REMOVE DUPLICATES AND ONLY SELECT THE MOST RECENT RECORDS
				SELECT DISTINCT
					[iati-identifier]
					,[participating-org]
					,[participating-org_role]
					,[participating-org_type]
					,[participating-org_ref]
					,ROW_NUMBER() OVER(PARTITION BY [iati-identifier],[participating-org], [participating-org_role], [participating-org_type], [participating-org_ref]  ORDER BY [iati-identifier]  DESC) AS RowOrdinal
	    		FROM [External].[IATIParticipatingOrganisation]	 
			) A
			WHERE RowOrdinal = 1
		) B
		OPTION(LABEL = 'Scratch.ParticipatingOrganisation.Obtain');


		-- GET THE MAX IDENTITY KEY FROM THE PERSISTED TABLE
		DECLARE @maxKey INT = (SELECT ISNULL(MAX(ParticipatingOrganisationKey),0) FROM [Persisted].[ParticipatingOrganisation])

		-- CREATE A TEMP TABLE USING CTAS TO HANDLE MERGE OPERATIONS
		CREATE TABLE [Persisted].[ParticipatingOrganisation_Upsert]
		WITH
		(	
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS

		-- NEW ROWS AND NEW VERSIONS OF ROWS
		SELECT 
			ROW_NUMBER() OVER(ORDER BY [ParticipatingOrganisationChangeHash] DESC) + @maxKey AS  ParticipatingOrganisationKey
			,S.[ParticipatingOrganisationChangeHash]
			,S.[IatiIdentifier]
			,S.[ParticipatingOrg]
			,S.[ParticipatingOrgRole]
			,S.[ParticipatingOrgType]
			,S.[ParticipatingOrgRef]
			,GETDATE() AS [InsertedDate]
		FROM [Scratch].[ParticipatingOrganisation] AS S
		UNION ALL
		-- KEEP ROWS THAT ARE NOT BEING TOUCHED
		SELECT 
			P.ParticipatingOrganisationKey
			,P.[ParticipatingOrganisationChangeHash]
			,P.[IatiIdentifier]
			,P.[ParticipatingOrg]
			,P.[ParticipatingOrgRole]
			,P.[ParticipatingOrgType]
			,P.[ParticipatingOrgRef]
			,GETDATE() AS [InsertedDate]
		FROM [Persisted].[ParticipatingOrganisation] AS P
		WHERE NOT EXISTS
		(
			SELECT *
			FROM [Scratch].[ParticipatingOrganisation] S
			WHERE S.[ParticipatingOrganisationChangeHash] = P.[ParticipatingOrganisationChangeHash]
		)
		OPTION(LABEL = 'Persisted.ParticipatingOrganisation.Obtain');

		-- KEEP LATEST CTAS AND DELETE PREVIOUS ONE
		RENAME OBJECT [Persisted].[ParticipatingOrganisation]			TO [ParticipatingOrganisation_old];
		RENAME OBJECT [Persisted].[ParticipatingOrganisation_Upsert]	TO [ParticipatingOrganisation];
		DROP TABLE [Persisted].[ParticipatingOrganisation_old];
		

	END TRY

	BEGIN CATCH
		--CTAS FAILED, MARK PROCESS AS FAILED AND THROW ERROR
		DECLARE @ErrorMsg	VARCHAR(250)
		SET @ErrorMsg = 'Error loading table Persisted.ParticipatingOrganisation: ' + ERROR_MESSAGE()
		RAISERROR (@ErrorMsg, 16, 1)
	END CATCH

END
