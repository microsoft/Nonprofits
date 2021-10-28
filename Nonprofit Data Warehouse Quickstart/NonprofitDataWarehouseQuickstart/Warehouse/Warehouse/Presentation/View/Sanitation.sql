-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE VIEW [Presentation].[Sanitation]
AS
SELECT
	 [SanitationKey]			
	,[SanitationChangeHash]	
	,[GhoCode]				
	,[GhoDisplay]			
	,[GhoUrl]				
	,[PublishStateCode]		
	,[PublishStateDisplay]	
	,[YearCode]					
	,[YearDisplay]			
	,[RegionCode]			
	,[RegionDisplay]				
	,[CountryCode]			
	,[CountryDisplay]		
	,[ResidenceAreaTypeCode]	
	,[ResidenceAreaTypeDisplay]
	,[DisplayValue]				
	,[Numeric]					
	,[InsertedDate]
FROM [Persisted].Sanitation
