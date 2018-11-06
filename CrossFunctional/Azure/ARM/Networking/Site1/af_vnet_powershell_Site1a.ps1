# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.
<#
 .SYNOPSIS
    Deploys the AzureFoundation templates for Site 1 and 2 of a four datacenter pattern.  The metadata template that 
    created this template refers to these VNETs as VNET100 through VNET 204.


  
 .DESCRIPTION
    Deploys an Azure Resource Manager template assocazted to the first site in the AzureFoundation

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

#using the spreadsheet goto the VNET tab and copy the computed ResourceGroup Names.
$ResourceGroupName_vnet100="rgVNETprodwc"
$ResourceGroupName_vnet101="rgVNEThbiwc"
$ResourceGroupName_vnet102="rgVNETpreprodwc"
$ResourceGroupName_vnet103="rgVNETstoragewc"
$ResourceGroupName_vnet104="rgVNETserviceswc"
$ResourceGroupName_vnet200="rgVNETprodw2"
$ResourceGroupName_vnet201="rgVNEThbiw2"
$ResourceGroupName_vnet202="rgVNETpreprodw2"
$ResourceGroupName_vnet203="rgVNETstoragew2"
$ResourceGroupName_vnet204="rgVNETservicesw2"



#Setup the Deployment Name
$date=Get-Date
$deploymentName = "AzureFoundation" + $date.month + $date.day + $date.Year +$date.hour

#Setup where the template files can be found
$RootPath = "C:\Users\willst\Source\Repos\Nonprofits\CrossFunctional\Azure\ARM\Networking"

$ParametersPathVNET100=$RootPath+"\Site1\af_vnet_azuredeploy_parameters_Site1_prod_A.json"
$TemplatePathVNET100=$RootPath+"\Site1\af_vnet_azuredeploy_template_Site1_prod_A.json"
$ParametersPathVNET101=$RootPath+"\Site1\af_vnet_azuredeploy_parameters_Site1_hbi_A.json"
$TemplatePathVNET101=$RootPath+"\Site1\af_vnet_azuredeploy_template_Site1_hbi_A.json"
$ParametersPathVNET102=$RootPath+"\Site1\af_vnet_azuredeploy_parameters_Site1_preprod_A.json"
$TemplatePathVNET102=$RootPath+"\Site1\af_vnet_azuredeploy_template_Site1_preprod_A.json"
$ParametersPathVNET103=$RootPath+"\Site1\af_vnet_azuredeploy_parameters_Site1_storage_A.json"
$TemplatePathVNET103=$RootPath+"\Site1\af_vnet_azuredeploy_template_Site1_storage_A.json"
$ParametersPathVNET104=$RootPath+"\site1\af_vnet_azuredeploy_parameters_site1_services_A.json"
$TemplatePathVNET104=$RootPath+"\Site1\af_vnet_azuredeploy_template_Site1_services_A.json"

$ParametersPathVNET200=$RootPath+"\Site2\af_vnet_azuredeploy_parameters_Site2_prod_A.json"
$TemplatePathVNET200=$RootPath+"\Site2\af_vnet_azuredeploy_template_Site2_prod_A.json"
$ParametersPathVNET201=$RootPath+"\Site2\af_vnet_azuredeploy_parameters_Site2_hbi_A.json"
$TemplatePathVNET201=$RootPath+"\Site2\af_vnet_azuredeploy_template_Site2_hbi_A.json"
$ParametersPathVNET202=$RootPath+"\Site2\af_vnet_azuredeploy_parameters_Site2_preprod_A.json"
$TemplatePathVNET202=$RootPath+"\Site2\af_vnet_azuredeploy_template_Site2_preprod_A.json"
$ParametersPathVNET203 =$RootPath+"\Site2\af_vnet_azuredeploy_parameters_Site2_storage_A.json"
$TemplatePathVNET203 =$RootPath+"\Site2\af_vnet_azuredeploy_template_Site2_storage_A.json"
$ParametersPathVNET204=$RootPath+"\Site2\af_vnet_azuredeploy_parameters_Site2_services_A.json"
$TemplatePathVNET204=$RootPath+"\Site2\af_vnet_azuredeploy_template_Site2_services_A.json"

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
*****************Services (VNET104)*******************
#>
Select-AzureRmSubscription -SubscriptionID $SubID_Services;
$servicesResourceGroup1 = Get-AzureRmResourceGroup -Name $ResourceGroupName_vnet104 -ErrorAction SilentlyContinue
$servicesResourceGroup2 = Get-AzureRmResourceGroup -Name $ResourceGroupName_vnet204 -ErrorAction SilentlyContinue

