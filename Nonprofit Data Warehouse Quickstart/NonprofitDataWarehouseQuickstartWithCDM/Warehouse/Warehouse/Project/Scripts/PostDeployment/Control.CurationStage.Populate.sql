
-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

SET IDENTITY_INSERT [Control].[CurationStage] ON;

TRUNCATE TABLE [Control].[CurationStage];

INSERT INTO [Control].[CurationStage] (CurationStageId ,CurationStageCode)
VALUES (1, 'RAW')

INSERT INTO [Control].[CurationStage] (CurationStageId ,CurationStageCode)
VALUES (2, 'Persisted')

SET IDENTITY_INSERT [Control].[CurationStage] OFF;