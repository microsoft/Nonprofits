<#	
.SYNOPSIS Set AAD Connect Permissions for service account

.DESCRIPTION Use this script to set permissions for the AAD Connect Service Account.

.PARAMETER AllPermissions
Use this parameter to configure all object permissions:
- DeviceWriteBack
- ExchangeHybridWriteBack
- GroupWriteBack
- PasswordHashSync
- PasswordWriteBack

.PARAMETER DeviceWriteBack
Use this parameter to configure Device Write Back. Using this parameter will require use of the AAD Connect modules, 
so AAD Connect must already be installed.

.PARAMETER Domain
Used to specify the NetBIOS domain name.  If this parameter is omitted, the current NetBIOS domain name is used.

.PARAMETER ExchangeHybridWriteBack
Use this parameter to set the permissions for Exchange Hybrid WriteBack.

.PARAMETER ExchangeHybridWriteBackOUs
Use this parameter to specify target OUs to enable the service account writeback permissions. If this parameter is omitted,
access is granted at the domain root.

.PARAMETER Forests
If you have more than one forest in your AAD Connect topology, you can use the Forests parameter to specify them for device writeback.
You must be logged on with an account that has enterprise admin privileges in the target forests.

.PARAMETER GroupWriteBack
Use this parameter to configure Office 365 Group writeback permissions.  Uses GroupWriteBackOU if the parameter is specified;
otherwise, uses default value in AD connector.

.PARAMETER PasswordHashSync
Use this parameter to set 'Replicating Directory Changes' and 'Replicating Directory Changes All' permissions.

.PARAMETER PasswordWriteBack
Use this parameter to enable password writeback.  Uses ExchangeHybridWriteBackOUs parameter if specified; otherwise, sets
permissions at domain root.

.PARAMETER User
Specify the AAD account that will be granted permissions.  If no account is specified, attempt to locate the account through
the connector properties.

.EXAMPLE
.\AADConnectPermissions.ps1
Attempt to configure permissions for all features.

.EXAMPLE
.\AADConnectPermissions.ps1 -User AADSyncAdmin -ExchangeHybridWriteBack -GroupWriteBack
Delegate Exchange Hybrid WriteBack permissions at the domain top-level to use AADSyncAdmin, and enable GroupWriteBack using the value already stored in the AADConnect configuration.

.EXAMPLE
.\AADConnectPermissions.ps1 -User AADSyncAdmin -GroupWriteBack -GroupWriteBackOU "OU=O365 Groups,OU=Resources,DC=contoso,DC=com"
Delegate Group WriteBack permissions to the account AADSyncAdmin using the container OU=O365 Groups,OU=Resources,DC=contoso,DC=com. If the container does not exist, create it and then delegate permissions.

.\AADConnectPermissions.ps1 -PasswordHashSync
Delegate 'Replicating Directory Changes' and 'Replicating Directory Changes All' permissions for PasswordHashSync to the user stored in the AAD Connect configuration.

.LINK
https://gallery.technet.microsoft.com/AD-Advanced-Permissions-49723f74

.NOTES
- 2017-08-15	Added install sequence for MSOnline and AzureADPreview modules
				Added support for DeviceWriteBack for multiple forests
				Added support for Windows 10 Azure AD joined devices to device writeback
				Added support for INetOrgPerson objects to Exchange hybrid and password writeback 
- 2017-08-14	Initial Release
#>

Param (
	[switch]$AllPermissions,
	[switch]$DeviceWriteBack,
	[string]$Domain,
	[switch]$ExchangeHybridWriteBack,
	[array]$ExchangeHybridWriteBackOUs,
	[array]$Forests,
	[switch]$GroupWriteBack,
	[array]$GroupWriteBackOU,
	[object]$LocalCredential,
	[switch]$PasswordHashSync,
	[switch]$PasswordWriteBack,
	[object]$TenantCredential,
	[string]$TenantID,
	[string]$User,
	[string]$VerifiedDomains
	)

# Check if Elevated
$wid = [system.security.principal.windowsidentity]::GetCurrent()
$prp = New-Object System.Security.Principal.WindowsPrincipal($wid)
$adm = [System.Security.Principal.WindowsBuiltInRole]::Administrator
if ($prp.IsInRole($adm))
{
	Write-Host -ForegroundColor Green "Elevated PowerShell session detected. Continuing."
}
else
{
	Write-Host -ForegroundColor Red "This application/script must be run in an elevated PowerShell window. Please launch an elevated session and try again."
	Break
}

