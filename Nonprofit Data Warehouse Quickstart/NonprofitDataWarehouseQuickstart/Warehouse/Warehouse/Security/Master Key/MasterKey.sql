-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

-- CREATE A DATABASE MASTER KEY
-- Only necessary if one does not already exist.
-- Required to encrypt the credential secret.
--
-- SQLCMD Mode Enabled with StorageRootUri parameter defined like below
-- Variables required to be passed in during the deployment process are:
-- :SETVAR MasterKey "8h%61og$R21LMlyY$3iNzHuGdTAqgtS"
--

CREATE MASTER KEY ENCRYPTION BY PASSWORD = '%MASTER_KEY%';