$Environment = "AzureUSGovernment"
#$Environment = 'AzureCloud'
$AADEnvironment = "USGovernment"
#$AADEnvironment = "AzureCloud"
Connect-MsolService -AzureEnvironment $AADEnvironment

Login-AzureRmAccount -EnvironmentName $Environment;
#MAC:  $SubID_Services="730f26b5-ebf5-4518-999f-0b4eb0cdc8f9"
$SubName_Services="MAC_SLG_Managed_Services"
$SubID_Services='30457dd5-e56b-416b-9228-d48b37fe7caa'
Select-AzureRmSubscription -SubscriptionID $SubID_Services;
$cred=Get-Credential
#$UPNSuffix = "@SLG044O365.onmicrosoft.com"
#$UPNSuffix = "@SLG044.us"
$UPNSuffix = "@magtaggov.onmicrosoft.com"
#$UPNSuffix = "@gov.SLG044.us"

#Get a list of the users in the AAD
#$AllUsers = Get-AzureRmADUser
$AllUsers = Get-msolUser -all
$AllGroups = Get-MsolGroup
$AllGroupMemebership =  Get-MsolGroupMember -GroupObjectId $Group.ObjectId

foreach($user in $AllUsers | Where-Object {$_.UserPrincipalName -match $UPNSuffix}){
$user = get-msoluser -UserPrincipalName "binhcao@gov.slg044.us"
if($user.LastDirSyncTime -match "2017" ){
write-host $User.LastDirSyncTime", "$user.UserPrincipalName
$user | remove-msoluser
}

}

foreach($group in $AllGroups){
write-host $group.DisplayName
$Group |Remove-MsolGroup}



