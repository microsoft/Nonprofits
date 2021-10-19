/* ==============================================================================================================
-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

-- Description:	This script is a template to creates SQL Server User.
-- It requires parameters values to be replaced
-- Parameters: 
-- -- %PRESENTATION_USER_PASSWORD% - Sql User Password
-- Remarks: This script can be executed under normal user on master database
-- ==============================================================================================================*/


/*** CREATE PRESENTATION USER USER ***/
/* Create SQL Login */
CREATE LOGIN [PresentationUser] WITH PASSWORD = '%PRESENTATION_USER_PASSWORD%';

/* Create SQL User */
CREATE USER PresentationUser FOR LOGIN PresentationUser WITH DEFAULT_SCHEMA = [Presentation]

/* Add user roles */
EXEC sp_addrolemember 'db_datareader', 'PresentationUser'