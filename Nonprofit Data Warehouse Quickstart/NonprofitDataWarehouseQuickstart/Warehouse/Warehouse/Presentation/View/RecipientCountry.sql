-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE VIEW [Presentation].[RecipientCountry]
AS 
SELECT
	 [RecipientCountryKey]
	,[IatiIdentifier]
	,[RecipientCountryCode]
	,[RecipientCountryPercentage]
	,[RecipientCountry]
	,[InsertedDate]
FROM [Persisted].[RecipientCountry]
