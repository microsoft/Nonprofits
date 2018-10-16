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


    # "configuration": {
    #   "vnetwithDNSTemplateURL": "[concat(parameters('baseUrl'),'/vnet-with-dns-server.json')]",
    #   "nicTemplateURL": "[concat(parameters('baseUrl'),'/nic.json')]",
    #   "adPDCModulesURL": "[concat(variables('assetLocation'),'/CreateADPDC.ps1.zip')]",
    #   "adPDCConfigurationFunction": "CreateADPDC.ps1\\CreateADPDC",
    #   "adBDCPreparationModulesURL": "[concat(variables('assetLocation'),'/PrepareADBDC.ps1.zip')]",
    #   "adBDCPreparationFunction": "PrepareADBDC.ps1\\PrepareADBDC",
    #   "adBDCConfigurationModulesURL": "[concat(variables('assetLocation'),'/ConfigureADBDC.ps1.zip')]",
    #   "adBDCConfigurationFunction": "ConfigureADBDC.ps1\\ConfigureADBDC",
    #   "fswConfigurationModulesURL": "[concat(variables('assetLocation'),'/ConfigureFileShareWitness.ps1.zip')]",
    #   "fswConfigurationFunction": "ConfigureFileShareWitness.ps1\\ConfigureFileShareWitness",
    #   "fswPreparationModulesURL": "[concat(variables('assetLocation'),'/PrepareFileShareWitness.ps1.zip')]",
    #   "fswPreparationFunction": "PrepareFileShareWitness.ps1\\PrepareFileShareWitness",
    #   "sqlAOPrepareModulesURL": "[concat(variables('assetLocation'),'/PrepareAlwaysOnSqlServer.ps1.zip')]",
    #   "sqlAOPrepareFunction": "PrepareAlwaysOnSqlServer.ps1\\PrepareAlwaysOnSqlServer",
    #   "sqlAOConfigurationModulesURL": "[concat(variables('assetLocation'),'/ConfigureAlwaysOnSqlServer.ps1.zip')]",
    #   "sqlAOConfigurationFunction": "ConfigureAlwaysOnSqlServer.ps1\\ConfigureAlwaysOnSqlServer",
    #   "prepareClusterModulesURL": "[concat(variables('assetLocation'),'/PrepareFailoverCluster.ps1.zip')]",
    #   "prepareClusterConfigurationFunction": "PrepareFailoverCluster.ps1\\PrepareFailoverCluster",
    #   "configureClusterModulesURL": "[concat(variables('assetLocation'),'/ConfigureFailoverCluster.ps1.zip')]",
    #   "configureClusterConfigurationFunction": "ConfigureFailoverCluster.ps1\\ConfigureFailoverCluster",
    #   "spConfigurationModulesURL": "[concat(variables('assetLocation'),'/ConfigureSharePointServerHA.ps1.zip')]",
    #   "spConfigurationFunction": "ConfigureSharePointServerHA.ps1\\ConfigureSharePointServerHA",
    #   "spPreparationModulesURL": "[concat(variables('assetLocation'),'/PrepareSharePointServerHA.ps1.zip')]",
    #   "spPreparationFunction": "PrepareSharePointServerHA.ps1\\PrepareSharePointServerHA",
    #   "spWebIPAdressSetupURL": "[concat(parameters('baseUrl'),'/publicip-',parameters('spWebIPNewOrExisting'),'.json')]",
    #   "spCAIPAdressSetupURL": "[concat(parameters('baseUrl'),'/publicip-','new.json')]",
    #   "rdpIPAdressSetupURL": "[concat(parameters('baseUrl'),'/publicip-rdp.json')]",
    #   "availabilitySetSetupURL": "[concat(parameters('baseUrl'),'/availabilitySets.json')]",
    #   "provisioningPrimaryDCURL": "[concat(parameters('baseUrl'),'/provisioningPrimaryDomainController.json')]",
    #   "provisioningBackupDCURL": "[concat(parameters('baseUrl'),'/provisioningBackupDomainController.json')]",
    #   "configuringBackupDCURL": "[concat(parameters('baseUrl'),'/configuringBackupDomainController.json')]",
    #   "configuringSQLAlwaysOnClusterUrl": "[concat(parameters('baseUrl'),'/configuringSQLAlwaysOnCluster.json')]",
    #   "provisioningSharepointVMsURL": "[concat(parameters('baseUrl'),'/provisioningSharepointVMs.json')]",
    #   "configuringSharepointUrl": "[concat(parameters('baseUrl'),'/configuringSharePoint.json')]",
    #   "creatingStorageAccounts": "[concat(parameters('baseUrl'),'/creatingStorageAccounts.json')]",
    #   "provisioningSQLVMsURL": "[concat(parameters('baseUrl'),'/provisioningSQLVMs.json')]",

    #   "vnetSetupURL": "[concat(parameters('baseUrl'),'/vnet-new.json')]",

    #   "setupLBsUrl": "[concat(parameters('baseUrl'),'/setupLBs.json')]",
    #   "creatingNicsUrl": "[concat(parameters('baseUrl'),'/creatingNICS.json')]"




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
$nestedTemplateUris.Add("$baseTemplateUrl/availabilitySets.json")
$nestedTemplateUris.Add("$baseTemplateUrl/setupLBs.json")
$nestedTemplateUris.Add("$baseTemplateUrl/publicip-new.json")
$nestedTemplateUris.Add("$baseTemplateUrl/publicip-1.json")
$nestedTemplateUris.Add("$baseTemplateUrl/publicip-0.json")
$nestedTemplateUris.Add("$baseTemplateUrl/nic.json")
$nestedTemplateUris.Add("$baseTemplateUrl/availabilitySets.json")





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