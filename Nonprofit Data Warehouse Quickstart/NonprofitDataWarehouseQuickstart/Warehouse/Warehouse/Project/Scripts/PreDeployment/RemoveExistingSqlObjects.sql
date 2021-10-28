-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

/** Control Objects **/
IF OBJECT_ID('Audit.ExecutionLog') IS NOT NULL DROP VIEW [Audit].[ExecutionLog];
IF OBJECT_ID('Audit.PipelineLoad') IS NOT NULL DROP TABLE [Audit].[PipelineLoad];
IF OBJECT_ID('Control.ActivateNewPipeline') IS NOT NULL DROP PROCEDURE [Control].[ActivateNewPipeline];
IF OBJECT_ID('Control.CurationStage') IS NOT NULL DROP TABLE [Control].[CurationStage];
IF OBJECT_ID('Control.Entity') IS NOT NULL DROP TABLE [Control].[Entity];
IF OBJECT_ID('Control.FinalisePipeline') IS NOT NULL DROP PROCEDURE [Control].[FinalisePipeline];
IF OBJECT_ID('Control.ObtainEntity') IS NOT NULL DROP PROCEDURE [Control].[ObtainEntity];
IF OBJECT_ID('Control.PipelineStatusType') IS NOT NULL DROP TABLE [Control].[PipelineStatusType];
IF OBJECT_ID('Control.SourceSystem') IS NOT NULL DROP TABLE [Control].[SourceSystem];

/** External Objects **/
IF OBJECT_ID('External.IATIActivityDate') IS NOT NULL DROP EXTERNAL TABLE [External].[IATIActivityDate];
IF OBJECT_ID('External.IATIActivityStatus') IS NOT NULL DROP EXTERNAL TABLE [External].[IATIActivityStatus];
IF OBJECT_ID('External.IATIBudget') IS NOT NULL DROP EXTERNAL TABLE [External].[IATIBudget];
IF OBJECT_ID('External.IATIContactInformation') IS NOT NULL DROP EXTERNAL TABLE [External].[IATIContactInformation];
IF OBJECT_ID('External.IATIDescription') IS NOT NULL DROP EXTERNAL TABLE [External].[IATIDescription];
IF OBJECT_ID('External.IATIParticipatingOrganisation') IS NOT NULL DROP EXTERNAL TABLE [External].[IATIParticipatingOrganisation];
IF OBJECT_ID('External.IATIRecipientCountry') IS NOT NULL DROP EXTERNAL TABLE [External].[IATIRecipientCountry];
IF OBJECT_ID('External.IATIRecipientRegion') IS NOT NULL DROP EXTERNAL TABLE [External].[IATIRecipientRegion];
IF OBJECT_ID('External.IATIReportingOrganisation') IS NOT NULL DROP EXTERNAL TABLE [External].[IATIReportingOrganisation];
IF OBJECT_ID('External.IATISector') IS NOT NULL DROP EXTERNAL TABLE [External].[IATISector];
IF OBJECT_ID('External.IATITitle') IS NOT NULL DROP EXTERNAL TABLE [External].[IATITitle];
IF OBJECT_ID('External.IATITransaction') IS NOT NULL DROP EXTERNAL TABLE [External].[IATITransaction];
IF OBJECT_ID('External.WHOSanitation') IS NOT NULL DROP EXTERNAL TABLE [External].[WHOSanitation];

/** Scratch Objects **/
IF OBJECT_ID('Scratch.ActivityDate') IS NOT NULL DROP TABLE [Scratch].[ActivityDate];
IF OBJECT_ID('Scratch.ActivityStatus') IS NOT NULL DROP TABLE [Scratch].[ActivityStatus];
IF OBJECT_ID('Scratch.Budget') IS NOT NULL DROP TABLE [Scratch].[Budget];
IF OBJECT_ID('Scratch.ContactInformation') IS NOT NULL DROP TABLE [Scratch].[ContactInformation];
IF OBJECT_ID('Scratch.Description') IS NOT NULL DROP TABLE [Scratch].[Description];
IF OBJECT_ID('Scratch.ParticipatingOrganisation') IS NOT NULL DROP TABLE [Scratch].[ParticipatingOrganisation];
IF OBJECT_ID('Scratch.RecipientCountry') IS NOT NULL DROP TABLE [Scratch].[RecipientCountry];
IF OBJECT_ID('Scratch.RecipientRegion') IS NOT NULL DROP TABLE [Scratch].[RecipientRegion];
IF OBJECT_ID('Scratch.ReportingOrganisation') IS NOT NULL DROP TABLE [Scratch].[ReportingOrganisation];
IF OBJECT_ID('Scratch.Sanitation') IS NOT NULL DROP TABLE [Scratch].[Sanitation];
IF OBJECT_ID('Scratch.Sector') IS NOT NULL DROP TABLE [Scratch].[Sector];
IF OBJECT_ID('Scratch.Title') IS NOT NULL DROP TABLE [Scratch].[Title];
IF OBJECT_ID('Scratch.Transaction') IS NOT NULL DROP TABLE [Scratch].[Transaction];
IF OBJECT_ID('Scratch.Transactions') IS NOT NULL DROP TABLE [Scratch].[Transactions];

