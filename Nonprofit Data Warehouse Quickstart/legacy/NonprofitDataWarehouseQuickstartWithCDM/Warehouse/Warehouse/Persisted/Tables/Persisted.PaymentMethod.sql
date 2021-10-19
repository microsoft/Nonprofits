-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE TABLE [Persisted].[PaymentMethod]
(
     PaymentMethodKey                               INT                 NOT NULL
    ,PaymentMethodChangeHash						BINARY(32)		    NOT NULL 
    ,MsnfpComments									NVARCHAR(500)		NULL
    ,MsnfpContactId									NVARCHAR(500)		NULL
    ,CreatedBy										NVARCHAR(500)		NULL
    ,CreatedOnBehalfBy								NVARCHAR(500)		NULL
    ,CreatedOn										DATETIME2(7)	    NULL
    ,ImportSequenceNumber							BIGINT				NULL
    ,MsnfpIsDefault									BIT					NULL
    ,MsnfpLastAuthenticationStatus					BIGINT				NULL
    ,MsnfpLastAuthenticationStatusDisplay			NVARCHAR(500)		NULL
    ,MsnfpLastAuthenticationStatusDate				DATETIME2(7)	    NULL
    ,MsnfpLastAuthenticationStatusDetail			NVARCHAR(500)		NULL
    ,MsnfpLastAuthenticationStatusTechnicalDetail	NVARCHAR(500)		NULL
    ,ModifiedBy										NVARCHAR(500)		NULL
    ,ModifiedOnBehalfBy								NVARCHAR(500)		NULL
    ,ModifiedOn										DATETIME2(7)	    NULL
    ,MsnfpName										NVARCHAR(500)		NULL
    ,OwnerId										NVARCHAR(500)		NULL
    ,OwningBusinessUnit								NVARCHAR(500)		NULL
    ,OwningTeam										NVARCHAR(500)		NULL
    ,OwningUser										NVARCHAR(500)		NULL
    ,MsnfpPaymentMethodId							NVARCHAR(500)		NOT NULL
    ,MsnfpPaymentScheduleId							NVARCHAR(500)		NULL
    ,MsnfpPayorId									NVARCHAR(500)		NULL
    ,OverriddenCreatedOn							DATETIME2(7)	    NULL
    ,StateCode										BIGINT				NULL
    ,StateCodeDisplay								NVARCHAR(500)		NULL
    ,StatusCode										BIGINT				NULL
    ,StatusCodeDisplay								NVARCHAR(500)		NULL
    ,TimezoneRuleVersionNumber						BIGINT				NULL
    ,MsnfpTransactionId								NVARCHAR(500)		NULL
    ,MsnfpType										BIGINT				NULL
    ,MsnfpTypeDisplay								NVARCHAR(500)		NULL
    ,UtcConversionTimezoneCode						BIGINT				NULL
    ,VersionNumber									BIGINT				NULL
    ,[InsertedDate]									DATETIME2(7)		NOT NULL
) 
WITH
( 
     CLUSTERED COLUMNSTORE INDEX
    ,DISTRIBUTION = ROUND_ROBIN
);