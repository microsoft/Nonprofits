$Environment = 'AzureCloud'
$Environment = 'AzureUSGovernment'

Login-AzureRmAccount -Environment $Environment
$subscription = Get-AzureRmSubscription |  Out-GridView -PassThru
Set-AzureRmContext -SubscriptionId $subscription.Id
Write-Host "Successfully logged in to Azure." -ForegroundColor Green 



#Limit the VNET migration to a specific Resource Group.
$ResouceGroup = Get-AzureRMResourceGroup | Out-GridView -PassThru
$VMs= Get-AzureRMVM -ResourceGroupName $ResouceGroup.ResourceGroupName
#Limit the VM migration to a specific VM and just bipass the ForEach below.
#$VM = Get-AzureRMVM -ResourceGroupName $ResouceGroup.ResourceGroupName | Out-GridView -PassThru

Foreach($VM in $VMS)
{
    write-output $vm.name + $vm.Location
#Get the current VM's NIC name to get the NIC variable set so the picklist of Subnets will allow the user to have an idea where the NIC was
<# #> 
    $NicName = (($VM.NetworkProfile.NetworkInterfaces[0].id).Split('/'))[8]
    $Nic = Get-AzureRmNetworkInterface -Name $NicName -ResourceGroupName $VM.ResourceGroupName
    $Title = (($NIC[0].IpConfigurations.subnet.id).split('/'))[10]

    $NewNetwork = Get-AzureRmVirtualNetwork |Select-Object -property Name,Location,ResourceGroupName,AddressSpacetext | Out-GridView -passthru
    $NewNetwork = Get-AzureRmVirtualNetwork -Name $NewNetwork.Name -ResourceGroupName $NewNetwork.ResourceGroupName

    $NewSubnet = Get-AzureRmVirtualNetworkSubnetConfig -VirtualNetwork $NewNetwork | Select-Object -Property Name,AddressPrefix |Out-GridView -PassThru -Title $Title
    $NewSubnet = Get-AzureRmVirtualNetworkSubnetConfig -VirtualNetwork $NewNetwork -Name $NewSubnet.Name
    
    $message = "current name: " + $vm.name + ", Current IP: " +$NIC[0].IpConfigurations.privateIPAddress+ ", New IP must be in this prefex: " + $NewSubnet.AddressPrefix
    $NewPrivateIP = Read-Host $message
    $NewIPConfig = New-AzureRmNetworkInterfaceIpConfig -Subnet $NewSubnet -Name 'config1' -Primary -PrivateIpAddress $NewPrivateIP 

    
    $NewNic = New-AzureRmNetworkInterface -Name "$($NicName)1a" -ResourceGroupName $Nic.ResourceGroupName -Location $Nic.Location -IpConfiguration $NewIPConfig -Force 
   

   #using the VM Configuration in memory, remove the primary NIC and replace with the new NIC
    $VM = Remove-AzureRmVMNetworkInterface -VM $VM -NetworkInterfaceIDs $Nic.Id

    $vm = Add-AzureRmVMNetworkInterface -VM $VM -NetworkInterface $NewNic
    $Proceed = Read-host 'Type Yes if you want to proceed'
    if($Proceed -eq "Yes"){
        Stop-AzureRmVM -Name $VM.Name -ResourceGroupName $Vm.ResourceGroupName -Force
        Remove-AzureRmVM -Name $VM.Name -ResourceGroupName $Vm.ResourceGroupName -Force

        #Is there an Availability Set?
        if($vm.AvailabilitySetReference.id -eq $null){
            $newVMConfig = new-azurermvmconfig -VMSize $vm.HardwareProfile.VmSize -VMName $vm.Name -Tags $vm.tags 
        }
        else{
        $newVMConfig = new-azurermvmconfig -VMSize $vm.HardwareProfile.VmSize -VMName $vm.Name -AvailabilitySetId $vm.AvailabilitySetReference.Id -Tags $vm.tags 
        }
     
        Add-AzureRmVMNetworkInterface -vm $newVMConfig -id $vm.NetworkProfile.NetworkInterfaces[0].Id
        #Is the VM Windows or Linux?
        if($vm.StorageProfile.osDisk.OStype -eq "Windows"){
            #Is the VM using Managed Disk or Storage Accounts?
            if($vm.storageProfile.OSDisk.ManagedDisk.ID -eq $null){
                Set-AzureRmVMOSDisk -vm $newVMConfig -Name $vm.StorageProfile.OsDisk.Name -CreateOption Attach -vhdURI $vm.StorageProfile.OsDisk.Vhd.Uri -Windows 
            }
            else{
                Set-AzureRmVMOSDisk -vm $newVMConfig -Name $vm.StorageProfile.OsDisk.Name -CreateOption Attach -ManagedDiskId $vm.StorageProfile.OsDisk.ManagedDisk.Id -Windows 
            }
        }
        else {
            Set-AzureRmVMOSDisk -vm $newVMConfig -Name $vm.StorageProfile.OsDisk.Name -CreateOption Attach -ManagedDiskId $vm.StorageProfile.OsDisk.ManagedDisk.Id -Linux
        }
        #Does the VM have any Data Disks?
        if($vm.StorageProfile.DataDisks -ne $null){
            foreach($Disk in $VM.StorageProfile.DataDisks){
                if($Disk.ManagedDisk -eq $null){
                    add-AzureRmVMDataDisk -Name $disk.name -Lun $disk.lun -VM $newVMConfig -Caching $disk.caching -CreateOption attach -VhdUri $disk.vhd.Uri
                }
                else{
                    add-AzureRmVMDataDisk -Name $disk.name -Lun $disk.lun -VM $newVMConfig -Caching $disk.caching -CreateOption attach -ManagedDiskId $disk.ManagedDisk

                }
            }
        }



    $NewVM = $newVMConfig | New-AzureRmVM -ResourceGroupName $vm.ResourceGroupName -Location $vm.Location


    }

}

