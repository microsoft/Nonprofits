# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.
<#
 .SYNOPSIS
    Deploys the AzureFoundation templates for Site 1 and 2 of a four datacenter pattern.  The metadata template that 
    created this template refers to these vWANs as vWAN104, 204, 304 and 404.


  
 .DESCRIPTION
    Deploys an Azure Resource Manager template assocazted to the first pair of sites in the AzureFoundation

    VNETID Naming Conventions
    
    VNET100:  Production Site 1
    VNET101:  HBI Site 1
    VNET102:  PreProd Site 1
    VNET103:  Storage Site 1
    VNET104:  Services Site 1

    VNET200:  Production Site 1
    VNET201:  HBI Site 1
    VNET202:  PreProd Site 1
    VNET203:  Storage Site 1
    VNET204:  Services Site 1

    vWAN104:  Virtual WAN for Site 1
    vwan204:  Virtual WAN for Site 2
    vWAN304:  Virtual WAN for Site 3
    vWAN404:  Virtual WAN for Site 4

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

Function RegisterRP {
    Param(
        [string]$ResourceProviderNamespace
    )

    Write-Host "Registering resource provider '$ResourceProviderNamespace'";
    Register-AzureRmResourceProvider -ProviderNamespace $ResourceProviderNamespace;
}

#******************************************************************************
# Script body
# Execution begins here
#******************************************************************************
$ErrorActionPreference = "Stop"

# sign in
Write-Host "Logging in...";
#$Environment = "AzureUSGovernment"
$Environment = 'AzureCloud'
Login-AzureRmAccount -EnvironmentName $Environment;


#In these variables, use the Get-AzureRMSubscription command to list the subscriptions 
#Cut and Paste the values in the variables for the five standard subscriptions.
$UserName='willst@contoso.org'
#Use the Subscription Tab of the spreadsheet to copy the values here for the subscription variables.
$subID_Prod="9e1fbfe8-b7ae-4994-8b85-2d5cca580f0c"
$subID_HBI="0a603b5f-f98d-4065-9387-592202ed8089"
$subID_PreProd="4209a74c-6816-4d1f-aa53-c0a3007a66f8"
$subID_Storage="66550e87-b8bc-4ab2-bbaa-fb96bc4e0b1c"
$subID_Services="b352fe70-6fe2-4dcd-a153-ee002ed3da62"


#Update these fields for the datacenter pair to target the deployment at
#https://docs.microsoft.com/en-us/azure/best-practices-availability-paired-regions
#Goto the Location Tab and select the PowerShell for the Region that will be Site 1 and Site 2

$locationSite_1="westcentralus"
$locationSite_2="westus2"

#using the spreadsheet goto the vWAN tab and copy the computed ResourceGroup Names.  The last column in the spreadsheet allows for easy cut/paste

$resourceGroupNamevWAN104="rgVirtualWANwestcentralus"
$resourceGroupNamevWAN204="rgVirtualWANwestus2"
$resourceGroupNamevWAN304="rgVirtualWANnortheurope"
$resourceGroupNamevWAN404="rgVirtualWANwesteurope"




#Setup the Deployment Name
$date=Get-Date
$deploymentName = "Deployment-AzureFoundationvWANs-incremental-" + $date.year + $date.month + $date.day + $date.Year +$date.hour

#Setup where the template files can be found
$RootPath = "C:\Users\willst\Source\Repos\Microsoft\Nonprofits\ProductsAndServices\CrossFunctional\Azure\ARM\Networking\VirtualWAN\"

$ParametersPathvWAN104=$RootPath+"afVWANParametersRegional1.json"
$TemplatePathvWAN104=$RootPath+"afVWANDeployRegion1.json"


$ParametersPathvWAN204=$RootPath+"afVWANDeployRegion2.json"
$TemplatePathvWAN204=$RootPath+"afVWANParametersRegional2.json"

# select subscription
#Write-Host "Selecting subscription '$subscriptionId'";

# Register RPs
$resourceProviders = @("microsoft.compute","microsoft.network");
if($resourceProviders.length) {
    Write-Host "Registering resource providers"
    foreach($resourceProvider in $resourceProviders) {
        RegisterRP($resourceProvider);
    }
}


<#
*****************Services Subscription (vWAN104)*******************
#>
Select-AzureRmSubscription -SubscriptionID $SubID_Services;
$servicesResourceGroup1 = Get-AzureRmResourceGroup -Name $resourceGroupNamevWAN104 -ErrorAction SilentlyContinue
$servicesResourceGroup2 = Get-AzureRmResourceGroup -Name $resourceGroupNamevWAN204 -ErrorAction SilentlyContinue

#Create or check for existing resource group
if(!$servicesResourceGroup1)
{
    Write-Host "Resource group '$resourceGroupNamevWAN104' does not exist. To create a new resource group, please enter a location.";
    if(!$locationSite_1) {
        $locationSite_1 = Read-Host "resourceGroupLocation";
    }
    Write-Host "Creating resource group '$resourceGroupNamevWAN104' in location '$locationSite_1'";
    New-AzureRmResourceGroup -Name $resourceGroupNamevWAN104 -Location $locationSite_1
}
else{
    Write-Host "Using existing resource group '$resourceGroupNamevWAN104'";
}
if(!$servicesResourceGroup2)
{
    Write-Host "Resource group '$resourceGroupNamevWAN204' does not exist. To create a new resource group, please enter a location.";
    if(!$locationSite_2) {
        $locationSite_2 = Read-Host "resourceGroupLocation";
    }
    Write-Host "Creating resource group '$resourceGroupNamevWAN204' in location '$locationSite_2'";
    New-AzureRmResourceGroup -Name $resourceGroupNamevWAN204 -Location $locationSite_2
}
else{
    Write-Host "Using existing resource group '$resourceGroupNamevWAN204'";
}
<#
This section is where we build the NSG for the VNET afr locatedry where json files eecto ../ and run the powershell from di
#>

# Start the deployment

Test-AzureRmResourceGroupDeployment  -ResourceGroupName $resourceGroupNamevWAN104 -TemplateFile $TemplatePathvWAN104 -TemplateParameterFile $ParametersPathvWAN104;

New-AzureRmResourceGroupDeployment -name $deploymentName -ResourceGroupName $resourceGroupNamevWAN104 -Templatefile $TemplatePathvWAN104 -TemplateParameterfile $ParametersPathvWAN104;


# Start the deployment

Test-AzureRmResourceGroupDeployment -ResourceGroupName $resourceGroupNamevWAN204 -TemplateFile $TemplatePathvWAN204 -TemplateParameterFile $ParametersPathvWAN204;

New-AzureRmResourceGroupDeployment -name $deploymentName -ResourceGroupName $resourceGroupNamevWAN204 -Templatefile $TemplatePathvWAN204 -TemplateParameterfile $ParametersPathvWAN204;
<#roubleshooting
#Debug
$deploymentName = "AzureFoundationSite1A_Debug1b"
New-AzureRmResourceGroupDeployment -name $deploymentName -ResourceGroupName $resourceGroupNamevWAN104 -Templatefile $TemplatePathvWAN104 -TemplateParameterfile $ParametersPathvWAN104 -DeploymentDebugLogLevel All;
$Operations = Get-AzureRmResourceGroupDeploymentOperation -DeploymentName $deploymentName -ResourceGroupName $resourceGroupNamevWAN204
foreach($Operation in $Operations){
Write-Host $operation.id
$Operation.properties.request | ConvertTo-Json -Depth 10
    Write-Host "Request:"
$Operation.properties.response | ConvertTo-Json -Depth 10
 Write-Host "Response:"}
#>
