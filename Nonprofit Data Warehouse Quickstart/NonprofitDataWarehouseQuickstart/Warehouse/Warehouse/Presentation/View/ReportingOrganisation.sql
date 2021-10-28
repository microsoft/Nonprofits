-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE VIEW [Presentation].[ReportingOrganisation]
AS 
SELECT
	 [ReportingOrganisationKey]
	,[IatiIdentifier]
    ,[ReportingOrgRef]
    ,[ReportingOrg]
    ,[ReportingOrgType]
    ,[ReportingOrgSecondaryReporter]
	,[InsertedDate]
FROM [Persisted].[ReportingOrganisation]