$OURegExPathTest = '^(ou=)[a-zA-Z\d\=\, ]*(,dc\=\w*,dc=\w*)'
If ($GroupWriteBackOU -and ($GroupWriteBackOU -notmatch $OURegExPathTest))
{
	Write-Host -ForegroundColor Red "Invalid Organizational Unit structure for GroupWriteBackOU."
	Break
}

If ($ExchangeHybridWriteBackOUs -and ($ExchangeHybridWriteBackOUs -notmatch $OURegExPathTest))
{
	Write-Host -ForegroundColor Red "One or more of your Exchange Hybrid WriteBack OUs is formatted incorrectly."
	Break
}

If ($PSBoundParameters.Count -eq 0)
{
	Write-Host -Foreground Yellow "No paramters specified.  Running all options."
	$AllPermissions = $True	
}

If ($AllPermissions)
{
	$DeviceWriteBack = $true
	$ExchangeHybridWriteBack = $true
	$GroupWriteBack = $true
	$PasswordHashSync = $true
	$PasswordWriteBack = $true
}

# Check to see if user is specified as param. If not, select the user from the AD Connector. If no valid user is found, exit.
If (!($User))
{
	    <#	
		Write-Host -ForegroundColor Yellow "No user specified. Attempting to locate user configuration."
		$Path = $env:TEMP + "\" + (Get-Random)
		Get-ADSyncServerConfiguration -Path $Path
		$ConnectorIdentifier = (Get-ADSyncConnector | ? { $_.ConnectorTypeName -eq "AD" }).Identifier
		#>
		#<#
		$Path = $env:TEMP + "\" + (Get-Random)
		$Session = New-PSSEssion -Computername Localhost #-Credential $LocalCredential
		$Command1 = { Param ($Path); Get-ADSyncServerConfiguration -Path $Path }
		$Command2 = { (Get-ADSyncConnector | ? { $_.ConnectorTypeName -eq "AD" }) }
		Invoke-Command -Session $Session -Scriptblock $Command1 -ArgumentList $Path
		$Result = Invoke-Command -Session $Session -ScriptBlock $Command2
		$ConnectorIdentifier = $Result.Identifier.ToString() #>
		
		$ConnectorXMLFile = $Path + "\Connectors\Connector_{$($ConnectorIdentifier)}.xml"
		[xml]$ConnectorXMLData = gc $ConnectorXMLFile
		$User = $ConnectorXMLData.'ma-data'.'private-configuration'.'adma-configuration'.'forest-login-user'
		$Domain = $ConnectorXMLData.'ma-data'.'private-configuration'.'adma-configuration'.'forest-login-domain'
		$Domain = (Get-ADDomain $Domain).NetBIOSName
		$User = $Domain + "\" + $User
		If (!($User))
		{
			Write-Host -ForegroundColor Red "User not specified in parameter and unable to find user in XML file. Please re-run with -User parameter."
			Break
		}
		Else
		{
			Write-Host -ForegroundColor Green "AAD Connect service account is $($User)."
		}
		
	} #
	#$SessionOutput = Invoke-Command -Session $Session -ScriptBlock $Command

If (Get-Module ADSync) { Remove-Module ADSync }

# Modules
Import-Module MSOnline -Force
If (!(Get-Module -ListAvailable MSOnline -ea silentlycontinue))
{
	Write-Host -ForegroundColor Yellow "This requires the Microsoft Online Services Module. Attempting to download and install."
	wget https://download.microsoft.com/download/5/0/1/5017D39B-8E29-48C8-91A8-8D0E4968E6D4/en/msoidcli_64.msi -OutFile $env:TEMP\msoidcli_64.msi
	#wget "http://download.connect.microsoft.com/pr/AdministrationConfig_3.msi?t=18b85329-168d-48e6-9d80-859922cceb08&e=1502786671&h=2fe908bf9d4b49944635243f3e0fc691" -OutFile $env:TEMP\AdministrationConfig_3.msi
	If (!(Get-Command Install-Module))
	{
		wget https://download.microsoft.com/download/C/4/1/C41378D4-7F41-4BBE-9D0D-0E4F98585C61/PackageManagement_x64.msi -OutFile $env:TEMP\PackageManagement_x64.msi
	}
	msiexec /i $env:TEMP\msoidcli_64.msi /quiet /passive
	#msiexec /i $env:TEMP\AdministrationConfig_3.msi /qn
	msiexec /i $env:TEMP\PackageManagement_x64.msi /qn
	Install-PackageProvider -Name Nuget -MinimumVersion 2.8.5.201 -Force -Confirm:$false
	Install-Module MSOnline -Confirm:$false -Force
	If (!(Get-Module -ListAvailable MSOnline))
	{
		Write-Host -ForegroundColor Red "This Configuration requires the MSOnline Module. Please download from https://connect.microsoft.com/site1164/Downloads/DownloadDetails.aspx?DownloadID=59185 and try again."
		Break
	}
}
#Import-Module MSOnline

