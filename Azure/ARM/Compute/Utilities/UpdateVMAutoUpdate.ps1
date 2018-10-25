#Set the autoupdate for a Virtual Machine
Write-Host "Logging in...";
$Environment = "AzureUSGovernment"
#$Environment = 'AzureCloud'
Login-AzureRmAccount -EnvironmentName $Environment;
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
$Creds = Get-Credential
Select-AzureRmSubscription -SubscriptionID $SubID_Services;

$VMs = Get-AzureRmVM
foreach ($vm in $VMs){
Set-AzureRmVMOperatingSystem -EnableAutoUpdate -ComputerName $vm.name -Credential $Creds -vm $VM -Windows
}

