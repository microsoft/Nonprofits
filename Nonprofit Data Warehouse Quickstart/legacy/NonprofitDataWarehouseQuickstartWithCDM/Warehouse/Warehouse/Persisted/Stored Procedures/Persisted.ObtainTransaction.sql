CREATE PROC [Persisted].[ObtainTransaction] 
AS
-- ==============================================================================================================

-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

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
			,MsnfpAdjustmentComment
			,MsnfpAdjustmentReason
			,MsnfpAdjustmentReasonDisplay
			,MsnfpAdjustmentType
			,MsnfpAdjustmentTypeDisplay
			,MsnfpAmount
			,MsnfpAmountBase
			,MsnfpAnonymity
			,MsnfpAnonymityDisplay
			,MsnfpBookdate
			,CreatedBy
			,CreatedOnBehalfBy
			,CreatedOn
			,TransactionCurrencyId
			,MsiatiCurrencyValuedate
			,MsnfpDataEntryReference
			,MsnfpDataEntrySource
			,MsnfpDataEntrySourceDisplay
			,MsiatiDescription
			,MsiatiDisbursementchannelid
			,MsnfpEffectiveCampaignId
			,MsnfpEffectiveSourceCode
			,ExchangeRate
			,MsnfpExchangeRateDate
			,MsiatiFinanceTypeId
			,MsiatiFlowTypeId
			,MsiatiHumanitarian
			,ImportSequenceNumber
			,MsnfpIsAdjusted
			,ModifiedBy
			,ModifiedOnBehalfBy
			,ModifiedOn
			,MsnfpName
			,MsnfpOriginalTxnAdjustedId
			,MsnfpOriginatingCampaignId
			,MsnfpOriginatingSourceCode
			,OwnerId
			,OwningBusinessUnit
			,OwningTeam
			,OwningUser
			,MsnfpTransactionPaymentMethodId
			,MsnfpTransactionPaymentScheduleid
			,MsnfpPostedDate
			,MsiatiProviderActivityIdentifier
			,MsiatiProviderOrganizationId
			,MsnfpTransactionReceiptonAccountId
			,MsnfpReceivedDate
			,MsiatiRecipientActivityidentifier
			,MsiatiRecipientCountryId
			,MsiatiRecipientCountryDescription
			,MsiatiRecipientOrganizationId
			,MsiatiRecipientRegionId
			,MsiatiRecipientRegionDescription
			,OverriddenCreatedOn
			,MsiatiReference
			,StateCode
			,StateCodeDisplay
			,StatusCode
			,StatusCodeDisplay
			,MsiatiTiedStatusId
			,TimeZoneRuleVersionNumber
			,MsnfpTransactionId
			,UtcConversionTimeZoneCode
			,VersionNumber								
		FROM	
		-- CREATE A CHANGE HASH COLUMN TO COMPARE WITH EXISTING RECORDS IN THE PERSISTED TABLE
		(
			SELECT 
				HASHBYTES('SHA2_256', CONCAT_WS('|', 
										ISNULL(UPPER(msnfp_adjustmentcomment),'UNKNOWN')
										,ISNULL(UPPER(msnfp_adjustmentreason),'UNKNOWN')
										,ISNULL(UPPER(msnfp_adjustmentreason_display),'UNKNOWN')
										,ISNULL(UPPER(msnfp_adjustmenttype),'UNKNOWN')
										,ISNULL(UPPER(msnfp_adjustmenttype_display),'UNKNOWN')
										,ISNULL(msnfp_amount,0)
										,ISNULL(msnfp_amount_base,0)
										,ISNULL(UPPER(msnfp_anonymity),'UNKNOWN')
										,ISNULL(UPPER(msnfp_anonymity_display),'UNKNOWN')
										,ISNULL(msnfp_bookdate,'1900-01-01 00:00:00')
										,ISNULL(UPPER(createdby),'UNKNOWN')
										,ISNULL(UPPER(createdonbehalfby),'UNKNOWN')
										,ISNULL(createdon,'1900-01-01 00:00:00')
										,ISNULL(UPPER(transactioncurrencyid),'UNKNOWN')
										,ISNULL(msiati_currencyvaluedate,'1900-01-01 00:00:00')
										,ISNULL(UPPER(msnfp_dataentryreference),'UNKNOWN')
										,ISNULL(UPPER(msnfp_dataentrysource),'UNKNOWN')
										,ISNULL(UPPER(msnfp_dataentrysource_display),'UNKNOWN')
										,ISNULL(UPPER(msiati_description),'UNKNOWN')
										,ISNULL(UPPER(msiati_disbursementchannelid),'UNKNOWN')
										,ISNULL(UPPER(msnfp_effectivecampaignid),'UNKNOWN')
										,ISNULL(UPPER(msnfp_effectivesourcecode),'UNKNOWN')
										,ISNULL(exchangerate,0)
										,ISNULL(msnfp_exchangeratedate,'1900-01-01 00:00:00')
										,ISNULL(UPPER(msiati_financetypeid),'UNKNOWN')
										,ISNULL(UPPER(msiati_flowtypeid),'UNKNOWN')
										,ISNULL(msiati_humanitarian,0)
										,ISNULL(importsequencenumber,0)
										,ISNULL(msnfp_isadjusted,0)
										,ISNULL(UPPER(modifiedby),'UNKNOWN')
										,ISNULL(UPPER(modifiedonbehalfby),'UNKNOWN')
										,ISNULL(modifiedon,'1900-01-01 00:00:00')
										,ISNULL(UPPER(msnfp_name),'UNKNOWN')
										,ISNULL(UPPER(msnfp_originaltxnadjustedid),'UNKNOWN')
										,ISNULL(UPPER(msnfp_originatingcampaignid),'UNKNOWN')
										,ISNULL(UPPER(msnfp_originatingsourcecode),'UNKNOWN')
										,ISNULL(UPPER(ownerid),'UNKNOWN')
										,ISNULL(UPPER(owningbusinessunit),'UNKNOWN')
										,ISNULL(UPPER(owningteam),'UNKNOWN')
										,ISNULL(UPPER(owninguser),'UNKNOWN')
										,ISNULL(UPPER(msnfp_transaction_paymentmethodid),'UNKNOWN')
										,ISNULL(UPPER(msnfp_transaction_paymentscheduleid),'UNKNOWN')
										,ISNULL(msnfp_posteddate,'1900-01-01 00:00:00')
										,ISNULL(UPPER(msiati_provideractivityidentifier),'UNKNOWN')
										,ISNULL(UPPER(msiati_provideriorganizationid),'UNKNOWN')
										,ISNULL(UPPER(msnfp_transaction_receiptonaccountid),'UNKNOWN')
										,ISNULL(msnfp_receiveddate,'1900-01-01 00:00:00')
										,ISNULL(UPPER(msiati_recipientactivityidentifier),'UNKNOWN')
										,ISNULL(UPPER(msiati_recipientcountryid),'UNKNOWN')
										,ISNULL(UPPER(msiati_recipientcountrydescription),'UNKNOWN')
										,ISNULL(UPPER(msiati_recipientorganizationid),'UNKNOWN')
										,ISNULL(UPPER(msiati_recipientregionid),'UNKNOWN')
										,ISNULL(UPPER(msiati_recipientregiondescription),'UNKNOWN')
										,ISNULL(overriddencreatedon,'1900-01-01 00:00:00')
										,ISNULL(UPPER(msiati_reference),'UNKNOWN')
										,ISNULL(UPPER(statecode),'UNKNOWN')
										,ISNULL(UPPER(statecode_display),'UNKNOWN')
										,ISNULL(UPPER(statuscode),'UNKNOWN')
										,ISNULL(UPPER(statuscode_display),'UNKNOWN')
										,ISNULL(UPPER(msiati_tiedstatusid),'UNKNOWN')
										,ISNULL(timezoneruleversionnumber,0)
										,ISNULL(UPPER(msnfp_transactionid),'UNKNOWN')
										,ISNULL(utcconversiontimezonecode,0)
										,ISNULL(UPPER(versionnumber),0)
									))								         AS [TransactionChangeHash]
							,msnfp_adjustmentcomment             	         AS	MsnfpAdjustmentComment
							,msnfp_adjustmentreason              	         AS	MsnfpAdjustmentReason
							,msnfp_adjustmentreason_display      	         AS	MsnfpAdjustmentReasonDisplay
							,msnfp_adjustmenttype                	         AS	MsnfpAdjustmentType
							,msnfp_adjustmenttype_display        	         AS	MsnfpAdjustmentTypeDisplay
							,CAST(msnfp_amount AS DECIMAL(18,4))             AS	MsnfpAmount
							,CAST(msnfp_amount_base AS DECIMAL(18,4))        AS	MsnfpAmountBase
							,msnfp_anonymity                     	         AS	MsnfpAnonymity
							,msnfp_anonymity_display             	         AS	MsnfpAnonymityDisplay
							,CAST(msnfp_bookdate AS DATETIME2(7))            AS	MsnfpBookdate
							,createdby                           	         AS	CreatedBy
							,createdonbehalfby                   	         AS	CreatedOnBehalfBy
							,CAST(createdon AS DATETIME2(7))                 AS	CreatedOn
							,transactioncurrencyid               	         AS	TransactionCurrencyId
							,CAST(msiati_currencyvaluedate AS DATETIME2(7))  AS	MsiatiCurrencyValuedate
							,msnfp_dataentryreference            	         AS	MsnfpDataEntryReference
							,msnfp_dataentrysource               	         AS	MsnfpDataEntrySource
							,msnfp_dataentrysource_display       	         AS	MsnfpDataEntrySourceDisplay
							,msiati_description                  	         AS	MsiatiDescription
							,msiati_disbursementchannelid        	         AS	MsiatiDisbursementchannelid
							,msnfp_effectivecampaignid           	         AS	MsnfpEffectiveCampaignId
							,msnfp_effectivesourcecode           	         AS	MsnfpEffectiveSourceCode
							,CAST(exchangerate AS DECIMAL(18,4))             AS	ExchangeRate
							,CAST(msnfp_exchangeratedate AS DATETIME2(7))    AS	MsnfpExchangeRateDate
							,msiati_financetypeid                	         AS	MsiatiFinanceTypeId
							,msiati_flowtypeid                   	         AS	MsiatiFlowTypeId
							,CAST(msiati_humanitarian AS BIT)                AS	MsiatiHumanitarian
							,CAST(importsequencenumber AS INT)               AS	ImportSequenceNumber
							,CAST(msnfp_isadjusted AS BIT)                   AS	MsnfpIsAdjusted
							,modifiedby                          	         AS	ModifiedBy
							,modifiedonbehalfby                  	         AS	ModifiedOnBehalfBy
							,CAST(modifiedon AS DATETIME2(7))                AS	ModifiedOn
							,msnfp_name                          	         AS	MsnfpName
							,msnfp_originaltxnadjustedid         	         AS	MsnfpOriginalTxnAdjustedId
							,msnfp_originatingcampaignid         	         AS	MsnfpOriginatingCampaignId
							,msnfp_originatingsourcecode         	         AS	MsnfpOriginatingSourceCode
							,ownerid                             	         AS	OwnerId
							,owningbusinessunit                  	         AS	OwningBusinessUnit
							,owningteam                          	         AS	OwningTeam
							,owninguser                          	         AS	OwningUser
							,msnfp_transaction_paymentmethodid   	         AS	MsnfpTransactionPaymentMethodId
							,msnfp_transaction_paymentscheduleid 	         AS	MsnfpTransactionPaymentScheduleid
							,CAST(msnfp_posteddate AS DATETIME2(7))          AS	MsnfpPostedDate
							,msiati_provideractivityidentifier   	         AS	MsiatiProviderActivityIdentifier
							,msiati_provideriorganizationid      	         AS	MsiatiProviderOrganizationId
							,msnfp_transaction_receiptonaccountid	         AS	MsnfpTransactionReceiptonAccountId
							,CAST(msnfp_receiveddate AS DATETIME2(7))        AS	MsnfpReceivedDate
							,msiati_recipientactivityidentifier  	         AS	MsiatiRecipientActivityidentifier
							,msiati_recipientcountryid           	         AS	MsiatiRecipientCountryId
							,msiati_recipientcountrydescription  	         AS	MsiatiRecipientCountryDescription
							,msiati_recipientorganizationid      	         AS	MsiatiRecipientOrganizationId
							,msiati_recipientregionid            	         AS	MsiatiRecipientRegionId
							,msiati_recipientregiondescription   	         AS	MsiatiRecipientRegionDescription
							,CAST(overriddencreatedon AS DATETIME2(7))       AS	OverriddenCreatedOn
							,msiati_reference                    	         AS	MsiatiReference
							,statecode                           	         AS	StateCode
							,statecode_display                   	         AS	StateCodeDisplay
							,statuscode                          	         AS	StatusCode
							,statuscode_display                  	         AS	StatusCodeDisplay
							,msiati_tiedstatusid                 	         AS	MsiatiTiedStatusId
							,CAST(timezoneruleversionnumber AS INT)          AS	TimeZoneRuleVersionNumber
							,ISNULL(msnfp_transactionid, 'UNKNOWN')          AS	MsnfpTransactionId
							,CAST(utcconversiontimezonecode AS INT)          AS	UtcConversionTimeZoneCode
							,CAST(versionnumber AS BIGINT)                   AS	VersionNumber
											
			FROM 
			(		
				-- APPLY ROW NUMBER TO REMOVE DUPLICATES AND ONLY SELECT THE MOST RECENT RECORDS
				SELECT DISTINCT
					msnfp_adjustmentcomment
					,msnfp_adjustmentreason
					,msnfp_adjustmentreason_display
					,msnfp_adjustmenttype
					,msnfp_adjustmenttype_display
					,msnfp_amount
					,msnfp_amount_base
					,msnfp_anonymity
					,msnfp_anonymity_display
					,msnfp_bookdate
					,createdby
					,createdonbehalfby
					,createdon
					,transactioncurrencyid
					,msiati_currencyvaluedate
					,msnfp_dataentryreference
					,msnfp_dataentrysource
					,msnfp_dataentrysource_display
					,msiati_description
					,msiati_disbursementchannelid
					,msnfp_effectivecampaignid
					,msnfp_effectivesourcecode
					,exchangerate
					,msnfp_exchangeratedate
					,msiati_financetypeid
					,msiati_flowtypeid
					,msiati_humanitarian
					,importsequencenumber
					,msnfp_isadjusted
					,modifiedby
					,modifiedonbehalfby
					,modifiedon
					,msnfp_name
					,msnfp_originaltxnadjustedid
					,msnfp_originatingcampaignid
					,msnfp_originatingsourcecode
					,ownerid
					,owningbusinessunit
					,owningteam
					,owninguser
					,msnfp_transaction_paymentmethodid
					,msnfp_transaction_paymentscheduleid
					,msnfp_posteddate
					,msiati_provideractivityidentifier
					,msiati_provideriorganizationid
					,msnfp_transaction_receiptonaccountid
					,msnfp_receiveddate
					,msiati_recipientactivityidentifier
					,msiati_recipientcountryid
					,msiati_recipientcountrydescription
					,msiati_recipientorganizationid
					,msiati_recipientregionid
					,msiati_recipientregiondescription
					,overriddencreatedon
					,msiati_reference
					,statecode
					,statecode_display
					,statuscode
					,statuscode_display
					,msiati_tiedstatusid
					,timezoneruleversionnumber
					,msnfp_transactionid
					,utcconversiontimezonecode
					,versionnumber
					,ROW_NUMBER() OVER(PARTITION BY [msnfp_Transactionid] ORDER BY COALESCE([overriddencreatedon],[createdon]),[modifiedon] DESC) AS RowOrdinal
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
			,S.TransactionChangeHash
			,S.MsnfpAdjustmentComment
			,S.MsnfpAdjustmentReason					
			,S.MsnfpAdjustmentReasonDisplay			
			,S.MsnfpAdjustmentType						
			,S.MsnfpAdjustmentTypeDisplay				
			,S.MsnfpAmount								
			,S.MsnfpAmountBase							
			,S.MsnfpAnonymity							
			,S.MsnfpAnonymityDisplay					
			,S.MsnfpBookdate							
			,S.CreatedBy								
			,S.CreatedOnBehalfBy						
			,S.CreatedOn								
			,S.TransactionCurrencyId					
			,S.MsiatiCurrencyValuedate					
			,S.MsnfpDataEntryReference					
			,S.MsnfpDataEntrySource					
			,S.MsnfpDataEntrySourceDisplay				
			,S.MsiatiDescription						
			,S.MsiatiDisbursementchannelid				
			,S.MsnfpEffectiveCampaignId				
			,S.MsnfpEffectiveSourceCode				
			,S.ExchangeRate							
			,S.MsnfpExchangeRateDate					
			,S.MsiatiFinanceTypeId						
			,S.MsiatiFlowTypeId						
			,S.MsiatiHumanitarian						
			,S.ImportSequenceNumber					
			,S.MsnfpIsAdjusted							
			,S.ModifiedBy								
			,S.ModifiedOnBehalfBy						
			,S.ModifiedOn								
			,S.MsnfpName								
			,S.MsnfpOriginalTxnAdjustedId				
			,S.MsnfpOriginatingCampaignId				
			,S.MsnfpOriginatingSourceCode				
			,S.OwnerId									
			,S.OwningBusinessUnit						
			,S.OwningTeam								
			,S.OwningUser								
			,S.MsnfpTransactionPaymentMethodId			
			,S.MsnfpTransactionPaymentScheduleid		
			,S.MsnfpPostedDate							
			,S.MsiatiProviderActivityIdentifier		
			,S.MsiatiProviderOrganizationId			
			,S.MsnfpTransactionReceiptonAccountId		
			,S.MsnfpReceivedDate						
			,S.MsiatiRecipientActivityidentifier		
			,S.MsiatiRecipientCountryId				
			,S.MsiatiRecipientCountryDescription		
			,S.MsiatiRecipientOrganizationId			
			,S.MsiatiRecipientRegionId					
			,S.MsiatiRecipientRegionDescription		
			,S.OverriddenCreatedOn						
			,S.MsiatiReference							
			,S.StateCode								
			,S.StateCodeDisplay						
			,S.StatusCode								
			,S.StatusCodeDisplay						
			,S.MsiatiTiedStatusId						
			,S.TimeZoneRuleVersionNumber				
			,S.MsnfpTransactionId						
			,S.UtcConversionTimeZoneCode				
			,S.VersionNumber													
			,GETDATE() AS [InsertedDate]
		FROM [Scratch].[Transaction] AS S
		UNION ALL
		-- KEEP ROWS THAT ARE NOT BEING TOUCHED
		SELECT 
			 P.TransactionKey
			,P.TransactionChangeHash
			,P.MsnfpAdjustmentComment
			,P.MsnfpAdjustmentReason					
			,P.MsnfpAdjustmentReasonDisplay			
			,P.MsnfpAdjustmentType						
			,P.MsnfpAdjustmentTypeDisplay				
			,P.MsnfpAmount								
			,P.MsnfpAmountBase							
			,P.MsnfpAnonymity							
			,P.MsnfpAnonymityDisplay					
			,P.MsnfpBookdate							
			,P.CreatedBy								
			,P.CreatedOnBehalfBy						
			,P.CreatedOn								
			,P.TransactionCurrencyId					
			,P.MsiatiCurrencyValuedate					
			,P.MsnfpDataEntryReference					
			,P.MsnfpDataEntrySource					
			,P.MsnfpDataEntrySourceDisplay				
			,P.MsiatiDescription						
			,P.MsiatiDisbursementchannelid				
			,P.MsnfpEffectiveCampaignId				
			,P.MsnfpEffectiveSourceCode				
			,P.ExchangeRate							
			,P.MsnfpExchangeRateDate					
			,P.MsiatiFinanceTypeId						
			,P.MsiatiFlowTypeId						
			,P.MsiatiHumanitarian						
			,P.ImportSequenceNumber					
			,P.MsnfpIsAdjusted							
			,P.ModifiedBy								
			,P.ModifiedOnBehalfBy						
			,P.ModifiedOn								
			,P.MsnfpName								
			,P.MsnfpOriginalTxnAdjustedId				
			,P.MsnfpOriginatingCampaignId				
			,P.MsnfpOriginatingSourceCode				
			,P.OwnerId									
			,P.OwningBusinessUnit						
			,P.OwningTeam								
			,P.OwningUser								
			,P.MsnfpTransactionPaymentMethodId			
			,P.MsnfpTransactionPaymentScheduleid		
			,P.MsnfpPostedDate							
			,P.MsiatiProviderActivityIdentifier		
			,P.MsiatiProviderOrganizationId			
			,P.MsnfpTransactionReceiptonAccountId		
			,P.MsnfpReceivedDate						
			,P.MsiatiRecipientActivityidentifier		
			,P.MsiatiRecipientCountryId				
			,P.MsiatiRecipientCountryDescription		
			,P.MsiatiRecipientOrganizationId			
			,P.MsiatiRecipientRegionId					
			,P.MsiatiRecipientRegionDescription		
			,P.OverriddenCreatedOn						
			,P.MsiatiReference							
			,P.StateCode								
			,P.StateCodeDisplay						
			,P.StatusCode								
			,P.StatusCodeDisplay						
			,P.MsiatiTiedStatusId						
			,P.TimeZoneRuleVersionNumber				
			,P.MsnfpTransactionId						
			,P.UtcConversionTimeZoneCode				
			,P.VersionNumber	
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
		RENAME OBJECT [Persisted].[Transaction] TO [Transaction_old];
		RENAME OBJECT [Persisted].[Transaction_Upsert] TO [Transaction];
		DROP TABLE [Persisted].[Transaction_old];
		

	END TRY

	BEGIN CATCH
		--CTAS FAILED, MARK PROCESS AS FAILED AND THROW ERROR
		DECLARE @ErrorMsg	VARCHAR(250)
		SET @ErrorMsg = 'Error loading table Persisted.Transaction: ' + ERROR_MESSAGE()
		RAISERROR (@ErrorMsg, 16, 1)
	END CATCH

END