#Create or check for existing resource group
if(!$servicesResourceGroup1)
{
    Write-Host "Resource group '$ResourceGroupName_vnet104' does not exist. To create a new resource group, please enter a location.";
    if(!$locationSite_1) {
        $locationSite_1 = Read-Host "resourceGroupLocation";
    }
    Write-Host "Creating resource group '$ResourceGroupName_vnet104' in location '$locationSite_1'";
    New-AzureRmResourceGroup -Name $ResourceGroupName_vnet104 -Location $locationSite_1
}
else{
    Write-Host "Using existing resource group '$ResourceGroupName_vnet104'";
}
if(!$servicesResourceGroup2)
{
    Write-Host "Resource group '$ResourceGroupName_vnet204' does not exist. To create a new resource group, please enter a location.";
    if(!$locationSite_2) {
        $locationSite_2 = Read-Host "resourceGroupLocation";
    }
    Write-Host "Creating resource group '$ResourceGroupName_vnet204' in location '$locationSite_2'";
    New-AzureRmResourceGroup -Name $ResourceGroupName_vnet204 -Location $locationSite_2
}
else{
    Write-Host "Using existing resource group '$ResourceGroupName_vnet204'";
}
<#
This section is where we build the NSG for the VNET afr locatedry where json files eecto ../ and run the powershell from di
#>

# Start the deployment

Test-AzureRmResourceGroupDeployment  -ResourceGroupName $ResourceGroupName_vnet104 -TemplateFile $TemplatePathVNET104 -TemplateParameterFile $ParametersPathVNET104;

New-AzureRmResourceGroupDeployment -name $deploymentName -ResourceGroupName $ResourceGroupName_vnet104 -Templatefile $TemplatePathVNET104 -TemplateParameterfile $ParametersPathVNET104;


# Start the deployment

Test-AzureRmResourceGroupDeployment -ResourceGroupName $ResourceGroupName_vnet204 -TemplateFile $TemplatePathVNET204 -TemplateParameterFile $ParametersPathVNET204;

New-AzureRmResourceGroupDeployment -name $deploymentName -ResourceGroupName $ResourceGroupName_vnet204 -Templatefile $TemplatePathVNET204 -TemplateParameterfile $ParametersPathVNET204;
<#roubleshooting
#Debug
$deploymentName = "AzureFoundationSite1A_Debug1b"
New-AzureRmResourceGroupDeployment -name $deploymentName -ResourceGroupName $ResourceGroupName_vnet104 -Templatefile $TemplatePathVNET104 -TemplateParameterfile $ParametersPathVNET104 -DeploymentDebugLogLevel All;
$Operations = Get-AzureRmResourceGroupDeploymentOperation -DeploymentName $deploymentName -ResourceGroupName $ResourceGroupName_vnet204
foreach($Operation in $Operations){
Write-Host $operation.id
$Operation.properties.request | ConvertTo-Json -Depth 10
    Write-Host "Request:"
$Operation.properties.response | ConvertTo-Json -Depth 10
 Write-Host "Response:"}
#>

<#
**************************Production Subscription***************
#>

Select-AzureRmSubscription -SubscriptionID $SubID_Prod;
$prodResourceGroup1 = Get-AzureRmResourceGroup -Name $ResourceGroupName_vnet100 -ErrorAction SilentlyContinue
$prodResourceGroup2 = Get-AzureRmResourceGroup -Name $ResourceGroupName_vnet200 -ErrorAction SilentlyContinue

if(!$prodResourceGroup1)
{
    Write-Host "Resource group '$ResourceGroupName_vnet100' does not exist. To create a new resource group, please enter a location.";
    if(!$locationSite_1) {
        $locationSite_1 = Read-Host "resourceGroupLocation";
    }
    Write-Host "Creating resource group '$ResourceGroupName_vnet100' in location '$locationSite_1'";
    New-AzureRmResourceGroup -Name $ResourceGroupName_vnet100 -Location $locationSite_1
}
else{
    Write-Host "Using existing resource group '$ResourceGroupName_vnet100'";
}
if(!$prodResourceGroup2)
{
    Write-Host "Resource group '$ResourceGroupName_vnet200' does not exist. To create a new resource group, please enter a location.";
    if(!$locationSite_2) {
        $locationSite_2 = Read-Host "resourceGroupLocation";
    }
    Write-Host "Creating resource group '$ResourceGroupName_vnet200' in location '$locationSite_2'";
    New-AzureRmResourceGroup -Name $ResourceGroupName_vnet200 -Location $locationSite_2
}
else{
    Write-Host "Using existing resource group '$ResourceGroupName_vnet200'";
}
<#
This section is where we build the NSG for the VNET
#>

