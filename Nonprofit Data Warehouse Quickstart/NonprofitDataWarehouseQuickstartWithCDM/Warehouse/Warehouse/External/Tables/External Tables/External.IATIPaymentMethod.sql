-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.


CREATE EXTERNAL TABLE [External].[IATIPaymentMethod]
(
     msnfp_comments                                     NVARCHAR(1000) NULL
    ,msnfp_contactid                                    NVARCHAR(1000) NULL
    ,createdby                                          NVARCHAR(1000) NULL
    ,createdonbehalfby                                  NVARCHAR(1000) NULL
    ,createdon                                          NVARCHAR(1000) NULL
    ,importsequencenumber                               NVARCHAR(1000) NULL
    ,msnfp_isdefault                                    NVARCHAR(1000) NULL
    ,msnfp_lastauthenticationstatus                     NVARCHAR(1000) NULL
    ,msnfp_lastauthenticationstatus_display             NVARCHAR(1000) NULL
    ,msnfp_lastauthenticationstatusdate                 NVARCHAR(1000) NULL
    ,msnfp_lastauthenticationstatusdetail               NVARCHAR(1000) NULL
    ,msnfp_lastauthenticationstatustechnicaldetail      NVARCHAR(1000) NULL
    ,modifiedby                                         NVARCHAR(1000) NULL
    ,modifiedonbehalfby                                 NVARCHAR(1000) NULL
    ,modifiedon                                         NVARCHAR(1000) NULL
    ,msnfp_name                                         NVARCHAR(1000) NULL
    ,ownerid                                            NVARCHAR(1000) NULL
    ,owningbusinessunit                                 NVARCHAR(1000) NULL
    ,owningteam                                         NVARCHAR(1000) NULL
    ,owninguser                                         NVARCHAR(1000) NULL
    ,msnfp_paymentmethodid                              NVARCHAR(1000) NULL
    ,msnfp_paymentscheduleid                            NVARCHAR(1000) NULL
    ,msnfp_payorid                                      NVARCHAR(1000) NULL
    ,overriddencreatedon                                NVARCHAR(1000) NULL
    ,statecode                                          NVARCHAR(1000) NULL
    ,statecode_display                                  NVARCHAR(1000) NULL
    ,statuscode                                         NVARCHAR(1000) NULL
    ,statuscode_display                                 NVARCHAR(1000) NULL
    ,timezoneruleversionnumber                          NVARCHAR(1000) NULL
    ,msnfp_transactionid                                NVARCHAR(1000) NULL
    ,msnfp_type                                         NVARCHAR(1000) NULL
    ,msnfp_type_display                                 NVARCHAR(1000) NULL
    ,utcconversiontimezonecode                          NVARCHAR(1000) NULL
    ,versionnumber                                      NVARCHAR(1000) NULL
) 
WITH
( 
    LOCATION = '/NonprofitAccelerator/msnfp_PaymentMethod/',
    DATA_SOURCE = ExternalDataSourceADLS,
    FILE_FORMAT = ExternalFileFormatCSV,
    REJECT_TYPE = VALUE,
    REJECT_VALUE = 0
);