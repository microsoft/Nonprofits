﻿-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE VIEW [Presentation].[Transaction]
AS 
	SELECT
	     [TransactionKey]
        ,[TransactionChangeHash]
        ,[MsnfpAdjustmentComment]
        ,[MsnfpAdjustmentReason]
        ,[MsnfpAdjustmentReasonDisplay]
        ,[MsnfpAdjustmentType]
        ,[MsnfpAdjustmentTypeDisplay]
        ,[MsnfpAmount]
        ,[MsnfpAmountBase]
        ,[MsnfpAnonymity]
        ,[MsnfpAnonymityDisplay]
        ,[MsnfpBookdate]
        ,[CreatedBy]
        ,[CreatedOnBehalfBy]
        ,[CreatedOn]
        ,[TransactionCurrencyId]
        ,[MsiatiCurrencyValuedate]
        ,[MsnfpDataEntryReference]
        ,[MsnfpDataEntrySource]
        ,[MsnfpDataEntrySourceDisplay]
        ,[MsiatiDescription]
        ,[MsiatiDisbursementchannelid]
        ,[MsnfpEffectiveCampaignId]
        ,[MsnfpEffectiveSourceCode]
        ,[ExchangeRate]
        ,[MsnfpExchangeRateDate]
        ,[MsiatiFinanceTypeId]
        ,[MsiatiFlowTypeId]
        ,[MsiatiHumanitarian]
        ,[ImportSequenceNumber]
        ,[MsnfpIsAdjusted]
        ,[ModifiedBy]
        ,[ModifiedOnBehalfBy]
        ,[ModifiedOn]
        ,[MsnfpName]
        ,[MsnfpOriginalTxnAdjustedId]
        ,[MsnfpOriginatingCampaignId]
        ,[MsnfpOriginatingSourceCode]
        ,[OwnerId]
        ,[OwningBusinessUnit]
        ,[OwningTeam]
        ,[OwningUser]
        ,[MsnfpTransactionPaymentMethodId]
        ,[MsnfpTransactionPaymentScheduleid]
        ,[MsnfpPostedDate]
        ,[MsiatiProviderActivityIdentifier]
        ,[MsiatiProviderOrganizationId]
        ,[MsnfpTransactionReceiptonAccountId]
        ,[MsnfpReceivedDate]
        ,[MsiatiRecipientActivityidentifier]
        ,[MsiatiRecipientCountryId]
        ,[MsiatiRecipientCountryDescription]
        ,[MsiatiRecipientOrganizationId]
        ,[MsiatiRecipientRegionId]
        ,[MsiatiRecipientRegionDescription]
        ,[OverriddenCreatedOn]
        ,[MsiatiReference]
        ,[StateCode]
        ,[StateCodeDisplay]
        ,[StatusCode]
        ,[StatusCodeDisplay]
        ,[MsiatiTiedStatusId]
        ,[TimeZoneRuleVersionNumber]
        ,[MsnfpTransactionId]
        ,[UtcConversionTimeZoneCode]
        ,[VersionNumber]
        ,[InsertedDate]
    FROM [Persisted].[Transaction]