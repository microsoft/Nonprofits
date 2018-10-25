$Environment = "AzureUSGovernment"
#$Environment = 'AzureCloud'
#$AADEnvironment = "USGovernment"
$AADEnvironment = "AzureCloud"
Connect-MsolService -AzureEnvironment $AADEnvironment
cd "C:\Program Files (x86)\Microsoft SDKs\Azure\AzCopy"

Login-AzureRmAccount -EnvironmentName $Environment;
$subID_CJIS=""
$SubName_CJIS='mac_slg_Managed_CJIS'
$subID_HBI="ce38c0ef-22f5-458d-b1f7-e3890e2471f2"
$SubName_HBI= 'MAC_SLG_Managed_HBI'
$subID_PreProd="a7d928df-fc97-4f02-adae-3d7cdeb7c8cb"
$subName_PreProd='MAC_SLG_Managed_PreProd'
$SubID_Prod="ec1cea2e-92aa-45a7-89b0-d9fc40df2beb"
$SubName_Prod='MAC_SLG_Managed_Prod'
$SubID_Services="730f26b5-ebf5-4518-999f-0b4eb0cdc8f9"
$SubName_Services="MAC_SLG_Managed_Services"
$SubID_Storage="6e5d19d2-a324-470a-b24f-57ac0d3221a1"
$SubName_Storage="MAC_SLG_Managed_Storage"

Select-AzureRmSubscription -SubscriptionID $SubID_PreProd;

$Source = "https://vamagtxdotpreproddatas2a.blob.core.usgovcloudapi.net/pathway1test/TX_2017/"
$Destination = "https://vamagtxdotpreproddatas2a.file.core.usgovcloudapi.net/pathway1test"
$key = 
AzCopy /Source:$source /Dest:$Destination /Destkey:$key /S
