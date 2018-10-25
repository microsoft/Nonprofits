# This mostly came from here:
#https://blog.kloud.com.au/2016/02/10/synchronously-startstop-all-azure-resource-manager-virtual-machines-in-a-resource-group/

param(
[string]$power,
[string]$azureResourceGroup
)

if (!$power){Write-host "No powerstate specified. Use -Power start|stop"}
if (!$azureResourceGroup){Write-host "No Azure Resource Group specified. Use -azureResourceGroup 'ResourceGroupName'"}

. .\Invoke-Parallel.ps1


$context = Get-AzureRmContext
$TenantId = $context.Tenant.TenantId

write-host "Enumerating VM's from AzureRM in Resource Group '"$azureResourceGroup "'"
$vms = Get-AzureRMVM -ResourceGroupName $azureResourceGroup  
$vmrunninglist = @()
$vmstoppedlist = @()


Foreach($vm in $vms)
    {
        $vmstatus = Get-AzureRMVM -ResourceGroupName $azureResourceGroup -name $vm.name -Status       
        $PowerState = (get-culture).TextInfo.ToTitleCase(($vmstatus.statuses)[1].code.split("/")[1])
          
        write-host "VM: '"$vm.Name"' is" $PowerState
        if ($Powerstate -eq 'Running')
        {
            $vmrunninglist = $vmrunninglist + $vm.name
        }
        if ($Powerstate -eq 'Deallocated')
        {
            $vmstoppedlist = $vmstoppedlist + $vm.name
        } 
    }

            
if ($power -eq 'start') {
    write-host "Starting VM's "$vmstoppedlist " in Resource Group "$azureResourceGroup       
    $vmstoppedlist | Invoke-Parallel -ImportVariables -NoCloseOnTimeout -ScriptBlock {
    Start-AzureRMVM -ResourceGroupName $azureResourceGroup -Name $_ -Verbose }
}
    

if ($power -eq 'stop') {
     write-host "Stopping VM's "$vmrunninglist " in Resource Group "$azureResourceGroup       
     $vmrunninglist | Invoke-Parallel -ImportVariables -NoCloseOnTimeout -ScriptBlock {
     Stop-AzureRMVM -ResourceGroupName $azureResourceGroup -Name $_ -Verbose -Force }
}