-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

CREATE EXTERNAL TABLE [External].[IATIContactInformation]
(
	[iati-identifier] 								NVARCHAR(50) 			NOT NULL,
	[contact-info_type] 							NVARCHAR(100) 				NULL,
	[contact-info_department_narrative] 			NVARCHAR(4000) 				NULL,
	[contact-info_department] 						NVARCHAR(100)  				NULL,
	[contact-info_email] 							NVARCHAR(100)  				NULL,
	[contact-info_job-title_narrative] 				NVARCHAR(4000)  			NULL,
	[contact-info_job-title] 						NVARCHAR(100)  				NULL,
	[contact-info_mailing-address_narrative] 		NVARCHAR(4000)  			NULL,
	[contact-info_mailing-address] 					NVARCHAR(100)  				NULL,
	[contact-info_organisation_narrative] 			NVARCHAR(4000)  			NULL,
	[contact-info_organisation]  			 		NVARCHAR(100)  				NULL,
	[contact-info_person-name_narrative]  			NVARCHAR(4000)  			NULL,
	[contact-info_person-name]  			 		NVARCHAR(100)  				NULL,
	[contact-info_telephone]  			 			NVARCHAR(100)  				NULL,
	[contact-info_website]  			 			NVARCHAR(100)  				NULL
)
WITH
( 
    LOCATION = '/RAW/IATI/ContactInformation/',
    DATA_SOURCE = ExternalDataSourceADLS,
    FILE_FORMAT = ExternalFileFormatParquet,
    REJECT_TYPE = VALUE,
    REJECT_VALUE = 0
);
