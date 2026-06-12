# Assigns Power Pages site-agent web roles for Portal-EDM / Enhanced Data Model sites.
#
# The site-agent runtime reads Bot Consumer web roles from the powerpagecomponent.content
# JSON key adx_botconsumer_adx_webrole. Dataverse relationship/intersect rows alone are
# not enough for the runtime widget to render. By default, this script assigns the
# built-in Anonymous Users and Authenticated Users roles; pass -RoleNames or -RoleIds
# to choose a different set explicitly. The script ends with a Dataverse readback summary.

param(
	[string]$OrgUrl,
	[string]$SiteId,
	[string]$SiteName,
	[string]$ProjectConfigPath,
	[string]$BotConsumerId,
	[string]$BotSchemaName,
	[string[]]$RoleNames = @(),
	[string[]]$RoleIds = @(),
	[switch]$ReplaceExistingRoles,
	[switch]$EnsureSiteAgentEnabled
)

$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot '..\shared\portal-config.ps1')

$SiteId = Resolve-PowerPagesWebsiteRecordId -WebsiteRecordId $SiteId -SiteName $SiteName -ProjectConfigPath $ProjectConfigPath

if (-not $OrgUrl) {
	$orgInfo = Get-PacOrgInfo
	$OrgUrl = $orgInfo.OrgUrl.TrimEnd('/')
	Write-Host "Using PAC CLI environment: $OrgUrl"
}
else {
	$OrgUrl = $OrgUrl.TrimEnd('/')
}

if (-not $PSBoundParameters.ContainsKey('RoleNames') -and -not $PSBoundParameters.ContainsKey('RoleIds')) {
	$RoleNames = @('Anonymous Users', 'Authenticated Users')
}

function Get-DataverseAccessTokenWithFallback([string]$ResourceUrl) {
	$azCommand = Get-Command az -ErrorAction SilentlyContinue
	if ($azCommand) {
		$tokenOutput = az account get-access-token --resource $ResourceUrl --query accessToken -o tsv 2>&1
		if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace([string]$tokenOutput)) {
			return ([string]$tokenOutput).Trim()
		}

		Write-Host "Azure CLI token acquisition failed; trying Az PowerShell. $($tokenOutput | Out-String)" -ForegroundColor DarkYellow
	}

	try {
		return Get-DataverseAccessToken -OrgUrl $ResourceUrl
	}
	catch {
		throw "Could not get a Dataverse access token for $ResourceUrl. Sign in with az login or Connect-AzAccount for the target tenant. $($_.Exception.Message)"
	}
}

$token = Get-DataverseAccessTokenWithFallback -ResourceUrl $OrgUrl
$headers = @{
	Authorization    = "Bearer $token"
	Accept           = 'application/json'
	'OData-Version'  = '4.0'
	'Content-Type'   = 'application/json'
	'If-Match'       = '*'
}
$api = "$OrgUrl/api/data/v9.2"

function Invoke-DataverseCollection([string]$Uri) {
	$items = @()
	while ($Uri) {
		$response = Invoke-RestMethod -Uri $Uri -Headers $headers -Method GET
		$items += @($response.value)
		$Uri = $response.'@odata.nextLink'
	}
	return $items
}

function ConvertFrom-ComponentContent($component) {
	if ([string]::IsNullOrWhiteSpace([string]$component.content)) {
		return [pscustomobject]@{}
	}

	try {
		return $component.content | ConvertFrom-Json
	}
	catch {
		throw "Component '$($component.name)' ($($component.powerpagecomponentid)) has invalid content JSON. $($_.Exception.Message)"
	}
}

function Get-BotConsumerRoleIds($botConsumer) {
	$content = ConvertFrom-ComponentContent $botConsumer
	if ($content.PSObject.Properties.Name -contains 'adx_botconsumer_adx_webrole') {
		return @($content.adx_botconsumer_adx_webrole | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) } | Select-Object -Unique)
	}
	if ($content.PSObject.Properties.Name -contains 'botconsumer_webrole') {
		return @($content.botconsumer_webrole | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) } | Select-Object -Unique)
	}

	return @()
}

