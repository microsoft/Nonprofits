-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE VIEW [Presentation].[ContactInformation]
AS 
SELECT
	[ContactInformationKey],
	[IatiIdentifier],
	[ContactInfoType],
	[ContactInfoDepartmentNarrative],
	[ContactInfoDepartment],
	[ContactInfoEmail],
	[ContactInfoJobTitleNarrative],
	[ContactInfoJobTitle],
	[ContactInfoMailingAddressNarrative],
	[ContactInfoMailingAddress],
	[ContactInfoOrganisationNarrative],
	[ContactInfoOrganisation],
	[ContactInfoPersonNameNarrative], 
	[ContactInfoPersonName],
	[ContactInfoTelephone], 
	[ContactInfoWebsite], 
	[InsertedDate]
FROM [Persisted].[ContactInformation]
