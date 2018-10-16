<#
 .SYNOPSIS
    Deploys the AzureFoundation KeyVault for the Region.  .

 .DESCRIPTION
    Deploys an Azure Resource Manager template assocazted to the KeyVault in the AzureFoundation

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

Select-AzureRmSubscription -SubscriptionID $SubID_Services;
$KeyVault=Get-AzureRmKeyVault
$location="usgovtexas"
$keyVaultResourceGroupName = "rg_slgMAG-KeyVault"; 

$keyVaultResourceGroup = Get-AzureRmResourceGroup -Name $keyvaultResourceGroupName -ErrorAction SilentlyContinue

#Create or check for existing resource group
if(!$keyVaultResourceGroup)
{
    Write-Host "Resource group '$keyVaultResourceGroup ' does not exist. To create a new resource group, please enter a location.";
    if(!$Location) {
        $Location = Read-Host "resourceGroupLocation";
    }
    Write-Host "Creating resource group '$keyVaultResourceGroup ' in location '$Location'";
    New-AzureRmResourceGroup -Name $keyvaultResourceGroupName -Location $Location
}
else{
    Write-Host "Using existing resource group '$keyVaultResourceGroup '";
}

$resourceProviders = @("microsoft.compute","microsoft.network");
if($resourceProviders.length) {
    Write-Host "Registering resource providers"
    foreach($resourceProvider in $resourceProviders) {
        RegisterRP($resourceProvider);
    }
}


$keyvaultParametersFilePath="C:\users\WILLS\Source\Repos\AzureFoundation\ARM\SecurityIdentity\KeyVault\AzureDeploy.keyvault.parameters.json"
$keyvaultTemplateFilePath="C:\Users\WILLS\Source\Repos\AzureFoundation\ARM\SecurityIdentity\KeyVault\AzureDeploy.KeyVault.json"

# Start the deployment

Test-AzureRmResourceGroupDeployment -ResourceGroupName $keyvaultResourcegroupName -TemplateFile $keyvaultTemplateFilePath -TemplateParameterFile $keyvaultParametersFilePath;
New-AzureRmResourceGroupDeployment -ResourceGroupName $keyvaultResourceGroupName -Templatefile $keyvaultTemplateFilePath -TemplateParameterfile $keyvaultParametersFilePath;

get-azurermkeyvault 

