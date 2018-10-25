$vmrg = "rg_sso_tx"
$vmName = "txpaads2a"
$StorageURI = "https://rgssotxdisks436.blob.core.usgovcloudapi.net/vhds"
$disk0 = "disk0.vhd"
$disk0Name = "disk0"
$disk0LUN = 0
$disk0Cashe = 'None'


$Disk0URI= $StorageURI+"/"+$disk0
$VM= get-azureRMVM -name $vmName -ResourceGroupName $VMRG

$VM = Add-AzureRmVMDataDisk -VM $VM -Name $disk0Name -VhdUri $Disk0URI -LUN $Disk0LUN -Caching $disk0Cashe -DiskSizeinGB 4095 -CreateOption Empty
$vm = Update-AzureRmVM -ResourceGroupName $vmrg -VM $VM
$vm.StorageProfile.DataDisks