function Get-LocalWebRoleIdsByName {
	$webRoleDir = Join-Path $PSScriptRoot '..\..\.powerpages-site\web-roles'
	$result = @{}
	if (-not (Test-Path -LiteralPath $webRoleDir)) {
		return $result
	}

	foreach ($file in Get-ChildItem -LiteralPath $webRoleDir -Filter '*.webrole.yml' -File) {
		$roleName = $null
		$roleId = $null
		foreach ($line in Get-Content -LiteralPath $file.FullName) {
			$nameResult = [regex]::Match($line, '^name:\s*(.+?)\s*$')
			if ($nameResult.Success) {
				$roleName = $nameResult.Groups[1].Value.Trim()
				continue
			}

			$idResult = [regex]::Match($line, '^id:\s*(\S+)\s*$')
			if ($idResult.Success) { $roleId = $idResult.Groups[1].Value.Trim() }
		}

		if (-not [string]::IsNullOrWhiteSpace($roleName) -and -not [string]::IsNullOrWhiteSpace($roleId)) {
			if (-not $result.ContainsKey($roleName)) { $result[$roleName] = @() }
			$result[$roleName] = @($result[$roleName]) + $roleId
		}
	}

	return $result
}

function Get-RoleComponents {
	$fetchXml = "<fetch><entity name='powerpagecomponent'><attribute name='powerpagecomponentid'/><attribute name='name'/><attribute name='powerpagecomponenttype'/><attribute name='content'/><filter><condition attribute='powerpagesiteid' operator='eq' value='$SiteId'/><condition attribute='powerpagecomponenttype' operator='eq' value='11'/></filter><order attribute='name'/></entity></fetch>"
	return @(Invoke-DataverseCollection -Uri "$api/powerpagecomponents?fetchXml=$([System.Uri]::EscapeDataString($fetchXml))")
}

function Resolve-RoleIds([object[]]$roleComponents, [string[]]$names, [string[]]$ids) {
	$resolved = New-Object System.Collections.Generic.List[string]
	$localRoleIdsByName = Get-LocalWebRoleIdsByName

	foreach ($id in @($ids)) {
		if ([string]::IsNullOrWhiteSpace($id)) { continue }
		$roleIdResults = @($roleComponents | Where-Object { $_.powerpagecomponentid -eq $id.Trim() })
		if ($roleIdResults.Count -eq 0) {
			throw "Web role component ID '$id' was not found for site $SiteId."
		}
		$resolved.Add($roleIdResults[0].powerpagecomponentid)
	}

	foreach ($name in @($names)) {
		if ([string]::IsNullOrWhiteSpace($name)) { continue }
		$roleNameResults = @($roleComponents | Where-Object { $_.name -eq $name.Trim() })
		if ($roleNameResults.Count -eq 0) {
			$available = ($roleComponents | ForEach-Object { "'$($_.name)' ($($_.powerpagecomponentid))" }) -join ', '
			if ([string]::IsNullOrWhiteSpace($available)) { $available = '<none>' }
			throw "Web role '$name' was not found for site $SiteId. Available roles: $available"
		}
		if ($roleNameResults.Count -gt 1) {
			if ($localRoleIdsByName.ContainsKey($name.Trim())) {
				$localRoleResults = @($roleNameResults | Where-Object { $localRoleIdsByName[$name.Trim()] -contains $_.powerpagecomponentid })
				if ($localRoleResults.Count -eq 1) {
					$resolved.Add($localRoleResults[0].powerpagecomponentid)
					continue
				}
			}

			$systemRoleResults = @()
			foreach ($roleCandidate in $roleNameResults) {
				$content = ConvertFrom-ComponentContent $roleCandidate
				if ($name.Trim() -eq 'Anonymous Users' -and $content.anonymoususersrole -eq $true) {
					$systemRoleResults += $roleCandidate
				}
				elseif ($name.Trim() -eq 'Authenticated Users' -and $content.authenticatedusersrole -eq $true) {
					$systemRoleResults += $roleCandidate
				}
			}

			if ($systemRoleResults.Count -eq 1) {
				$resolved.Add($systemRoleResults[0].powerpagecomponentid)
				continue
			}

			$duplicateRoleIds = ($roleNameResults | ForEach-Object { $_.powerpagecomponentid }) -join ', '
			throw "Multiple web roles named '$name' were found for site ${SiteId}: $duplicateRoleIds. Re-run with -RoleIds to choose exact roles."
		}
		$resolved.Add($roleNameResults[0].powerpagecomponentid)
	}

	return @($resolved | Select-Object -Unique)
}