/** Stage Objects **/
IF OBJECT_ID('Stage.LoadActivityDate') IS NOT NULL DROP PROCEDURE [Stage].[LoadActivityDate];
IF OBJECT_ID('Stage.LoadActivityStatus') IS NOT NULL DROP PROCEDURE [Stage].[LoadActivityStatus];
IF OBJECT_ID('Stage.LoadBudget') IS NOT NULL DROP PROCEDURE [Stage].[LoadBudget];
IF OBJECT_ID('Stage.LoadContactInformation') IS NOT NULL DROP PROCEDURE [Stage].[LoadContactInformation];
IF OBJECT_ID('Stage.LoadDescription') IS NOT NULL DROP PROCEDURE [Stage].[LoadDescription];
IF OBJECT_ID('Stage.LoadParticipatingOrganisation') IS NOT NULL DROP PROCEDURE [Stage].[LoadParticipatingOrganisation];
IF OBJECT_ID('Stage.LoadRecipientCountry') IS NOT NULL DROP PROCEDURE [Stage].[LoadRecipientCountry];
IF OBJECT_ID('Stage.LoadRecipientRegion') IS NOT NULL DROP PROCEDURE [Stage].[LoadRecipientRegion];
IF OBJECT_ID('Stage.LoadReportingOrganisation') IS NOT NULL DROP PROCEDURE [Stage].[LoadReportingOrganisation];
IF OBJECT_ID('Stage.LoadSector') IS NOT NULL DROP PROCEDURE [Stage].[LoadSector];
IF OBJECT_ID('Stage.LoadTitle') IS NOT NULL DROP PROCEDURE [Stage].[LoadTitle];
IF OBJECT_ID('Stage.LoadTransaction') IS NOT NULL DROP PROCEDURE [Stage].[LoadTransaction];

/** Persisted Tables **/
IF OBJECT_ID('Persisted.ActivityDate') IS NOT NULL DROP TABLE [Persisted].[ActivityDate];
IF OBJECT_ID('Persisted.ActivityStatus') IS NOT NULL DROP TABLE [Persisted].[ActivityStatus];
IF OBJECT_ID('Persisted.Budget') IS NOT NULL DROP TABLE [Persisted].[Budget];
IF OBJECT_ID('Persisted.ContactInformation') IS NOT NULL DROP TABLE [Persisted].[ContactInformation];
IF OBJECT_ID('Persisted.Description') IS NOT NULL DROP TABLE [Persisted].[Description];
IF OBJECT_ID('Persisted.ParticipatingOrganisation') IS NOT NULL DROP TABLE [Persisted].[ParticipatingOrganisation];
IF OBJECT_ID('Persisted.RecipientCountry') IS NOT NULL DROP TABLE [Persisted].[RecipientCountry];
IF OBJECT_ID('Persisted.RecipientRegion') IS NOT NULL DROP TABLE [Persisted].[RecipientRegion];
IF OBJECT_ID('Persisted.ReportingOrganisation') IS NOT NULL DROP TABLE [Persisted].[ReportingOrganisation];
IF OBJECT_ID('Persisted.Sanitation') IS NOT NULL DROP TABLE [Persisted].[Sanitation];
IF OBJECT_ID('Persisted.Sector') IS NOT NULL DROP TABLE [Persisted].[Sector];
IF OBJECT_ID('Persisted.Title') IS NOT NULL DROP TABLE [Persisted].[Title];
IF OBJECT_ID('Persisted.Transaction') IS NOT NULL DROP TABLE [Persisted].[Transaction];

