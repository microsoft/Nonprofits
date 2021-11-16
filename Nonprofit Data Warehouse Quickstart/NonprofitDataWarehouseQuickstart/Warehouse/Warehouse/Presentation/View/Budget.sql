-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE VIEW [Presentation].[Budget]
AS 
SELECT
	 [BudgetKey]
	,[IatiIdentifier]
    ,[BudgetType]
    ,[BudgetPeriodStartIsoDate]
    ,[BudgetPeriodEndIsoDate]
    ,[BudgetValueCurrency]
    ,[BudgetValueDate]
    ,[BudgetValue]
	,[InsertedDate]
FROM [Persisted].[Budget]
