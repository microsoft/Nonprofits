function DownloadAndStoreFiles{
    Param ([string]$folderToStoreFiles, [System.Collections.ArrayList]$resourceUris)
    foreach($resourceUri in $resourceUris){
        $resourceFileName = Split-Path -Path $resourceUri -Leaf
        $resourceFileName
        $mainTemplateResponse = Invoke-WebRequest -Uri $resourceUri -OutFile ($folderToStoreFiles + $resourceFileName) -PassThru
    }
}


$folderToStoreNestedFiles = ".\nestedtemplates\"
$folderToStoreDSCFiles = ".\DSC\"

$baseTemplateUrl = "https://gallery.azure.com/artifact/20151001/sharepoint2013.sharepoint2013farmsharepoint2013-ha.1.0.14/Artifacts"
$nestedTemplateUris = New-Object System.Collections.ArrayList
$nestedTemplateUris.Add("https://gallery.azure.com/artifact/20161101/sharepoint2013.sharepoint2013farmsharepoint2013-ha.1.0.14/Artifacts/mainTemplate.json")
$nestedTemplateUris.Add("$baseTemplateUrl/vnet-with-dns-server.json")
$nestedTemplateUris.Add("$baseTemplateUrl/nic.json")
$nestedTemplateUris.Add("$baseTemplateUrl/provisioningSQLVMs.json")
$nestedTemplateUris.Add("$baseTemplateUrl/configuringSharePoint.json")
$nestedTemplateUris.Add("$baseTemplateUrl/creatingStorageAccounts.json")
$nestedTemplateUris.Add("$baseTemplateUrl/provisioningSharepointVMs.json")
$nestedTemplateUris.Add("$baseTemplateUrl/configuringSQLAlwaysOnCluster.json")
$nestedTemplateUris.Add("$baseTemplateUrl/creatingNICS.json")
$nestedTemplateUris.Add("$baseTemplateUrl/availibilitySets.json")

if(!(Test-Path -Path $folderToStoreNestedFiles)){
    New-Item -type Directory -Path $folderToStoreNestedFiles
}
DownloadAndStoreFiles -resourceUris $nestedTemplateUris -folderToStoreFiles $folderToStoreNestedFiles 


$baseAssetLocationUrl = "https://sdaviesms.blob.core.windows.net/marketplaceprod/dscv2"
$dscURIs = New-Object System.Collections.ArrayList

# SQL Server Always On
$dscURIs.Add("$baseAssetLocationUrl/ConfigureAlwaysOnSqlServer.ps1.zip");
$dscURIs.Add("$baseAssetLocationUrl/PrepareAlwaysOnSqlServer.ps1.zip");

# SQL Server File Share Witness
$dscURIs.Add("$baseAssetLocationUrl/ConfigureFileShareWitness.ps1.zip");
$dscURIs.Add("$baseAssetLocationUrl/PrepareFileShareWitness.ps1.zip");

# SQL Server Always On Failover Cluster
$dscURIs.Add("$baseAssetLocationUrl/ConfigureFailoverCluster.ps1.zip");
$dscURIs.Add("$baseAssetLocationUrl/PrepareFailoverCluster.ps1.zip");

# SharePoint Server High Availablity
$dscURIs.Add("$baseAssetLocationUrl/ConfigureSharePointServerHA.ps1.zip");
$dscURIs.Add("$baseAssetLocationUrl/PrepareSharePointServerHA.ps1.zip");

if(!(Test-Path -Path $folderToStoreDSCFiles)){
    New-Item -type Directory -Path $folderToStoreDSCFiles
}
DownloadAndStoreFiles -resourceUris $dscURIs -folderToStoreFiles $folderToStoreDSCFiles  