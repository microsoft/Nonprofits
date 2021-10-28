-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE VIEW [Presentation].[ActivityDate]
AS 
SELECT
	 [ActivityDateKey]
	,[IatiIdentifier]
    ,[StartPlanned]
    ,[EndPlanned]
    ,[StartActual]
    ,[EndActual]				
	,[InsertedDate]			
FROM [Persisted].[ActivityDate]
