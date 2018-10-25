#Requires -Version 3.0
#Requires -Module AzureRM.Resources
#Requires -Module Azure.Storage
#Requires -Module AzureRM.Storage


Write-Host "Logging in..."
$Environment = "AzureUSGovernment"
#$Environment = 'AzureCloud'
Login-AzureRmAccount -EnvironmentName $Environment
$subID_HBI='97eba262-9086-4a3e-9770-dcfef6c3df30'
$SubName_HBI= 'slgmag_managed_HBI'
$subID_PreProd='a4b962d2-6b17-4c38-af02-010a6e774379'
$subName_PreProd='slgmag_managed_PreProd'
$SubID_Prod='4a0d1d83-f557-4065-8423-be499038298a'
$SubName_Prod='slgmag_managed_Production'
$SubID_Services='30457dd5-e56b-416b-9228-d48b37fe7caa'
$SubName_Services='slgmag_managed_Services'
$SubID_Storage='0223b7af-344f-42cd-bed2-5ebbc7d06d5d'
$SubName_Storage='slgmag_managed_Storage'
#Set up Resource Group names and template files
$ArtifactStagingDirectory='C:\Users\WILLS\Source\Repos\AzureFoundation\ARM\Compute\Windows\Workloads\identity\iam-adds\'
$ResourceGroupName = 'rg_prod_adds_tx'
$UploadArtifacts = false
$StorageAccountName = 'givemeastorageaccount1a'
$ADDSTemplateFile = $ArtifactStagingDirectory + 'af_compute_adds_azuredeploy.json'
$ADDSParametersFile = $ArtifactStagingDirectory + 'af_compute_adds_azuredeploy.json'
$ADDSDSCPath = $ArtifactStagingDirectory + 'DSC'
$ValidateOnly = false
#Set up the location
$resourceGroupLocation = 'usgovtexas'
$location='usgovtexas'

