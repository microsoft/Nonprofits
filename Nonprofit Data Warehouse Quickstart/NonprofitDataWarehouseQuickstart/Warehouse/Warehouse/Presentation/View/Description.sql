-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE VIEW [Presentation].[Description]
AS 
SELECT
	 [DescriptionKey]
	,[IatiIdentifier]
	,[DescriptionNarrative]
	,[InsertedDate]
FROM [Persisted].[Description]
