-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.


CREATE EXTERNAL TABLE [External].[IATIPaymentSchedule]
(
     createdby                                      NVARCHAR(1000) NULL
    ,createdonbehalfby                              NVARCHAR(1000) NULL
    ,createdon                                      NVARCHAR(1000) NULL
    ,transactioncurrencyid                          NVARCHAR(1000) NULL
    ,msnfp_omtsched_defaulthardcredittocustomer     NVARCHAR(1000) NULL
    ,msnfp_paymentschedule_donorcommitmentid        NVARCHAR(1000) NULL
    ,exchangerate                                   NVARCHAR(1000) NULL
    ,msnfp_firstpaymentdate                         NVARCHAR(1000) NULL
    ,msnfp_frequency                                NVARCHAR(1000) NULL
    ,msnfp_frequency_display                        NVARCHAR(1000) NULL
    ,msnfp_frequencyinterval                        NVARCHAR(1000) NULL
    ,importsequencenumber                           NVARCHAR(1000) NULL
    ,msnfp_lastpaymentdate                          NVARCHAR(1000) NULL
    ,modifiedby                                     NVARCHAR(1000) NULL
    ,modifiedonbehalfby                             NVARCHAR(1000) NULL
    ,modifiedon                                     NVARCHAR(1000) NULL
    ,msnfp_name                                     NVARCHAR(1000) NULL
    ,msnfp_nextpaymentamount                        NVARCHAR(1000) NULL
    ,msnfp_nextpaymentamount_base                   NVARCHAR(1000) NULL
    ,msnfp_nextpaymentdate                          NVARCHAR(1000) NULL
    ,msnfp_numberofpayments                         NVARCHAR(1000) NULL
    ,ownerid                                        NVARCHAR(1000) NULL
    ,owningbusinessunit                             NVARCHAR(1000) NULL
    ,owningteam                                     NVARCHAR(1000) NULL
    ,owninguser                                     NVARCHAR(1000) NULL
    ,msnfp_paymentscheduleid                        NVARCHAR(1000) NULL
    ,msnfp_receiptonaccountid                       NVARCHAR(1000) NULL
    ,overriddencreatedon                            NVARCHAR(1000) NULL
    ,msnfp_recurringamount                          NVARCHAR(1000) NULL
    ,msnfp_recurringamount_base                     NVARCHAR(1000) NULL
    ,statecode                                      NVARCHAR(1000) NULL
    ,statecode_display                              NVARCHAR(1000) NULL
    ,statuscode                                     NVARCHAR(1000) NULL
    ,statuscode_display                             NVARCHAR(1000) NULL
    ,timezoneruleversionnumber                      NVARCHAR(1000) NULL
    ,msnfp_totalamount                              NVARCHAR(1000) NULL
    ,msnfp_totalamount_base                         NVARCHAR(1000) NULL
    ,utcconversiontimezonecode                      NVARCHAR(1000) NULL
    ,versionnumber                                  NVARCHAR(1000) NULL
)
WITH
( 
    LOCATION = '/NonprofitAccelerator/msnfp_PaymentSchedule/',
    DATA_SOURCE = ExternalDataSourceADLS,
    FILE_FORMAT = ExternalFileFormatCSV,
    REJECT_TYPE = VALUE,
    REJECT_VALUE = 0
);