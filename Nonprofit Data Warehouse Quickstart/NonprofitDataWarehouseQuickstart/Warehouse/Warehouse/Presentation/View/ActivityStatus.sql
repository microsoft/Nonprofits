-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE VIEW [Presentation].[ActivityStatus]
AS 
SELECT
	 [ActivityStatusKey]
	,[IatiIdentifier]
    ,[ActivityStatus]
    ,[ActivityStatusDescription]
	,[InsertedDate]
FROM [Persisted].[ActivityStatus]
