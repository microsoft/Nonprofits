-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE TABLE [Persisted].[Sanitation]
(
	[SanitationKey]				INT				NOT NULL,
	[SanitationChangeHash]		BINARY(32)		NOT NULL,
	[GhoCode]					NVARCHAR(100)		NULL,
	[GhoDisplay]				NVARCHAR(100)		NULL,
	[GhoUrl]					NVARCHAR(100)		NULL,
	[PublishStateCode]			NVARCHAR(50)		NULL,
	[PublishStateDisplay]		NVARCHAR(50)		NULL,
	[YearCode]					INT					NULL,	
	[YearDisplay]				INT					NULL,
	[RegionCode]				NVARCHAR(50)		NULL,
	[RegionDisplay]				NVARCHAR(50)		NULL,	
	[CountryCode]				NVARCHAR(50)		NULL,
	[CountryDisplay]			NVARCHAR(50)		NULL,
	[ResidenceAreaTypeCode]		NVARCHAR(50)		NULL,
	[ResidenceAreaTypeDisplay]	NVARCHAR(50)		NULL,
	[DisplayValue]				INT					NULL,
	[Numeric]					DECIMAL(9,5)		NULL,
	[InsertedDate]				DATETIME2(7)		NULL
) 
WITH
( CLUSTERED COLUMNSTORE INDEX
, DISTRIBUTION = ROUND_ROBIN
);