/*Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the MIT License.*/

The contoso.org, Contoso for Good, is a ficticious company that embodies the typical horizontal user stories of a nonprofit organization.  While there may be occasion where specific segments of a nonprofit are focused on, we will try to keep Contoso.org's focus on the betterment of society.

The audience of contoso.org
- How other nonprofits who want to see how Microsoft's Tech for Social Impact is using technology
- How partners are developing soltuions that plug into common deployments.
Naming Convention:
[Azure](https://github.com/Microsoft/Nonprofits/blob/master/CrossFunctional/Azure/Presentations/AzureFoundation_NamingConventions_Working.pptx)

How to make a new user in Contoso.org:
The Contoso for Good environment is using a typical AAD Connect Hybrid Idnentity solution with Password Write back.  This means that identities originate at the Domain Controllers on premise.  To access the domain controller hit up the Remote Desktop Server rds0 and in the local server manager select tools and Users and Computers, add a user into the OU for Contoso.org and add that user to the tsiContosoAdmins groups.  Please use a password generator for the creation of the Domain Controller ID to ensure complex passwords.  Self service is set up for the end user to change their password later.

Only TSI team members need Domain Controller identities, other users will be added with B2B using the Azure Active Directory through the portal and selecting a new guest user.  To gain portal access a guest user must be changed to a "member" user.  To change the member type, you must use powershell, use the [script](https://https://github.com/Microsoft/Nonprofits/blob/master/CrossFunctional/Azure/ARM/SecurityIdentity/Utilities/B2BUtilitiy.ps1) in the Utilities folder. 

Troubleshooting Steps:  
- Password Reset: https://aka.ms/sspr (reset your password) https://aka.ms/ssprsetup first you must update your password
- latency http://azurespeed.com/

Master Accounts:  

Demo License Extensions:  https://microsoft.sharepoint.com/teams/Office356TrialExtensions


Dynamics 365

    The production instance of Contoso's Dynamics 365 production instance is:  https://contosoorgprod.crm.dynamics.com
    The default security group is ContosoBusinessAppUsers

