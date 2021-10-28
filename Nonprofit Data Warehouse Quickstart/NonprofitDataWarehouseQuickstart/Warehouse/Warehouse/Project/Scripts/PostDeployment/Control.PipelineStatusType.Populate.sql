-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

SET IDENTITY_INSERT [Control].[PipelineStatusType] ON;

TRUNCATE TABLE [Control].[PipelineStatusType];

INSERT INTO [Control].[PipelineStatusType] (PipelineStatusTypeId ,PipelineStatusTypeCode ,PipelineStatusTypeName)
VALUES (1, 'InProgress', 'Load In Progress')

INSERT INTO [Control].[PipelineStatusType] (PipelineStatusTypeId ,PipelineStatusTypeCode ,PipelineStatusTypeName)
VALUES (2, 'Success', 'Load Completed Successfully')

INSERT INTO [Control].[PipelineStatusType] (PipelineStatusTypeId ,PipelineStatusTypeCode ,PipelineStatusTypeName)
VALUES (3, 'Failed', 'Load Failed')

SET IDENTITY_INSERT [Control].[PipelineStatusType] OFF;