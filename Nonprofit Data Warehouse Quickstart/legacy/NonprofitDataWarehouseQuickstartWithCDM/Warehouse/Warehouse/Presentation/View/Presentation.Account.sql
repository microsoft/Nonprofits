﻿
-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE VIEW [Presentation].[Account]
AS 
SELECT
	  [AccountKey]                                         
	 ,[AccountChangeHash]						            
	 ,[StageId]                                            
	 ,[TraversedPath]                                      
	 ,[AccountId]											
	 ,[Name]											
	 ,[AccountNumber]										
	 ,[AccountRatingCode]									
	 ,[AccountRatingCodeDisplay]							
	 ,[MsnfpAccountType]									
	 ,[MsnfpAccountTypeDisplay]							
	 ,[MsnfpAcquisitionDate]								
	 ,[MsnfpAcquisitionSource]								
	 ,[MsnfpAcquisitionSourceDisplay]						
	 ,[Address1Composite]									
	 ,[Address1AddressTypeCode]							
	 ,[Address1AddressTypeCodeDisplay]						
	 ,[Address1City]										
	 ,[Address1Country]									
	 ,[Address1County]										
	 ,[Address1Fax]										
	 ,[Address1FreightTermsCode]							
	 ,[Address1FreightTermsCodeDisplay]					
	 ,[Address1AddressId]									
	 ,[Address1Latitude]									
	 ,[Address1Longitude]									
	 ,[Address1Name]										
	 ,[Address1PostOfficeBox]								
	 ,[Address1PrimaryContactName]							
	 ,[Address1ShippingMethodCode]							
	 ,[Address1ShippingMethodCodeDisplay]					
	 ,[Address1StateOrProvince]							
	 ,[Address1Line1]										
	 ,[Address1Line2]										
	 ,[Address1Line3]										
	 ,[Address1Telephone2]									
	 ,[Address1Telephone3]									
	 ,[Address1UpsZone]									
	 ,[Address1UtcOffset]									
	 ,[Address1PostalCode]									
	 ,[Address2Composite]									
	 ,[Address2AddressTypeCode]							
	 ,[Address2AddressTypeCodeDisplay]						
	 ,[Address2City]										
	 ,[Address2Country]									
	 ,[Address2County]										
	 ,[Address2Fax]										
	 ,[Address2FreightTermsCode]							
	 ,[Address2FreightTermsCodeDisplay]					
	 ,[Address2AddressId]									
	 ,[Address2Latitude]									
	 ,[Address2Longitude]									
	 ,[Address2Name]										
	 ,[Address2PostOfficeBox]								
	 ,[Address2PrimaryContactName]							
	 ,[Address2ShippingMethodCode]							
	 ,[Address2ShippingMethodCodeDisplay]					
	 ,[Address2StateOrProvince]							
	 ,[Address2Line1]										
	 ,[Address2Line2]										
	 ,[Address2Line3]										
	 ,[Address2Telephone1]									
	 ,[Address2Telephone2]									
	 ,[Address2Telephone3]									
	 ,[Address2UpsZone]									
	 ,[Address2UtcOffset]									
	 ,[Address2PostalCode]									
	 ,[Address1Telephone1]									
	 ,[Aging30]											
	 ,[Aging30Base]										
	 ,[Aging60]											
	 ,[Aging60Base]										
	 ,[Aging90]											
	 ,[Aging90Base]										
	 ,[Revenue]											
	 ,[RevenueBase]										
	 ,[BusinessTypeCode]									
	 ,[BusinessTypeCodeDisplay]							
	 ,[AccountCategoryCode]								
	 ,[AccountCategoryCodeDisplay]							
	 ,[AccountClassificationCode]							
	 ,[AccountClassificationCodeDisplay]					
	 ,[CreatedBy]											
	 ,[CreatedOnBehalfBy]									
	 ,[CreatedByExternalParty]								
	 ,[CreatedOn]											
	 ,[CreditOnHold]										
	 ,[CreditLimit]										
	 ,[CreditLimitBase]									
	 ,[TransactionCurrencyId]								
	 ,[CustomerSizeCode]									
	 ,[CustomerSizeCodeDisplay]							
	 ,[MsiatiDefaultCurrencyId]							
	 ,[MsiatiDefaultLanguageId]							
	 ,[Description]										
	 ,[DoNotBulkEmail]										
	 ,[DoNotBulkPostalMail]								
	 ,[DoNotEmail]											
	 ,[DoNotFax]											
	 ,[DoNotPostalMail]									
	 ,[DoNotPhone]											
	 ,[EmailAddress1]										
	 ,[EmailAddress2]										
	 ,[EmailAddress3]										
	 ,[EntityImageTimestamp]								
	 ,[EntityImageUrl]										
	 ,[EntityImageId]										
	 ,[ExchangeRate]										
	 ,[Fax]												
	 ,[FollowEmail]										
	 ,[FtpSiteUrl]											
	 ,[MsiatiIatiOrganizationIdentifier]					
	 ,[ImportSequenceNumber]								
	 ,[IndustryCode]										
	 ,[IndustryCodeDisplay]								
	 ,[LastUsedInCampaign]									
	 ,[LastOnHoldTime]										
	 ,[SlaInvokedId]										
	 ,[Telephone1]											
	 ,[MarketCap]											
	 ,[MarketCapBase]										
	 ,[MarketingOnly]										
	 ,[MasterId]											
	 ,[Merged]												
	 ,[ModifiedBy]											
	 ,[ModifiedOnBehalfBy]									
	 ,[MsdynExternalAccountId]								
	 ,[ModifiedByExternalParty]							
	 ,[ModifiedOn]											
	 ,[NumberOfEmployees]									
	 ,[OnHoldTime]											
	 ,[OpenDeals]											
	 ,[OpenDealsDate]										
	 ,[OpenDealsState]										
	 ,[OpenRevenue]										
	 ,[OpenRevenueBase]									
	 ,[OpenRevenueDate]									
	 ,[OpenRevenueState]									
	 ,[MsiatiOrganizationTypeId]							
	 ,[OriginatingLeadId]									
	 ,[Telephone2]											
	 ,[OwnerId]											
	 ,[OwnershipCode]										
	 ,[OwnershipCodeDisplay]								
	 ,[OwningBusinessUnit]									
	 ,[OwningTeam]											
	 ,[OwningUser]											
	 ,[ParentAccountId]									
	 ,[ParticipatesInWorkflow]								
	 ,[PaymentTermsCode]									
	 ,[PaymentTermsCodeDisplay]							
	 ,[PreferredAppointmentDayCode]						
	 ,[PreferredAppointmentDayCodeDisplay]					
	 ,[PreferredEquipmentId]								
	 ,[PreferredContactMethodCode]							
	 ,[PreferredContactMethodCodeDisplay]					
	 ,[PreferredServiceId]									
	 ,[PreferredAppointmentTimeCode]						
	 ,[PreferredAppointmentTimeCodeDisplay]				
	 ,[PreferredSystemUserId]								
	 ,[MsnfpPrimaryConstituentType]						
	 ,[MsnfpPrimaryConstituentTypeDisplay]					
	 ,[PrimaryContactId]									
	 ,[PrimarySatoriId]									
	 ,[PrimaryTwitterId]									
	 ,[ProcessId]											
	 ,[DefaultPriceLevelId]								
	 ,[OverriddenCreatedOn]								
	 ,[CustomerTypeCode]									
	 ,[CustomerTypeCodeDisplay]							
	 ,[MsiatiReportingOrganizationId]						
	 ,[MsiatiSecondaryReporter]							
	 ,[DoNotSendMm]										
	 ,[SharesOutstanding]									
	 ,[ShippingMethodCode]									
	 ,[ShippingMethodCodeDisplay]							
	 ,[Sic]												
	 ,[SlaId]												
	 ,[StateCode]											
	 ,[StateCodeDisplay]									
	 ,[StatusCode]											
	 ,[StatusCodeDisplay]									
	 ,[StockExchange]										
	 ,[Telephone3]											
	 ,[TerritoryId]										
	 ,[TerritoryCode]										
	 ,[TerritoryCodeDisplay]								
	 ,[TickerSymbol]										
	 ,[TimeSpentByMeOnEmailAndMeetings]					
	 ,[TimeZoneRuleVersionNumber]							
	 ,[UtcConversionTimeZoneCode]							
	 ,[VersionNumber]										
	 ,[WebsiteUrl]											
	 ,[YomiName]											
	 ,[InsertedDate]												
FROM [Persisted].[Account]
