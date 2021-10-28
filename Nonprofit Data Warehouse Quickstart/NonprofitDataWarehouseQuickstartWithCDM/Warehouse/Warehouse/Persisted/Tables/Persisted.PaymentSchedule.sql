-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE TABLE [Persisted].[PaymentSchedule]
(
     PaymentScheduleKey                             INT                 NOT NULL
    ,PaymentScheduleChangeHash						BINARY(32)		    NOT NULL 
    ,CreatedBy                                      NVARCHAR(500)       NULL
    ,CreatedOnBehalfBy                              NVARCHAR(500)       NULL
    ,CreatedOn                                      DATETIME2(7)        NULL
    ,TransactionCurrencyId                          NVARCHAR(500)       NULL
    ,MsnfpOmtschedDefaultHardCreditToCustomer       NVARCHAR(500)       NULL
    ,MsnfpPaymentScheduleDonorCommitmentId          NVARCHAR(500)       NULL
    ,ExchangeRate                                   DECIMAL(18,4)       NULL
    ,MsnfpFirstpaymentDate                          DATETIME2(7)        NULL
    ,MsnfpFrequency                                 BIGINT              NULL
    ,MsnfpFrequencyDisplay                          NVARCHAR(500)       NULL
    ,MsnfpFrequencyInterval                         BIGINT              NULL
    ,ImportSequenceNumber                           BIGINT              NULL
    ,MsnfpLastPaymentDate                           DATETIME2(7)        NULL
    ,ModifiedBy                                     NVARCHAR(500)       NULL
    ,ModifiedOnBehalfBy                             NVARCHAR(500)       NULL
    ,ModifiedOn                                     DATETIME2(7)        NULL
    ,MsnfpName                                      NVARCHAR(500)       NULL
    ,MsnfpNextPaymentAmount                         DECIMAL(18,4)       NULL
    ,MsnfpNextPaymentAmountBase                     DECIMAL(18,4)       NULL
    ,MsnfpNextPaymentDate                           DATETIME2(7)        NULL
    ,MsnfpNumberOfPayments                          BIGINT              NULL
    ,OwnerId                                        NVARCHAR(500)       NULL
    ,OwningBusinessUnit                             NVARCHAR(500)       NULL
    ,OwningTeam                                     NVARCHAR(500)       NULL
    ,OwningUser                                     NVARCHAR(500)       NULL
    ,MsnfpPaymentScheduleId                         NVARCHAR(500)       NOT NULL
    ,MsnfpReceiptonAccountId                        NVARCHAR(500)       NULL
    ,OverriddenCreatedOn                            DATETIME2(7)        NULL
    ,MsnfpRecurringAmount                           DECIMAL(18,4)       NULL
    ,MsnfpRecurringAmountBase                       DECIMAL(18,4)       NULL
    ,StateCode                                      BIGINT              NULL
    ,StateCodeDisplay                               NVARCHAR(500)       NULL
    ,StatusCode                                     BIGINT              NULL
    ,StatusCodeDisplay                              NVARCHAR(500)       NULL
    ,TimezoneRuleVersionNumber                      BIGINT              NULL
    ,MsnfpTotalAmount                               DECIMAL(18,4)       NULL
    ,MsnfpTotalAmountBase                           DECIMAL(18,4)       NULL
    ,UtcConversionTimezoneCode                      BIGINT              NULL
    ,VersionNumber                                  BIGINT              NULL
    ,[InsertedDate]									DATETIME2(7)        NOT NULL	
) 
WITH
( 
     CLUSTERED COLUMNSTORE INDEX
    ,DISTRIBUTION = ROUND_ROBIN
);