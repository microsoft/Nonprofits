# This script will change the UPN for the user members of an AD group
$AdGrp = "All Employees"
$oldSuffix = "@slg044o365.onmicrosoft.com"
$newSuffix = "@slg044.us"

# Get the AD Group in Azure
$AzAdGrp = Get-MsolGroup -All | Where-Object { $_.DisplayName -eq $AdGrp }
$AzAdGrp_members = Get-MsolGroupMember -All -GroupObjectId $AzAdGrp.ObjectId
write-host "Total members of group: " $AzAdGrp_members.Count

# Create array of users to change
# Example command to test only a portion of the users in the group:
$users = Get-MsolGroupMember -All -GroupObjectId $AzAdGrp.ObjectId | Get-MsolUser | Where-Object { $_.UserPrincipalName -like "*$OldSuffix"}
# Command to run for all users in the group:
# $users = Get-MsolGroupMember -All -GroupObjectId $AzAdGrp.ObjectId | Get-MsolUser

$newUpn = $users.Item(1).UserPrincipalName -replace "@SLG044o365.onmicrosoft.com", "@slg044.us"






# Change UPN of users
$users | ForEach-Object {
$newUpn = $_.UserPrincipalName -replace $oldSuffix,$newSuffix
Set-MsolUserPrincipalName -NewUserPrincipalName $newUpn -UserPrincipalName $_.UserPrincipalName 
Write-host "New UPN assigned: " $newUpn
}
