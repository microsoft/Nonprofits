
-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

SET IDENTITY_INSERT [Control].[SourceSystem] ON;

TRUNCATE TABLE [Control].[SourceSystem];

INSERT INTO [Control].[SourceSystem] (SourceSystemId, SourceSystemCode, SourceSystemName, ConnectionStringSecret, UserNameSecret, PasswordSecret)
VALUES (1, 'IATI',	'International Aid Transparency Initiative', NULL, NULL, NULL)

SET IDENTITY_INSERT [Control].[SourceSystem] OFF;