# Enable Device Write-Back
# See https://docs.microsoft.com/en-us/azure/active-directory/connect/active-directory-aadconnect-feature-device-writeback for more
# information.
If ($DeviceWriteBack)
{
	# Check for NetBIOS Domain Name
	If (!($Domain)) { $Domain = (Get-ADDomain).Name }
	
	If (!($TenantCredential)) { $global:TenantCredential = Get-Credential }
	Connect-MsolService -Credential $TenantCredential
	
	# Check for verified domains in tenant
	If (!($VerifiedDomains))
	{
		[array]$VerifiedDomains = Get-MsolDomain -Status Verified | ? { $_.Name -notlike "*onmicrosoft.com" }
		If ($VerifiedDomains -eq 0)
		{
		Write-Host -ForegroundColor Red "Device WriteBack requires a verified domain in your Office 365 Tenant. Please re-run AADConnectPermissions.ps1 without DeviceWriteBack parameter to continue."
		Break
		}
	}
			
	# Check for TenantID
	If (!($TenantID))
	{
		$TenantID = (Get-MsolAccountSku)[0].AccountObjectID
	}
	
	# Check for Active Directory Module
	If (!(Get-Module -ListAvailable ActiveDirectory))
	{
		Write-Host -ForegroundColor Yellow "Configuring Device Writeback requires the Active Directory Module. Attempting to install."
		Add-WindowsFeature RSAT-AD-PowerShell
	}
	If (!(Get-Module -ListAvailable ActiveDirectory))
	{
		Write-Host -ForegroundColor Red "Unable to install Active Directory module. Device Writeback configuration will not be successful. Please re-run AADConnectPermissions.ps1 without DeviceWriteBack parameter to continue."
		Break	
	}
	
	Else
	{
		Import-Module ActiveDirectory
		If (!(Test-Path -Path 'C:\Program Files\Microsoft Azure Active Directory Connect\AdPrep\AdSyncPrep.psm1'))
		{
			Write-Host -ForegroundColor Red "Unable to import ADSync Prep Module at C:\Program Files\Microsoft Azure Active Directory Connect\ADPrep\ADSyncPrep.psm1."
		}
		Else
		{
			If (!(Get-Module -ListAvailable MSOnline))
			{
				Write-Host -ForegroundColor Red "Unable to complete Device Writeback configuration. Requires MSOnline Module."
			}
			Else
			{
				Import-Module 'C:\Program Files\Microsoft Azure Active Directory Connect\AdPrep\AdSyncPrep.psm1'
				Write-Host "	Device WriteBack"
				Initialize-ADSyncDeviceWriteback -AdConnectorAccount $User –DomainName $Domain
				
				# Windows 10 Azure AD Joined Device WriteBack
				Write-Host "	Windows 10 Device Writeback"
				Initialize-ADSyncDomainJoinedComputerSync -AdConnectorAccount $User -AzureADCredentials $TenantCredential
				Initialize-ADSyncNGCKeysWriteBack -AdConnectorAccount $User
				If ($Forests)
				{
					foreach ($Forest in $Forests)
					{
						$VerifiedDomain = $VerifiedDomains[0]
						$RootDSE = Get-ADRootDSE
						$ConfigurationNamingContext = $RootDSE.configurationNamingContext
						$DirectoryEntry = New-Object System.DirectoryServices.DirectoryEntry
						$DirectoryEntry.Path = "LDAP://CN=Services," + $ConfigurationNamingContext
						$DeviceRegistrationContainer = $DirectoryEntry.Children.Add("CN=Device Registration Configuration", "container")
						$DeviceRegistrationContainer.CommitChanges()
						$ServiceConnectionPoint = $DeviceRegistrationContainer.Children.Add("CNCN=62a0ff2e-97b9-4513-943f-0d221bd30080", "serviceConnectionPoint")
						$ServiceConnectionPoint.Properties["keywords"].Add("azureADName:" + $VerifiedDomain)
						$ServiceConnectionPoint.Properties["keywords"].Add("azureADid:" + $TenantID)
						$ServiceConnectionPoint.CommitChanges()
					}
					Write-Host -ForegroundColor Green "Completed Device writeback permissions configuration."
				}
			}
		}
	}
}

