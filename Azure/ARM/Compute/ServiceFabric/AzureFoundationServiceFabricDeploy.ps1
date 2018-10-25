<#
 .SYNOPSIS
    Deploys a Secure ServiceFabric Cluster to Azure, integrated with the AzureFoundation's VNET, subnet, and KeyVault

 .DESCRIPTION
    Deploys an Azure Resource Manager template

 .PARAMETER subscriptionId
    The subscription id where the template will be deployed.

 .PARAMETER resourceGroupName
    The resource group where the template will be deployed. Can be the name of an existing or a new resource group.

 .PARAMETER resourceGroupLocation
    Optional, a resource group location. If specified, will try to create a new resource group in this location. If not specified, assumes resource group is existing.

 .PARAMETER deploymentName
    The deployment name.

 .PARAMETER templateFilePath
    Optional, path to the template file. Defaults to template.json.

 .PARAMETER parametersFilePath
    Optional, path to the parameters file. Defaults to parameters.json. If file is not found, will prompt for parameter values based on template.
#>

param(
 [Parameter(Mandatory=$True)]
 [string]
 $subscriptionId,

 [Parameter(Mandatory=$True)]
 [string]
 $resourceGroupName,

 [string]
 $resourceGroupLocation,

 [Parameter(Mandatory=$True)]
 [string]
 $deploymentName,

 [string]
 $templateFilePath = "template.json",

 [string]
 $parametersFilePath = "parameters.json"
)

<#
.SYNOPSIS
    Registers RPs
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
$resourceGroupName = "rg_PreProd_slg_servicefabric_tx" 
$Environment = "AzureUSGovernment"
#$Environment = "AzureCloud"
$resourceGroupLocation="usgovtexas"
#$resourceGroupLocation = "westcentralus"
$subscriptionId = "30457dd5-e56b-416b-9228-d48b37fe7caa"

# sign in
Write-Host "Logging in...";
Login-AzureRmAccount -EnvironmentName $Environment;

# select subscription
Write-Host "Selecting subscription '$subscriptionId'";
Select-AzureRmSubscription -SubscriptionID $subscriptionId;

# Register RPs
$resourceProviders = @("microsoft.compute","microsoft.keyvault","microsoft.network","microsoft.servicefabric","microsoft.storage");
if($resourceProviders.length) {
    Write-Host "Registering resource providers"
    foreach($resourceProvider in $resourceProviders) {
        RegisterRP($resourceProvider);
    }
}

#Create or check for existing resource group
$resourceGroup = Get-AzureRmResourceGroup -Name $resourceGroupName -ErrorAction SilentlyContinue
if(!$resourceGroup)
{
    Write-Host "Resource group '$resourceGroupName' does not exist. To create a new resource group, please enter a location.";
    if(!$resourceGroupLocation) {
        $resourceGroupLocation = Read-Host "resourceGroupLocation";
    }
    Write-Host "Creating resource group '$resourceGroupName' in location '$resourceGroupLocation'";
    New-AzureRmResourceGroup -Name $resourceGroupName -Location $resourceGroupLocation
}
else{
    Write-Host "Using existing resource group '$resourceGroupName'";
}

# Start the deployment
Write-Host "Starting deployment...";
$serviceFabricTemplateFilePath = 'C:\Users\WILLS\Source\Repos\AzureFoundation\ARM\VM\ServiceFabric\af_ServiceFabric_Secure.json'
$serviceFabricParametersFilePath = 'C:\Users\WILLS\Source\Repos\AzureFoundation\ARM\VM\ServiceFabric\af_ServiceFabric_Secure_Parameters.json'
   test-AzureRmResourceGroupDeployment -ResourceGroupName $resourceGroupName -TemplateFile $serviceFabricTemplateFilePath -TemplateParameterFile $serviceFabricParametersFilePath;

if(Test-Path $parametersFilePath) {
 $clusterName = New-AzureRmResourceGroupDeployment -ResourceGroupName $resourceGroupName -TemplateFile $serviceFabricTemplateFilePath  -TemplateParameterFile $serviceFabricParametersFilePath;
} else {
    New-AzureRmResourceGroupDeployment -ResourceGroupName $resourceGroupName -TemplateFile $templateFilePath;
}

Connect-ServiceFabricCluster -ConnectionEndpoint  | get-Servicefabricclusterupgrade


$vaultName = 'slgmag-Keyvault-PreProd'
$secretRetrieved = Get-AzureKeyVaultCertificate 
$pfxBytes = [System.Convert]::FromBase64String($secretRetrieved.SecretValueText)
[io.file]::WriteAllBytes("c:\cert\CertFromSecret.pfx", $pfxBytes) 
Connect-serviceFabricCluster -ConnectionEndpoint $ClusterName -KeepAliveIntervalInSec 10 -X509Credential -ServerCertThumbprint $Certthumprint -FindType FindByThumbprint -FindValue $Certthumprint -StoreLocation CurrentUser -StoreName "AeisPreProd"  

#Load Certificate in KeyVault
$certificateName = 'SLGPreProd'
$securepfxpwd = ConvertTo-SecureString –String Read-Host 'EnterPasswordForPFX File' –AsPlainText –Force
$secretRetrieved = Get-AzureKeyVaultSecret -VaultName $vaultName
$cer = Import-AzureKeyVaultCertificate -VaultName $vaultName -Name $certificateName -FilePath 'C:\temp\slg\SLGPreProd.pfx' -Password $securepfxpwd
$Certthumprint = "TBD"

