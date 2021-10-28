-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE VIEW [Presentation].[RecipientRegion]
AS 
SELECT
	 [RecipientRegionKey]
	,[IatiIdentifier]
    ,[RecipientRegionCode]
    ,[RecipientRegion]
    ,[RecipientRegionPercentage]
    ,[RecipientRegionVocabulary]
	,[InsertedDate]
FROM [Persisted].[RecipientRegion]