function Get-BotConsumerComponent {
	if (-not [string]::IsNullOrWhiteSpace($BotConsumerId)) {
		return Invoke-RestMethod -Uri "$api/powerpagecomponents($($BotConsumerId.Trim()))?`$select=powerpagecomponentid,name,powerpagecomponenttype,content" -Headers $headers -Method GET
	}

	$fetchXml = "<fetch><entity name='powerpagecomponent'><attribute name='powerpagecomponentid'/><attribute name='name'/><attribute name='powerpagecomponenttype'/><attribute name='content'/><filter><condition attribute='powerpagesiteid' operator='eq' value='$SiteId'/><condition attribute='powerpagecomponenttype' operator='eq' value='27'/></filter></entity></fetch>"
	$components = @(Invoke-DataverseCollection -Uri "$api/powerpagecomponents?fetchXml=$([System.Uri]::EscapeDataString($fetchXml))")

	if (-not [string]::IsNullOrWhiteSpace($BotSchemaName)) {
		$components = @($components | Where-Object {
			$content = ConvertFrom-ComponentContent $_
			$content.botschemaname -eq $BotSchemaName.Trim()
		})
	}

	if ($components.Count -eq 0) {
		$schemaHint = if ($BotSchemaName) { " with bot schema '$BotSchemaName'" } else { '' }
		throw "No Bot Consumer component found for site $SiteId$schemaHint. Create or add the site agent first."
	}
	if ($components.Count -gt 1) {
		$available = ($components | ForEach-Object {
			$content = ConvertFrom-ComponentContent $_
			"'$($_.name)' ($($_.powerpagecomponentid), schema=$($content.botschemaname))"
		}) -join ', '
		throw "Multiple Bot Consumer components were found for site ${SiteId}: $available. Re-run with -BotConsumerId or -BotSchemaName."
	}

	return $components[0]
}

function Set-SiteAgentEnabledSetting {
	$settingName = 'SiteCopilot/EnableNativeControlPVABots'
	$encodedFilter = [System.Uri]::EscapeDataString("mspp_name eq '$settingName' and _mspp_websiteid_value eq $SiteId")
	$existing = @(Invoke-DataverseCollection -Uri "$api/mspp_sitesettings?`$select=mspp_sitesettingid,mspp_name,mspp_value,_mspp_websiteid_value&`$filter=$encodedFilter")

	if ($existing.Count -eq 0) {
		$body = @{
			mspp_name = $settingName
			mspp_value = 'true'
			'mspp_websiteid@odata.bind' = "/mspp_websites($SiteId)"
		} | ConvertTo-Json -Depth 5
		Invoke-RestMethod -Uri "$api/mspp_sitesettings" -Headers $headers -Method POST -Body $body | Out-Null
		Write-Host "Created site setting $settingName=true"
		return
	}

	foreach ($setting in $existing) {
		if ($setting.mspp_value -ne 'true') {
			$body = @{ mspp_value = 'true' } | ConvertTo-Json -Depth 5
			Invoke-RestMethod -Uri "$api/mspp_sitesettings($($setting.mspp_sitesettingid))" -Headers $headers -Method PATCH -Body $body | Out-Null
			Write-Host "Updated site setting $settingName=true"
		}
		else {
			Write-Host "Site setting $settingName is already true"
		}
	}
}

