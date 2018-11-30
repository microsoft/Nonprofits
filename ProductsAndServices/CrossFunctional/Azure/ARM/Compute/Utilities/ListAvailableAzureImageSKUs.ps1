
$Environment = 'AzureCloud'
#$Environment = 'AzureUSGovernment'

Login-AzureRmAccount -Environment $Environment
$subscription = Get-AzureRmSubscription |  Out-GridView -PassThru
Set-AzureRmContext -SubscriptionId $subscription.Id
Write-Host "Successfully logged in to Azure." -ForegroundColor Green 


#$location="usgovtexas"
$location="westcentralus"
$pathName = 'c:\temp\'
$imageName="macImages031318"
$Publishers=Get-AzureRmVMImagePublisher -location $Location
foreach($publisher in $Publishers.PublisherName){

$Offers=Get-AzureRmVMImageOffer -location $location -PublisherName $publisher

foreach($offer in $Offers.Offer){

$SKUs=Get-AzureRmVMImageSku -Location $Location -Offer $offer -PublisherName $publisher

foreach($SKU in $SKUs.skus){
$Images=Get-AzureRmVMImage -Location $location -offer $offer -PublisherName $publisher -skus $Sku 

$images|Export-Csv -Append -Path $pathName+$imageName.csv

}}}