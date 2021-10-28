-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE TABLE [Persisted].[RecipientCountry]
(
	[RecipientCountryKey]			INT				NOT NULL,
	[RecipientCountryChangeHash]	BINARY(32)		NOT NULL,
	[IatiIdentifier] 				NVARCHAR(50) 	NOT NULL,
	[RecipientCountryCode] 			NVARCHAR(100) 		NULL,
	[RecipientCountryPercentage] 	DECIMAL(18,4) 		NULL,
	[RecipientCountry] 				NVARCHAR(4000) 		NULL,
	[InsertedDate]					DATETIME2(7)		NULL
)
WITH
( CLUSTERED COLUMNSTORE INDEX
, DISTRIBUTION = ROUND_ROBIN
);