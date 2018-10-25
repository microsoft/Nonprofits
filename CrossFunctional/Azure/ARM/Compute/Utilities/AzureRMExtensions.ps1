#https://blogs.msdn.microsoft.com/azuresecurity/2016/02/24/update-on-microsoft-antimalware-and-azure-resource-manager-arm-vms/
$location = "eastus2"
$ResourceGroupName = "rg_services_adds_tx"
$ResourceGroup = get-azurermResourceGroup -Name $ResourceGroupName
$WorkspaceID = Get-Credential -Message "Enter the workspaceID and Key" 
#AntiMalware Agent
$antiMalware= “Microsoft.Azure.Security”
$antiMalwareType = “IaaSAntimalware”
$settingString = ‘{"AntimalwareEnabled": true}’;
$allVersions= (Get-AzureRmVMExtensionImage -Location $location -PublisherName $antiMalware -Type $antiMalwareType).Version
$versionString = $allVersions[($allVersions.count)-1].Split(“.”)[0] + “.” + $allVersions[($allVersions.count)-1].Split(“.”)[1]
#MMA Agent
#https://www.hybrid-cloudblog.com/using-set-azurermvmextension-to-add-vm-extension/
$MMA="Microsoft.EnterpriseCloud.Monitoring"
$MMAType = "MicrosoftMonitoringAgent"
$allVersions2= (Get-AzureRmVMExtensionImage -Location $location -PublisherName $MMA -Type $MMAType).Version
$versionString2 = $allVersions2[($allVersions2.count)-1].Split(“.”)[0] + “.” + $allVersions2[($allVersions2.count)-1].Split(“.”)[1]


$VMs = Get-AzureRmVM -ResourceGroupName $ResourceGroupName 
ForEach($VM in $VMs){
#Set-AzureRMVMExtension –ResourceGroupName $ResourceGroupName -Location $location -ExtensionType $MMAType -Name $MMAType  -Publisher "Microsoft.EnterpriseCloud.Monitoring" -TypeHandlerVersion "1.0" -Settings @{"workspaceID" = $workspaceID.UserName} -VMName $VM.Name -ProtectedSettings @{"workspaceKey" = $workspaceID.Password}
Set-AzureRmVMExtension -ResourceGroupName $resourceGroupName -Location $location -VMName $vm.Name -Name $AntimalwareType -Publisher $antiMalware -ExtensionType $antiMalwareType -TypeHandlerVersion $versionString -SettingString $settingString

}