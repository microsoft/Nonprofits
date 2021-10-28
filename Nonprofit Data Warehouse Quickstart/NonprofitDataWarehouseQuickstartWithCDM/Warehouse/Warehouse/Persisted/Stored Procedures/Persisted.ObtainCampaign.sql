CREATE PROC [Persisted].[ObtainCampaign] 
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

		IF OBJECT_ID ('Scratch.Campaign','U') IS NOT NULL 
			DROP TABLE [Scratch].[Campaign];

		-- RE-CREATE CTAS AND POPULATE WITH NEW VALUES
		CREATE TABLE [Scratch].[Campaign]
		WITH
		(
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS
		SELECT 
			 [CampaignChangeHash]
			,StageId								
			,TraversedPath							
			,MsnfpAquisitionSource				
			,ActualEnd							
			,ActualStart							
			,MsnfpAppealSegment					
			,MsnfpAppealSegmentDisplay			
			,BudgetedCost						
			,BudgetedCostBase					
			,CampaignId								
			,MsnfpCampaignCategory				
			,MsnfpCampaignCategoryDisplay		
			,CodeName							
			,MsnfpCampaignType					
			,MsnfpCampaignTypeDisplay			
			,TypeCode							
			,TypeCodeDisplay							
			,MsnfpChannel							
			,MsnfpChannelDisplay					
			,CreatedBy							
			,CreatedOnBehalfBy						
			,CreatedOn							
			,TransactionCurrencyId				
			,MsnfpCampaignDefaultDesignation		
			,Description							
			,MsnfpEffort							
			,MsnfpEffortDisplay					
			,EmailAddress							
			,EntityImage							
			,EntityImageTimestamp				
			,EntityImageUrl						
			,EntityImageId						
			,ExpectedRevenue						
			,ExpectedRevenueBase						
			,ExchangeRate							
			,ExpectedResponse					
			,MsnfpFirstResponseDate				
			,ImportSequenceNumber				
			,MsnfpLastResponseDate					
			,Message								
			,OtherCost								
			,OtherCostBase						
			,ModifiedBy							
			,ModifiedOnBehalfBy					
			,ModifiedOn							
			,Name								
			,Objective								
			,OwnerId									
			,OwningBusinessUnit					
			,OwningTeam							
			,OwningUser							
			,PricelistId								
			,ProcessId							
			,PromotionCodeName					
			,ProposedEnd								
			,ProposedStart						
			,OverriddenCreatedOn						
			,MsnfpSourceCode						
			,MsnfpStartDate						
			,StateCode							
			,StateCodeDisplay					
			,StatusCode							
			,StatusCodeDisplay					
			,MsnfpSubchannel							
			,MsnfpSubchannelDisplay					
			,IsTemplate								
			,TimezoneRuleVersionNumber				
			,TmpRegardingObjectId				
			,TotalActualCost						
			,TotalActualCostBase					
			,TotalCampaignActivityActualCost			
			,TotalCampaignActivityActualCostBase	
			,UtcConversionTimezoneCode		
			,VersionNumber	
		FROM						
		-- CREATE A CHANGE HASH COLUMN TO COMPARE WITH EXISTING RECORDS IN THE PERSISTED TABLE
		(
			SELECT 
				HASHBYTES('SHA2_256', CONCAT_WS('|', 
										ISNULL(UPPER(stageid),'UNKNOWN')
										,ISNULL(UPPER(traversedpath),'UNKNOWN')
										,ISNULL(UPPER(msnfp_aquisitionsource),'UNKNOWN')
										,ISNULL(actualend,'1900-01-01 00:00:00')
										,ISNULL(actualstart,'1900-01-01 00:00:00')
										,ISNULL(msnfp_appealsegment,1)
										,ISNULL(UPPER(msnfp_appealsegment_display),'UNKNOWN')
										,ISNULL(budgetedcost,0)
										,ISNULL(budgetedcost_base,0)
										,ISNULL(UPPER(campaignid),'UNKNOWN')
										,ISNULL(msnfp_campaigncategory,1)
										,ISNULL(UPPER(msnfp_campaigncategory_display),'UNKNOWN')
										,ISNULL(UPPER(codename),'UNKNOWN')
										,ISNULL(msnfp_campaigntype,1)
										,ISNULL(UPPER(msnfp_campaigntype_display),'UNKNOWN')
										,ISNULL(typecode,1)
										,ISNULL(UPPER(typecode_display),'UNKNOWN')
										,ISNULL(msnfp_channel,1)
										,ISNULL(UPPER(msnfp_channel_display),'UNKNOWN')
										,ISNULL(UPPER(createdby),'UNKNOWN')
										,ISNULL(UPPER(createdonbehalfby),'UNKNOWN')
										,ISNULL(createdon,'1900-01-01 00:00:00')
										,ISNULL(UPPER(transactioncurrencyid),'UNKNOWN')
										,ISNULL(UPPER(msnfp_campaign_defaultdesignation),'UNKNOWN')
										,ISNULL(UPPER(description),'UNKNOWN')
										,ISNULL(msnfp_effort,1)
										,ISNULL(UPPER(msnfp_effort_display),'UNKNOWN')
										,ISNULL(UPPER(emailaddress),'UNKNOWN')
										,ISNULL(UPPER(entityimage),'UNKNOWN')
										,ISNULL(entityimage_timestamp,1)
										,ISNULL(UPPER(entityimage_url),'UNKNOWN')
										,ISNULL(UPPER(entityimageid),'UNKNOWN')
										,ISNULL(expectedrevenue,0)
										,ISNULL(expectedrevenue_base,0)
										,ISNULL(exchangerate,0)
										,ISNULL(expectedresponse,1)
										,ISNULL(msnfp_firstresponsedate,'1900-01-01 00:00:00')
										,ISNULL(importsequencenumber,1)
										,ISNULL(msnfp_lastresponsedate,'1900-01-01 00:00:00')
										,ISNULL(UPPER(message),'UNKNOWN')
										,ISNULL(othercost,0)
										,ISNULL(othercost_base,0)
										,ISNULL(UPPER(modifiedby),'UNKNOWN')
										,ISNULL(UPPER(modifiedonbehalfby),'UNKNOWN')
										,ISNULL(modifiedon,'1900-01-01 00:00:00')
										,ISNULL(UPPER(name),'UNKNOWN')
										,ISNULL(UPPER(objective),'UNKNOWN')
										,ISNULL(UPPER(ownerid),'UNKNOWN')
										,ISNULL(UPPER(owningbusinessunit),'UNKNOWN')
										,ISNULL(UPPER(owningteam),'UNKNOWN')
										,ISNULL(UPPER(owninguser),'UNKNOWN')
										,ISNULL(UPPER(pricelistid),'UNKNOWN')
										,ISNULL(UPPER(processid),'UNKNOWN')
										,ISNULL(UPPER(promotioncodename),'UNKNOWN')
										,ISNULL(proposedend,'1900-01-01 00:00:00')
										,ISNULL(proposedstart,'1900-01-01 00:00:00')
										,ISNULL(overriddencreatedon,'1900-01-01 00:00:00')
										,ISNULL(UPPER(msnfp_sourcecode),'UNKNOWN')
										,ISNULL(msnfp_startdate,'1900-01-01 00:00:00')
										,ISNULL(statecode,1)
										,ISNULL(UPPER(statecode_display),'UNKNOWN')
										,ISNULL(statuscode,1)
										,ISNULL(UPPER(statuscode_display),'UNKNOWN')
										,ISNULL(msnfp_subchannel,1)
										,ISNULL(UPPER(msnfp_subchannel_display),'UNKNOWN')
										,ISNULL(istemplate,0)
										,ISNULL(timezoneruleversionnumber,1)
										,ISNULL(UPPER(tmpregardingobjectid),'UNKNOWN')
										,ISNULL(totalactualcost,0)
										,ISNULL(totalactualcost_base,0)
										,ISNULL(totalcampaignactivityactualcost,0)
										,ISNULL(totalcampaignactivityactualcost_base,0)
										,ISNULL(utcconversiontimezonecode,1)
										,ISNULL(versionnumber,1)
									))								                     AS	CampaignChangeHash
							,stageid                             	                     AS	StageId								
							,traversedpath                       	                     AS	TraversedPath						
							,msnfp_aquisitionsource              	                     AS	MsnfpAquisitionSource				
							,CAST(actualend AS DATETIME2(7))                             AS	ActualEnd							
							,CAST(actualstart AS DATETIME2(7))                           AS	ActualStart							
							,CAST(msnfp_appealsegment AS BIGINT)   	                     AS	MsnfpAppealSegment					
							,msnfp_appealsegment_display         	                     AS	MsnfpAppealSegmentDisplay			
							,CAST(budgetedcost AS DECIMAL(18,4))                         AS	BudgetedCost						
							,CAST(budgetedcost_base AS DECIMAL(18,4))                    AS	BudgetedCostBase					
							,ISNULL(campaignid, 'UNKNOWN')                        	     AS	CampaignId							
							,CAST(msnfp_campaigncategory AS BIGINT)                      AS	MsnfpCampaignCategory				
							,msnfp_campaigncategory_display      	                     AS	MsnfpCampaignCategoryDisplay		
							,codename                            	                     AS	CodeName							
							,CAST(msnfp_campaigntype AS BIGINT)                          AS	MsnfpCampaignType					
							,msnfp_campaigntype_display          	                     AS	MsnfpCampaignTypeDisplay			
							,CAST(typecode AS BIGINT)                                    AS	TypeCode							
							,typecode_display                    	                     AS	TypeCodeDisplay						
							,CAST(msnfp_channel AS BIGINT)         	                     AS	MsnfpChannel						
							,msnfp_channel_display               	                     AS	MsnfpChannelDisplay					
							,createdby                           	                     AS	CreatedBy							
							,createdonbehalfby                   	                     AS	CreatedOnBehalfBy					
							,CAST(createdon AS DATETIME2(7))       	                     AS	CreatedOn							
							,transactioncurrencyid               	                     AS	TransactionCurrencyId				
							,msnfp_campaign_defaultdesignation   	                     AS	MsnfpCampaignDefaultDesignation		
							,description                         	                     AS	Description							
							,CAST(msnfp_effort AS BIGINT)                                AS	MsnfpEffort							
							,msnfp_effort_display                	                     AS	MsnfpEffortDisplay					
							,emailaddress                        	                     AS	EmailAddress						
							,entityimage                         	                     AS	EntityImage							
							,CAST(entityimage_timestamp AS BIGINT)                       AS	EntityImageTimestamp				
							,entityimage_url                     	                     AS	EntityImageUrl						
							,entityimageid                       	                     AS	EntityImageId						
							,CAST(expectedrevenue AS DECIMAL(18,4))                      AS	ExpectedRevenue						
							,CAST(expectedrevenue_base AS DECIMAL(18,4))                 AS	ExpectedRevenueBase					
							,CAST(exchangerate AS DECIMAL(18,4))                         AS	ExchangeRate						
							,CAST(expectedresponse AS BIGINT)          	                 AS	ExpectedResponse					
							,CAST(msnfp_firstresponsedate AS DATETIME2(7))               AS	MsnfpFirstResponseDate				
							,CAST(importsequencenumber AS BIGINT)      	                 AS	ImportSequenceNumber				
							,CAST(msnfp_lastresponsedate AS DATETIME2(7))                AS	MsnfpLastResponseDate				
							,message                             	                     AS	Message								
							,CAST(othercost AS DECIMAL(18,4))                            AS	OtherCost							
							,CAST(othercost_base AS DECIMAL(18,4))                       AS	OtherCostBase						
							,modifiedby                          	                     AS	ModifiedBy							
							,modifiedonbehalfby                  	                     AS	ModifiedOnBehalfBy					
							,CAST(modifiedon AS DATETIME2(7))                            AS	ModifiedOn							
							,name                                	                     AS	[Name]								
							,objective                           	                     AS	Objective							
							,ownerid                             	                     AS	OwnerId								
							,owningbusinessunit                  	                     AS	OwningBusinessUnit					
							,owningteam                          	                     AS	OwningTeam							
							,owninguser                          	                     AS	OwningUser							
							,pricelistid                         	                     AS	PricelistId							
							,processid                           	                     AS	ProcessId							
							,promotioncodename                   	                     AS	PromotionCodeName					
							,CAST(proposedend AS DATETIME2(7))                           AS	ProposedEnd							
							,CAST(proposedstart AS DATETIME2(7))                         AS	ProposedStart						
							,CAST(overriddencreatedon AS DATETIME2(7))                   AS	OverriddenCreatedOn					
							,msnfp_sourcecode                    	                     AS	MsnfpSourceCode						
							,CAST(msnfp_startdate AS DATETIME2(7))                       AS	MsnfpStartDate						
							,CAST(statecode AS BIGINT)                                   AS	StateCode							
							,statecode_display                   	                     AS	StateCodeDisplay					
							,CAST(statuscode AS BIGINT)                                  AS	StatusCode							
							,statuscode_display                  	                     AS	StatusCodeDisplay					
							,CAST(msnfp_subchannel AS BIGINT)                            AS	MsnfpSubchannel						
							,msnfp_subchannel_display            	                     AS	MsnfpSubchannelDisplay				
							,CAST(istemplate AS BIT)                                     AS	IsTemplate							
							,CAST(timezoneruleversionnumber AS BIGINT)                   AS	TimezoneRuleVersionNumber			
							,tmpregardingobjectid                	                     AS	TmpRegardingObjectId				
							,CAST(totalactualcost AS DECIMAL(18,4))                      AS	TotalActualCost						
							,CAST(totalactualcost_base AS DECIMAL(18,4))                 AS	TotalActualCostBase					
							,CAST(totalcampaignactivityactualcost AS DECIMAL(18,4))      AS	TotalCampaignActivityActualCost		
							,CAST(totalcampaignactivityactualcost_base AS DECIMAL(18,4)) AS	TotalCampaignActivityActualCostBase	
							,CAST(utcconversiontimezonecode AS BIGINT)                   AS	UtcConversionTimezoneCode			
							,CAST(versionnumber AS BIGINT)                               AS	VersionNumber						
			FROM 
			(		
				-- APPLY ROW NUMBER TO REMOVE DUPLICATES AND ONLY SELECT THE MOST RECENT RECORDS
				SELECT DISTINCT
					stageid                             	
					,traversedpath                       	
					,msnfp_aquisitionsource              	
					,actualend                           	
					,actualstart                         	
					,msnfp_appealsegment                 	
					,msnfp_appealsegment_display         	
					,budgetedcost                        	
					,budgetedcost_base                   	
					,campaignid                          	
					,msnfp_campaigncategory              	
					,msnfp_campaigncategory_display      	
					,codename                            	
					,msnfp_campaigntype                  	
					,msnfp_campaigntype_display          	
					,typecode                            	
					,typecode_display                    	
					,msnfp_channel                       	
					,msnfp_channel_display               	
					,createdby                           	
					,createdonbehalfby                   	
					,createdon                           	
					,transactioncurrencyid               	
					,msnfp_campaign_defaultdesignation   	
					,description                         	
					,msnfp_effort                        	
					,msnfp_effort_display                	
					,emailaddress                        	
					,entityimage                         	
					,entityimage_timestamp               	
					,entityimage_url                     	
					,entityimageid                       	
					,expectedrevenue                     	
					,expectedrevenue_base                	
					,exchangerate                        	
					,expectedresponse                    	
					,msnfp_firstresponsedate             	
					,importsequencenumber                	
					,msnfp_lastresponsedate              	
					,message                             	
					,othercost                           	
					,othercost_base                      	
					,modifiedby                          	
					,modifiedonbehalfby                  	
					,modifiedon                          	
					,name                                	
					,objective                           	
					,ownerid                             	
					,owningbusinessunit                  	
					,owningteam                          	
					,owninguser                          	
					,pricelistid                         	
					,processid                           	
					,promotioncodename                   	
					,proposedend                         	
					,proposedstart                       	
					,overriddencreatedon                 	
					,msnfp_sourcecode                    	
					,msnfp_startdate                     	
					,statecode                           	
					,statecode_display                   	
					,statuscode                          	
					,statuscode_display                  	
					,msnfp_subchannel                    	
					,msnfp_subchannel_display            	
					,istemplate                          	
					,timezoneruleversionnumber           	
					,tmpregardingobjectid                	
					,totalactualcost                     	
					,totalactualcost_base                	
					,totalcampaignactivityactualcost     	
					,totalcampaignactivityactualcost_base	
					,utcconversiontimezonecode           	
					,versionnumber                       	
					,ROW_NUMBER() OVER(PARTITION BY [campaignid] ORDER BY COALESCE([overriddencreatedon],[createdon]),[modifiedon] DESC) AS RowOrdinal
	    		FROM [External].[IATICampaign]	 
			) A
			WHERE RowOrdinal = 1
		) B
		OPTION(LABEL = 'Scratch.Campaign.Obtain');


		-- GET THE MAX IDENTITY KEY FROM THE PERSISTED TABLE
		DECLARE @maxKey INT = (SELECT ISNULL(MAX(CampaignKey),0) FROM [Persisted].[Campaign])

		-- CREATE A TEMP TABLE USING CTAS TO HANDLE MERGE OPERATIONS
		CREATE TABLE [Persisted].[Campaign_Upsert]
		WITH
		(	
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS
		-- NEW ROWS AND NEW VERSIONS OF ROWS
		SELECT 
			ROW_NUMBER() OVER(ORDER BY [CampaignChangeHash] DESC) + @maxKey AS  CampaignKey
			,S.[CampaignChangeHash]
			,S.StageId								
			,S.TraversedPath							
			,S.MsnfpAquisitionSource				
			,S.ActualEnd							
			,S.ActualStart							
			,S.MsnfpAppealSegment					
			,S.MsnfpAppealSegmentDisplay			
			,S.BudgetedCost						
			,S.BudgetedCostBase					
			,S.CampaignId								
			,S.MsnfpCampaignCategory				
			,S.MsnfpCampaignCategoryDisplay		
			,S.CodeName							
			,S.MsnfpCampaignType					
			,S.MsnfpCampaignTypeDisplay			
			,S.TypeCode							
			,S.TypeCodeDisplay						
			,S.MsnfpChannel							
			,S.MsnfpChannelDisplay					
			,S.CreatedBy							
			,S.CreatedOnBehalfBy						
			,S.CreatedOn							
			,S.TransactionCurrencyId				
			,S.MsnfpCampaignDefaultDesignation		
			,S.Description							
			,S.MsnfpEffort							
			,S.MsnfpEffortDisplay					
			,S.EmailAddress							
			,S.EntityImage							
			,S.EntityImageTimestamp				
			,S.EntityImageUrl						
			,S.EntityImageId						
			,S.ExpectedRevenue						
			,S.ExpectedRevenueBase					
			,S.ExchangeRate							
			,S.ExpectedResponse					
			,S.MsnfpFirstResponseDate				
			,S.ImportSequenceNumber				
			,S.MsnfpLastResponseDate					
			,S.Message								
			,S.OtherCost								
			,S.OtherCostBase						
			,S.ModifiedBy							
			,S.ModifiedOnBehalfBy					
			,S.ModifiedOn							
			,S.[Name]								
			,S.Objective								
			,S.OwnerId								
			,S.OwningBusinessUnit					
			,S.OwningTeam							
			,S.OwningUser							
			,S.PricelistId							
			,S.ProcessId							
			,S.PromotionCodeName					
			,S.ProposedEnd							
			,S.ProposedStart						
			,S.OverriddenCreatedOn					
			,S.MsnfpSourceCode						
			,S.MsnfpStartDate						
			,S.StateCode							
			,S.StateCodeDisplay					
			,S.StatusCode							
			,S.StatusCodeDisplay					
			,S.MsnfpSubchannel						
			,S.MsnfpSubchannelDisplay					
			,S.IsTemplate								
			,S.TimezoneRuleVersionNumber				
			,S.TmpRegardingObjectId				
			,S.TotalActualCost						
			,S.TotalActualCostBase					
			,S.TotalCampaignActivityActualCost		
			,S.TotalCampaignActivityActualCostBase	
			,S.UtcConversionTimezoneCode		
			,S.VersionNumber	
			,GETDATE() AS [InsertedDate]
		FROM [Scratch].[Campaign] AS S
		UNION ALL
		-- KEEP ROWS THAT ARE NOT BEING TOUCHED
		SELECT 
			 P.CampaignKey
			,P.[CampaignChangeHash]
			,P.StageId								
			,P.TraversedPath							
			,P.MsnfpAquisitionSource				
			,P.ActualEnd							
			,P.ActualStart							
			,P.MsnfpAppealSegment					
			,P.MsnfpAppealSegmentDisplay			
			,P.BudgetedCost						
			,P.BudgetedCostBase					
			,P.CampaignId								
			,P.MsnfpCampaignCategory				
			,P.MsnfpCampaignCategoryDisplay		
			,P.CodeName							
			,P.MsnfpCampaignType					
			,P.MsnfpCampaignTypeDisplay			
			,P.TypeCode							
			,P.TypeCodeDisplay						
			,P.MsnfpChannel							
			,P.MsnfpChannelDisplay					
			,P.CreatedBy							
			,P.CreatedOnBehalfBy						
			,P.CreatedOn							
			,P.TransactionCurrencyId				
			,P.MsnfpCampaignDefaultDesignation		
			,P.Description							
			,P.MsnfpEffort							
			,P.MsnfpEffortDisplay					
			,P.EmailAddress							
			,P.EntityImage							
			,P.EntityImageTimestamp				
			,P.EntityImageUrl						
			,P.EntityImageId						
			,P.ExpectedRevenue						
			,P.ExpectedRevenueBase					
			,P.ExchangeRate							
			,P.ExpectedResponse					
			,P.MsnfpFirstResponseDate				
			,P.ImportSequenceNumber				
			,P.MsnfpLastResponseDate					
			,P.Message								
			,P.OtherCost								
			,P.OtherCostBase						
			,P.ModifiedBy							
			,P.ModifiedOnBehalfBy					
			,P.ModifiedOn							
			,P.[Name]								
			,P.Objective								
			,P.OwnerId								
			,P.OwningBusinessUnit					
			,P.OwningTeam							
			,P.OwningUser							
			,P.PricelistId							
			,P.ProcessId							
			,P.PromotionCodeName					
			,P.ProposedEnd							
			,P.ProposedStart						
			,P.OverriddenCreatedOn					
			,P.MsnfpSourceCode						
			,P.MsnfpStartDate						
			,P.StateCode							
			,P.StateCodeDisplay					
			,P.StatusCode							
			,P.StatusCodeDisplay					
			,P.MsnfpSubchannel						
			,P.MsnfpSubchannelDisplay					
			,P.IsTemplate								
			,P.TimezoneRuleVersionNumber				
			,P.TmpRegardingObjectId				
			,P.TotalActualCost						
			,P.TotalActualCostBase					
			,P.TotalCampaignActivityActualCost		
			,P.TotalCampaignActivityActualCostBase	
			,P.UtcConversionTimezoneCode		
			,P.VersionNumber	
			,GETDATE() AS [InsertedDate]
		FROM [Persisted].[Campaign] AS P
		WHERE NOT EXISTS
		(
			SELECT *
			FROM [Scratch].[Campaign] S
			WHERE S.[CampaignChangeHash] = P.[CampaignChangeHash]
		)
		OPTION(LABEL = 'Persisted.Campaign.Obtain');

		-- KEEP LATEST CTAS AND DELETE PREVIOUS ONE
		RENAME OBJECT [Persisted].[Campaign] TO [Campaign_old];
		RENAME OBJECT [Persisted].[Campaign_Upsert] TO [Campaign];
		DROP TABLE [Persisted].[Campaign_old];
		

	END TRY

	BEGIN CATCH
		--CTAS FAILED, MARK PROCESS AS FAILED AND THROW ERROR
		DECLARE @ErrorMsg	VARCHAR(250)
		SET @ErrorMsg = 'Error loading table Persisted.Campaign: ' + ERROR_MESSAGE()
		RAISERROR (@ErrorMsg, 16, 1)
	END CATCH

END
