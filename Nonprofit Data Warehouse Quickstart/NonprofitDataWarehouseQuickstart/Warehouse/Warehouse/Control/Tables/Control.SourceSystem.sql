-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE TABLE [Control].[SourceSystem]
(
	[SourceSystemId]         INT IDENTITY (1, 1) NOT NULL PRIMARY KEY NONCLUSTERED NOT ENFORCED,
    [SourceSystemCode]       VARCHAR (20)		 NOT NULL,
    [SourceSystemName]       VARCHAR (50)		 NOT NULL,
	[ConnectionStringSecret] VARCHAR(50)			 NULL,
	[UserNameSecret]		 VARCHAR(50)			 NULL,
	[PasswordSecret]		 VARCHAR(50)			 NULL
)
WITH (DISTRIBUTION = ROUND_ROBIN, HEAP)