/** Persisted Stored Procedures **/
IF OBJECT_ID('Persisted.ObtainActivityDate') IS NOT NULL DROP PROCEDURE [Persisted].[ObtainActivityDate];
IF OBJECT_ID('Persisted.ObtainActivityStatus') IS NOT NULL DROP PROCEDURE [Persisted].[ObtainActivityStatus];
IF OBJECT_ID('Persisted.ObtainBudget') IS NOT NULL DROP PROCEDURE [Persisted].[ObtainBudget];
IF OBJECT_ID('Persisted.ObtainContactInformation') IS NOT NULL DROP PROCEDURE [Persisted].[ObtainContactInformation];
IF OBJECT_ID('Persisted.ObtainDescription') IS NOT NULL DROP PROCEDURE [Persisted].[ObtainDescription];
IF OBJECT_ID('Persisted.ObtainParticipatingOrganisation') IS NOT NULL DROP PROCEDURE [Persisted].[ObtainParticipatingOrganisation];
IF OBJECT_ID('Persisted.ObtainRecipientCountry') IS NOT NULL DROP PROCEDURE [Persisted].[ObtainRecipientCountry];
IF OBJECT_ID('Persisted.ObtainRecipientRegion') IS NOT NULL DROP PROCEDURE [Persisted].[ObtainRecipientRegion];
IF OBJECT_ID('Persisted.ObtainReportingOrganisation') IS NOT NULL DROP PROCEDURE [Persisted].[ObtainReportingOrganisation];
IF OBJECT_ID('Persisted.ObtainSanitation') IS NOT NULL DROP PROCEDURE [Persisted].[ObtainSanitation];
IF OBJECT_ID('Persisted.ObtainSector') IS NOT NULL DROP PROCEDURE [Persisted].[ObtainSector];
IF OBJECT_ID('Persisted.ObtainTitle') IS NOT NULL DROP PROCEDURE [Persisted].[ObtainTitle];
IF OBJECT_ID('Persisted.ObtainTransaction') IS NOT NULL DROP PROCEDURE [Persisted].[ObtainTransaction];

/** Presentation Views **/
IF OBJECT_ID('Presentation.ActivityDate') IS NOT NULL DROP VIEW [Presentation].[ActivityDate];
IF OBJECT_ID('Presentation.ActivityStatus') IS NOT NULL DROP VIEW [Presentation].[ActivityStatus];
IF OBJECT_ID('Presentation.Budget') IS NOT NULL DROP VIEW [Presentation].[Budget];
IF OBJECT_ID('Presentation.ContactInformation') IS NOT NULL DROP VIEW [Presentation].[ContactInformation];
IF OBJECT_ID('Presentation.Description') IS NOT NULL DROP VIEW [Presentation].[Description];
IF OBJECT_ID('Presentation.ParticipatingOrganisation') IS NOT NULL DROP VIEW [Presentation].[ParticipatingOrganisation];
IF OBJECT_ID('Presentation.RecipientCountry') IS NOT NULL DROP VIEW [Presentation].[RecipientCountry];
IF OBJECT_ID('Presentation.RecipientRegion') IS NOT NULL DROP VIEW [Presentation].[RecipientRegion];
IF OBJECT_ID('Presentation.ReportingOrganisation') IS NOT NULL DROP VIEW [Presentation].[ReportingOrganisation];
IF OBJECT_ID('Presentation.Sanitation') IS NOT NULL DROP VIEW [Presentation].[Sanitation];
IF OBJECT_ID('Presentation.Sector') IS NOT NULL DROP VIEW [Presentation].[Sector];
IF OBJECT_ID('Presentation.Title') IS NOT NULL DROP VIEW [Presentation].[Title];
IF OBJECT_ID('Presentation.Transaction') IS NOT NULL DROP VIEW [Presentation].[Transaction];

/** External Resources **/
IF EXISTS(SELECT * FROM sys.external_data_sources WHERE [name] = 'ExternalDataSourceADLS') DROP EXTERNAL DATA SOURCE [ExternalDataSourceADLS];
IF EXISTS(SELECT * FROM sys.database_scoped_credentials WHERE [name] = 'DatabaseScopedCredentialADLS') DROP DATABASE SCOPED CREDENTIAL [DatabaseScopedCredentialADLS];
IF EXISTS (SELECT * FROM sys.symmetric_keys WHERE [name] like '%DatabaseMasterKey%') DROP MASTER KEY;
IF EXISTS (SELECT * FROM sys.external_file_formats WHERE [name] = 'ExternalFileFormatCSV') DROP EXTERNAL FILE FORMAT [ExternalFileFormatCSV];
IF EXISTS (SELECT * FROM sys.external_file_formats WHERE [name] = 'ExternalFileFormatParquet') DROP EXTERNAL FILE FORMAT [ExternalFileFormatParquet];

/** External Resources **/
IF EXISTS (SELECT * FROM sys.schemas WHERE [name] = 'Audit') DROP SCHEMA [Audit];
IF EXISTS (SELECT * FROM sys.schemas WHERE [name] = 'Control') DROP SCHEMA [Control];
IF EXISTS (SELECT * FROM sys.schemas WHERE [name] = 'External') DROP SCHEMA [External];
IF EXISTS (SELECT * FROM sys.schemas WHERE [name] = 'Persisted') DROP SCHEMA [Persisted];
IF EXISTS (SELECT * FROM sys.schemas WHERE [name] = 'Presentation') DROP SCHEMA [Presentation];
IF EXISTS (SELECT * FROM sys.schemas WHERE [name] = 'Scratch') DROP SCHEMA [Scratch];
IF EXISTS (SELECT * FROM sys.schemas WHERE [name] = 'Stage') DROP SCHEMA [Stage];