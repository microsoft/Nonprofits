-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

-- CREATE A DATABASE SCOPED CREDENTIAL

CREATE DATABASE SCOPED CREDENTIAL [DatabaseScopedCredentialADLS] WITH
    IDENTITY = 'Managed Service Identity'
;