function Get-SiteAgentEnabledSetting {
	$settingName = 'SiteCopilot/EnableNativeControlPVABots'
	$encodedFilter = [System.Uri]::EscapeDataString("mspp_name eq '$settingName' and _mspp_websiteid_value eq $SiteId")
	return @(Invoke-DataverseCollection -Uri "$api/mspp_sitesettings?`$select=mspp_sitesettingid,mspp_name,mspp_value,_mspp_websiteid_value&`$filter=$encodedFilter")
}

$roleComponents = @(Get-RoleComponents)
$resolvedRoleIds = @(Resolve-RoleIds -roleComponents $roleComponents -names $RoleNames -ids $RoleIds)
if ($resolvedRoleIds.Count -eq 0) {
	throw 'No web roles were resolved. Pass -RoleNames or -RoleIds.'
}

$botConsumer = Get-BotConsumerComponent
$content = ConvertFrom-ComponentContent $botConsumer

$existingRoleIds = @()
if ($content.PSObject.Properties.Name -contains 'adx_botconsumer_adx_webrole') {
	$existingRoleIds = @($content.adx_botconsumer_adx_webrole)
}
elseif ($content.PSObject.Properties.Name -contains 'botconsumer_webrole') {
	$existingRoleIds = @($content.botconsumer_webrole)
}

$newRoleIds = if ($ReplaceExistingRoles) {
	@($resolvedRoleIds | Select-Object -Unique)
}
else {
	@($existingRoleIds + $resolvedRoleIds | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) } | Select-Object -Unique)
}

$content | Add-Member -NotePropertyName 'adx_botconsumer_adx_webrole' -NotePropertyValue $newRoleIds -Force

$body = @{ content = ($content | ConvertTo-Json -Depth 20 -Compress) } | ConvertTo-Json -Depth 20
Invoke-RestMethod -Uri "$api/powerpagecomponents($($botConsumer.powerpagecomponentid))" -Headers $headers -Method PATCH -Body $body | Out-Null

if ($EnsureSiteAgentEnabled) {
	Set-SiteAgentEnabledSetting
}

$roleNamesById = @{}
foreach ($role in $roleComponents) { $roleNamesById[$role.powerpagecomponentid] = $role.name }

$readbackBotConsumer = Get-BotConsumerComponent
$readbackRoleIds = @(Get-BotConsumerRoleIds -botConsumer $readbackBotConsumer)
$readbackRoleNames = @($readbackRoleIds | ForEach-Object { if ($roleNamesById.ContainsKey($_)) { $roleNamesById[$_] } else { '<unknown>' } })
$siteAgentSettings = @(Get-SiteAgentEnabledSetting)

Write-Host "Patched Bot Consumer '$($botConsumer.name)' ($($botConsumer.powerpagecomponentid))"
Write-Host "Roles:"
foreach ($roleId in $readbackRoleIds) {
	$roleName = if ($roleNamesById.ContainsKey($roleId)) { $roleNamesById[$roleId] } else { '<unknown>' }
	Write-Host "  - $roleName ($roleId)"
}

$summary = [ordered]@{
	siteId = $SiteId
	botConsumerId = $readbackBotConsumer.powerpagecomponentid
	botConsumerName = $readbackBotConsumer.name
	roleIds = $readbackRoleIds
	roleNames = $readbackRoleNames
	siteAgentEnabledSetting = @($siteAgentSettings | ForEach-Object { [ordered]@{ id = $_.mspp_sitesettingid; name = $_.mspp_name; value = $_.mspp_value } })
}
Write-Host 'Readback summary:'
Write-Host ($summary | ConvertTo-Json -Depth 10)