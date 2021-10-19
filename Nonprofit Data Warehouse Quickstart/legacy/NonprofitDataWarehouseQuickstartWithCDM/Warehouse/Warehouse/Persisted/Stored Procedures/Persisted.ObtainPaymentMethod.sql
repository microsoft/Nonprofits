CREATE PROC [Persisted].[ObtainPaymentMethod] 
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

		IF OBJECT_ID ('Scratch.PaymentMethod','U') IS NOT NULL 
			DROP TABLE [Scratch].[PaymentMethod];

		-- RE-CREATE CTAS AND POPULATE WITH NEW VALUES
		CREATE TABLE [Scratch].[PaymentMethod]
		WITH
		(
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS
		SELECT 
			 [PaymentMethodChangeHash]
			,MsnfpComments									
			,MsnfpContactId									
			,CreatedBy										
			,CreatedOnBehalfBy								
			,CreatedOn										
			,ImportSequenceNumber							
			,MsnfpIsDefault									
			,MsnfpLastAuthenticationStatus					
			,MsnfpLastAuthenticationStatusDisplay			
			,MsnfpLastAuthenticationStatusDate				
			,MsnfpLastAuthenticationStatusDetail			
			,MsnfpLastAuthenticationStatusTechnicalDetail	
			,ModifiedBy										
			,ModifiedOnBehalfBy								
			,ModifiedOn										
			,MsnfpName										
			,OwnerId										
			,OwningBusinessUnit								
			,OwningTeam										
			,OwningUser										
			,MsnfpPaymentMethodId							
			,MsnfpPaymentScheduleId							
			,MsnfpPayorId									
			,OverriddenCreatedOn							
			,StateCode										
			,StateCodeDisplay								
			,StatusCode										
			,StatusCodeDisplay								
			,TimezoneRuleVersionNumber						
			,MsnfpTransactionId								
			,MsnfpType										
			,MsnfpTypeDisplay								
			,UtcConversionTimezoneCode						
			,VersionNumber									
		FROM	
		-- CREATE A CHANGE HASH COLUMN TO COMPARE WITH EXISTING RECORDS IN THE PERSISTED TABLE
		(
			SELECT 
				HASHBYTES('SHA2_256', CONCAT_WS('|', 
										 ISNULL(UPPER(msnfp_comments),'UNKNOWN')									 
										,ISNULL(UPPER(msnfp_contactid),'UNKNOWN')                                
										,ISNULL(UPPER(createdby),'UNKNOWN')                      
										,ISNULL(UPPER(createdonbehalfby),'UNKNOWN')                            
										,ISNULL(createdon,'1900-01-01 00:00:00')                  
										,ISNULL(importsequencenumber,0)                            
										,ISNULL(msnfp_isdefault,0)                
										,ISNULL(msnfp_lastauthenticationstatus,0)
										,ISNULL(UPPER(msnfp_lastauthenticationstatus_display),'UNKNOWN')     
										,ISNULL(msnfp_lastauthenticationstatusdate,'1900-01-01 00:00:00')
										,ISNULL(UPPER(msnfp_lastauthenticationstatusdetail),'UNKNOWN') 
										,ISNULL(UPPER(msnfp_lastauthenticationstatustechnicaldetail),'UNKNOWN')
										,ISNULL(UPPER(modifiedby),'UNKNOWN')
										,ISNULL(UPPER(modifiedonbehalfby),'UNKNOWN')                          
										,ISNULL(modifiedon,'1900-01-01 00:00:00')                   
										,ISNULL(UPPER(msnfp_name),'UNKNOWN')                          
										,ISNULL(UPPER(ownerid),'UNKNOWN')                        
										,ISNULL(UPPER(owningbusinessunit),'UNKNOWN')                            
										,ISNULL(UPPER(owningteam),'UNKNOWN')              
										,ISNULL(UPPER(owninguser),'UNKNOWN')                      
										,ISNULL(UPPER(msnfp_paymentmethodid),'UNKNOWN')                         
										,ISNULL(UPPER(msnfp_paymentscheduleid),'UNKNOWN')              
										,ISNULL(UPPER(msnfp_payorid),'UNKNOWN')      
										,ISNULL(overriddencreatedon,'1900-01-01 00:00:00')                   
										,ISNULL(statecode,0)        
										,ISNULL(UPPER(statecode_display),'UNKNOWN')                         
										,ISNULL(statuscode,0)          
										,ISNULL(UPPER(statuscode_display),'UNKNOWN')                    
										,ISNULL(timezoneruleversionnumber,0)                
										,ISNULL(UPPER(msnfp_transactionid),'UNKNOWN')    
										,ISNULL(msnfp_type,0)    
										,ISNULL(UPPER(msnfp_type_display),'UNKNOWN')                   
										,ISNULL(utcconversiontimezonecode,0)                 
										,ISNULL(versionnumber,0)         
									))								          AS [PaymentMethodChangeHash]
					,msnfp_comments									          AS MsnfpComments									
					,msnfp_contactid                                          AS MsnfpContactId									
					,createdby                                                AS CreatedBy										
					,createdonbehalfby                                        AS CreatedOnBehalfBy								
					,CAST(createdon AS DATETIME2(7))                          AS CreatedOn										
					,CAST(importsequencenumber AS BIGINT)                     AS ImportSequenceNumber							
					,CAST(msnfp_isdefault AS BIT)                             AS MsnfpIsDefault									
					,CAST(msnfp_lastauthenticationstatus AS BIGINT)           AS MsnfpLastAuthenticationStatus					
					,msnfp_lastauthenticationstatus_display                   AS MsnfpLastAuthenticationStatusDisplay			
					,CAST(msnfp_lastauthenticationstatusdate AS DATETIME2(7)) AS MsnfpLastAuthenticationStatusDate				
					,msnfp_lastauthenticationstatusdetail                     AS MsnfpLastAuthenticationStatusDetail			
					,msnfp_lastauthenticationstatustechnicaldetail            AS MsnfpLastAuthenticationStatusTechnicalDetail	
					,modifiedby                                               AS ModifiedBy										
					,modifiedonbehalfby                                       AS ModifiedOnBehalfBy								
					,CAST(modifiedon AS DATETIME2(7))                         AS ModifiedOn										
					,msnfp_name                                               AS MsnfpName										
					,ownerid                                                  AS OwnerId										
					,owningbusinessunit                                       AS OwningBusinessUnit								
					,owningteam                                               AS OwningTeam										
					,owninguser                                               AS OwningUser										
					,ISNULL(msnfp_paymentmethodid, 'UNKNOWN')                 AS MsnfpPaymentMethodId							
					,msnfp_paymentscheduleid                                  AS MsnfpPaymentScheduleId							
					,msnfp_payorid                                            AS MsnfpPayorId									
					,CAST(overriddencreatedon AS DATETIME2(7))                AS OverriddenCreatedOn							
					,CAST(statecode AS BIGINT)                                AS StateCode										
					,statecode_display                                        AS StateCodeDisplay								
					,CAST(statuscode AS BIGINT)                               AS StatusCode										
					,statuscode_display                                       AS StatusCodeDisplay								
					,CAST(timezoneruleversionnumber AS BIGINT)                AS TimezoneRuleVersionNumber						
					,msnfp_transactionid                                      AS MsnfpTransactionId								
					,CAST(msnfp_type AS BIGINT)                               AS MsnfpType										
					,msnfp_type_display                                       AS MsnfpTypeDisplay								
					,CAST(utcconversiontimezonecode AS BIGINT)                AS UtcConversionTimezoneCode						
					,CAST(versionnumber AS BIGINT)                            AS VersionNumber												
			FROM 
			(		
				-- APPLY ROW NUMBER TO REMOVE DUPLICATES AND ONLY SELECT THE MOST RECENT RECORDS
				SELECT DISTINCT
					 msnfp_comments                                     
					,msnfp_contactid                                    
					,createdby                                          
					,createdonbehalfby                                  
					,createdon                                          
					,importsequencenumber                               
					,msnfp_isdefault                                    
					,msnfp_lastauthenticationstatus                     
					,msnfp_lastauthenticationstatus_display             
					,msnfp_lastauthenticationstatusdate                 
					,msnfp_lastauthenticationstatusdetail               
					,msnfp_lastauthenticationstatustechnicaldetail      
					,modifiedby                                         
					,modifiedonbehalfby                                 
					,modifiedon                                         
					,msnfp_name                                         
					,ownerid                                            
					,owningbusinessunit                                 
					,owningteam                                         
					,owninguser                                         
					,msnfp_paymentmethodid                              
					,msnfp_paymentscheduleid                            
					,msnfp_payorid                                      
					,overriddencreatedon                                
					,statecode                                          
					,statecode_display                                  
					,statuscode                                         
					,statuscode_display                                 
					,timezoneruleversionnumber                          
					,msnfp_transactionid                                
					,msnfp_type                                         
					,msnfp_type_display                                 
					,utcconversiontimezonecode                          
					,versionnumber
					,ROW_NUMBER() OVER(PARTITION BY [msnfp_paymentmethodid] ORDER BY COALESCE([overriddencreatedon],[createdon]),[modifiedon] DESC) AS RowOrdinal
	    		FROM [External].[IATIPaymentMethod]	 
			) A
			WHERE RowOrdinal = 1
		) B
		OPTION(LABEL = 'Scratch.PaymentMethod.Obtain');


		-- GET THE MAX IDENTITY KEY FROM THE PERSISTED TABLE
		DECLARE @maxKey INT = (SELECT ISNULL(MAX(PaymentMethodKey),0) FROM [Persisted].[PaymentMethod])

		-- CREATE A TEMP TABLE USING CTAS TO HANDLE MERGE OPERATIONS
		CREATE TABLE [Persisted].[PaymentMethod_Upsert]
		WITH
		(	
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS
		-- NEW ROWS AND NEW VERSIONS OF ROWS
		SELECT 
			ROW_NUMBER() OVER(ORDER BY [PaymentMethodChangeHash] DESC) + @maxKey AS  PaymentMethodKey
			,S.[PaymentMethodChangeHash]
			,S.MsnfpComments								
			,S.MsnfpContactId								
			,S.CreatedBy									
			,S.CreatedOnBehalfBy							
			,S.CreatedOn									
			,S.ImportSequenceNumber						
			,S.MsnfpIsDefault								
			,S.MsnfpLastAuthenticationStatus				
			,S.MsnfpLastAuthenticationStatusDisplay		
			,S.MsnfpLastAuthenticationStatusDate			
			,S.MsnfpLastAuthenticationStatusDetail			
			,S.MsnfpLastAuthenticationStatusTechnicalDetail
			,S.ModifiedBy									
			,S.ModifiedOnBehalfBy							
			,S.ModifiedOn									
			,S.MsnfpName									
			,S.OwnerId										
			,S.OwningBusinessUnit							
			,S.OwningTeam									
			,S.OwningUser									
			,S.MsnfpPaymentMethodId						
			,S.MsnfpPaymentScheduleId						
			,S.MsnfpPayorId								
			,S.OverriddenCreatedOn							
			,S.StateCode									
			,S.StateCodeDisplay							
			,S.StatusCode									
			,S.StatusCodeDisplay							
			,S.TimezoneRuleVersionNumber					
			,S.MsnfpTransactionId							
			,S.MsnfpType									
			,S.MsnfpTypeDisplay							
			,S.UtcConversionTimezoneCode					
			,S.VersionNumber								
			,GETDATE() AS [InsertedDate]
		FROM [Scratch].[PaymentMethod] AS S
		UNION ALL
		-- KEEP ROWS THAT ARE NOT BEING TOUCHED
		SELECT 
			 P.PaymentMethodKey
			,P.PaymentMethodChangeHash
			,P.MsnfpComments								
			,P.MsnfpContactId								
			,P.CreatedBy									
			,P.CreatedOnBehalfBy							
			,P.CreatedOn									
			,P.ImportSequenceNumber						
			,P.MsnfpIsDefault								
			,P.MsnfpLastAuthenticationStatus				
			,P.MsnfpLastAuthenticationStatusDisplay		
			,P.MsnfpLastAuthenticationStatusDate			
			,P.MsnfpLastAuthenticationStatusDetail			
			,P.MsnfpLastAuthenticationStatusTechnicalDetail
			,P.ModifiedBy									
			,P.ModifiedOnBehalfBy							
			,P.ModifiedOn									
			,P.MsnfpName									
			,P.OwnerId										
			,P.OwningBusinessUnit							
			,P.OwningTeam									
			,P.OwningUser									
			,P.MsnfpPaymentMethodId						
			,P.MsnfpPaymentScheduleId						
			,P.MsnfpPayorId								
			,P.OverriddenCreatedOn							
			,P.StateCode									
			,P.StateCodeDisplay							
			,P.StatusCode									
			,P.StatusCodeDisplay							
			,P.TimezoneRuleVersionNumber					
			,P.MsnfpTransactionId							
			,P.MsnfpType									
			,P.MsnfpTypeDisplay							
			,P.UtcConversionTimezoneCode					
			,P.VersionNumber	
			,GETDATE() AS [InsertedDate]
		FROM [Persisted].[PaymentMethod] AS P
		WHERE NOT EXISTS
		(
			SELECT *
			FROM [Scratch].[PaymentMethod] S
			WHERE S.[PaymentMethodChangeHash] = P.[PaymentMethodChangeHash]
		)
		OPTION(LABEL = 'Persisted.PaymentMethod.Obtain');

		-- KEEP LATEST CTAS AND DELETE PREVIOUS ONE
		RENAME OBJECT [Persisted].[PaymentMethod] TO [PaymentMethod_old];
		RENAME OBJECT [Persisted].[PaymentMethod_Upsert] TO [PaymentMethod];
		DROP TABLE [Persisted].[PaymentMethod_old];
		

	END TRY

	BEGIN CATCH
		--CTAS FAILED, MARK PROCESS AS FAILED AND THROW ERROR
		DECLARE @ErrorMsg	VARCHAR(250)
		SET @ErrorMsg = 'Error loading table Persisted.PaymentMethod: ' + ERROR_MESSAGE()
		RAISERROR (@ErrorMsg, 16, 1)
	END CATCH

END
