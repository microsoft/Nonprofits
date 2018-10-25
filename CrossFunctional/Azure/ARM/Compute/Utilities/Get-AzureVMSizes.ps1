$Environment = "AzureUSGovernment"
#$Environment = 'AzureCloud'
Login-AzureRmAccount -EnvironmentName $Environment;
$resources = Get-AzureRmResourceProvider -ProviderNamespace Microsoft.Compute
$resources.ResourceTypes.Where{($_.ResourceTypeName -eq 'virtualMachines')}.Locations
$VMSizes = Get-AzureRMVmSize -Location "USGov Texas" | Sort-Object Name | ft Name, NumberOfCores, MemoryInMB, MaxDataDiskCount -AutoSize
$VMSizes | Export-Csv -Path "c:\temp\vmsizes"
#Find all VM Sizes in all regions with greater than or equal to 64 max attached disks
Get-AzureRmLocation | ForEach-Object {$_.location; Get-AzureRmVMSize -Location $_.location | where{$_.MaxDataDiskCount -ge 64}}
#Find all VM Sizes in all regions with greater than or equal to 32 cores
Get-AzureRmLocation | ForEach-Object {$_.location; Get-AzureRmVMSize -Location $_.location | where{$_.NumberOfCores -ge 32}}