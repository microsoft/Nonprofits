# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License.
<#
 .SYNOPSIS
    The BusinessPlatformApps team has developed deployments using AppSource.  These deployments have recently been depricated, however the demand for the 

  
 .DESCRIPTION
    Deploys an Azure Resource Manager template associated with the Bing News BusinessPlatformApplication.  The application source code was copied into the GitHub Repo for Nonprofits from the BusinessPlatformApps

The source code used to be deployed by AppSource, this deployment is using an Azure Deploy approach.

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

#Or select a subscription here: 
$subscription = Get-AzureRmSubscription |  Out-GridView -PassThru
Set-AzureRmContext -SubscriptionId $subscription.Id

#Update these fields for the datacenter pair to target the deployment at
#https://docs.microsoft.com/en-us/azure/best-practices-availability-paired-regions
#Goto the Location Tab and select the PowerShell for the Region that will be Site 1 and Site 2

$locationSite_1="westcentralus"
$locationSite_2="westus2"

#using the spreadsheet goto the vWAN tab and copy the computed ResourceGroup Names.  The last column in the spreadsheet allows for easy cut/paste

$resourceGroupNameBingNews="rgWillstBingNewsDeployementTest"

#Setup the Deployment Name
$date=Get-Date
$deploymentName = "Deployment-AzureFoundationvWANs-incremental-" + $date.year + $date.month + $date.day + $date.Year +$date.hour

#Setup where the template files can be found
$RootPath = "C:\Users\willst\Source\Repos\Microsoft\Nonprofits\ProductsAndServices\ActivisimAndAwareness\SocialListening\KeywordSentimentAnalysis\"

$ParametersPathBingNews=$RootPath+"Microsoft-NewsTemplate\AzureDeploy.parameters.json"
$TemplatePathBingNews=$RootPath+"Microsoft-NewsTemplate\AzureDeploy.json"

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
*****************Select Subscription (BingNews)*******************
#>
Select-AzureRmSubscription -SubscriptionID $SubID_PreProd;
$ResourceGroup = Get-AzureRmResourceGroup -Name $resourceGroupNameBingNews -ErrorAction SilentlyContinue

#Create or check for existing resource group
if(!$ResourceGroup)
{
    Write-Host "Resource group '$resourceGroupNameBingNews' does not exist. To create a new resource group, please enter a location.";
    if(!$locationSite_1) {
        $locationSite_1 = Read-Host "resourceGroupLocation";
    }
    Write-Host "Creating resource group '$resourceGroupNameBingNews' in location '$locationSite_1'";
    New-AzureRmResourceGroup -Name $resourceGroupNameBingNews -Location $locationSite_1
}
else{
    Write-Host "Using existing resource group '$resourceGroupNameBingNews'";
}
<#
This section is where we build the NSG for the VNET afr locatedry where json files eecto ../ and run the powershell from di
#>

# Start the deployment

Test-AzureRmResourceGroupDeployment  -ResourceGroupName $resourceGroupNameBingNews -TemplateFile $TemplatePathBingNews -TemplateParameterFile $ParametersPathBingNews;

New-AzureRmResourceGroupDeployment -name $deploymentName -ResourceGroupName $resourceGroupNameBingNews -Templatefile $TemplatePathBingNews -TemplateParameterfile $ParametersPathBingNews;


# Start the deployment

Test-AzureRmResourceGroupDeployment -ResourceGroupName $resourceGroupNamevWAN204 -TemplateFile $TemplatePathvWAN204 -TemplateParameterFile $ParametersPathvWAN204;

New-AzureRmResourceGroupDeployment -name $deploymentName -ResourceGroupName $resourceGroupNamevWAN204 -Templatefile $TemplatePathvWAN204 -TemplateParameterfile $ParametersPathvWAN204;
<#roubleshooting
#Debug
$deploymentName = "AzureFoundationSite1A_Debug1b"
New-AzureRmResourceGroupDeployment -name $deploymentName -ResourceGroupName $resourceGroupNameBingNews -Templatefile $TemplatePathBingNews -TemplateParameterfile $ParametersPathBingNews -DeploymentDebugLogLevel All;
$Operations = Get-AzureRmResourceGroupDeploymentOperation -DeploymentName $deploymentName -ResourceGroupName $resourceGroupNamevWAN204
foreach($Operation in $Operations){
Write-Host $operation.id
$Operation.properties.request | ConvertTo-Json -Depth 10
    Write-Host "Request:"
$Operation.properties.response | ConvertTo-Json -Depth 10
 Write-Host "Response:"}
#>

