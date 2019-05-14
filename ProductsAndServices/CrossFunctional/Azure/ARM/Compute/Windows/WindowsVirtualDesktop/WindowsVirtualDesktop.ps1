
# sign in
Write-Host "Logging in...";
#$Environment = "AzureUSGovernment"
$Environment = 'AzureCloud'
Login-AzureRmAccount -EnvironmentName $Environment;
$subID_Services="b352fe70-6fe2-4dcd-a153-ee002ed3da62"
$tenantName = 'contoso.org'
$hostPoolName = 'contosoWVD'
Select-AzureRmSubscription -SubscriptionID $SubID_Services;
Add-RdsAccount -DeploymentUrl "https://rdbroker.wvd.microsoft.com"
Add-RdsAppGroupUser $tenantName $hostPoolName "Desktop Application Group" -UserPrincipalName willst@contoso.org
set-RDSHostPool $tenantName $hostPoolName -BreadthFirstLoadBalancer
