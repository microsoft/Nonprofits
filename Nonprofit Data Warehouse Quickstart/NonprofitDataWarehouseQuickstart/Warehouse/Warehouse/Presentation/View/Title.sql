-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE VIEW [Presentation].[Title]
AS 
SELECT
	 [TitleKey]
	,[IatiIdentifier]
	,[TitleNarrative]
	,[InsertedDate]
FROM [Persisted].[Title]
