-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

/*
Post-Deployment Script Template							
--------------------------------------------------------------------------------------
 This file contains SQL statements that will be appended to the build script.		
 Use SQLCMD syntax to include a file in the post-deployment script.			
 Example:      :r .\myfile.sql								
 Use SQLCMD syntax to reference a variable in the post-deployment script.		
 Example:      :setvar TableName MyTable							
               SELECT * FROM [$(TableName)]					
--------------------------------------------------------------------------------------
*/

-- Populate reference data tables
:r .\PostDeployment\Control.CurationStage.Populate.sql
:r .\PostDeployment\Control.Entity.Populate.sql
:r .\PostDeployment\Control.PipelineStatusType.Populate.sql
:r .\PostDeployment\Control.SourceSystem.Populate.sql