$dt=get-date
$path='c:\temp\azure\roadmap\GetResourceProvidersByRegion10122017b.csv'
$ResourceProviders = Get-AzureRmResourceProvider -ListAvailable
$JSONResourceProvider = ConvertTo-Json -InputObject $ResourceProviders 
$ResourceProviders | Format-Table
$RPTable =@()
$i=0
Foreach($RP in $ResourceProviders) {
$rpdetails = Get-AzureRmResourceProvider -ProviderNamespace $rp.ProviderNamespace
Write-Output $rpdetails
Select-AzureRmSubscription -SubscriptionID $SubID_Services;
Register-AzureRmResourceProvider -providernamespace $rp.ProviderNamespace
Select-AzureRmSubscription -SubscriptionID $SubID_Prod;
Register-AzureRmResourceProvider -providernamespace $rp.ProviderNamespace
Select-AzureRmSubscription -SubscriptionID $SubID_preProd
Register-AzureRmResourceProvider -providernamespace $rp.ProviderNamespace

Select-AzureRmSubscription -SubscriptionID $SubID_Storage
Register-AzureRmResourceProvider -providernamespace $rp.ProviderNamespace

Select-AzureRmSubscription -SubscriptionID $SubID_HBI
Register-AzureRmResourceProvider -providernamespace $rp.ProviderNamespace

$rpdetails = Get-AzureRmResourceProvider -ProviderNamespace $rp.ProviderNamespace
Write-Output $rpdetails

}



