<#
 .SYNOPSIS
    Used to find the ObjectIDs so that AccessPolicies for the Keyvault can be created.  Once the object is found
    the ObjectID is used in the MetaData spreadsheet to assign permissions to a Secret, Key or Certificate.

 .DESCRIPTION
    Makes a list of ObjectID for a given Tenant.

 .PARAMETERs 
    subscriptionId_prod
    The subscription ids where the template will be deployed.

 .PARAMETER resourceGroupName
    The resource group where the template will be deployed. Can be the name of an existing or a new resource group.

 .PARAMETER resourceGroupLocation
    Optional, a resource group location. If specified, will try to create a new resource group in this location. If not specified, assumes resource group is existing.

 .PARAMETER deploymentName
    The deployment name.

 .PARAMETER templateFilePath
    Optional, path to the template file. Defaults to template.json.

 .PARAMETER parametersFilePath
    Optional, path to the parameters file. Defaults to parameters.json. If file is not found, will prompt for parameter txlues based on template.
#>
$aadEnvironment = 'USGovernment'
#$environment = 'AzureCloud'
$environment = 'AzureUSGovernment'

Connect-MsolService -AzureEnvironment $aadEnvironment
Connect-AzureAD -AzureEnvironmentName AzureUSGovernment
$Users = Get-AzureADUser
$Groups = Get-AzureADGroup