#I guess this stores the templates in Azure?
if ($UploadArtifacts) {
    # Convert relative paths to absolute paths if needed
    $ArtifactStagingDirectory = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($PSScriptRoot, $ArtifactStagingDirectory))
    $ADDSDSCPath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($PSScriptRoot, $ADDSDSCPath))

    Set-Variable ArtifactsLocationName '_artifactsLocation' -Option ReadOnly -Force
    Set-Variable ArtifactsLocationSasTokenName '_artifactsLocationSasToken' -Option ReadOnly -Force
	Set-Variable ArtifactsLocationResourceIdName '_artifactsLocationResourceId' -Option ReadOnly -Force

    $ADDSTemplateFileContent = Get-Content $ADDSTemplateFile -Raw | ConvertFrom-Json
    $ADDSParametersFileContent = Get-Content $ADDSParametersFile -Raw | ConvertFrom-Json
    #$ADDSParametersFileContent = $ADDSTemplateFileContent | Get-Member -Type NoteProperty | Where-Object {$_.Name -eq "parameters"}
    if (Get-Member -InputObject $ADDSParametersFileContent -Name parameters) {
        $TemplateParameters= $ADDSParametersFileContent.parameters
    }
    else {
        $TemplateParameters = $ADDSParametersFileContent
    }

    # Create a storage account name if none was provided
    if($StorageAccountName -eq "") {
        $subscriptionId = ((Get-AzureRmContext).Subscription.SubscriptionId).Replace('-', '').substring(0, 19)
        $StorageAccountName = "stage$subscriptionId"
    }

    $StorageAccount = (Get-AzureRmStorageAccount | Where-Object{$_.StorageAccountName -eq $StorageAccountName})

    # Create the storage account if it doesn't already exist
    if($StorageAccount -eq $null){
        $StorageResourceGroupName = "ARM_Deploy_Staging"
        New-AzureRmResourceGroup -Location "$ResourceGroupLocation" -Name $StorageResourceGroupName -Force
        $StorageAccount = New-AzureRmStorageAccount -StorageAccountName $StorageAccountName -Type 'Standard_LRS' -ResourceGroupName $StorageResourceGroupName -Location "$ResourceGroupLocation"
    }

    $StorageAccountContext = $storageAccount.Context
    
    if (Get-Member -InputObject $ADDSTemplateFileContent.parameters -Name _artifactsLocation) {
        if (Get-Member -InputObject $TemplateParameters -Name _artifactsLocation) {
            $OptionalParameters.Add($ArtifactsLocationName, $TemplateParameters._artifactsLocation.value)
        }                
        else {
            $OptionalParameters.Add($ArtifactsLocationName, $StorageAccountContext.BlobEndPoint + $StorageContainerName)
        }
    }

    if (Get-Member -InputObject $ADDSTemplateFileContent.parameters -Name _artifactsLocationResourceId) {
        if (Get-Member -InputObject $TemplateParameters -Name _artifactsLocationResourceId) {
            $OptionalParameters.Add($artifactsLocationResourceIdName, $TemplateParameters._artifactsLocationResourceId.value)
        }
        else {
            $OptionalParameters.Add($artifactsLocationResourceIdName, $storageAccount.Id)
        }
    }
    
    # Create DSC configuration archive
    if (Test-Path $ADDSDSCPath) {
        $DSCFiles = Get-ChildItem $ADDSDSCPath -File -Filter "*.ps1" | ForEach-Object -Process {$_.FullName}
        foreach ($DSCFile in $DSCFiles) {
            $DSCZipFile = $DSCFile.Replace(".ps1",".zip")
            Publish-AzureVMDscConfiguration -ConfigurationPath $DSCFile -ConfigurationArchivePath $DSCZipFile -Force
        }
    }

    # Copy files from the local storage staging location to the storage account container
    New-AzureStorageContainer -Name $StorageContainerName -Context $StorageAccountContext -Permission Container -ErrorAction SilentlyContinue *>&1
    
    $ArtifactFilePaths = Get-ChildItem $ArtifactStagingDirectory -Recurse -File | ForEach-Object -Process {$_.FullName}
    foreach ($SourcePath in $ArtifactFilePaths) {
        $BlobName = $SourcePath.Substring($ArtifactStagingDirectory.length + 1)
        Set-AzureStorageBlobContent -File $SourcePath -Blob $BlobName -Container $StorageContainerName -Context $StorageAccountContext -Force
    }

    # Generate the value for artifacts location SAS token if it is not provided in the parameter file
    if (Get-Member -InputObject $ADDSTemplateFileContent.parameters -Name _artifactsLocationSasToken) {
        if (Get-Member -InputObject $TemplateParameters -Name _artifactsLocationSasToken) {
            $OptionalParameters.Add($ArtifactsLocationSasTokenName, $TemplateParameters._artifactsLocationSasToken.value)
        }
        else {
            $ArtifactsLocationSasToken = New-AzureStorageContainerSASToken -Container $StorageContainerName -Context $StorageAccountContext -Permission r -ExpiryTime (Get-Date).AddHours(4)
            $ArtifactsLocationSasToken = ConvertTo-SecureString $ArtifactsLocationSasToken -AsPlainText -Force
            $OptionalParameters.Add($ArtifactsLocationSasTokenName, $ArtifactsLocationSasToken)
        }  
    }
}

# Create or update the resource group using the specified template file and template parameters file
$ADDSResourceGroup = New-AzureRmResourceGroup -Name $ADDSResourceGroupName -Location $ResourceGroupLocation -Verbose -Force -ErrorAction Stop 
if(!$ADDSResourceGroup)
{
    Write-Host "Resource group '$ADDSResourceGroupName' does not exist. To create a new resource group, please enter a location.";
    if(!$Location) {
        $Location = Read-Host "resourceGroupLocation";
    }
    Write-Host "Creating resource group '$ADDSResourceGroupName' in location '$Location'";
    New-AzureRmResourceGroup -Name $ADDSResourceGroupName -Location $Location
}
else{
    Write-Host "Using existing resource group '$ADDSResourceGroupName'";
}

# Start the deployment

Test-AzureRmResourceGroupDeployment -ResourceGroupName $ADDSResourcegroupname -TemplateFile $ADDSTemplateFile -TemplateParameterFile $ADDSParametersFile

New-AzureRmResourceGroupDeployment -ResourceGroupName $ADDSResourcegroupname -TemplateFile $ADDSTemplateFile -TemplateParameterFile $ADDSParametersFile