# Start the deployment

Test-AzureRmResourceGroupDeployment  -ResourceGroupName $ResourceGroupName_vnet100 -TemplateFile $TemplatePathVNET100 -TemplateParameterFile $ParametersPathVNET100;

New-AzureRmResourceGroupDeployment -name $deploymentName -ResourceGroupName $ResourceGroupName_vnet100 -Templatefile $TemplatePathVNET100 -TemplateParameterfile $ParametersPathVNET100;


# Start the deployment
Test-AzureRmResourceGroupDeployment -ResourceGroupName $ResourceGroupName_vnet200 -TemplateFile $TemplatePathVNET200 -TemplateParameterFile $ParametersPathVNET200;

New-AzureRmResourceGroupDeployment -name $deploymentName -ResourceGroupName $ResourceGroupName_vnet200 -Templatefile $TemplatePathVNET200 -TemplateParameterfile $ParametersPathVNET200;

<#
**************************PrepreProduction Subscription***************
#>

Select-AzureRmSubscription -SubscriptionID $SubID_preProd
$preProdResourceGroup1 = Get-AzureRmResourceGroup -Name $ResourceGroupName_vnet102 -ErrorAction SilentlyContinue
$preProdResourceGroup2 = Get-AzureRmResourceGroup -Name $ResourceGroupName_vnet202 -ErrorAction SilentlyContinue

if(!$preProdResourceGroup1)
{
    Write-Host "Resource group '$ResourceGroupName_vnet102' does not exist. To create a new resource group, please enter a location.";
    if(!$locationSite_1) {
        $locationSite_1 = Read-Host "resourceGroupLocation";
    }
    Write-Host "Creating resource group '$ResourceGroupName_vnet102' in location '$locationSite_1'";
    New-AzureRmResourceGroup -Name $ResourceGroupName_vnet102 -Location $locationSite_1
}
else{
    Write-Host "Using existing resource group '$ResourceGroupName_vnet102'";
}
if(!$preProdResourceGroup2)
{
    Write-Host "Resource group '$ResourceGroupName_vnet202' does not exist. To create a new resource group, please enter a location.";
    if(!$locationSite_2) {
        $locationSite_2 = Read-Host "resourceGroupLocation";
    }
    Write-Host "Creating resource group '$ResourceGroupName_vnet202' in location '$locationSite_2'";
    New-AzureRmResourceGroup -Name $ResourceGroupName_vnet202 -Location $locationSite_2
}
else{
    Write-Host "Using existing resource group '$ResourceGroupName_vnet202'";
}
<#
This section is where we build the NSG for the VNET
#>

# Start the deployment
Test-AzureRmResourceGroupDeployment  -ResourceGroupName $ResourceGroupName_vnet102 -TemplateFile $TemplatePathVNET102 -TemplateParameterFile $ParametersPathVNET102;

New-AzureRmResourceGroupDeployment -name $deploymentName -ResourceGroupName $ResourceGroupName_vnet102 -Templatefile $TemplatePathVNET102 -TemplateParameterfile $ParametersPathVNET102;

# Start the deployment
Test-AzureRmResourceGroupDeployment -ResourceGroupName $ResourceGroupName_vnet202 -TemplateFile $TemplatePathVNET202 -TemplateParameterFile $ParametersPathVNET202;

New-AzureRmResourceGroupDeployment -name $deploymentName -ResourceGroupName $ResourceGroupName_vnet202 -Templatefile $TemplatePathVNET202 -TemplateParameterfile $ParametersPathVNET202;

<#
**************************High Business Impact Subscription***************
#>

Select-AzureRmSubscription -SubscriptionID $SubID_HBI

$hbiResourceGroup1 = Get-AzureRmResourceGroup -Name $ResourceGroupName_vnet101 -ErrorAction SilentlyContinue
$hbiResourceGroup2 = Get-AzureRmResourceGroup -Name $ResourceGroupName_vnet201 -ErrorAction SilentlyContinue

