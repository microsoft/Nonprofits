-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

SET IDENTITY_INSERT [Control].[Entity] ON;

TRUNCATE TABLE [Control].[Entity];

-- RAW
INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (1, 'IATIACTIVITYDATE', 'Activity Date',	'datasources', 'iati', 'ActivityDate.csv', 'quickstart', 'RAW/IATI/ActivityDate', 'ActivityDate*.parquet', NULL, NULL, NULL, 1, 1, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (2, 'IATIACTIVITYSTATUS', 'Activity Status', 'datasources', 'iati', 'ActivityStatus.csv', 'quickstart', 'RAW/IATI/ActivityStatus', 'ActivityStatus*.parquet', NULL, NULL, NULL, 1, 1, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (3, 'IATIBUDGET', 'Budget', 'datasources', 'iati', 'Budget.csv', 'quickstart', 'RAW/IATI/Budget', 'Budget*.parquet', NULL, NULL, NULL, 1, 1, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (4, 'IATICONTACTINFORMATION', 'Contact Information', 'datasources', 'iati', 'ContactInformation.csv', 'quickstart', 'RAW/IATI/ContactInformation',	'ContactInformation*.parquet', NULL, NULL, NULL, 1, 1, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (5, 'IATIDESCRIPTION', 'Description', 'datasources', 'iati', 'Description.csv', 'quickstart', 'RAW/IATI/Description', 'Description*.parquet', NULL, NULL, NULL, 1, 1, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (6, 'IATIPARTICIPATINGORGANISATION', 'Participating Organisation', 'datasources', 'iati', 'ParticipatingOrganisation.csv','quickstart', 'RAW/IATI/ParticipatingOrganisation', 'ParticipatingOrganisation*.parquet', NULL, NULL, NULL, 1, 1, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (7, 'IATIRECIPIENTCOUNTRY', 'Recipient Country', 'datasources', 'iati', 'RecipientCountry.csv', 'quickstart', 'RAW/IATI/RecipientCountry', 'RecipientCountry*.parquet',	NULL, NULL, NULL, 1, 1, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (8, 'IATIRECIPIENTREGION', 'Recipient Region', 'datasources', 'iati', 'RecipientRegion.csv', 'quickstart', 'RAW/IATI/RecipientRegion', 'RecipientRegion*.parquet', NULL, NULL, NULL, 1, 1, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (9, 'IATIREPORTINGORGANISATION', 'Reporting Organisation', 'datasources', 'iati', 'ReportingOrganisation.csv', 'quickstart', 'RAW/IATI/ReportingOrganisation', 'ReportingOrganisation*.parquet', NULL, NULL, NULL, 1, 1, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (10, 'IATISECTOR', 'Sector', 'datasources', 'iati', 'Sector.csv', 'quickstart', 'RAW/IATI/Sector', 'Sector*.parquet', NULL, NULL, NULL, 1, 1, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (11, 'IATITITLE', 'Title', 'datasources', 'iati', 'Title.csv', 'quickstart', 'RAW/IATI/Title', 'Title*.parquet', NULL, NULL, NULL, 1, 1, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (12, 'IATITRANSACTIONS', 'Transactions', 'datasources', 'iati', 'Transaction.csv', 'quickstart', 'RAW/IATI/Transaction', 'Transaction*.parquet', NULL, NULL, NULL, 1, 1, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (13, 'WHOSANITATION', 'Sanitation Services', 'datasources', 'who', 'Sanitation.csv', 'quickstart', 'RAW/WHO/Sanitation', 'Sanitation*.parquet', NULL, NULL, NULL, 2, 1, 1)

-- PERSISTED
INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (100, 'PERSISTEDACTIVITYDATE', 'Persisted Activity Date', NULL, NULL, NULL, NULL, NULL, NULL, 'Persisted', 'ActivityDate', 'ObtainActivityDate', 1, 2, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (101, 'PERSISTEDACTIVITYSTATUS', 'Persisted Activity Status', NULL, NULL, NULL, NULL, NULL, NULL, 'Persisted', 'ActivityStatus', 'ObtainActivityStatus', 1, 2, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (102, 'PERSISTEDBUDGET', 'Persisted Budget',	NULL, NULL, NULL, NULL, NULL, NULL, 'Persisted', 'Budget', 'ObtainBudget', 1, 2, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (103, 'PERSISTEDCONTACTINFORMATION', 'Persisted Contact Information', NULL, NULL, NULL, NULL, NULL, NULL, 'Persisted', 'ContactInformation', 'ObtainContactInformation', 1, 2, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (104, 'PERSISTEDDESCRIPTION', 'Persisted Description', NULL, NULL, NULL, NULL, NULL, NULL, 'Persisted', 'Description', 'ObtainDescription', 1, 2, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (105, 'PERSISTEDPARTICIPATINGORGANISATION', 'Persisted Participating Organisation', NULL, NULL, NULL, NULL, NULL, NULL, 'Persisted', 'ParticipatingOrganisation', 'ObtainParticipatingOrganisation',1, 2, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (106, 'PERSISTEDRECIPIENTCOUNTRY', 'Persisted Recipient Country', NULL, NULL, NULL, NULL, NULL, NULL, 'Persisted', 'RecipientCountry', 'ObtainRecipientCountry', 1, 2, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (107, 'PERSISTEDRECIPIENTREGION', 'Persisted Recipient Region', NULL, NULL, NULL, NULL, NULL, NULL, 'Persisted', 'RecipientRegion', 'ObtainRecipientRegion', 1, 2, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (108, 'PERSISTEDREPORTINGORGANISATION', 'Persisted Reporting Organisation', NULL, NULL, NULL, NULL, NULL, NULL,  'Persisted', 'ReportingOrganisation', 'ObtainReportingOrganisation', 1, 2, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (109, 'PERSISTEDSECTOR', 'Persisted Sector',	NULL, NULL, NULL, NULL, NULL, NULL,  'Persisted', 'Sector', 'ObtainSector', 1, 2, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (110, 'PERSISTEDTITLE', 'Persisted Title', NULL, NULL, NULL, NULL, NULL, NULL,  'Persisted', 'Title', 'ObtainTitle',	1, 2, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (111, 'PERSISTEDTRANSACTION', 'Persisted Transaction', NULL, NULL, NULL, NULL, NULL, NULL,  'Persisted', 'Transaction', 'ObtainTransaction', 1, 2, 1)

INSERT INTO [Control].[Entity] ([EntityId],[EntityCode],[EntityName],[SourceContainer],[SourceFolderPath],[SourceFileName],[TargetContainer],[TargetFolderPath],[TargetFileName],[TargetSchema],[TargetTable],[TargetStoredProcedure],[SourceSystemId],[CurationStageId],[Active])
VALUES (112, 'PERSISTEDSANITATION', 'Persisted Sanitation',	NULL, NULL, NULL, NULL, NULL, NULL,  'Persisted', 'Sanitation', 'ObtainSanitation', 2, 2, 1)

SET IDENTITY_INSERT [Control].[Entity] OFF;