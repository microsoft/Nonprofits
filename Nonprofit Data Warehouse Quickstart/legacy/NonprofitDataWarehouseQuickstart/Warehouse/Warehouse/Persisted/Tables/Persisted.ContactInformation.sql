-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE TABLE [Persisted].[ContactInformation]
(
	[ContactInformationKey]					INT				NOT NULL, 
	[ContactInformationChangeHash]			BINARY(32)		NOT NULL, 
	[IatiIdentifier] 						NVARCHAR(50) 	NOT NULL,
	[ContactInfoType] 						NVARCHAR(100) 		NULL,
	[ContactInfoDepartmentNarrative] 		NVARCHAR(4000) 		NULL,
	[ContactInfoDepartment] 				NVARCHAR(100)  		NULL,
	[ContactInfoEmail] 						NVARCHAR(100)  		NULL,
	[ContactInfoJobTitleNarrative] 			NVARCHAR(4000)  	NULL,
	[ContactInfoJobTitle] 					NVARCHAR(100)  		NULL,
	[ContactInfoMailingAddressNarrative] 	NVARCHAR(4000)  	NULL,
	[ContactInfoMailingAddress] 			NVARCHAR(100)  		NULL,
	[ContactInfoOrganisationNarrative] 		NVARCHAR(4000)  	NULL,
	[ContactInfoOrganisation]  			 	NVARCHAR(100)  		NULL,
	[ContactInfoPersonNameNarrative]  		NVARCHAR(4000)  	NULL,
	[ContactInfoPersonName]  			 	NVARCHAR(100)  		NULL,
	[ContactInfoTelephone]  			 	NVARCHAR(100)  		NULL,
	[ContactInfoWebsite]  			 		NVARCHAR(100)  		NULL,
	[InsertedDate]							DATETIME2(7)		NULL
)
WITH
( CLUSTERED COLUMNSTORE INDEX
, DISTRIBUTION = ROUND_ROBIN
);