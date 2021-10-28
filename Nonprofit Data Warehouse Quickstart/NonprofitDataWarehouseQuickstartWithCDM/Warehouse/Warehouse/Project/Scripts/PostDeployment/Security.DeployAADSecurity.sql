
/* ==============================================================================================================

-- Copyright (c) Microsoft Corporation.
-- Licensed under the MIT License.

-- Description:	This script is a template to creates users for AAD objects (ADF, SQL Server, AAD Groups).
-- It requires parameters values to be replaced
-- Parameters: 
-- -- %ADF_NAME% - name of the Azure Data Factory
-- -- %SQL_SERVER_NAME% - name of the SQL Server
-- -- %AAD_ADMIN_GROUP% - name of the AAD Admin group
-- -- %AAD_DEVELOPER_GROUP% - name of the AAD Developer group
-- Remarks: This script need to be executed under SQL Azure Active Directory Admin.
-- ==============================================================================================================*/


/*** 1. Create Azure Data Factory (ADF) MSI user ***/;
/* Create User */
CREATE USER [%ADF_NAME%] FROM EXTERNAL PROVIDER;

/* Add user to roles */
EXEC sys.sp_addrolemember 'db_datareader', '%ADF_NAME%';
EXEC sys.sp_addrolemember 'db_datawriter', '%ADF_NAME%';




/*** 2. Create SQL Server MSI ***/
/* Create User */
CREATE USER [%SQL_SERVER_NAME%] FROM EXTERNAL PROVIDER;

/* Add user roles */
EXEC sys.sp_addrolemember 'db_datareader', '%SQL_SERVER_NAME%';
	



/*** 3. Admin AAD Group permissions ***/
/* Create user */
CREATE USER [%AAD_ADMIN_GROUP%] FROM EXTERNAL PROVIDER;

/* Add user roles  */
EXEC sys.sp_addrolemember 'db_owner', '%AAD_ADMIN_GROUP%'




/*** 4. Developer AAD Group permissions ***/
/* Create user */
CREATE USER [%AAD_DEVELOPER_GROUP%] FROM EXTERNAL PROVIDER;

/* Add user roles  */
EXEC sys.sp_addrolemember 'db_owner', '%AAD_DEVELOPER_GROUP%'