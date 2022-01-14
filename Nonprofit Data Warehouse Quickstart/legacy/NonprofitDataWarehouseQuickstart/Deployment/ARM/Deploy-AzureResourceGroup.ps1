<#

# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

.SYNOPSIS
    Deploy resources to Azure to Resource Manager

.DESCRIPTION
    Deploy resources to Azure to Resource Manager
    1. Azure KeyVault
    2. Azure Data Lake Store
    3. Azure Data Factory (without code)
    4. Synape Analytics and SqlServer(former Sql DW)
    5. Azure Blob Storage


.PARAMETER Project
    e.g."mstsidh"

.PARAMETER ResourceGroupLocation
    Declares Resource Group location e.g. "westeurope", "uksouth"

.PARAMETER ResourceGroupName
    Resource Group Name e.g. mstsidhrgweudev

.PARAMETER keyVaultName
    Key Vault Name e.g."mstsidhkvweudev"

.PARAMETER blobStorageAccountName 
    Blob Storage Account Name e.g. "mstsidhsaweudev"

.PARAMETER dataLakeStoreName 
    Data Lake Store Name e.g. "mstsidhadlsweudev"

.PARAMETER sqlDataWarehouseName 
    SQL Data Warehouse Name e.g. "mstsidhsqldwweudev"

.PARAMETER dataFactoryName 
    Data Factory Name e.g. "mstsidhadfweudev"

.PARAMETER sqlServerName 
    SQL Server Name e.g. "mstsidhsqlweudev"

.PARAMETER sqlServerAdminLogin 
    SQL Server Admin Login e.g. "mstsidhadmin"

.PARAMETER sqlServerAdminPassword 
    SQL Server Admin Password e.g. "ncvhIA73GB7C5SB3"

.PARAMETER tags 
    Resource tag e.g. @{Environment:"Dev", Project:"DataHub"}

.OUTPUTS
   No objects are outputed

