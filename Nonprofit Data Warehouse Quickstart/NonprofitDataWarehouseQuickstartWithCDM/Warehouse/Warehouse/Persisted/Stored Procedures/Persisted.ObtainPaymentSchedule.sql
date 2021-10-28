CREATE PROC [Persisted].[ObtainPaymentSchedule] 
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

		IF OBJECT_ID ('Scratch.PaymentSchedule','U') IS NOT NULL 
			DROP TABLE [Scratch].[PaymentSchedule];

		-- RE-CREATE CTAS AND POPULATE WITH NEW VALUES
		CREATE TABLE [Scratch].[PaymentSchedule]
		WITH
		(
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS
		SELECT 
			 [PaymentScheduleChangeHash]
			,CreatedBy                                   
			,CreatedOnBehalfBy                           
			,CreatedOn                                   
			,TransactionCurrencyId                       
			,MsnfpOmtschedDefaultHardCreditToCustomer    
			,MsnfpPaymentScheduleDonorCommitmentId       
			,ExchangeRate                                
			,MsnfpFirstpaymentDate                       
			,MsnfpFrequency                              
			,MsnfpFrequencyDisplay                       
			,MsnfpFrequencyInterval                      
			,ImportSequenceNumber                        
			,MsnfpLastPaymentDate                        
			,ModifiedBy                                  
			,ModifiedOnBehalfBy                          
			,ModifiedOn                                  
			,MsnfpName                                   
			,MsnfpNextPaymentAmount                      
			,MsnfpNextPaymentAmountBase                  
			,MsnfpNextPaymentDate                        
			,MsnfpNumberOfPayments                       
			,OwnerId                                     
			,OwningBusinessUnit                          
			,OwningTeam                                  
			,OwningUser                                  
			,MsnfpPaymentScheduleId                      
			,MsnfpReceiptonAccountId                     
			,OverriddenCreatedOn                         
			,MsnfpRecurringAmount                        
			,MsnfpRecurringAmountBase                    
			,StateCode                                   
			,StateCodeDisplay                            
			,StatusCode                                  
			,StatusCodeDisplay                           
			,TimezoneRuleVersionNumber                   
			,MsnfpTotalAmount                            
			,MsnfpTotalAmountBase                        
			,UtcConversionTimezoneCode                   
			,VersionNumber                               
		FROM	
		-- CREATE A CHANGE HASH COLUMN TO COMPARE WITH EXISTING RECORDS IN THE PERSISTED TABLE
		(
			SELECT 
				HASHBYTES('SHA2_256', CONCAT_WS('|', 
								    	 ISNULL(UPPER(createdby),'UNKNOWN')	                                   
								    	,ISNULL(UPPER(createdonbehalfby),'UNKNOWN')	                           
								    	,ISNULL(createdon,'1900-01-01 00:00:00')	                                   
								    	,ISNULL(UPPER(transactioncurrencyid),'UNKNOWN')	                       
								    	,ISNULL(UPPER(msnfp_omtsched_defaulthardcredittocustomer),'UNKNOWN')	  
								    	,ISNULL(UPPER(msnfp_paymentschedule_donorcommitmentid),'UNKNOWN')	     
								    	,ISNULL(exchangerate,0)	                                
								    	,ISNULL(msnfp_firstpaymentdate,'1900-01-01 00:00:00')	                      
								    	,ISNULL(msnfp_frequency,0)	                             
								    	,ISNULL(UPPER(msnfp_frequency_display),'UNKNOWN')	                     
								    	,ISNULL(msnfp_frequencyinterval,0)	                     
								    	,ISNULL(importsequencenumber,0)	                        
								    	,ISNULL(msnfp_lastpaymentdate,'1900-01-01 00:00:00')	                       
								    	,ISNULL(UPPER(modifiedby),'UNKNOWN')	                                  
								    	,ISNULL(UPPER(modifiedonbehalfby),'UNKNOWN')	                          
								    	,ISNULL(modifiedon,'1900-01-01 00:00:00')	                                  
								    	,ISNULL(UPPER(msnfp_name),'UNKNOWN')	                                  
								    	,ISNULL(msnfp_nextpaymentamount,0)	                     
								    	,ISNULL(msnfp_nextpaymentamount_base,0)	                
								    	,ISNULL(msnfp_nextpaymentdate,'1900-01-01 00:00:00')	                       
								    	,ISNULL(msnfp_numberofpayments,0)	                      
								    	,ISNULL(UPPER(ownerid),'UNKNOWN')	                                     
								    	,ISNULL(UPPER(owningbusinessunit),'UNKNOWN')	                          
								    	,ISNULL(UPPER(owningteam),'UNKNOWN')	                                  
								    	,ISNULL(UPPER(owninguser),'UNKNOWN')	                                  
								    	,ISNULL(UPPER(msnfp_paymentscheduleid),'UNKNOWN')	                     
								    	,ISNULL(UPPER(msnfp_receiptonaccountid),'UNKNOWN')	                    
								    	,ISNULL(overriddencreatedon,'1900-01-01 00:00:00')	                         
								    	,ISNULL(msnfp_recurringamount,0)	                       
								    	,ISNULL(msnfp_recurringamount_base,0)	                  
								    	,ISNULL(statecode,0)	                                   
								    	,ISNULL(UPPER(statecode_display),'UNKNOWN')	                           
								    	,ISNULL(statuscode,0)	                                  
								    	,ISNULL(UPPER(statuscode_display),'UNKNOWN')	                          
								    	,ISNULL(timezoneruleversionnumber,0)	                   
								    	,ISNULL(msnfp_totalamount,0)	                           
								    	,ISNULL(msnfp_totalamount_base,0)	                      
								    	,ISNULL(utcconversiontimezonecode,0)	 
								    	,ISNULL(versionnumber,0)
									))								       AS [PaymentScheduleChangeHash]
					 ,createdby                                            AS CreatedBy                                    
					 ,createdonbehalfby                            	       AS CreatedOnBehalfBy                       	
					 ,CAST(createdon AS DATETIME2(7))                      AS CreatedOn                                    
					 ,transactioncurrencyid                        	       AS TransactionCurrencyId                        
					 ,msnfp_omtsched_defaulthardcredittocustomer   	       AS MsnfpOmtschedDefaultHardCreditToCustomer     
					 ,msnfp_paymentschedule_donorcommitmentid      	       AS MsnfpPaymentScheduleDonorCommitmentId        
					 ,CAST(exchangerate AS DECIMAL(18,4))                  AS ExchangeRate                                 
					 ,CAST(msnfp_firstpaymentdate AS DATETIME2(7))         AS MsnfpFirstpaymentDate                        
					 ,CAST(msnfp_frequency AS BIGINT)                      AS MsnfpFrequency                               
					 ,msnfp_frequency_display                      	       AS MsnfpFrequencyDisplay                        
					 ,CAST(msnfp_frequencyinterval AS BIGINT)              AS MsnfpFrequencyInterval                       
					 ,CAST(importsequencenumber AS BIGINT)                 AS ImportSequenceNumber                         
					 ,CAST(msnfp_lastpaymentdate AS DATETIME2(7))          AS MsnfpLastPaymentDate                         
					 ,modifiedby                                   	       AS ModifiedBy                                   
					 ,modifiedonbehalfby                           	       AS ModifiedOnBehalfBy                           
					 ,CAST(modifiedon AS DATETIME2(7))                     AS ModifiedOn                                   
					 ,msnfp_name                                   	       AS MsnfpName                                    
					 ,CAST(msnfp_nextpaymentamount AS DECIMAL(18,4))       AS MsnfpNextPaymentAmount                       
					 ,CAST(msnfp_nextpaymentamount_base AS DECIMAL(18,4))  AS MsnfpNextPaymentAmountBase                   
					 ,CAST(msnfp_nextpaymentdate AS DATETIME2(7))          AS MsnfpNextPaymentDate                         
					 ,msnfp_numberofpayments                       	       AS MsnfpNumberOfPayments                        
					 ,ownerid                                      	       AS OwnerId                                      
					 ,owningbusinessunit                           	       AS OwningBusinessUnit                           
					 ,owningteam                                   	       AS OwningTeam                                   
					 ,owninguser                                   	       AS OwningUser                                   
					 ,ISNULL(msnfp_paymentscheduleid, 'UNKNOWN')           AS MsnfpPaymentScheduleId                       
					 ,msnfp_receiptonaccountid                     	       AS MsnfpReceiptonAccountId                      
					 ,CAST(overriddencreatedon AS DATETIME2(7))            AS OverriddenCreatedOn                          
					 ,CAST(msnfp_recurringamount AS DECIMAL(18,4))         AS MsnfpRecurringAmount                         
					 ,CAST(msnfp_recurringamount_base AS DECIMAL(18,4))    AS MsnfpRecurringAmountBase                     
					 ,CAST(statecode AS BIGINT)                            AS StateCode                                    
					 ,statecode_display                            	       AS StateCodeDisplay                             
					 ,CAST(statuscode AS BIGINT)                           AS StatusCode                                   
					 ,statuscode_display                           	       AS StatusCodeDisplay                            
					 ,CAST(timezoneruleversionnumber AS BIGINT)            AS TimezoneRuleVersionNumber                    
					 ,CAST(msnfp_totalamount AS DECIMAL(18,4))             AS MsnfpTotalAmount                             
					 ,CAST(msnfp_totalamount_base AS DECIMAL(18,4))        AS MsnfpTotalAmountBase                         
					 ,CAST(utcconversiontimezonecode AS BIGINT)            AS UtcConversionTimezoneCode                    
					 ,CAST(versionnumber AS BIGINT)                        AS VersionNumber                                											
			FROM 
			(		
				-- APPLY ROW NUMBER TO REMOVE DUPLICATES AND ONLY SELECT THE MOST RECENT RECORDS
				SELECT DISTINCT
					  createdby                                    
					 ,createdonbehalfby                            
					 ,createdon                                    
					 ,transactioncurrencyid                        
					 ,msnfp_omtsched_defaulthardcredittocustomer   
					 ,msnfp_paymentschedule_donorcommitmentid      
					 ,exchangerate                                 
					 ,msnfp_firstpaymentdate                       
					 ,msnfp_frequency                              
					 ,msnfp_frequency_display                      
					 ,msnfp_frequencyinterval                      
					 ,importsequencenumber                         
					 ,msnfp_lastpaymentdate                        
					 ,modifiedby                                   
					 ,modifiedonbehalfby                           
					 ,modifiedon                                   
					 ,msnfp_name                                   
					 ,msnfp_nextpaymentamount                      
					 ,msnfp_nextpaymentamount_base                 
					 ,msnfp_nextpaymentdate                        
					 ,msnfp_numberofpayments                       
					 ,ownerid                                      
					 ,owningbusinessunit                           
					 ,owningteam                                   
					 ,owninguser                                   
					 ,msnfp_paymentscheduleid                      
					 ,msnfp_receiptonaccountid                     
					 ,overriddencreatedon                          
					 ,msnfp_recurringamount                        
					 ,msnfp_recurringamount_base                   
					 ,statecode                                    
					 ,statecode_display                            
					 ,statuscode                                   
					 ,statuscode_display                           
					 ,timezoneruleversionnumber                    
					 ,msnfp_totalamount                            
					 ,msnfp_totalamount_base                       
					 ,utcconversiontimezonecode                    
					 ,versionnumber                                
					,ROW_NUMBER() OVER(PARTITION BY [msnfp_paymentscheduleid] ORDER BY COALESCE([overriddencreatedon],[createdon]),[modifiedon] DESC) AS RowOrdinal
	    		FROM [External].[IATIPaymentSchedule]	 
			) A
			WHERE RowOrdinal = 1
		) B
		OPTION(LABEL = 'Scratch.PaymentSchedule.Obtain');


		-- GET THE MAX IDENTITY KEY FROM THE PERSISTED TABLE
		DECLARE @maxKey INT = (SELECT ISNULL(MAX(PaymentScheduleKey),0) FROM [Persisted].[PaymentSchedule])

		-- CREATE A TEMP TABLE USING CTAS TO HANDLE MERGE OPERATIONS
		CREATE TABLE [Persisted].[PaymentSchedule_Upsert]
		WITH
		(	
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS
		-- NEW ROWS AND NEW VERSIONS OF ROWS
		SELECT 
			ROW_NUMBER() OVER(ORDER BY [PaymentScheduleChangeHash] DESC) + @maxKey AS  PaymentScheduleKey
			,S.PaymentScheduleChangeHash						
			,S.CreatedBy                                    
			,S.CreatedOnBehalfBy                            
			,S.CreatedOn                                    
			,S.TransactionCurrencyId                        
			,S.MsnfpOmtschedDefaultHardCreditToCustomer     
			,S.MsnfpPaymentScheduleDonorCommitmentId        
			,S.ExchangeRate                                 
			,S.MsnfpFirstpaymentDate                        
			,S.MsnfpFrequency                               
			,S.MsnfpFrequencyDisplay                        
			,S.MsnfpFrequencyInterval                       
			,S.ImportSequenceNumber                         
			,S.MsnfpLastPaymentDate                         
			,S.ModifiedBy                                   
			,S.ModifiedOnBehalfBy                           
			,S.ModifiedOn                                   
			,S.MsnfpName                                    
			,S.MsnfpNextPaymentAmount                       
			,S.MsnfpNextPaymentAmountBase                   
			,S.MsnfpNextPaymentDate                         
			,S.MsnfpNumberOfPayments                        
			,S.OwnerId                                      
			,S.OwningBusinessUnit                           
			,S.OwningTeam                                   
			,S.OwningUser                                   
			,S.MsnfpPaymentScheduleId                       
			,S.MsnfpReceiptonAccountId                      
			,S.OverriddenCreatedOn                          
			,S.MsnfpRecurringAmount                         
			,S.MsnfpRecurringAmountBase                     
			,S.StateCode                                    
			,S.StateCodeDisplay                             
			,S.StatusCode                                   
			,S.StatusCodeDisplay                            
			,S.TimezoneRuleVersionNumber                    
			,S.MsnfpTotalAmount                             
			,S.MsnfpTotalAmountBase                         
			,S.UtcConversionTimezoneCode                    
			,S.VersionNumber                  								
			,GETDATE() AS [InsertedDate]
		FROM [Scratch].[PaymentSchedule] AS S
		UNION ALL
		-- KEEP ROWS THAT ARE NOT BEING TOUCHED
		SELECT 
			 P.PaymentScheduleKey                           
			,P.PaymentScheduleChangeHash						
			,P.CreatedBy                                    
			,P.CreatedOnBehalfBy                            
			,P.CreatedOn                                    
			,P.TransactionCurrencyId                        
			,P.MsnfpOmtschedDefaultHardCreditToCustomer     
			,P.MsnfpPaymentScheduleDonorCommitmentId        
			,P.ExchangeRate                                 
			,P.MsnfpFirstpaymentDate                        
			,P.MsnfpFrequency                               
			,P.MsnfpFrequencyDisplay                        
			,P.MsnfpFrequencyInterval                       
			,P.ImportSequenceNumber                         
			,P.MsnfpLastPaymentDate                         
			,P.ModifiedBy                                   
			,P.ModifiedOnBehalfBy                           
			,P.ModifiedOn                                   
			,P.MsnfpName                                    
			,P.MsnfpNextPaymentAmount                       
			,P.MsnfpNextPaymentAmountBase                   
			,P.MsnfpNextPaymentDate                         
			,P.MsnfpNumberOfPayments                        
			,P.OwnerId                                      
			,P.OwningBusinessUnit                           
			,P.OwningTeam                                   
			,P.OwningUser                                   
			,P.MsnfpPaymentScheduleId                       
			,P.MsnfpReceiptonAccountId                      
			,P.OverriddenCreatedOn                          
			,P.MsnfpRecurringAmount                         
			,P.MsnfpRecurringAmountBase                     
			,P.StateCode                                    
			,P.StateCodeDisplay                             
			,P.StatusCode                                   
			,P.StatusCodeDisplay                            
			,P.TimezoneRuleVersionNumber                    
			,P.MsnfpTotalAmount                             
			,P.MsnfpTotalAmountBase                         
			,P.UtcConversionTimezoneCode                    
			,P.VersionNumber                                
			,GETDATE() AS [InsertedDate]
		FROM [Persisted].[PaymentSchedule] AS P
		WHERE NOT EXISTS
		(
			SELECT *
			FROM [Scratch].[PaymentSchedule] S
			WHERE S.[PaymentScheduleChangeHash] = P.[PaymentScheduleChangeHash]
		)
		OPTION(LABEL = 'Persisted.PaymentSchedule.Obtain');

		-- KEEP LATEST CTAS AND DELETE PREVIOUS ONE
		RENAME OBJECT [Persisted].[PaymentSchedule] TO [PaymentSchedule_old];
		RENAME OBJECT [Persisted].[PaymentSchedule_Upsert] TO [PaymentSchedule];
		DROP TABLE [Persisted].[PaymentSchedule_old];
		

	END TRY

	BEGIN CATCH
		--CTAS FAILED, MARK PROCESS AS FAILED AND THROW ERROR
		DECLARE @ErrorMsg	VARCHAR(250)
		SET @ErrorMsg = 'Error loading table Persisted.PaymentSchedule: ' + ERROR_MESSAGE()
		RAISERROR (@ErrorMsg, 16, 1)
	END CATCH

END