# Enable Exchange Hybrid WriteBack permissions.  If no parameter for ExchangeHybridWriteBackOUs is specified, use the top-level domain.
If ($ExchangeHybridWriteBack)
{
	If (!($ExchangeHybridWriteBackOUs))
		{
			[array]$ExchangeHybridWriteBackOUs = (Get-ADDomain).DistinguishedName
		}
	
	# Check Exchange Schema Versions.  If Exchange Schema Version is 15317 or greater, then the forest has been prepared
	# for Exchange Server 2016 RTM. For purposes of Hybrid Write-Back, the only difference between the two versions is the availability 
	# of the msDS-ExternalDirectoryObjectID schema attribute.
	# For more information on Exchange Server 2016 Schema Versions, see https://technet.microsoft.com/en-us/library/bb125224%28v=exchg.160%29.aspx.
	# For more information on Exchange Server 2013 Schema Versions, see https://blogs.technet.microsoft.com/rmilne/2015/03/17/how-to-check-exchange-schema-and-object-values-in-ad/.
	# For further informatio non Exchange Server Schema versions, see https://eightwone.com/references/schema-versions/.
	
	$Schema = (Get-ADRootDSE).SchemaNamingContext
	$Value = "CN=ms-Exch-Schema-Version-Pt," + $Schema
	$ExchangeSchemaVersion = (Get-ADObject $Value -pr rangeUpper).rangeUpper
	
	foreach ($DN in $ExchangeHybridWriteBackOUs)
	{
		if ($ExchangeSchemaVersion -ge 15317)
		{
			# Exchange Server 2016 or greater
			# User
			$cmd = "dsacls '$DN' /I:S /G '`"$User`":WP;msDS-ExternalDirectoryObjectID;user'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msExchArchiveStatus;user'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msExchBlockedSendersHash;user'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msExchSafeRecipientsHash;user'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msExchSafeSendersHash;user'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msExchUCVoiceMailSettings;user'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msExchUserHoldPolicies;user'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;proxyAddresses;user'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;publicDelegates;user'`n"
			
			# InetOrgPerson
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msDS-ExternalDirectoryObjectID;iNetOrgPerson'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msExchArchiveStatus;iNetOrgPerson'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msExchBlockedSendersHash;iNetOrgPerson'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msExchSafeRecipientsHash;iNetOrgPerson'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msExchSafeSendersHash;iNetOrgPerson'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msExchUCVoiceMailSettings;iNetOrgPerson'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msExchUserHoldPolicies;iNetOrgPerson'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;proxyAddresses;iNetOrgPerson'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;publicDelegates;iNetOrgPerson'`n"
			
			# Group
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;proxyAddresses;group'`n"
						
			# Contact
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;proxyAddresses;contact'`n"
			Invoke-Expression $cmd | Out-Null
		}
		else
		{
			# Exchange Server 2013 or less
			# User
			$cmd = "dsacls '$DN' /I:S /G '`"$User`":WP;msExchArchiveStatus;user'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msExchBlockedSendersHash;user'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msExchSafeRecipientsHash;user'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msExchSafeSendersHash;user'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msExchUCVoiceMailSettings;user'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msExchUserHoldPolicies;user'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;proxyAddresses;user'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;publicDelegates;user'`n"
			
			# InetOrgPerson
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msExchArchiveStatus;iNetOrgPerson'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msExchBlockedSendersHash;iNetOrgPerson'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msExchSafeRecipientsHash;iNetOrgPerson'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msExchSafeSendersHash;iNetOrgPerson'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msExchUCVoiceMailSettings;iNetOrgPerson'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;msExchUserHoldPolicies;iNetOrgPerson'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;proxyAddresses;iNetOrgPerson'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;publicDelegates;iNetOrgPerson'`n"
			
			# Group
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;proxyAddresses;group'`n"
						
			# Contact
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;proxyAddresses;contact'`n"
			Invoke-Expression $cmd | Out-Null
		}
	}
	Write-Host -ForegroundColor Green "Completed Exchange Hybrid writeback permissions configuration."
}

