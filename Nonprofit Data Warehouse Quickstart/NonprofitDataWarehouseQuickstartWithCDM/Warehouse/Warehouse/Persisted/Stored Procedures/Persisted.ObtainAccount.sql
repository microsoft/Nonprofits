CREATE PROC [Persisted].[ObtainAccount] 
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

		IF OBJECT_ID ('Scratch.Account','U') IS NOT NULL 
			DROP TABLE [Scratch].[Account];

		-- RE-CREATE CTAS AND POPULATE WITH NEW VALUES
		CREATE TABLE [Scratch].[Account]
		WITH
		(
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS
		SELECT                                            
			 AccountChangeHash						                
			,StageId                                                
			,TraversedPath                                          
			,AccountId												
			,[Name]												    
			,AccountNumber											
			,AccountRatingCode										
			,AccountRatingCodeDisplay								
			,MsnfpAccountType										
			,MsnfpAccountTypeDisplay								
			,MsnfpAcquisitionDate									
			,MsnfpAcquisitionSource									
			,MsnfpAcquisitionSourceDisplay							
			,Address1Composite										
			,Address1AddressTypeCode								
			,Address1AddressTypeCodeDisplay							
			,Address1City											
			,Address1Country										
			,Address1County											
			,Address1Fax											
			,Address1FreightTermsCode								
			,Address1FreightTermsCodeDisplay						
			,Address1AddressId										
			,Address1Latitude										
			,Address1Longitude										
			,Address1Name											
			,Address1PostOfficeBox									
			,Address1PrimaryContactName								
			,Address1ShippingMethodCode								
			,Address1ShippingMethodCodeDisplay						
			,Address1StateOrProvince								
			,Address1Line1											
			,Address1Line2											
			,Address1Line3											
			,Address1Telephone2										
			,Address1Telephone3										
			,Address1UpsZone										
			,Address1UtcOffset										
			,Address1PostalCode										
			,Address2Composite										
			,Address2AddressTypeCode								
			,Address2AddressTypeCodeDisplay							
			,Address2City											
			,Address2Country										
			,Address2County											
			,Address2Fax											
			,Address2FreightTermsCode								
			,Address2FreightTermsCodeDisplay						
			,Address2AddressId										
			,Address2Latitude										
			,Address2Longitude										
			,Address2Name											
			,Address2PostOfficeBox									
			,Address2PrimaryContactName								
			,Address2ShippingMethodCode								
			,Address2ShippingMethodCodeDisplay						
			,Address2StateOrProvince								
			,Address2Line1											
			,Address2Line2											
			,Address2Line3											
			,Address2Telephone1										
			,Address2Telephone2										
			,Address2Telephone3										
			,Address2UpsZone										
			,Address2UtcOffset										
			,Address2PostalCode										
			,Address1Telephone1										
			,Aging30												
			,Aging30Base											
			,Aging60												
			,Aging60Base											
			,Aging90												
			,Aging90Base											
			,Revenue												
			,RevenueBase											
			,BusinessTypeCode										
			,BusinessTypeCodeDisplay								
			,AccountCategoryCode									
			,AccountCategoryCodeDisplay								
			,AccountClassificationCode								
			,AccountClassificationCodeDisplay						
			,CreatedBy												
			,CreatedOnBehalfBy										
			,CreatedByExternalParty									
			,CreatedOn												
			,CreditOnHold											
			,CreditLimit											
			,CreditLimitBase										
			,TransactionCurrencyId									
			,CustomerSizeCode										
			,CustomerSizeCodeDisplay								
			,MsiatiDefaultCurrencyId								
			,MsiatiDefaultLanguageId								
			,[Description]											
			,DoNotBulkEmail											
			,DoNotBulkPostalMail									
			,DoNotEmail												
			,DoNotFax												
			,DoNotPostalMail										
			,DoNotPhone												
			,EmailAddress1											
			,EmailAddress2											
			,EmailAddress3											
			,EntityImageTimestamp									
			,EntityImageUrl											
			,EntityImageId											
			,ExchangeRate											
			,Fax												    
			,FollowEmail											
			,FtpSiteUrl												
			,MsiatiIatiOrganizationIdentifier						
			,ImportSequenceNumber									
			,IndustryCode											
			,IndustryCodeDisplay									
			,LastUsedInCampaign										
			,LastOnHoldTime											
			,SlaInvokedId											
			,Telephone1												
			,MarketCap												
			,MarketCapBase											
			,MarketingOnly											
			,MasterId												
			,Merged												    
			,ModifiedBy												
			,ModifiedOnBehalfBy										
			,MsdynExternalAccountId									
			,ModifiedByExternalParty								
			,ModifiedOn												
			,NumberOfEmployees										
			,OnHoldTime												
			,OpenDeals												
			,OpenDealsDate											
			,OpenDealsState											
			,OpenRevenue											
			,OpenRevenueBase										
			,OpenRevenueDate										
			,OpenRevenueState										
			,MsiatiOrganizationTypeId								
			,OriginatingLeadId										
			,Telephone2												
			,OwnerId												
			,OwnershipCode											
			,OwnershipCodeDisplay									
			,OwningBusinessUnit										
			,OwningTeam												
			,OwningUser												
			,ParentAccountId										
			,ParticipatesInWorkflow									
			,PaymentTermsCode										
			,PaymentTermsCodeDisplay								
			,PreferredAppointmentDayCode							
			,PreferredAppointmentDayCodeDisplay						
			,PreferredEquipmentId									
			,PreferredContactMethodCode								
			,PreferredContactMethodCodeDisplay						
			,PreferredServiceId										
			,PreferredAppointmentTimeCode							
			,PreferredAppointmentTimeCodeDisplay					
			,PreferredSystemUserId									
			,MsnfpPrimaryConstituentType							
			,MsnfpPrimaryConstituentTypeDisplay						
			,PrimaryContactId										
			,PrimarySatoriId										
			,PrimaryTwitterId										
			,ProcessId												
			,DefaultPriceLevelId									
			,OverriddenCreatedOn									
			,CustomerTypeCode										
			,CustomerTypeCodeDisplay								
			,MsiatiReportingOrganizationId							
			,MsiatiSecondaryReporter								
			,DoNotSendMm											
			,SharesOutstanding										
			,ShippingMethodCode										
			,ShippingMethodCodeDisplay								
			,Sic												    
			,SlaId												    
			,StateCode												
			,StateCodeDisplay										
			,StatusCode												
			,StatusCodeDisplay										
			,StockExchange											
			,Telephone3												
			,TerritoryId											
			,TerritoryCode											
			,TerritoryCodeDisplay									
			,TickerSymbol											
			,TimeSpentByMeOnEmailAndMeetings						
			,TimeZoneRuleVersionNumber								
			,UtcConversionTimeZoneCode								
			,VersionNumber											
			,WebsiteUrl												
			,YomiName																															
		FROM	
		-- CREATE A CHANGE HASH COLUMN TO COMPARE WITH EXISTING RECORDS IN THE PERSISTED TABLE
		(
			SELECT 
				HASHBYTES('SHA2_256', CONCAT_WS('|',             
										 ISNULL(UPPER(stageid),'UNKNOWN')                            
										,ISNULL(UPPER(traversedpath),'UNKNOWN')                    
										,ISNULL(UPPER(accountid),'UNKNOWN')              
										,ISNULL(UPPER([name]),'UNKNOWN')                                 
										,ISNULL(UPPER(accountnumber),'UNKNOWN')                           
										,ISNULL(accountratingcode,0)                      
										,ISNULL(UPPER(accountratingcode_display),'UNKNOWN')              
										,ISNULL(msnfp_accounttype,0)                      
										,ISNULL(UPPER(msnfp_accounttype_display),'UNKNOWN')              
										,ISNULL(msnfp_acquisitiondate,'1900-01-01 00:00:00')                   
										,ISNULL(msnfp_acquisitionsource,0)                
										,ISNULL(UPPER(msnfp_acquisitionsource_display),'UNKNOWN')        
										,ISNULL(UPPER(address1_composite),'UNKNOWN')                     
										,ISNULL(address1_addresstypecode,0)               
										,ISNULL(UPPER(address1_addresstypecode_display),'UNKNOWN')       
										,ISNULL(UPPER(address1_city),'UNKNOWN')                          
										,ISNULL(UPPER(address1_country),'UNKNOWN')                       
										,ISNULL(UPPER(address1_county),'UNKNOWN')                        
										,ISNULL(UPPER(address1_fax),'UNKNOWN')                           
										,ISNULL(address1_freighttermscode,0)              
										,ISNULL(UPPER(address1_freighttermscode_display),'UNKNOWN')      
										,ISNULL(UPPER(address1_addressid),'UNKNOWN')                     
										,ISNULL(address1_latitude,0)                      
										,ISNULL(address1_longitude,0)                     
										,ISNULL(UPPER(address1_name),'UNKNOWN')                          
										,ISNULL(UPPER(address1_postofficebox),'UNKNOWN')                 
										,ISNULL(UPPER(address1_primarycontactname),'UNKNOWN')            
										,ISNULL(address1_shippingmethodcode,0)            
										,ISNULL(UPPER(address1_shippingmethodcode_display),'UNKNOWN')    
										,ISNULL(UPPER(address1_stateorprovince),'UNKNOWN')               
										,ISNULL(UPPER(address1_line1),'UNKNOWN')                         
										,ISNULL(UPPER(address1_line2),'UNKNOWN')                         
										,ISNULL(UPPER(address1_line3),'UNKNOWN')                         
										,ISNULL(UPPER(address1_telephone2),'UNKNOWN')                    
										,ISNULL(UPPER(address1_telephone3),'UNKNOWN')                    
										,ISNULL(UPPER(address1_upszone),'UNKNOWN')                       
										,ISNULL(address1_utcoffset,0)                     
										,ISNULL(UPPER(address1_postalcode),'UNKNOWN')                    
										,ISNULL(UPPER(address2_composite),'UNKNOWN')                     
										,ISNULL(address2_addresstypecode,0)               
										,ISNULL(UPPER(address2_addresstypecode_display),'UNKNOWN')       
										,ISNULL(UPPER(address2_city),'UNKNOWN')                          
										,ISNULL(UPPER(address2_country),'UNKNOWN')                       
										,ISNULL(UPPER(address2_county),'UNKNOWN')                        
										,ISNULL(UPPER(address2_fax),'UNKNOWN')                           
										,ISNULL(address2_freighttermscode,0)              
										,ISNULL(UPPER(address2_freighttermscode_display),'UNKNOWN')      
										,ISNULL(UPPER(address2_addressid),'UNKNOWN')                     
										,ISNULL(address2_latitude,0)                      
										,ISNULL(address2_longitude,0)                     
										,ISNULL(UPPER(address2_name),'UNKNOWN')                          
										,ISNULL(UPPER(address2_postofficebox),'UNKNOWN')                 
										,ISNULL(UPPER(address2_primarycontactname),'UNKNOWN')            
										,ISNULL(address2_shippingmethodcode,0)            
										,ISNULL(UPPER(address2_shippingmethodcode_display),'UNKNOWN')    
										,ISNULL(UPPER(address2_stateorprovince),'UNKNOWN')               
										,ISNULL(UPPER(address2_line1),'UNKNOWN')                         
										,ISNULL(UPPER(address2_line2),'UNKNOWN')                         
										,ISNULL(UPPER(address2_line3),'UNKNOWN')                         
										,ISNULL(UPPER(address2_telephone1),'UNKNOWN')                    
										,ISNULL(UPPER(address2_telephone2),'UNKNOWN')                    
										,ISNULL(UPPER(address2_telephone3),'UNKNOWN')                    
										,ISNULL(UPPER(address2_upszone),'UNKNOWN')                       
										,ISNULL(address2_utcoffset,0)                     
										,ISNULL(UPPER(address2_postalcode),'UNKNOWN')                    
										,ISNULL(UPPER(address1_telephone1),'UNKNOWN')                    
										,ISNULL(UPPER(aging30),'UNKNOWN')                                
										,ISNULL(UPPER(aging30_base),'UNKNOWN')                           
										,ISNULL(UPPER(aging60),'UNKNOWN')                                
										,ISNULL(UPPER(aging60_base),'UNKNOWN')                           
										,ISNULL(UPPER(aging90),'UNKNOWN')                                
										,ISNULL(UPPER(aging90_base),'UNKNOWN')                           
										,ISNULL(UPPER(revenue),'UNKNOWN')                               
										,ISNULL(UPPER(revenue_base),'UNKNOWN')                           
										,ISNULL(businesstypecode,0)                       
										,ISNULL(UPPER(businesstypecode_display),'UNKNOWN')               
										,ISNULL(accountcategorycode,0)                    
										,ISNULL(UPPER(accountcategorycode_display),'UNKNOWN')           
										,ISNULL(accountclassificationcode,0)              
										,ISNULL(UPPER(accountclassificationcode_display),'UNKNOWN')      
										,ISNULL(UPPER(createdby),'UNKNOWN')                              
										,ISNULL(UPPER(createdonbehalfby),'UNKNOWN')                      
										,ISNULL(UPPER(createdbyexternalparty),'UNKNOWN')                 
										,ISNULL(createdon,'1900-01-01 00:00:00')                               
										,ISNULL(creditonhold,0)                           
										,ISNULL(UPPER(creditlimit),'UNKNOWN')                            
										,ISNULL(UPPER(creditlimit_base),'UNKNOWN')                       
										,ISNULL(UPPER(transactioncurrencyid),'UNKNOWN')                 
										,ISNULL(customersizecode,0)                       
										,ISNULL(UPPER(customersizecode_display),'UNKNOWN')               
										,ISNULL(UPPER(msiati_defaultcurrencyid),'UNKNOWN')               
										,ISNULL(UPPER(msiati_defaultlanguageid),'UNKNOWN')               
										,ISNULL(UPPER([description]),'UNKNOWN')                          
										,ISNULL(donotbulkemail,0)                         
										,ISNULL(donotbulkpostalmail,0)                    
										,ISNULL(donotemail,0)                             
										,ISNULL(donotfax,0)                               
										,ISNULL(donotpostalmail,0)                        
										,ISNULL(donotphone,0)                             
										,ISNULL(UPPER(emailaddress1),'UNKNOWN')                          
										,ISNULL(UPPER(emailaddress2),'UNKNOWN')                          
										,ISNULL(UPPER(emailaddress3),'UNKNOWN')                          
										,ISNULL(entityimage_timestamp,'1900-01-01 00:00:00')                   
										,ISNULL(UPPER(entityimage_url),'UNKNOWN')                        
										,ISNULL(UPPER(entityimageid),'UNKNOWN')                          
										,ISNULL(UPPER(exchangerate),'UNKNOWN')                           
										,ISNULL(UPPER(fax),'UNKNOWN')                                    
										,ISNULL(followemail,0)                            
										,ISNULL(UPPER(ftpsiteurl),'UNKNOWN')                             
										,ISNULL(UPPER(msiati_iatiorganizationidentifier),'UNKNOWN')      
										,ISNULL(importsequencenumber,0)                    
										,ISNULL(industrycode,0)                           
										,ISNULL(UPPER(industrycode_display),'UNKNOWN')                   
										,ISNULL(UPPER(lastusedincampaign),'UNKNOWN')                     
										,ISNULL(lastonholdtime,'1900-01-01 00:00:00')                          
										,ISNULL(UPPER(slainvokedid),'UNKNOWN')                           
										,ISNULL(UPPER(telephone1),'UNKNOWN')                             
										,ISNULL(marketcap,0)                              
										,ISNULL(marketcap_base,0)                         
										,ISNULL(marketingonly,0)                          
										,ISNULL(UPPER(masterid),'UNKNOWN')                               
										,ISNULL(merged,0)                                 
										,ISNULL(UPPER(modifiedby),'UNKNOWN')                             
										,ISNULL(UPPER(modifiedonbehalfby),'UNKNOWN')                     
										,ISNULL(UPPER(msdyn_externalaccountid),'UNKNOWN')                
										,ISNULL(UPPER(modifiedbyexternalparty),'UNKNOWN')                
										,ISNULL(modifiedon,'1900-01-01 00:00:00')                              
										,ISNULL(numberofemployees,0)                       
										,ISNULL(onholdtime,0)                              
										,ISNULL(opendeals,0)                              
										,ISNULL(opendeals_date,'1900-01-01 00:00:00')                          
										,ISNULL(opendeals_state,0)                        
										,ISNULL(openrevenue,0)                            
										,ISNULL(openrevenue_base,0)                       
										,ISNULL(openrevenue_date,'1900-01-01 00:00:00')                        
										,ISNULL(openrevenue_state,0)                      
										,ISNULL(UPPER(msiati_organizationtypeid),'UNKNOWN')              
										,ISNULL(UPPER(originatingleadid),'UNKNOWN')                      
										,ISNULL(UPPER(telephone2),'UNKNOWN')                             
										,ISNULL(UPPER(ownerid),'UNKNOWN')                                
										,ISNULL(ownershipcode,0)                          
										,ISNULL(UPPER(ownershipcode_display),'UNKNOWN')                  
										,ISNULL(UPPER(owningbusinessunit),'UNKNOWN')                     
										,ISNULL(UPPER(owningteam),'UNKNOWN')                             
										,ISNULL(UPPER(owninguser),'UNKNOWN')                             
										,ISNULL(UPPER(parentaccountid),'UNKNOWN')                        
										,ISNULL(participatesinworkflow,0)                 
										,ISNULL(paymenttermscode,0)                       
										,ISNULL(UPPER(paymenttermscode_display),'UNKNOWN')               
										,ISNULL(preferredappointmentdaycode,0)            
										,ISNULL(UPPER(preferredappointmentdaycode_display),'UNKNOWN')    
										,ISNULL(UPPER(preferredequipmentid),'UNKNOWN')                   
										,ISNULL(preferredcontactmethodcode,0)             
										,ISNULL(UPPER(preferredcontactmethodcode_display),'UNKNOWN')     
										,ISNULL(UPPER(preferredserviceid),'UNKNOWN')                     
										,ISNULL(preferredappointmenttimecode,0)           
										,ISNULL(UPPER(preferredappointmenttimecode_display),'UNKNOWN')   
										,ISNULL(UPPER(preferredsystemuserid),'UNKNOWN')                  
										,ISNULL(msnfp_primaryconstituenttype,0)           
										,ISNULL(UPPER(msnfp_primaryconstituenttype_display),'UNKNOWN')   
										,ISNULL(UPPER(primarycontactid),'UNKNOWN')                       
										,ISNULL(UPPER(primarysatoriid),'UNKNOWN')                        
										,ISNULL(UPPER(primarytwitterid),'UNKNOWN')                       
										,ISNULL(UPPER(processid),'UNKNOWN')                              
										,ISNULL(UPPER(defaultpricelevelid),'UNKNOWN')                    
										,ISNULL(overriddencreatedon,'1900-01-01 00:00:00')                     
										,ISNULL(customertypecode,0)                       
										,ISNULL(UPPER(customertypecode_display),'UNKNOWN')               
										,ISNULL(UPPER(msiati_reportingorganizationid),'UNKNOWN')         
										,ISNULL(msiati_secondaryreporter,0)               
										,ISNULL(donotsendmm,0)                            
										,ISNULL(sharesoutstanding,0)                      
										,ISNULL(shippingmethodcode,0)                     
										,ISNULL(UPPER(shippingmethodcode_display),'UNKNOWN')             
										,ISNULL(UPPER(sic),'UNKNOWN')                                    
										,ISNULL(UPPER(slaid),'UNKNOWN')                                  
										,ISNULL(statecode,0)                              
										,ISNULL(UPPER(statecode_display),'UNKNOWN')                      
										,ISNULL(statuscode,0)                             
										,ISNULL(UPPER(statuscode_display),'UNKNOWN')                     
										,ISNULL(UPPER(stockexchange),'UNKNOWN')                          
										,ISNULL(UPPER(telephone3),'UNKNOWN')                             
										,ISNULL(UPPER(territoryid),'UNKNOWN')                            
										,ISNULL(territorycode,0)                          
										,ISNULL(UPPER(territorycode_display),'UNKNOWN')                  
										,ISNULL(UPPER(tickersymbol),'UNKNOWN')                           
										,ISNULL(UPPER(timespentbymeonemailandmeetings),'UNKNOWN')        
										,ISNULL(timezoneruleversionnumber,0)               
										,ISNULL(utcconversiontimezonecode,0)              
										,ISNULL(versionnumber,0)                           
										,ISNULL(UPPER(websiteurl),'UNKNOWN')                             
										,ISNULL(UPPER(yominame),'UNKNOWN')                               
									))						          AS [AccountChangeHash]					                
					,stageid                                          AS StageId                                                
					,traversedpath                                    AS TraversedPath                                          
					,ISNULL(accountid, 'UNKNOWN')                     AS AccountId												
					,[name]                                           AS [Name]												    
					,accountnumber                                    AS AccountNumber											
					,CAST(accountratingcode AS BIGINT)                AS AccountRatingCode										
					,accountratingcode_display                        AS AccountRatingCodeDisplay								
					,CAST(msnfp_accounttype AS BIGINT)                AS MsnfpAccountType										
					,msnfp_accounttype_display                        AS MsnfpAccountTypeDisplay								
					,CAST(msnfp_acquisitiondate AS DATETIME2(7))      AS MsnfpAcquisitionDate									
					,msnfp_acquisitionsource                          AS MsnfpAcquisitionSource									
					,CAST(msnfp_acquisitionsource_display AS BIGINT)  AS MsnfpAcquisitionSourceDisplay							
					,address1_composite                               AS Address1Composite										
					,address1_addresstypecode                         AS Address1AddressTypeCode								
					,CAST(address1_addresstypecode_display AS BIGINT) AS Address1AddressTypeCodeDisplay							
					,address1_city                                    AS Address1City											
					,address1_country                                 AS Address1Country										
					,address1_county                                  AS Address1County											
					,address1_fax                                     AS Address1Fax											
					,CAST(address1_freighttermscode AS BIGINT)        AS Address1FreightTermsCode								
					,address1_freighttermscode_display                AS Address1FreightTermsCodeDisplay						
					,ISNULL(address1_addressid, 'UNKNOWN')            AS Address1AddressId										
					,CAST(address1_latitude AS DECIMAL(18,4))         AS Address1Latitude										
					,CAST(address1_longitude AS DECIMAL(18,4))        AS Address1Longitude										
					,address1_name                                    AS Address1Name											
					,address1_postofficebox                           AS Address1PostOfficeBox									
					,address1_primarycontactname                      AS Address1PrimaryContactName								
					,CAST(address1_shippingmethodcode AS BIGINT)      AS Address1ShippingMethodCode								
					,address1_shippingmethodcode_display              AS Address1ShippingMethodCodeDisplay						
					,address1_stateorprovince                         AS Address1StateOrProvince								
					,address1_line1                                   AS Address1Line1											
					,address1_line2                                   AS Address1Line2											
					,address1_line3                                   AS Address1Line3											
					,address1_telephone2                              AS Address1Telephone2										
					,address1_telephone3                              AS Address1Telephone3										
					,address1_upszone                                 AS Address1UpsZone										
					,CAST(address1_utcoffset AS BIGINT)               AS Address1UtcOffset										
					,address1_postalcode                              AS Address1PostalCode										
					,address2_composite                               AS Address2Composite										
					,CAST(address2_addresstypecode AS BIGINT)         AS Address2AddressTypeCode								
					,address2_addresstypecode_display                 AS Address2AddressTypeCodeDisplay							
					,address2_city                                    AS Address2City											
					,address2_country                                 AS Address2Country										
					,address2_county                                  AS Address2County											
					,address2_fax                                     AS Address2Fax											
					,CAST(address2_freighttermscode AS BIGINT)        AS Address2FreightTermsCode								
					,address2_freighttermscode_display                AS Address2FreightTermsCodeDisplay						
					,ISNULL(address2_addressid, 'UNKNOWN')            AS Address2AddressId										
					,CAST(address2_latitude AS DECIMAL(18,4))         AS Address2Latitude										
					,CAST(address2_longitude AS DECIMAL(18,4))        AS Address2Longitude										
					,address2_name                                    AS Address2Name											
					,address2_postofficebox                           AS Address2PostOfficeBox									
					,address2_primarycontactname                      AS Address2PrimaryContactName								
					,CAST(address2_shippingmethodcode AS BIGINT)      AS Address2ShippingMethodCode								
					,address2_shippingmethodcode_display              AS Address2ShippingMethodCodeDisplay						
					,address2_stateorprovince                         AS Address2StateOrProvince								
					,address2_line1                                   AS Address2Line1											
					,address2_line2                                   AS Address2Line2											
					,address2_line3                                   AS Address2Line3											
					,address2_telephone1                              AS Address2Telephone1										
					,address2_telephone2                              AS Address2Telephone2										
					,address2_telephone3                              AS Address2Telephone3										
					,address2_upszone                                 AS Address2UpsZone										
					,CAST(address2_utcoffset AS BIGINT)               AS Address2UtcOffset										
					,address2_postalcode                              AS Address2PostalCode										
					,address1_telephone1                              AS Address1Telephone1										
					,CAST(aging30 AS DECIMAL(18,4))                   AS Aging30												
					,CAST(aging30_base AS DECIMAL(18,4))              AS Aging30Base											
					,CAST(aging60 AS DECIMAL(18,4))                   AS Aging60												
					,CAST(aging60_base AS DECIMAL(18,4))              AS Aging60Base											
					,CAST(aging90 AS DECIMAL(18,4))                   AS Aging90												
					,CAST(aging90_base AS DECIMAL(18,4))              AS Aging90Base											
					,CAST(revenue AS DECIMAL(18,4))                   AS Revenue												
					,CAST(revenue_base AS DECIMAL(18,4))              AS RevenueBase											
					,CAST(businesstypecode AS BIGINT)                 AS BusinessTypeCode										
					,businesstypecode_display                         AS BusinessTypeCodeDisplay								
					,CAST(accountcategorycode AS BIGINT)              AS AccountCategoryCode									
					,accountcategorycode_display                      AS AccountCategoryCodeDisplay								
					,CAST(accountclassificationcode AS BIGINT)        AS AccountClassificationCode								
					,accountclassificationcode_display                AS AccountClassificationCodeDisplay						
					,createdby                                        AS CreatedBy												
					,createdonbehalfby                                AS CreatedOnBehalfBy										
					,createdbyexternalparty                           AS CreatedByExternalParty									
					,CAST(createdon AS DATETIME2(7))                  AS CreatedOn												
					,CAST(creditonhold AS BIT)                        AS CreditOnHold											
					,CAST(creditlimit AS DECIMAL(18,4))               AS CreditLimit											
					,CAST(creditlimit_base AS DECIMAL(18,4))          AS CreditLimitBase										
					,transactioncurrencyid                            AS TransactionCurrencyId									
					,CAST(customersizecode AS BIT)                    AS CustomerSizeCode										
					,customersizecode_display                         AS CustomerSizeCodeDisplay								
					,msiati_defaultcurrencyid                         AS MsiatiDefaultCurrencyId								
                    ,msiati_defaultlanguageid                         AS MsiatiDefaultLanguageId								
					,[description]                                    AS [Description]											
					,CAST(donotbulkemail AS BIT)                      AS DoNotBulkEmail											
					,CAST(donotbulkpostalmail AS BIT)                 AS DoNotBulkPostalMail									
					,CAST(donotemail AS BIT)                          AS DoNotEmail												
					,CAST(donotfax AS BIT)                            AS DoNotFax												
					,CAST(donotpostalmail AS BIT)                     AS DoNotPostalMail										
					,CAST(donotphone AS BIT)                          AS DoNotPhone												
					,emailaddress1                                    AS EmailAddress1											
					,emailaddress2                                    AS EmailAddress2											
					,emailaddress3                                    AS EmailAddress3											
					,CAST(entityimage_timestamp AS BIGINT)            AS EntityImageTimestamp									
					,entityimage_url                                  AS EntityImageUrl											
					,entityimageid                                    AS EntityImageId											
					,CAST(exchangerate AS DECIMAL(18,4))              AS ExchangeRate											
					,fax                                              AS Fax												    
					,CAST(followemail AS BIT)                         AS FollowEmail											
					,ftpsiteurl                                       AS FtpSiteUrl												
					,msiati_iatiorganizationidentifier                AS MsiatiIatiOrganizationIdentifier						
					,CAST(importsequencenumber AS BIGINT)             AS ImportSequenceNumber									
					,CAST(industrycode AS BIGINT)                     AS IndustryCode											
					,industrycode_display                             AS IndustryCodeDisplay									
					,CAST(lastusedincampaign AS DATETIME2(7))         AS LastUsedInCampaign										
					,CAST(lastonholdtime AS DATETIME2(7))             AS LastOnHoldTime											
					,slainvokedid                                     AS SlaInvokedId											
					,telephone1                                       AS Telephone1												
					,CAST(marketcap AS DECIMAL(18,4))                 AS MarketCap												
					,CAST(marketcap_base AS DECIMAL(18,4))            AS MarketCapBase											
					,CAST(marketingonly AS BIT)                       AS MarketingOnly											
					,masterid                                         AS MasterId												
					,CAST(merged AS BIT)                              AS Merged												    
					,modifiedby                                       AS ModifiedBy												
					,modifiedonbehalfby                               AS ModifiedOnBehalfBy										
					,msdyn_externalaccountid                          AS MsdynExternalAccountId									
					,modifiedbyexternalparty                          AS ModifiedByExternalParty								
					,CAST(modifiedon AS DATETIME2(7))                 AS ModifiedOn												
					,CAST(numberofemployees AS BIGINT)                AS NumberOfEmployees										
					,CAST(onholdtime AS BIGINT)                       AS OnHoldTime												
					,CAST(opendeals AS BIGINT)                        AS OpenDeals												
					,CAST(opendeals_date AS DATETIME2(7))             AS OpenDealsDate											
					,CAST(opendeals_state AS BIGINT)                  AS OpenDealsState											
					,CAST(openrevenue AS DECIMAL(18,4))               AS OpenRevenue											
					,CAST(openrevenue_base AS DECIMAL(18,4))          AS OpenRevenueBase										
					,CAST(openrevenue_date AS DATETIME2(7))           AS OpenRevenueDate										
					,CAST(openrevenue_state AS BIGINT)                AS OpenRevenueState										
					,msiati_organizationtypeid                        AS MsiatiOrganizationTypeId								
					,originatingleadid                                AS OriginatingLeadId										
					,telephone2                                       AS Telephone2												
					,ownerid                                          AS OwnerId												
					,CAST(ownershipcode AS BIGINT)                    AS OwnershipCode											
					,ownershipcode_display                            AS OwnershipCodeDisplay									
					,owningbusinessunit                               AS OwningBusinessUnit										
					,owningteam                                       AS OwningTeam												
					,owninguser                                       AS OwningUser												
					,parentaccountid                                  AS ParentAccountId										
					,CAST(participatesinworkflow AS BIT)              AS ParticipatesInWorkflow									
					,CAST(paymenttermscode AS BIGINT)                 AS PaymentTermsCode										
					,paymenttermscode_display                         AS PaymentTermsCodeDisplay								
					,CAST(preferredappointmentdaycode AS BIGINT)      AS PreferredAppointmentDayCode							
					,preferredappointmentdaycode_display              AS PreferredAppointmentDayCodeDisplay						
					,preferredequipmentid                             AS PreferredEquipmentId									
					,CAST(preferredcontactmethodcode AS BIGINT)       AS PreferredContactMethodCode								
					,preferredcontactmethodcode_display               AS PreferredContactMethodCodeDisplay						
					,preferredserviceid                               AS PreferredServiceId										
					,CAST(preferredappointmenttimecode AS BIGINT)     AS PreferredAppointmentTimeCode							
					,preferredappointmenttimecode_display             AS PreferredAppointmentTimeCodeDisplay					
					,preferredsystemuserid                            AS PreferredSystemUserId									
					,CAST(msnfp_primaryconstituenttype AS BIGINT)     AS MsnfpPrimaryConstituentType							
					,msnfp_primaryconstituenttype_display             AS MsnfpPrimaryConstituentTypeDisplay						
					,primarycontactid                                 AS PrimaryContactId										
					,primarysatoriid                                  AS PrimarySatoriId										
					,primarytwitterid                                 AS PrimaryTwitterId										
					,processid                                        AS ProcessId												
					,defaultpricelevelid                              AS DefaultPriceLevelId									
					,CAST(overriddencreatedon AS DATETIME2(7))        AS OverriddenCreatedOn									
					,CAST(customertypecode AS BIGINT)                 AS CustomerTypeCode										
					,customertypecode_display                         AS CustomerTypeCodeDisplay								
					,msiati_reportingorganizationid                   AS MsiatiReportingOrganizationId							
					,CAST(msiati_secondaryreporter AS BIT)            AS MsiatiSecondaryReporter								
					,CAST(donotsendmm AS BIT)                         AS DoNotSendMm											
					,CAST(sharesoutstanding AS BIGINT)                AS SharesOutstanding										
					,CAST(shippingmethodcode AS BIGINT)               AS ShippingMethodCode										
					,shippingmethodcode_display                       AS ShippingMethodCodeDisplay								
					,sic                                              AS Sic												    
					,slaid                                            AS SlaId												    
					,CAST(statecode AS BIGINT)                        AS StateCode												
					,statecode_display                                AS StateCodeDisplay										
					,CAST(statuscode AS BIGINT)                       AS StatusCode												
					,statuscode_display                               AS StatusCodeDisplay										
					,stockexchange                                    AS StockExchange											
					,telephone3                                       AS Telephone3												
					,territoryid                                      AS TerritoryId											
					,CAST(territorycode AS BIGINT)                    AS TerritoryCode											
					,territorycode_display                            AS TerritoryCodeDisplay									
					,tickersymbol                                     AS TickerSymbol											
					,timespentbymeonemailandmeetings                  AS TimeSpentByMeOnEmailAndMeetings						
					,CAST(timezoneruleversionnumber AS BIGINT)        AS TimeZoneRuleVersionNumber								
					,CAST(utcconversiontimezonecode AS BIGINT)        AS UtcConversionTimeZoneCode								
					,CAST(versionnumber AS BIGINT)                    AS VersionNumber											
					,websiteurl                                       AS WebsiteUrl												
					,yominame                                         AS YomiName																						
			FROM 
			(		
				-- APPLY ROW NUMBER TO REMOVE DUPLICATES AND ONLY SELECT THE MOST RECENT RECORDS
				SELECT DISTINCT
					 stageid                                
					,traversedpath                          
					,accountid                              
					,[name]                                 
					,accountnumber                          
					,accountratingcode                      
					,accountratingcode_display              
					,msnfp_accounttype                      
					,msnfp_accounttype_display              
					,msnfp_acquisitiondate                  
					,msnfp_acquisitionsource                
					,msnfp_acquisitionsource_display        
					,address1_composite                     
					,address1_addresstypecode               
					,address1_addresstypecode_display       
					,address1_city                          
					,address1_country                       
					,address1_county                        
					,address1_fax                           
					,address1_freighttermscode              
					,address1_freighttermscode_display      
					,address1_addressid                     
					,address1_latitude                      
					,address1_longitude                     
					,address1_name                          
					,address1_postofficebox                 
					,address1_primarycontactname            
					,address1_shippingmethodcode            
					,address1_shippingmethodcode_display    
					,address1_stateorprovince               
					,address1_line1                         
					,address1_line2                         
					,address1_line3                         
					,address1_telephone2                    
					,address1_telephone3                    
					,address1_upszone                       
					,address1_utcoffset                     
					,address1_postalcode                    
					,address2_composite                     
					,address2_addresstypecode               
					,address2_addresstypecode_display       
					,address2_city                          
					,address2_country                       
					,address2_county                        
					,address2_fax                           
					,address2_freighttermscode              
					,address2_freighttermscode_display      
					,address2_addressid                     
					,address2_latitude                      
					,address2_longitude                     
					,address2_name                          
					,address2_postofficebox                 
					,address2_primarycontactname            
					,address2_shippingmethodcode            
					,address2_shippingmethodcode_display    
					,address2_stateorprovince               
					,address2_line1                         
					,address2_line2                         
					,address2_line3                         
					,address2_telephone1                    
					,address2_telephone2                    
					,address2_telephone3                    
					,address2_upszone                       
					,address2_utcoffset                     
					,address2_postalcode                    
					,address1_telephone1                    
					,aging30                                
					,aging30_base                           
					,aging60                                
					,aging60_base                           
					,aging90                                
					,aging90_base                           
					,revenue                                
					,revenue_base                           
					,businesstypecode                       
					,businesstypecode_display               
					,accountcategorycode                    
					,accountcategorycode_display            
					,accountclassificationcode              
					,accountclassificationcode_display      
					,createdby                              
					,createdonbehalfby                      
					,createdbyexternalparty                 
					,createdon                              
					,creditonhold                           
					,creditlimit                            
					,creditlimit_base                       
					,transactioncurrencyid                  
					,customersizecode                       
					,customersizecode_display               
					,msiati_defaultcurrencyid               
					,msiati_defaultlanguageid               
					,[description]                          
					,donotbulkemail                         
					,donotbulkpostalmail                    
					,donotemail                             
					,donotfax                               
					,donotpostalmail                        
					,donotphone                             
					,emailaddress1                          
					,emailaddress2                          
					,emailaddress3                          
					,entityimage_timestamp                  
					,entityimage_url                        
					,entityimageid                          
					,exchangerate                           
					,fax                                    
					,followemail                            
					,ftpsiteurl                             
					,msiati_iatiorganizationidentifier      
					,importsequencenumber                   
					,industrycode                           
					,industrycode_display                   
					,lastusedincampaign                     
					,lastonholdtime                         
					,slainvokedid                           
					,telephone1                             
					,marketcap                              
					,marketcap_base                         
					,marketingonly                          
					,masterid                               
					,merged                                 
					,modifiedby                             
					,modifiedonbehalfby                     
					,msdyn_externalaccountid                
					,modifiedbyexternalparty                
					,modifiedon                             
					,numberofemployees                      
					,onholdtime                             
					,opendeals                              
					,opendeals_date                         
					,opendeals_state                        
					,openrevenue                            
					,openrevenue_base                       
					,openrevenue_date                       
					,openrevenue_state                      
					,msiati_organizationtypeid              
					,originatingleadid                      
					,telephone2                             
					,ownerid                                
					,ownershipcode                          
					,ownershipcode_display                  
					,owningbusinessunit                     
					,owningteam                             
					,owninguser                             
					,parentaccountid                        
					,participatesinworkflow                 
					,paymenttermscode                       
					,paymenttermscode_display               
					,preferredappointmentdaycode            
					,preferredappointmentdaycode_display    
					,preferredequipmentid                   
					,preferredcontactmethodcode             
					,preferredcontactmethodcode_display     
					,preferredserviceid                     
					,preferredappointmenttimecode           
					,preferredappointmenttimecode_display   
					,preferredsystemuserid                  
					,msnfp_primaryconstituenttype           
					,msnfp_primaryconstituenttype_display   
					,primarycontactid                       
					,primarysatoriid                        
					,primarytwitterid                       
					,processid                              
					,defaultpricelevelid                    
					,overriddencreatedon                    
					,customertypecode                       
					,customertypecode_display               
					,msiati_reportingorganizationid         
					,msiati_secondaryreporter               
					,donotsendmm                            
					,sharesoutstanding                      
					,shippingmethodcode                     
					,shippingmethodcode_display             
					,sic                                    
					,slaid                                  
					,statecode                              
					,statecode_display                      
					,statuscode                             
					,statuscode_display                     
					,stockexchange                          
					,telephone3                             
					,territoryid                            
					,territorycode                          
					,territorycode_display                  
					,tickersymbol                           
					,timespentbymeonemailandmeetings        
					,timezoneruleversionnumber              
					,utcconversiontimezonecode              
					,versionnumber                          
					,websiteurl                             
					,yominame                               
					,ROW_NUMBER() OVER(PARTITION BY [accountid],[address1_addressid],[address2_addressid] ORDER BY COALESCE([overriddencreatedon],[createdon]),[modifiedon] DESC) AS RowOrdinal
	    		FROM [External].[IATIAccount]	 
			) A
			WHERE RowOrdinal = 1
		) B
		OPTION(LABEL = 'Scratch.Account.Obtain');


		-- GET THE MAX IDENTITY KEY FROM THE PERSISTED TABLE
		DECLARE @maxKey INT = (SELECT ISNULL(MAX(AccountKey),0) FROM [Persisted].[Account])

		-- CREATE A TEMP TABLE USING CTAS TO HANDLE MERGE OPERATIONS
		CREATE TABLE [Persisted].[Account_Upsert]
		WITH
		(	
			CLUSTERED COLUMNSTORE INDEX,
			DISTRIBUTION = ROUND_ROBIN
		)
		AS
		-- NEW ROWS AND NEW VERSIONS OF ROWS
		SELECT 
			ROW_NUMBER() OVER(ORDER BY [AccountChangeHash] DESC) + @maxKey AS  AccountKey
			,S.AccountChangeHash						    
			,S.StageId                                    
			,S.TraversedPath                              
			,S.AccountId									
			,S.[Name]										
			,S.AccountNumber								
			,S.AccountRatingCode							
			,S.AccountRatingCodeDisplay					
			,S.MsnfpAccountType							
			,S.MsnfpAccountTypeDisplay					
			,S.MsnfpAcquisitionDate						
			,S.MsnfpAcquisitionSource						
			,S.MsnfpAcquisitionSourceDisplay				
			,S.Address1Composite							
			,S.Address1AddressTypeCode					
			,S.Address1AddressTypeCodeDisplay				
			,S.Address1City								
			,S.Address1Country							
			,S.Address1County								
			,S.Address1Fax								
			,S.Address1FreightTermsCode					
			,S.Address1FreightTermsCodeDisplay			
			,S.Address1AddressId							
			,S.Address1Latitude							
			,S.Address1Longitude							
			,S.Address1Name								
			,S.Address1PostOfficeBox						
			,S.Address1PrimaryContactName					
			,S.Address1ShippingMethodCode					
			,S.Address1ShippingMethodCodeDisplay			
			,S.Address1StateOrProvince					
			,S.Address1Line1								
			,S.Address1Line2								
			,S.Address1Line3								
			,S.Address1Telephone2							
			,S.Address1Telephone3							
			,S.Address1UpsZone							
			,S.Address1UtcOffset							
			,S.Address1PostalCode							
			,S.Address2Composite							
			,S.Address2AddressTypeCode					
			,S.Address2AddressTypeCodeDisplay				
			,S.Address2City								
			,S.Address2Country							
			,S.Address2County								
			,S.Address2Fax								
			,S.Address2FreightTermsCode					
			,S.Address2FreightTermsCodeDisplay			
			,S.Address2AddressId							
			,S.Address2Latitude							
			,S.Address2Longitude							
			,S.Address2Name								
			,S.Address2PostOfficeBox						
			,S.Address2PrimaryContactName					
			,S.Address2ShippingMethodCode					
			,S.Address2ShippingMethodCodeDisplay			
			,S.Address2StateOrProvince					
			,S.Address2Line1								
			,S.Address2Line2								
			,S.Address2Line3								
			,S.Address2Telephone1							
			,S.Address2Telephone2							
			,S.Address2Telephone3							
			,S.Address2UpsZone							
			,S.Address2UtcOffset							
			,S.Address2PostalCode							
			,S.Address1Telephone1							
			,S.Aging30									
			,S.Aging30Base								
			,S.Aging60									
			,S.Aging60Base								
			,S.Aging90									
			,S.Aging90Base								
			,S.Revenue									
			,S.RevenueBase								
			,S.BusinessTypeCode							
			,S.BusinessTypeCodeDisplay					
			,S.AccountCategoryCode						
			,S.AccountCategoryCodeDisplay					
			,S.AccountClassificationCode					
			,S.AccountClassificationCodeDisplay			
			,S.CreatedBy									
			,S.CreatedOnBehalfBy							
			,S.CreatedByExternalParty						
			,S.CreatedOn									
			,S.CreditOnHold								
			,S.CreditLimit								
			,S.CreditLimitBase							
			,S.TransactionCurrencyId						
			,S.CustomerSizeCode							
			,S.CustomerSizeCodeDisplay					
			,S.MsiatiDefaultCurrencyId					
			,S.MsiatiDefaultLanguageId					
			,S.[Description]								
			,S.DoNotBulkEmail								
			,S.DoNotBulkPostalMail						
			,S.DoNotEmail									
			,S.DoNotFax									
			,S.DoNotPostalMail							
			,S.DoNotPhone									
			,S.EmailAddress1								
			,S.EmailAddress2								
			,S.EmailAddress3								
			,S.EntityImageTimestamp						
			,S.EntityImageUrl								
			,S.EntityImageId								
			,S.ExchangeRate								
			,S.Fax										
			,S.FollowEmail								
			,S.FtpSiteUrl									
			,S.MsiatiIatiOrganizationIdentifier			
			,S.ImportSequenceNumber						
			,S.IndustryCode								
			,S.IndustryCodeDisplay						
			,S.LastUsedInCampaign							
			,S.LastOnHoldTime								
			,S.SlaInvokedId								
			,S.Telephone1									
			,S.MarketCap									
			,S.MarketCapBase								
			,S.MarketingOnly								
			,S.MasterId									
			,S.Merged										
			,S.ModifiedBy									
			,S.ModifiedOnBehalfBy							
			,S.MsdynExternalAccountId						
			,S.ModifiedByExternalParty					
			,S.ModifiedOn									
			,S.NumberOfEmployees							
			,S.OnHoldTime									
			,S.OpenDeals									
			,S.OpenDealsDate								
			,S.OpenDealsState								
			,S.OpenRevenue								
			,S.OpenRevenueBase							
			,S.OpenRevenueDate							
			,S.OpenRevenueState							
			,S.MsiatiOrganizationTypeId					
			,S.OriginatingLeadId							
			,S.Telephone2									
			,S.OwnerId									
			,S.OwnershipCode								
			,S.OwnershipCodeDisplay						
			,S.OwningBusinessUnit							
			,S.OwningTeam									
			,S.OwningUser									
			,S.ParentAccountId							
			,S.ParticipatesInWorkflow						
			,S.PaymentTermsCode							
			,S.PaymentTermsCodeDisplay					
			,S.PreferredAppointmentDayCode				
			,S.PreferredAppointmentDayCodeDisplay			
			,S.PreferredEquipmentId						
			,S.PreferredContactMethodCode					
			,S.PreferredContactMethodCodeDisplay			
			,S.PreferredServiceId							
			,S.PreferredAppointmentTimeCode				
			,S.PreferredAppointmentTimeCodeDisplay		
			,S.PreferredSystemUserId						
			,S.MsnfpPrimaryConstituentType				
			,S.MsnfpPrimaryConstituentTypeDisplay			
			,S.PrimaryContactId							
			,S.PrimarySatoriId							
			,S.PrimaryTwitterId							
			,S.ProcessId									
			,S.DefaultPriceLevelId						
			,S.OverriddenCreatedOn						
			,S.CustomerTypeCode							
			,S.CustomerTypeCodeDisplay					
			,S.MsiatiReportingOrganizationId				
			,S.MsiatiSecondaryReporter					
			,S.DoNotSendMm								
			,S.SharesOutstanding							
			,S.ShippingMethodCode							
			,S.ShippingMethodCodeDisplay					
			,S.Sic										
			,S.SlaId										
			,S.StateCode									
			,S.StateCodeDisplay							
			,S.StatusCode									
			,S.StatusCodeDisplay							
			,S.StockExchange								
			,S.Telephone3									
			,S.TerritoryId								
			,S.TerritoryCode								
			,S.TerritoryCodeDisplay						
			,S.TickerSymbol								
			,S.TimeSpentByMeOnEmailAndMeetings			
			,S.TimeZoneRuleVersionNumber					
			,S.UtcConversionTimeZoneCode					
			,S.VersionNumber								
			,S.WebsiteUrl									
			,S.YomiName														
			,GETDATE() AS [InsertedDate]
		FROM [Scratch].[Account] AS S

		UNION ALL

		-- KEEP ROWS THAT ARE NOT BEING TOUCHED
		SELECT 
			 P.AccountKey
			,P.AccountChangeHash						    
			,P.StageId                                    
			,P.TraversedPath                              
			,P.AccountId									
			,P.[Name]										
			,P.AccountNumber								
			,P.AccountRatingCode							
			,P.AccountRatingCodeDisplay					
			,P.MsnfpAccountType							
			,P.MsnfpAccountTypeDisplay					
			,P.MsnfpAcquisitionDate						
			,P.MsnfpAcquisitionSource						
			,P.MsnfpAcquisitionSourceDisplay				
			,P.Address1Composite							
			,P.Address1AddressTypeCode					
			,P.Address1AddressTypeCodeDisplay				
			,P.Address1City								
			,P.Address1Country							
			,P.Address1County								
			,P.Address1Fax								
			,P.Address1FreightTermsCode					
			,P.Address1FreightTermsCodeDisplay			
			,P.Address1AddressId							
			,P.Address1Latitude							
			,P.Address1Longitude							
			,P.Address1Name								
			,P.Address1PostOfficeBox						
			,P.Address1PrimaryContactName					
			,P.Address1ShippingMethodCode					
			,P.Address1ShippingMethodCodeDisplay			
			,P.Address1StateOrProvince					
			,P.Address1Line1								
			,P.Address1Line2								
			,P.Address1Line3								
			,P.Address1Telephone2							
			,P.Address1Telephone3							
			,P.Address1UpsZone							
			,P.Address1UtcOffset							
			,P.Address1PostalCode							
			,P.Address2Composite							
			,P.Address2AddressTypeCode					
			,P.Address2AddressTypeCodeDisplay				
			,P.Address2City								
			,P.Address2Country							
			,P.Address2County								
			,P.Address2Fax								
			,P.Address2FreightTermsCode					
			,P.Address2FreightTermsCodeDisplay			
			,P.Address2AddressId							
			,P.Address2Latitude							
			,P.Address2Longitude							
			,P.Address2Name								
			,P.Address2PostOfficeBox						
			,P.Address2PrimaryContactName					
			,P.Address2ShippingMethodCode					
			,P.Address2ShippingMethodCodeDisplay			
			,P.Address2StateOrProvince					
			,P.Address2Line1								
			,P.Address2Line2								
			,P.Address2Line3								
			,P.Address2Telephone1							
			,P.Address2Telephone2							
			,P.Address2Telephone3							
			,P.Address2UpsZone							
			,P.Address2UtcOffset							
			,P.Address2PostalCode							
			,P.Address1Telephone1							
			,P.Aging30									
			,P.Aging30Base								
			,P.Aging60									
			,P.Aging60Base								
			,P.Aging90									
			,P.Aging90Base								
			,P.Revenue									
			,P.RevenueBase								
			,P.BusinessTypeCode							
			,P.BusinessTypeCodeDisplay					
			,P.AccountCategoryCode						
			,P.AccountCategoryCodeDisplay					
			,P.AccountClassificationCode					
			,P.AccountClassificationCodeDisplay			
			,P.CreatedBy									
			,P.CreatedOnBehalfBy							
			,P.CreatedByExternalParty						
			,P.CreatedOn									
			,P.CreditOnHold								
			,P.CreditLimit								
			,P.CreditLimitBase							
			,P.TransactionCurrencyId						
			,P.CustomerSizeCode							
			,P.CustomerSizeCodeDisplay					
			,P.MsiatiDefaultCurrencyId					
			,P.MsiatiDefaultLanguageId					
			,P.[Description]								
			,P.DoNotBulkEmail								
			,P.DoNotBulkPostalMail						
			,P.DoNotEmail									
			,P.DoNotFax									
			,P.DoNotPostalMail							
			,P.DoNotPhone									
			,P.EmailAddress1								
			,P.EmailAddress2								
			,P.EmailAddress3								
			,P.EntityImageTimestamp						
			,P.EntityImageUrl								
			,P.EntityImageId								
			,P.ExchangeRate								
			,P.Fax										
			,P.FollowEmail								
			,P.FtpSiteUrl									
			,P.MsiatiIatiOrganizationIdentifier			
			,P.ImportSequenceNumber						
			,P.IndustryCode								
			,P.IndustryCodeDisplay						
			,P.LastUsedInCampaign							
			,P.LastOnHoldTime								
			,P.SlaInvokedId								
			,P.Telephone1									
			,P.MarketCap									
			,P.MarketCapBase								
			,P.MarketingOnly								
			,P.MasterId									
			,P.Merged										
			,P.ModifiedBy									
			,P.ModifiedOnBehalfBy							
			,P.MsdynExternalAccountId						
			,P.ModifiedByExternalParty					
			,P.ModifiedOn									
			,P.NumberOfEmployees							
			,P.OnHoldTime									
			,P.OpenDeals									
			,P.OpenDealsDate								
			,P.OpenDealsState								
			,P.OpenRevenue								
			,P.OpenRevenueBase							
			,P.OpenRevenueDate							
			,P.OpenRevenueState							
			,P.MsiatiOrganizationTypeId					
			,P.OriginatingLeadId							
			,P.Telephone2									
			,P.OwnerId									
			,P.OwnershipCode								
			,P.OwnershipCodeDisplay						
			,P.OwningBusinessUnit							
			,P.OwningTeam									
			,P.OwningUser									
			,P.ParentAccountId							
			,P.ParticipatesInWorkflow						
			,P.PaymentTermsCode							
			,P.PaymentTermsCodeDisplay					
			,P.PreferredAppointmentDayCode				
			,P.PreferredAppointmentDayCodeDisplay			
			,P.PreferredEquipmentId						
			,P.PreferredContactMethodCode					
			,P.PreferredContactMethodCodeDisplay			
			,P.PreferredServiceId							
			,P.PreferredAppointmentTimeCode				
			,P.PreferredAppointmentTimeCodeDisplay		
			,P.PreferredSystemUserId						
			,P.MsnfpPrimaryConstituentType				
			,P.MsnfpPrimaryConstituentTypeDisplay			
			,P.PrimaryContactId							
			,P.PrimarySatoriId							
			,P.PrimaryTwitterId							
			,P.ProcessId									
			,P.DefaultPriceLevelId						
			,P.OverriddenCreatedOn						
			,P.CustomerTypeCode							
			,P.CustomerTypeCodeDisplay					
			,P.MsiatiReportingOrganizationId				
			,P.MsiatiSecondaryReporter					
			,P.DoNotSendMm								
			,P.SharesOutstanding							
			,P.ShippingMethodCode							
			,P.ShippingMethodCodeDisplay					
			,P.Sic										
			,P.SlaId										
			,P.StateCode									
			,P.StateCodeDisplay							
			,P.StatusCode									
			,P.StatusCodeDisplay							
			,P.StockExchange								
			,P.Telephone3									
			,P.TerritoryId								
			,P.TerritoryCode								
			,P.TerritoryCodeDisplay						
			,P.TickerSymbol								
			,P.TimeSpentByMeOnEmailAndMeetings			
			,P.TimeZoneRuleVersionNumber					
			,P.UtcConversionTimeZoneCode					
			,P.VersionNumber								
			,P.WebsiteUrl									
			,P.YomiName									
			,GETDATE() AS [InsertedDate]
		FROM [Persisted].[Account] AS P
		WHERE NOT EXISTS
		(
			SELECT *
			FROM [Scratch].[Account] S
			WHERE S.[AccountChangeHash] = P.[AccountChangeHash]
		)
		OPTION(LABEL = 'Persisted.Account.Obtain');

		-- KEEP LATEST CTAS AND DELETE PREVIOUS ONE
		RENAME OBJECT [Persisted].[Account] TO [Account_old];
		RENAME OBJECT [Persisted].[Account_Upsert] TO [Account];
		DROP TABLE [Persisted].[Account_old];
		

	END TRY

	BEGIN CATCH
		--CTAS FAILED, MARK PROCESS AS FAILED AND THROW ERROR
		DECLARE @ErrorMsg	VARCHAR(250)
		SET @ErrorMsg = 'Error loading table Persisted.Account: ' + ERROR_MESSAGE()
		RAISERROR (@ErrorMsg, 16, 1)
	END CATCH

END
