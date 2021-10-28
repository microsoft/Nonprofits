    <#
	
	# Copyright (c) Microsoft Corporation.
	# Licensed under the MIT License.
	
    .SYNOPSIS
        Script Assign AAD Admin for Azure sql database server

    .DESCRIPTION
        Script Assign Active Directory Admin for Azure sql database server. That enables AAD admins to loging to to the server using AAD Accounts and configure AAD Security for the rest of the users.

    .PARAMETER ResourceGroupName
        Name of the resource group where solution SqlServer is deployed e.g. "mstsidhrgweudev"

    .PARAMETER SqlServerName
        Name of the Azure Sql Server e.g. "mstsidhsqlweudev"
    
    .PARAMETER SqlServerAdmin
        Name of the Group/User that is going to be assigned as SQL Server AAD Administgrator e.g. "AAD-GRP-MSTSIDH-DEV-ADMIN"
  
    .OUTPUTS
       No objects are outputed

    .EXAMPLE
        ./Deploy-AzureDataFactoryCode -ResourceGroupName "mstsidhrgweudev" -ResourceGroupLocation "westeurope" -SqlServerAdmin "AAD-GRP-MSTSIDH-DEV-ADMIN";

    .NOTES
        -Script requires AzureRM Modules installed on the machine where script is executed (requires administrator rights)
        -Script requires Owner of the subscription/resource group to log in e.g. Login-AzureRmAccount -SubscriptionId '{subscriptionId}' - this need to be executed only once.
        -Check parameter details for instructions 
        
        ### Setup - install modules (requires admin rights)
        Install-Module AzureRm

        Requires version 3.0 
    #>

Param(

    ### Mandatory parameters
    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $ResourceGroupLocation="westeurope",

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $ResourceGroupName = 'mstsidhrgweudev',

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $dataFactoryName = 'mstsidhadfweudev',

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $dataLakeStoreName = 'mstsidhadlsweudev',

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $blobStorageAccountName = 'mstsidhsaweudev',

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $keyVaultName = 'mstsidhkvweudev',


    ### Optional Parameters
    [Parameter(Mandatory=$false)]
    [switch] $UploadArtifacts,

    [Parameter(Mandatory=$false)]
    [string] $StorageAccountName,

    [Parameter(Mandatory=$false)]
    [string] $StorageContainerName = $ResourceGroupName.ToLowerInvariant() + '-stageartifacts',

    [Parameter(Mandatory=$false)]
    [string] $TemplateFile = 'azuredeploy.json',

    [Parameter(Mandatory=$false)]
    [string] $TemplateParametersFile = 'azuredeploy.parameters.json',

    [Parameter(Mandatory=$false)]
    [string] $ArtifactStagingDirectory = '.',
  
    [Parameter(Mandatory=$false)]
    [string] $DSCSourceFolder = 'DSC'
)

### Clear Screen
# Uncomment below line to clear screen
#cls;

### Login
# Uncomment below line to login
# Login-AzureRmAccount -SubscriptionId '{subscriptionId}'

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
        $StorageAccount = New-AzStorageAccount -Name $StorageAccountName -SkuName 'Standard_LRS' -ResourceGroupName $StorageResourceGroupName -Location $ResourceGroupLocation
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

New-AzResourceGroupDeployment `
    -Name ((Get-ChildItem $TemplateFile).BaseName + '-' + ((Get-Date).ToUniversalTime()).ToString('MMdd-HHmm')) `
    -ResourceGroupName $ResourceGroupName `
    -TemplateFile $TemplateFile `
    -factoryName $dataFactoryName `
    -LS_ADLS_properties_typeProperties_url "https://$($dataLakeStoreName).dfs.core.windows.net/" `
    -LS_BLOB_properties_typeProperties_serviceEndpoint "https://$($blobStorageAccountName).blob.core.windows.net/" `
    -LS_KeyVault_properties_typeProperties_baseUrl "https://$($keyVaultName).vault.azure.net/" `
    -LS_SynapseAnalytics_properties_typeProperties_connectionString_secretName "SynapseAnalytics-ConnectionString" `
    -Force -Verbose `
    -ErrorVariable ErrorMessages
if ($ErrorMessages) {
    Write-Output '', 'Template deployment returned the following errors:', @(@($ErrorMessages) | ForEach-Object { $_.Exception.Message.TrimEnd("`r`n") })
}