# Enable Group WriteBack permissions. If no OU is specified on the commandline, locate the OU specified in the connector parameters.
If ($GroupWriteBack)
{
	If ($GroupWriteBackOU)
	{
		Import-Module ADSync -Force
		Import-Module ActiveDirectory
		If (Test-Path "AD:\$GroupWriteBackOU")
		{
			Write-Host -ForegroundColor Green "Organizational unit $($GroupWriteBackOU) exists. Granting permissions."
			$cmd = "dsacls '$GroupWriteBackOU' /I:T /G '`"$User`":GA'`n"
			Invoke-Expression $cmd | Out-Null
		}
		Else
		{
			Write-Host -ForegroundColor Yellow "Organizational unit $($GroupWriteBackOU) does not exist. Creating."
			[array]$OuPath = $GroupWriteBackOU.Split(",")
			[array]::Reverse($OuPath)
			$OuDepthCount = 1
			foreach ($obj in $OuPath)
			{
				If ($OuDepthCount -eq 1)
				{
					$Ou = $obj
					# Do nothing else, since Test-Path will return a referral error when querying the very top level
				}
				Else
				{
					Write-Host Current item is $obj
					$Ou = $obj + "," + $Ou
					If (!(Test-Path AD:\$Ou))
					{
						Write-Host -ForegroundColor Green "     Creating OU ($($Ou)) in path."
						New-Item "AD:\$Ou" -ItemType OrganizationalUnit
					}
				}
				$OuDepthCount++
			}
			$cmd = "dsacls '$GroupWriteBackOU' /I:T /G '`"$User`":GA'`n"
			Invoke-Expression $cmd | Out-Null
		}
	}
	Else
	{
		Write-Host -ForegroundColor Yellow "Group WriteBack OU not specified.  Checking AD Connector value."
		If (!($Connector))
		{
			$Connector = Get-ADSyncConnector | ? { $_.ConnectorTypeName -eq "AD" }
		}
		
		$GroupWriteBackOU = $Connector.GlobalParameters["Connector.GroupWriteBackContainerDn"].Value
		If (!($GroupWriteBackOU))
		{
			Write-Host -ForegroundColor Red "No Group WriteBack OU configured on $($Connector.Name)"
		}
		Else
		{
			Write-Host -ForegroundColor Green "Using OU $($GroupWriteBackOU) for Office 365 Groups WriteBack container."
			$cmd = "dsacls '$GroupWriteBackOU' /I:T /G '`"$User`":GA'`n"
			Invoke-Expression $cmd | Out-Null
		}
	}
	Write-Host -ForegroundColor Green "Completed Office 365 Groups writeback permissions configuration."
}

# Enable Replicating Directory Changes and Replicating Directory Changes All permissions for $User
If ($PasswordHashSync)
{
	$RootDSE = Get-ADRootDSE
	$DefaultNamingContext = $RootDSE.defaultNamingContext
	$ConfigurationNamingContext = $RootDSE.configurationNamingContext
	
	$cmd = "dsacls '$DefaultNamingContext' /G '`"$User`":CA;`"Replicating Directory Changes`";'`n"
	$cmd += "dsacls '$DefaultNamingContext' /G '`"$User`":CA;`"Replicating Directory Changes All`";'`n"
	Invoke-Expression $cmd | Out-Null
Write-Host -ForegroundColor Green "Completed Password Hash Sync permissions configuration."
}

# Enable Password WriteBack using ExchangeHybridWriteBackOUs if specified, otherwise use top-level domain.
Remove-Module MSOnline
Import-Module ADSync -Force
If ($PasswordWriteBack)
{
	powershell {
		If (!($ExchangeHybridWriteBackOUs))
		{
			[array]$ExchangeHybridWriteBackOUs = (Get-ADDomain).DistinguishedName
		}
		
		foreach ($DN in $ExchangeHybridWriteBackOUs)
		{
			$cmd = "dsacls '$DN' /I:S /G '`"$User`":CA;`"Reset Password`";user'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":CA;`"Change Password`";user'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;pwdLastSet;user'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;lockoutTime;user'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":CA;`"Reset Password`";iNetOrgPerson'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":CA;`"Change Password`";iNetOrgPerson'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;pwdLastSet;iNetOrgPerson'`n"
			$cmd += "dsacls '$DN' /I:S /G '`"$User`":WP;lockoutTime;iNetOrgPerson'`n"
			Invoke-Expression $cmd | Out-Null
		}
		$AADConnector = Get-ADSyncConnector | ? { $_.ConnectorTypeName -eq "Extensible2" -and $_.SubType -like "*Azure Active Directory*" }
		Set-ADSyncAADPasswordResetConfiguration -Connector $AADConnector.Name -Enable $True
	}
	Write-Host -ForegroundColor Green "Completed Password WriteBack permissions configuration."
}