if(!$hbiResourceGroup1)
{
    Write-Host "Resource group '$ResourceGroupName_vnet101' does not exist. To create a new resource group, please enter a location.";
    if(!$locationSite_1) {
        $locationSite_1 = Read-Host "resourceGroupLocation";
    }
    Write-Host "Creating resource group '$ResourceGroupName_vnet101' in location '$locationSite_1'";
    New-AzureRmResourceGroup -Name $ResourceGroupName_vnet101 -Location $locationSite_1
}
else{
    Write-Host "Using existing resource group '$ResourceGroupName_vnet101'";
}
if(!$hbiResourceGroup2)
{
    Write-Host "Resource group '$ResourceGroupName_vnet201' does not exist. To create a new resource group, please enter a location.";
    if(!$locationSite_2) {
        $locationSite_2 = Read-Host "resourceGroupLocation";
    }
    Write-Host "Creating resource group '$ResourceGroupName_vnet201' in location '$locationSite_2'";
    New-AzureRmResourceGroup -Name $ResourceGroupName_vnet201 -Location $locationSite_2
}
else{
    Write-Host "Using existing resource group '$ResourceGroupName_vnet201'";
}
<#
This section is where we build the NSG for the VNET
#>

# Start the deployment
Test-AzureRmResourceGroupDeployment -ResourceGroupName $ResourceGroupName_vnet101 -TemplateFile $TemplatePathVNET101 -TemplateParameterFile $ParametersPathVNET101;

New-AzureRmResourceGroupDeployment -name $deploymentName -ResourceGroupName $ResourceGroupName_vnet101 -Templatefile $TemplatePathVNET101 -TemplateParameterfile $ParametersPathVNET101;

# Start the deployment
Test-AzureRmResourceGroupDeployment -ResourceGroupName $ResourceGroupName_vnet201 -TemplateFile $TemplatePathVNET201 -TemplateParameterFile $ParametersPathVNET201;

New-AzureRmResourceGroupDeployment -name $deploymentName -ResourceGroupName $ResourceGroupName_vnet201 -Templatefile $TemplatePathVNET201 -TemplateParameterfile $ParametersPathVNET201;

<#
**************************Storage Subscription***************
#>

Select-AzureRmSubscription -SubscriptionID $SubID_Storage;
$storageResourceGroup1 = Get-AzureRmResourceGroup -Name $ResourceGroupName_vnet103 -ErrorAction SilentlyContinue
$storageResourceGroup2 = Get-AzureRmResourceGroup -Name $ResourceGroupName_vnet203 -ErrorAction SilentlyContinue

if(!$storageResourceGroup1)
{
    Write-Host "Resource group '$ResourceGroupName_vnet103' does not exist. To create a new resource group, please enter a location.";
    if(!$locationSite_1) {
        $locationSite_1 = Read-Host "resourceGroupLocation";
    }
    Write-Host "Creating resource group '$ResourceGroupName_vnet103' in location '$locationSite_1'";
    New-AzureRmResourceGroup -Name $ResourceGroupName_vnet103 -Location $locationSite_1
}
else{
    Write-Host "Using existing resource group '$ResourceGroupName_vnet103'";
}
if(!$storageResourceGroup2)
{
    Write-Host "Resource group '$ResourceGroupName_vnet203' does not exist. To create a new resource group, please enter a location.";
    if(!$locationSite_2) {
        $locationSite_2 = Read-Host "resourceGroupLocation";
    }
    Write-Host "Creating resource group '$ResourceGroupName_vnet203' in location '$locationSite_2'";
    New-AzureRmResourceGroup -Name $ResourceGroupName_vnet203 -Location $locationSite_2
}
else{
    Write-Host "Using existing resource group '$ResourceGroupName_vnet203'";
}

# Start the deployment
Test-AzureRmResourceGroupDeployment -ResourceGroupName $ResourceGroupName_vnet103 -TemplateFile $TemplatePathVNET103 -TemplateParameterFile $ParametersPathVNET103;

# Start the deployment
Test-AzureRmResourceGroupDeployment -ResourceGroupName $ResourceGroupName_vnet203 -TemplateFile $TemplatePathVNET203 -TemplateParameterFile $ParametersPathVNET203;
New-AzureRmResourceGroupDeployment -name $deploymentName -ResourceGroupName $ResourceGroupName_vnet103 -Templatefile $TemplatePathVNET103 -TemplateParameterfile $ParametersPathVNET103;

New-AzureRmResourceGroupDeployment -name $deploymentName -ResourceGroupName $ResourceGroupName_vnet203 -Templatefile $TemplatePathVNET203 -TemplateParameterfile $ParametersPathVNET203;

