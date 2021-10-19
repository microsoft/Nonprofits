-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE VIEW [Presentation].[Sector]
AS 
SELECT
	 [SectorKey]
	,[IatiIdentifier]
    ,[Name]
    ,[SectorCode]
    ,[CategoryName]
    ,[SectorPercentage]
	,[InsertedDate]
FROM [Persisted].[Sector]
