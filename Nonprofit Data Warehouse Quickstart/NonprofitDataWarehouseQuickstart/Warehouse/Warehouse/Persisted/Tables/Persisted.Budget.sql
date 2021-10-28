-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE TABLE [Persisted].[Budget]
(
	[BudgetKey]					INT		        NOT NULL,
	[BudgetChangeHash]			BINARY(32)		NOT NULL,
    [IatiIdentifier]			NVARCHAR(50) 	NOT NULL,
    [BudgetType]				NVARCHAR(100) 		NULL,
    [BudgetPeriodStartIsoDate]	DATETIME2(7) 		NULL,
    [BudgetPeriodEndIsoDate]	DATETIME2(7) 		NULL,
    [BudgetValueCurrency]		NVARCHAR(100) 		NULL,
    [BudgetValueDate]			DATETIME2(7) 		NULL,
    [BudgetValue]				DECIMAL(18,4)		NULL,
	[InsertedDate]				DATETIME2(7)		NULL
)
WITH
( CLUSTERED COLUMNSTORE INDEX
, DISTRIBUTION = ROUND_ROBIN
);