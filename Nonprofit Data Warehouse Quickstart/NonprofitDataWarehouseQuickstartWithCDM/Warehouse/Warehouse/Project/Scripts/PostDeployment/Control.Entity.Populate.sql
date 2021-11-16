
-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

SET IDENTITY_INSERT [Control].[Entity] ON;

TRUNCATE TABLE [Control].[Entity];

-- RAW
INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (1, 'IATIACCOUNT', 'Account', 'datasources', 'iati', 'Account.csv', 'powerbi', 'CDM/Account', 'Account.csv', NULL, NULL, NULL, 1, 1, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (2, 'IATICAMPAIGN', 'Campaign', 'datasources', 'iati', 'Campaign.csv', 'powerbi', 'CDM/Campaign', 'Campaign.csv', NULL, NULL, NULL, 1, 1, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (3, 'IATIPAYMENTMETHOD', 'Payment Method', 'datasources', 'iati', 'msnfp_PaymentMethod.csv', 'powerbi', 'CDM/msnfp_PaymentMethod', 'msnfp_PaymentMethod.csv', NULL, NULL, NULL, 1, 1, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (4, 'IATIPAYMENTSCHEDULE', 'Payment Schedule', 'datasources', 'iati', 'msnfp_PaymentSchedule.csv', 'powerbi', 'CDM/msnfp_PaymentSchedule', 'msnfp_PaymentSchedule.csv', NULL, NULL, NULL, 1, 1, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (5, 'IATITRANSACTION', 'Transaction', 'datasources', 'iati', 'msnfp_Transaction.csv', 'powerbi', 'CDM/msnfp_Transaction', 'msnfp_Transaction.csv', NULL, NULL, NULL, 1, 1, 1)


-- PERSISTED
INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (100, 'PERSISTEDACCOUNT', 'Persisted Account', NULL, NULL, NULL, NULL, NULL, NULL, 'Persisted', 'Account', 'ObtainAccount', 1, 2, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (101, 'PERSISTEDCAMPAIGN', 'Persisted Campaign', NULL, NULL, NULL, NULL, NULL, NULL, 'Persisted', 'Campaign', 'ObtainCampaign', 1, 2, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (102, 'PERSISTEDPAYMENTMETHOD', 'Persisted Payment Method',	NULL, NULL, NULL, NULL, NULL, NULL, 'Persisted', 'Payment Method', 'ObtainPaymentMethod', 1, 2, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (103, 'PERSISTEDPAYMENTSCHEDULE', 'Persisted Payment Schedule', NULL, NULL, NULL, NULL, NULL, NULL, 'Persisted', 'PaymentSchedule', 'ObtainPaymentSchedule', 1, 2, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (104, 'PERSISTEDTRANSACTION', 'Persisted Transaction', NULL, NULL, NULL, NULL, NULL, NULL, 'Persisted', 'Transaction', 'ObtainTransaction', 1, 2, 1)


SET IDENTITY_INSERT [Control].[Entity] OFF;