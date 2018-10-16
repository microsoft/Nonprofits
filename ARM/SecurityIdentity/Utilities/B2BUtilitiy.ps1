#$AADEnvironment = "USGovernment"
$AADEnvironment = "AzureCloud"
Connect-MsolService -AzureEnvironment $AADEnvironment

#Change a guest to a Member
$users = get-msoluser 
$guestUser = $users |  where {$_.UserType -eq "Guest"} 
foreach($User in $guestUsers)
{

$user | Set-MsolUser -UserType Member
}

#Other CIS Checks

#IS Multi Factor Authentication MFA enabled for Administrators?  
Get-MsolUser -All | where {$_.StrongAuthenticationMethods.Count -eq 0} | Select-Object -Property UserPrincipalName

#Is Multi Factor Authentication MFA enabled?  For the users listed it isn't
Get-MsolUser -All | where {$_.StrongAuthenticationMethods.Count -eq 0} | Select-Object -Property UserPrincipalName