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
IF OBJECT_ID('External.IATIAccount') IS NOT NULL DROP EXTERNAL TABLE [External].[IATIAccount];
IF OBJECT_ID('External.IATICampaign') IS NOT NULL DROP EXTERNAL TABLE [External].[IATICampaign];
IF OBJECT_ID('External.IATIPaymentMethod') IS NOT NULL DROP EXTERNAL TABLE [External].[IATIPaymentMethod];
IF OBJECT_ID('External.IATIPaymentSchedule') IS NOT NULL DROP EXTERNAL TABLE [External].[IATIPaymentSchedule];
IF OBJECT_ID('External.IATITransaction') IS NOT NULL DROP EXTERNAL TABLE [External].[IATITransaction];

/** Scratch Objects **/
IF OBJECT_ID('Scratch.Account') IS NOT NULL DROP TABLE [Scratch].[Account];
IF OBJECT_ID('Scratch.Campaign') IS NOT NULL DROP TABLE [Scratch].[Campaign];
IF OBJECT_ID('Scratch.PaymentMethod') IS NOT NULL DROP TABLE [Scratch].[PaymentMethod];
IF OBJECT_ID('Scratch.PaymentSchedule') IS NOT NULL DROP TABLE [Scratch].[PaymentSchedule];
IF OBJECT_ID('Scratch.Transaction') IS NOT NULL DROP TABLE [Scratch].[Transaction];


/** Stage Objects **/
IF OBJECT_ID('Stage.LoadAccount') IS NOT NULL DROP PROCEDURE [Stage].[LoadAccount];
IF OBJECT_ID('Stage.LoadCampaign') IS NOT NULL DROP PROCEDURE [Stage].[LoadCampaign];
IF OBJECT_ID('Stage.LoadPaymentMethod') IS NOT NULL DROP PROCEDURE [Stage].[LoadPaymentMethod];
IF OBJECT_ID('Stage.LoadPaymentSchedule') IS NOT NULL DROP PROCEDURE [Stage].[LoadPaymentSchedule];
IF OBJECT_ID('Stage.LoadTransaction') IS NOT NULL DROP PROCEDURE [Stage].[LoadTransaction];

/** Persisted Tables **/
IF OBJECT_ID('Persisted.Account') IS NOT NULL DROP TABLE [Persisted].[Account];
IF OBJECT_ID('Persisted.Campaign') IS NOT NULL DROP TABLE [Persisted].[Campaign];
IF OBJECT_ID('Persisted.PaymentMethod') IS NOT NULL DROP TABLE [Persisted].[PaymentMethod];
IF OBJECT_ID('Persisted.PaymentSchedule') IS NOT NULL DROP TABLE [Persisted].[PaymentSchedule];
IF OBJECT_ID('Persisted.Transaction') IS NOT NULL DROP TABLE [Persisted].[Transaction];

/** Persisted Stored Procedures **/
IF OBJECT_ID('Persisted.ObtainAccount') IS NOT NULL DROP PROCEDURE [Persisted].[ObtainAccount];
IF OBJECT_ID('Persisted.ObtainCampaign') IS NOT NULL DROP PROCEDURE [Persisted].[ObtainCampaign];
IF OBJECT_ID('Persisted.ObtainPaymentMethod') IS NOT NULL DROP PROCEDURE [Persisted].[ObtainPaymentMethod];
IF OBJECT_ID('Persisted.ObtainPaymentSchedule') IS NOT NULL DROP PROCEDURE [Persisted].[ObtainPaymentSchedule];
IF OBJECT_ID('Persisted.ObtainTransaction') IS NOT NULL DROP PROCEDURE [Persisted].[ObtainTransaction];

/** Presentation Views **/
IF OBJECT_ID('Presentation.Account') IS NOT NULL DROP VIEW [Presentation].[Account];
IF OBJECT_ID('Presentation.Campaign') IS NOT NULL DROP VIEW [Presentation].[Campaign];
IF OBJECT_ID('Presentation.PaymentMethod') IS NOT NULL DROP VIEW [Presentation].[PaymentMethod];
IF OBJECT_ID('Presentation.PaymentSchedule') IS NOT NULL DROP VIEW [Presentation].[PaymentSchedule];
IF OBJECT_ID('Presentation.Transaction') IS NOT NULL DROP VIEW [Presentation].[Transaction];


/** External Resources **/
IF EXISTS(SELECT * FROM sys.external_data_sources WHERE [name] = 'ExternalDataSourceADLS') DROP EXTERNAL DATA SOURCE [ExternalDataSourceADLS];
IF EXISTS(SELECT * FROM sys.database_scoped_credentials WHERE [name] = 'DatabaseScopedCredentialADLS') DROP DATABASE SCOPED CREDENTIAL [DatabaseScopedCredentialADLS];
IF EXISTS (SELECT * FROM sys.symmetric_keys WHERE [name] LIKE '%DatabaseMasterKey%') DROP MASTER KEY;
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