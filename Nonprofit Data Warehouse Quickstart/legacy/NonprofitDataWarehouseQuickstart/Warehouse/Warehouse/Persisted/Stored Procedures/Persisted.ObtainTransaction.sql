-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.


CREATE PROC [Persisted].[ObtainTransaction] AS
-- ==============================================================================================================
-- Author:	Adatis
-- Description:	Performs a full data load. Incremental loads are not supported in this script
--	A Scratch Table is a temporary table used to store the data and remove duplicates. It is used instead of CTEs because it is more performante and reliable
--	We use CTAS as a work around for unsupported features, namely; Merge Statements & Joins on UPDATES/DELETES.
--  Although Insert/Update is a more performant approach, for simplicity, an alternative to MERGE is applied
-- ==============================================================================================================
BEGIN

	BEGIN TRY
		
		IF OBJECT_ID ('Scratch.Transaction','U') IS NOT NULL 
			DROP TABLE [Scratch].[Transaction];

		-- RE-CREATE CTAS AND POPULATE WITH NEW VALUES
		CREATE TABLE [Scratch].[Transaction]
		WITH
		(
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS
		SELECT 
			[TransactionChangeHash]
			,[IatiIdentifier]
			,[DefaultCurrency]
			,[TransactionAidType]
			,[TransactionDisbursementChannel]
			,[TransactionDescriptionNarrative]
			,[TransactionFlowType]
			,[TransactionProviderOrgProviderActivityId]
			,[TransactionProviderOrgRef]
			,[TransactionProviderOrgType]
			,[TransactionProviderOrg]
			,[TransactionReceiverOrgReceiverActivityId]
			,[TransactionReceiverOrgRef]
			,[TransactionReceiverOrgType]
			,[TransactionReceiverOrg]
			,[TransactionRecipientCountry]
			,[TransactionRecipientRegion]
			,[TransactionSector]
			,[TransactionSectorCategory]
			,[TransactionTiedStatus]
			,[TransactionIsoDate]
			,[TransactionType]
			,[TransactionValueCurrency]
			,[TransactionValueDate]
			,[TransactionValue]
		FROM	
		-- CREATE A CHANGE HASH COLUMN TO COMPARE WITH EXISTING RECORDS IN THE PERSISTED TABLE
		(
			SELECT 
				HASHBYTES('SHA2_256', CONCAT_WS('|', 
										ISNULL(UPPER([iati-identifier]),'UKNNOWN'),
										ISNULL(UPPER([default-currency]),'UKNNOWN'),
										ISNULL(UPPER([transaction_aid-type]),'UKNNOWN'),
										ISNULL(UPPER([transaction_disbursement-channel] ),'UKNNOWN'),
										ISNULL(UPPER([transaction_description_narrative]),'UKNNOWN'),
										ISNULL(UPPER([transaction_flow-type]),'UKNNOWN'),
										ISNULL(UPPER([transaction_provider-org_provider-activity-id]),'UKNNOWN'), 
										ISNULL(UPPER([transaction_provider-org_ref]),'UKNNOWN'),	 
										ISNULL(UPPER([transaction-provider-org-type]),'UKNNOWN'),
										ISNULL(UPPER([transaction_provider-org]),'UKNNOWN'),
										ISNULL(UPPER([transaction_receiver-org_receiver-activity-id]),'UKNNOWN'),
										ISNULL(UPPER([transaction_receiver-org_ref]),'UKNNOWN'),
										ISNULL(UPPER([transaction_receiver-org-type]),'UKNNOWN'),
										ISNULL(UPPER([transaction_receiver-org]),'UKNNOWN'),
										ISNULL(UPPER([transaction-recipient-country]),'UKNNOWN'),
										ISNULL(UPPER([transaction_recipient-region]),'UKNNOWN'),	 
										ISNULL(UPPER([transaction-sector]),'UKNNOWN'),
										ISNULL(UPPER([transaction-sector-category]),'UKNNOWN'),
										ISNULL(UPPER([transaction_tied-status]),'UKNNOWN'),
										ISNULL(UPPER([transaction_transaction-date_iso-date]),'1900-01-01 00:00:00'),
										ISNULL(UPPER([transaction-type]),'UKNNOWN'),
										ISNULL(UPPER([transaction_value_currency]),'UKNNOWN'),
										ISNULL(UPPER([transaction_value-date]),'1900-01-01 00:00:00'),
										ISNULL(UPPER([transaction_value]),0)
										))										AS [TransactionChangeHash]
				,[iati-identifier]												AS [IatiIdentifier]
				,[default-currency]												AS [DefaultCurrency]
				,[transaction_aid-type]											AS [TransactionAidType]
				,[transaction_disbursement-channel]								AS [TransactionDisbursementChannel]
				,[transaction_description_narrative]							AS [TransactionDescriptionNarrative]
				,[transaction_flow-type]										AS [TransactionFlowType]
				,[transaction_provider-org_provider-activity-id]				AS [TransactionProviderOrgProviderActivityId]
				,[transaction_provider-org_ref]									AS [TransactionProviderOrgRef]
				,[transaction-provider-org-type]								AS [TransactionProviderOrgType]
				,[transaction_provider-org]										AS [TransactionProviderOrg]
				,[transaction_receiver-org_receiver-activity-id]				AS [TransactionReceiverOrgReceiverActivityId]	
				,[transaction_receiver-org_ref]									AS [TransactionReceiverOrgRef]
				,[transaction_receiver-org-type]								AS [TransactionReceiverOrgType]
				,[transaction_receiver-org]										AS [TransactionReceiverOrg]
				,[transaction-recipient-country]								AS [TransactionRecipientCountry]
				,[transaction_recipient-region]									AS [TransactionRecipientRegion]
				,[transaction-sector]											AS [TransactionSector]
				,[transaction-sector-category]									AS [TransactionSectorCategory]
				,[transaction_tied-status]										AS [TransactionTiedStatus]
				,CAST([transaction_transaction-date_iso-date] AS DATETIME2(7))	AS [TransactionIsoDate]
				,[transaction-type]												AS [TransactionType]
				,[transaction_value_currency]									AS [TransactionValueCurrency]
				,CAST([transaction_value-date] AS DATETIME2(7))					AS [TransactionValueDate]
				,CAST([transaction_value] AS DECIMAL(18,4))						AS [TransactionValue]
			FROM
			(		
				-- APPLY ROW NUMBER TO REMOVE DUPLICATES AND ONLY SELECT THE MOST RECENT RECORDS
				SELECT DISTINCT
					[iati-identifier]
					,[default-currency]
					,[transaction_aid-type]
					,[transaction_disbursement-channel]
					,[transaction_description_narrative]
					,[transaction_flow-type]
					,[transaction_provider-org_provider-activity-id]
					,[transaction_provider-org_ref]
					,[transaction-provider-org-type]
					,[transaction_provider-org]
					,[transaction_receiver-org_receiver-activity-id]	
					,[transaction_receiver-org_ref]
					,[transaction_receiver-org-type]
					,[transaction_receiver-org]
					,[transaction-recipient-country]
					,[transaction_recipient-region]
					,[transaction-sector]
					,[transaction-sector-category]
					,[transaction_tied-status]
					,[transaction_transaction-date_iso-date]
					,[transaction-type]
					,[transaction_value_currency]
					,[transaction_value-date]
					,[transaction_value]
					,ROW_NUMBER() OVER(PARTITION BY [iati-identifier], [transaction_aid-type], [transaction_disbursement-channel], [transaction_description_narrative], [transaction_flow-type]
					,[transaction_provider-org_provider-activity-id] ,[transaction_provider-org_ref] ,[transaction-provider-org-type] ,[transaction_provider-org] ,[transaction_receiver-org_receiver-activity-id]	
					,[transaction_receiver-org_ref] ,[transaction_receiver-org-type] ,[transaction_receiver-org] ,[transaction-recipient-country] ,[transaction_recipient-region] ,[transaction-sector]
					,[transaction-sector-category] ,[transaction_tied-status] ,[transaction_transaction-date_iso-date] ,[transaction-type] ORDER BY [iati-identifier], [transaction_transaction-date_iso-date], [transaction_value-date] DESC) AS RowOrdinal
	    		FROM [External].[IATITransaction]	 
			) A
			WHERE RowOrdinal = 1
		) B
		OPTION(LABEL = 'Scratch.Transaction.Obtain');


		-- GET THE MAX IDENTITY KEY FROM THE PERSISTED TABLE
		DECLARE @maxKey INT = (SELECT ISNULL(MAX(TransactionKey),0) FROM [Persisted].[Transaction])

		-- CREATE A TEMP TABLE USING CTAS TO HANDLE MERGE OPERATIONS
		CREATE TABLE [Persisted].[Transaction_Upsert]
		WITH
		(	
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS

		-- NEW ROWS AND NEW VERSIONS OF ROWS
		SELECT 
			ROW_NUMBER() OVER(ORDER BY [TransactionChangeHash] DESC) + @maxKey AS  TransactionKey
			,S.[TransactionChangeHash]
			,S.[IatiIdentifier]
			,S.[DefaultCurrency]
			,S.[TransactionAidType]
			,S.[TransactionDisbursementChannel]
			,S.[TransactionDescriptionNarrative]
			,S.[TransactionFlowType]
			,S.[TransactionProviderOrgProviderActivityId]
			,S.[TransactionProviderOrgRef]
			,S.[TransactionProviderOrgType]
			,S.[TransactionProviderOrg]
			,S.[TransactionReceiverOrgReceiverActivityId]
			,S.[TransactionReceiverOrgRef]
			,S.[TransactionReceiverOrgType]
			,S.[TransactionReceiverOrg]
			,S.[TransactionRecipientCountry]
			,S.[TransactionRecipientRegion]
			,S.[TransactionSector]
			,S.[TransactionSectorCategory]
			,S.[TransactionTiedStatus]
			,S.[TransactionIsoDate]
			,S.[TransactionType]
			,S.[TransactionValueCurrency]
			,S.[TransactionValueDate]
			,S.[TransactionValue]
			,GETDATE() AS [InsertedDate]
		FROM [Scratch].[Transaction] AS S
		UNION ALL
		-- KEEP ROWS THAT ARE NOT BEING TOUCHED
		SELECT 
			P.TransactionKey
			,P.[TransactionChangeHash]
			,P.[IatiIdentifier]
			,P.[DefaultCurrency]
			,P.[TransactionAidType]
			,P.[TransactionDisbursementChannel]
			,P.[TransactionDescriptionNarrative]
			,P.[TransactionFlowType]
			,P.[TransactionProviderOrgProviderActivityId]
			,P.[TransactionProviderOrgRef]
			,P.[TransactionProviderOrgType]
			,P.[TransactionProviderOrg]
			,P.[TransactionReceiverOrgReceiverActivityId]
			,P.[TransactionReceiverOrgRef]
			,P.[TransactionReceiverOrgType]
			,P.[TransactionReceiverOrg]
			,P.[TransactionRecipientCountry]
			,P.[TransactionRecipientRegion]
			,P.[TransactionSector]
			,P.[TransactionSectorCategory]
			,P.[TransactionTiedStatus]
			,P.[TransactionIsoDate]
			,P.[TransactionType]
			,P.[TransactionValueCurrency]
			,P.[TransactionValueDate]
			,P.[TransactionValue]
			,GETDATE() AS [InsertedDate]
		FROM [Persisted].[Transaction] AS P
		WHERE NOT EXISTS
		(
			SELECT *
			FROM [Scratch].[Transaction] S
			WHERE S.[TransactionChangeHash] = P.[TransactionChangeHash]
		)
		OPTION(LABEL = 'Persisted.Transaction.Obtain');

		-- KEEP LATEST CTAS AND DELETE PREVIOUS ONE
		RENAME OBJECT [Persisted].[Transaction]			TO [Transaction_old];
		RENAME OBJECT [Persisted].[Transaction_Upsert]	TO [Transaction];
		DROP TABLE [Persisted].[Transaction_old];
		

	END TRY

	BEGIN CATCH
		--CTAS FAILED, MARK PROCESS AS FAILED AND THROW ERROR
		DECLARE @ErrorMsg	VARCHAR(250)
		SET @ErrorMsg = 'Error loading table Persisted.Transaction: ' + ERROR_MESSAGE()
		RAISERROR (@ErrorMsg, 16, 1)
	END CATCH

END
