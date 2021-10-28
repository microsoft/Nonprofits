-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE PROC [Persisted].[ObtainContactInformation] AS
-- ==============================================================================================================
-- Author:	Adatis
-- Description:	Performs a full data load. Incremental loads are not supported in this script
--	A Scratch Table is a temporary table used to store the data and remove duplicates. It is used instead of CTEs because it is more performante and reliable
--	We use CTAS as a work around for unsupported features, namely; Merge Statements & Joins on UPDATES/DELETES.
--  Although Insert/Update is a more performant approach, for simplicity, an alternative to MERGE is applied
-- ==============================================================================================================
BEGIN

	BEGIN TRY
		
		IF OBJECT_ID ('Scratch.ContactInformation','U') IS NOT NULL 
			DROP TABLE [Scratch].[ContactInformation];

		-- RE-CREATE CTAS AND POPULATE WITH NEW VALUES
		CREATE TABLE [Scratch].[ContactInformation]
		WITH
		(
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS
		SELECT 
			[ContactInformationChangeHash]
			,[IatiIdentifier]
			,[ContactInfoType]
			,[ContactInfoDepartmentNarrative]
			,[ContactInfoDepartment]
			,[ContactInfoEmail]
			,[ContactInfoJobTitleNarrative]
			,[ContactInfoJobTitle]
			,[ContactInfoMailingAddressNarrative]
			,[ContactInfoMailingAddress]
			,[ContactInfoOrganisationNarrative]
			,[ContactInfoOrganisation]
			,[ContactInfoPersonNameNarrative]
			,[ContactInfoPersonName]
			,[ContactInfoTelephone]
			,[ContactInfoWebsite]
		FROM	
		-- CREATE A CHANGE HASH COLUMN TO COMPARE WITH EXISTING RECORDS IN THE PERSISTED TABLE
		(
			SELECT 
				HASHBYTES('SHA2_256', CONCAT_WS('|', 
										ISNULL(UPPER([iati-identifier]),'UKNNOWN'),		
										ISNULL(UPPER([contact-info_type]),'UKNNOWN'),
										ISNULL(UPPER([contact-info_department_narrative]),'UKNNOWN'),	
										ISNULL(UPPER([contact-info_department]),'UKNNOWN'),
										ISNULL(UPPER([contact-info_email]),'UKNNOWN'),
										ISNULL(UPPER([contact-info_job-title_narrative]),'UKNNOWN'),
										ISNULL(UPPER([contact-info_job-title]),'UKNNOWN'),
										ISNULL(UPPER([contact-info_mailing-address_narrative]),'UKNNOWN'),
										ISNULL(UPPER([contact-info_mailing-address]),'UKNNOWN'),
										ISNULL(UPPER([contact-info_organisation_narrative]),'UKNNOWN'),	
										ISNULL(UPPER([contact-info_organisation]),'UKNNOWN'),	
										ISNULL(UPPER([contact-info_person-name_narrative]),'UKNNOWN'),
										ISNULL(UPPER([contact-info_person-name]),'UKNNOWN'),
										ISNULL(UPPER([contact-info_telephone]),'UKNNOWN'),										
										ISNULL(UPPER([contact-info_website]),'UKNNOWN')



										))						AS [ContactInformationChangeHash]
				,[iati-identifier]								AS [IatiIdentifier]
				,[contact-info_type]							AS [ContactInfoType]
				,[contact-info_department_narrative]			AS [ContactInfoDepartmentNarrative]
				,[contact-info_department]						AS [ContactInfoDepartment]
				,[contact-info_email]							AS [ContactInfoEmail]
				,[contact-info_job-title_narrative]				AS [ContactInfoJobTitleNarrative]
				,[contact-info_job-title]						AS [ContactInfoJobTitle]
				,[contact-info_mailing-address_narrative]		AS [ContactInfoMailingAddressNarrative]
				,[contact-info_mailing-address]					AS [ContactInfoMailingAddress]
				,[contact-info_organisation_narrative]			AS [ContactInfoOrganisationNarrative]
				,[contact-info_organisation]					AS [ContactInfoOrganisation]
				,[contact-info_person-name_narrative]			AS [ContactInfoPersonNameNarrative]
				,[contact-info_person-name]						AS [ContactInfoPersonName]
				,[contact-info_telephone]						AS [ContactInfoTelephone]
				,[contact-info_website]							AS [ContactInfoWebsite]
			FROM
			(		
				-- APPLY ROW NUMBER TO REMOVE DUPLICATES AND ONLY SELECT THE MOST RECENT RECORDS
				SELECT DISTINCT
					[iati-identifier]
					,[contact-info_type]
					,[contact-info_department_narrative]
					,[contact-info_department]
					,[contact-info_email]
					,[contact-info_job-title_narrative]
					,[contact-info_job-title]
					,[contact-info_mailing-address_narrative]
					,[contact-info_mailing-address]
					,[contact-info_organisation_narrative]
					,[contact-info_organisation]
					,[contact-info_person-name_narrative]
					,[contact-info_person-name]
					,[contact-info_telephone]
					,[contact-info_website]
					,ROW_NUMBER() OVER(PARTITION BY [iati-identifier] ORDER BY [iati-identifier] DESC) AS RowOrdinal
	    		FROM [External].[IATIContactInformation]	 
			) A
			WHERE RowOrdinal = 1
		) B
		OPTION(LABEL = 'Scratch.ContactInformation.Obtain');


		-- GET THE MAX IDENTITY KEY FROM THE PERSISTED TABLE
		DECLARE @maxKey INT = (SELECT ISNULL(MAX(ContactInformationKey),0) FROM [Persisted].[ContactInformation])

		-- CREATE A TEMP TABLE USING CTAS TO HANDLE MERGE OPERATIONS
		CREATE TABLE [Persisted].[ContactInformation_Upsert]
		WITH
		(	
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS

		-- NEW ROWS AND NEW VERSIONS OF ROWS
		SELECT 
			ROW_NUMBER() OVER(ORDER BY [ContactInformationChangeHash] DESC) + @maxKey AS  ContactInformationKey
			,S.[ContactInformationChangeHash]
			,S.[IatiIdentifier]
			,S.[ContactInfoType]
			,S.[ContactInfoDepartmentNarrative]
			,S.[ContactInfoDepartment]
			,S.[ContactInfoEmail]
			,S.[ContactInfoJobTitleNarrative]
			,S.[ContactInfoJobTitle]
			,S.[ContactInfoMailingAddressNarrative]
			,S.[ContactInfoMailingAddress]
			,S.[ContactInfoOrganisationNarrative]
			,S.[ContactInfoOrganisation]
			,S.[ContactInfoPersonNameNarrative]
			,S.[ContactInfoPersonName]
			,S.[ContactInfoTelephone]
			,S.[ContactInfoWebsite]
			,GETDATE() AS [InsertedDate]
		FROM [Scratch].[ContactInformation] AS S
		UNION ALL
		-- KEEP ROWS THAT ARE NOT BEING TOUCHED
		SELECT 
			P.ContactInformationKey
			,P.[ContactInformationChangeHash]
			,P.[IatiIdentifier]
			,P.[ContactInfoType]
			,P.[ContactInfoDepartmentNarrative]
			,P.[ContactInfoDepartment]
			,P.[ContactInfoEmail]
			,P.[ContactInfoJobTitleNarrative]
			,P.[ContactInfoJobTitle]
			,P.[ContactInfoMailingAddressNarrative]
			,P.[ContactInfoMailingAddress]
			,P.[ContactInfoOrganisationNarrative]
			,P.[ContactInfoOrganisation]
			,P.[ContactInfoPersonNameNarrative]
			,P.[ContactInfoPersonName]
			,P.[ContactInfoTelephone]
			,P.[ContactInfoWebsite]
			,GETDATE() AS [InsertedDate]
		FROM [Persisted].[ContactInformation] AS P
		WHERE NOT EXISTS
		(
			SELECT *
			FROM [Scratch].[ContactInformation] S
			WHERE S.[ContactInformationChangeHash] = P.[ContactInformationChangeHash]
		)
		OPTION(LABEL = 'Persisted.ContactInformation.Obtain');

		-- KEEP LATEST CTAS AND DELETE PREVIOUS ONE
		RENAME OBJECT [Persisted].[ContactInformation]			TO [ContactInformation_old];
		RENAME OBJECT [Persisted].[ContactInformation_Upsert]	TO [ContactInformation];
		DROP TABLE [Persisted].[ContactInformation_old];
		

	END TRY

	BEGIN CATCH
		--CTAS FAILED, MARK PROCESS AS FAILED AND THROW ERROR
		DECLARE @ErrorMsg	VARCHAR(250)
		SET @ErrorMsg = 'Error loading table Persisted.ContactInformation: ' + ERROR_MESSAGE()
		RAISERROR (@ErrorMsg, 16, 1)
	END CATCH

END