.EXAMPLE
    .\Deploy-AzureResourceGroup.ps1 `
        -ResourceGroupLocation $ResourceGroupLocation `
        -ResourceGroupName $resourceGroup `
        -keyVaultName $keyVault `
        -blobStorageAccountName $storageAccount `
        -dataLakeStoreName $dataLakeStore `
        -sqlServerName $sqlServer `
        -sqlDataWarehouseName $sqlDataWarehouse `
        -dataFactoryName $dataFactory `
        -tags $tags `
        -sqlServerAdminLogin $sqlServerAdminLogin `
        -sqlServerAdminPassword $sqlServerAdminPassword;

.NOTES
    -Script requires AzureRM Modules installed on the machine where script is executed (requires administrator rights)
    -Script requires Owner of the subscription/resource group to log in e.g. Login-AzureRmAccount -SubscriptionId '{subscriptionId}' - this need to be executed only once.
    -Check parameter details for instructions
    
    #Requires -Version 3.0
#>

Param(
    ### Mandatory Parameters
    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $ResourceGroupLocation="westeurope",

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $ResourceGroupName = "mstsidhrgweudev",

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $keyVaultName = "mstsidhkvweudev",

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $blobStorageAccountName = "mstsidhsaweudev",

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $dataLakeStoreName = "mstsidhadlsweudev",

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $sqlDataWarehouseName = "mstsidhsqldwweudev",

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $dataFactoryName = "mstsidhadfweudev",

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $sqlServerName = "mstsidhsqlweudev",

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $sqlServerAdminLogin = "mstsidhadmin",

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $sqlServerAdminPassword = "ncvhIA73GB7C5SB3",

    [Parameter(Mandatory=$false)]
    [object] $tags = @{},

    ### Optional parameters
    [switch] $UploadArtifacts,
    [string] $StorageAccountName,
    [string] $StorageContainerName = $ResourceGroupName.ToLowerInvariant() + '-stageartifacts',
    [string] $TemplateFile = 'azuredeploy.json',
    [string] $TemplateParametersFile = 'azuredeploy.parameters.json',
    [string] $ArtifactStagingDirectory = '.',
    [string] $DSCSourceFolder = 'DSC',
    [switch] $ValidateOnly
)
Write-Host "### Script Starting - Deploy-AzureResourceGroup"

try
{
    try {
        [Microsoft.Azure.Common.Authentication.AzureSession]::ClientFactory.AddUserAgent("VSAzureTools-$UI$($host.name)".replace(' ','_'), '3.0.0')
    } catch { }

    $ErrorActionPreference = 'Stop'
    Set-StrictMode -Version 3

    function Format-ValidationOutput {
        param ($ValidationOutput, [int] $Depth = 0)
        Set-StrictMode -Off
        return @($ValidationOutput | Where-Object { $_ -ne $null } | ForEach-Object { @('  ' * $Depth + ': ' + $_.Message) + @(Format-ValidationOutput @($_.Details) ($Depth + 1)) })
    }

    $OptionalParameters = New-Object -TypeName Hashtable
    $TemplateFile = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($PSScriptRoot, $TemplateFile))
    $TemplateParametersFile = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($PSScriptRoot, $TemplateParametersFile))

    if ($UploadArtifacts) {
        # Convert relative paths to absolute paths if needed
        $ArtifactStagingDirectory = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($PSScriptRoot, $ArtifactStagingDirectory))
        $DSCSourceFolder = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($PSScriptRoot, $DSCSourceFolder))

        # Parse the parameter file and update the values of artifacts location and artifacts location SAS token if they are present
        $JsonParameters = Get-Content $TemplateParametersFile -Raw | ConvertFrom-Json
        if (($JsonParameters | Get-Member -Type NoteProperty 'parameters') -ne $null) {
            $JsonParameters = $JsonParameters.parameters
        }
        $ArtifactsLocationName = '_artifactsLocation'
        $ArtifactsLocationSasTokenName = '_artifactsLocationSasToken'
        $OptionalParameters[$ArtifactsLocationName] = $JsonParameters | Select -Expand $ArtifactsLocationName -ErrorAction Ignore | Select -Expand 'value' -ErrorAction Ignore
        $OptionalParameters[$ArtifactsLocationSasTokenName] = $JsonParameters | Select -Expand $ArtifactsLocationSasTokenName -ErrorAction Ignore | Select -Expand 'value' -ErrorAction Ignore

        # Create DSC configuration archive
        if (Test-Path $DSCSourceFolder) {
            $DSCSourceFilePaths = @(Get-ChildItem $DSCSourceFolder -File -Filter '*.ps1' | ForEach-Object -Process {$_.FullName})
            foreach ($DSCSourceFilePath in $DSCSourceFilePaths) {
                $DSCArchiveFilePath = $DSCSourceFilePath.Substring(0, $DSCSourceFilePath.Length - 4) + '.zip'
                Publish-AzVMDscConfiguration $DSCSourceFilePath -OutputArchivePath $DSCArchiveFilePath -Force -Verbose
            }
        }

        # Create a storage account name if none was provided
        if ($StorageAccountName -eq '') {
            $StorageAccountName = 'stage' + ((Get-AzContext).Subscription.SubscriptionId).Replace('-', '').substring(0, 19)
        }

        $StorageAccount = (Get-AzStorageAccount | Where-Object{$_.StorageAccountName -eq $StorageAccountName})

        # Create the storage account if it doesn't already exist
        if ($StorageAccount -eq $null) {
            $StorageResourceGroupName = 'ARM_Deploy_Staging'
            New-AzResourceGroup -Location "$ResourceGroupLocation" -Name $StorageResourceGroupName -Force
            $StorageAccount = New-AzStorageAccount -Name $StorageAccountName -SkuName 'Standard_LRS' -ResourceGroupName $StorageResourceGroupName -Location "$ResourceGroupLocation"
        }

        # Generate the value for artifacts location if it is not provided in the parameter file
        if ($OptionalParameters[$ArtifactsLocationName] -eq $null) {
            $OptionalParameters[$ArtifactsLocationName] = $StorageAccount.Context.BlobEndPoint + $StorageContainerName
        }

        # Copy files from the local storage staging location to the storage account container
        New-AzStorageContainer -Name $StorageContainerName -Context $StorageAccount.Context -ErrorAction SilentlyContinue *>&1

        $ArtifactFilePaths = Get-ChildItem $ArtifactStagingDirectory -Recurse -File | ForEach-Object -Process {$_.FullName}
        foreach ($SourcePath in $ArtifactFilePaths) {
            Set-AzStorageBlobContent -File $SourcePath -Blob $SourcePath.Substring($ArtifactStagingDirectory.length + 1) `
                -Container $StorageContainerName -Context $StorageAccount.Context -Force
        }

        # Generate a 4 hour SAS token for the artifacts location if one was not provided in the parameters file
        if ($OptionalParameters[$ArtifactsLocationSasTokenName] -eq $null) {
            $OptionalParameters[$ArtifactsLocationSasTokenName] = ConvertTo-SecureString -AsPlainText -Force `
                (New-AzStorageContainerSASToken -Name $StorageContainerName -Context $StorageAccount.Context -Permission r -ExpiryTime (Get-Date).AddHours(4))
        }
    }

    # Create the resource group only when it doesn't already exist
    if ((Get-AzResourceGroup -Name $ResourceGroupName -Location $ResourceGroupLocation -Verbose -ErrorAction SilentlyContinue) -eq $null) {
        New-AzResourceGroup -Name $ResourceGroupName -Location $ResourceGroupLocation -Verbose -Force -ErrorAction Stop
    }

    if ($ValidateOnly) {
        $ErrorMessages = Format-ValidationOutput (Test-AzResourceGroupDeployment -ResourceGroupName $ResourceGroupName `
                                                                                      -TemplateFile $TemplateFile `
                                                                                      -servers_name $sqlServerName `
                                                                                      -vaults_name $keyVaultName `
                                                                                      -storageAccounts_name $blobStorageAccountName `
                                                                                      -dataLakeStore_name $dataLakeStoreName `
                                                                                      -dataWarehouse_name $sqlDataWarehouseName `
                                                                                      -dataFactory_name $dataFactoryName `
                                                                                      -sqlServerAdminLogin $sqlServerAdminLogin `
                                                                                      -sqlServerAdminPassword $sqlServerAdminPassword `
                                                                                      -tags $tags
                                                                                      )
                                                                                      #-TemplateParameterFile $TemplateParametersFile `
                                                                                      # @OptionalParameters `
        if ($ErrorMessages) {
            Write-Output '', 'Validation returned the following errors:', @($ErrorMessages), '', 'Template is invalid.'
        }
        else {
            Write-Output '', 'Template is valid.'
        }
    }
    else {
        New-AzResourceGroupDeployment -Name ((Get-ChildItem $TemplateFile).BaseName + '-' + ((Get-Date).ToUniversalTime()).ToString('MMdd-HHmm')) `
                                           -ResourceGroupName $ResourceGroupName `
                                           -TemplateFile $TemplateFile `
                                           -servers_name $sqlServerName `
                                           -vaults_name $keyVaultName `
                                           -storageAccounts_name $blobStorageAccountName `
                                           -dataLakeStore_name $dataLakeStoreName `
                                           -dataWarehouse_name $sqlDataWarehouseName `
                                           -dataFactory_name $dataFactoryName `
                                           -sqlServerAdminLogin $sqlServerAdminLogin `
                                           -sqlServerAdminPassword $sqlServerAdminPassword `
                                           -tags $tags `
                                           -Force -Verbose `
                                           -ErrorVariable ErrorMessages;
                                            #-TemplateParameterFile $TemplateParametersFile `
                                           #@OptionalParameters `
        if ($ErrorMessages) {
            Write-Output '', 'Template deployment returned the following errors:', @(@($ErrorMessages) | ForEach-Object { $_.Exception.Message.TrimEnd("`r`n") })
        }
    }
    Write-Host "### Script Succeded";
}
catch
{
    Write-Host "### Script Failed";
    throw;
}


