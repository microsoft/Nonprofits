-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE VIEW [Presentation].[ParticipatingOrganisation]
AS 
SELECT
	 [ParticipatingOrganisationKey]
	,[IatiIdentifier]
    ,[ParticipatingOrg]
    ,[ParticipatingOrgRole]
    ,[ParticipatingOrgType]
    ,[ParticipatingOrgRef]
	,[InsertedDate]
FROM [Persisted].[ParticipatingOrganisation]
