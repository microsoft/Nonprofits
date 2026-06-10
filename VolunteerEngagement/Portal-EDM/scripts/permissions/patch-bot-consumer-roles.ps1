# Patch powerpagecomponent content JSON to embed bot consumer web role arrays.
#
# Type-27 (bot consumer): embed adx_botconsumer_adx_webrole in the
# bot consumer content JSON. This keeps Power Pages EDM runtime role checks
# consistent after code-site uploads.

param(
	[string]$OrgUrl,
	[string]$SiteId,
	[string]$SiteName,
	[string]$ProjectConfigPath,
	[string]$YamlDir = (Join-Path $PSScriptRoot '..\..\.powerpages-site\bot-consumers'),
	[string]$WebRoleDir = (Join-Path $PSScriptRoot '..\..\.powerpages-site\web-roles'),
	[string[]]$RoleIds = @(),
	[string[]]$RoleNames = @('Anonymous Users', 'Authenticated Users', 'Administrators'),
	[string]$RoleContentKey = 'adx_botconsumer_adx_webrole'
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

$token = Get-DataverseAccessToken -OrgUrl $OrgUrl
$headers = @{
	Authorization    = "Bearer $token"
	Accept           = 'application/json'
	'OData-Version'  = '4.0'
	'Content-Type'   = 'application/json'
	'If-Match'       = '*'
}
$api = "$OrgUrl/api/data/v9.2"

$roleYamlKeys = @(
	'adx_botconsumer_adx_webrole',
	'botconsumer_adx_webrole',
	'adx_botconsumer_webrole',
	'botconsumer_webrole',
	'adx_webrole',
	'webroles',
	'webrole',
	'roles'
)

function Invoke-DataverseCollection([string]$Uri) {
	$items = @()
	while ($Uri) {
		$response = Invoke-RestMethod -Uri $Uri -Headers $headers -Method GET
		$items += @($response.value)
		$Uri = $response.'@odata.nextLink'
	}
	return $items
}

function Normalize-YamlValue([string]$value) {
	if ($null -eq $value) { return $null }
	$value = $value.Trim()
	if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
		$value = $value.Substring(1, $value.Length - 2)
	}
	if ([string]::IsNullOrWhiteSpace($value)) { return $null }
	return $value
}

function Parse-YamlListValue([string]$value) {
	$value = if ($null -eq $value) { '' } else { $value.Trim() }
	if ([string]::IsNullOrWhiteSpace($value)) { return @() }
	if ($value -eq '[]') { return @() }

	if ($value.StartsWith('[') -and $value.EndsWith(']')) {
		$inner = $value.Substring(1, $value.Length - 2)
		if ([string]::IsNullOrWhiteSpace($inner)) { return @() }
		return @($inner -split ',' | ForEach-Object { Normalize-YamlValue $_ } | Where-Object { $_ })
	}

	$normalized = Normalize-YamlValue $value
	if ($normalized) { return @($normalized) }
	return @()
}

function Parse-ScalarYamlFile([string]$Path) {
	$result = [ordered]@{
		id = $null
		name = $null
		roles = @()
	}
	$inRoles = $false

	foreach ($line in Get-Content -LiteralPath $Path) {
		if ($inRoles) {
			if ($line -match '^\s*-\s*(?<value>.+?)\s*$') {
				$value = Normalize-YamlValue $Matches.value
				if ($value) { $result.roles += $value }
				continue
			}

			if ($line -match '^\S') { $inRoles = $false }
		}

		if ($line -notmatch '^\s*(?<key>[A-Za-z0-9_]+)\s*:\s*(?<value>.*?)\s*$') { continue }

		$key = $Matches.key
		$value = $Matches.value

		if ($roleYamlKeys -contains $key) {
			$parsedRoles = @(Parse-YamlListValue $value)
			if ($parsedRoles.Count -gt 0 -or $value.Trim() -eq '[]') {
				$result.roles += $parsedRoles
				$inRoles = $false
			}
			else {
				$inRoles = $true
			}
			continue
		}

		if ($key -eq 'id') { $result.id = Normalize-YamlValue $value }
		elseif ($key -eq 'name') { $result.name = Normalize-YamlValue $value }
	}

	return [pscustomobject]$result
}

function Get-LocalWebRoles([string]$Path) {
	if (-not (Test-Path -LiteralPath $Path)) { return @() }

	return @(Get-ChildItem -LiteralPath $Path -Filter '*.webrole.yml' | ForEach-Object {
		$role = Parse-ScalarYamlFile $_.FullName
		if ($role.id -and $role.name) {
			[pscustomobject]@{ Id = $role.id; Name = $role.name; Source = $_.FullName }
		}
	})
}

function Resolve-WebRoleIds([string[]]$ExplicitRoleIds, [string[]]$Names) {
	$resolvedIds = @($ExplicitRoleIds | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | ForEach-Object { $_.Trim() })
	$namesToResolve = @($Names | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | ForEach-Object { $_.Trim() } | Select-Object -Unique)

	if ($namesToResolve.Count -eq 0) {
		return @($resolvedIds | Select-Object -Unique)
	}

	$localRoles = @(Get-LocalWebRoles -Path $WebRoleDir)
	foreach ($roleName in $namesToResolve) {
		$matches = @($localRoles | Where-Object { $_.Name -eq $roleName })
		if ($matches.Count -eq 1) {
			$resolvedIds += $matches[0].Id
			continue
		}
		elseif ($matches.Count -gt 1) {
			throw "Multiple local web role YAML files matched role name '$roleName'. Pass -RoleIds explicitly."
		}

		$escapedRoleName = [System.Security.SecurityElement]::Escape($roleName)
		$fetchXml = "<fetch><entity name='mspp_webrole'><attribute name='mspp_webroleid'/><attribute name='mspp_name'/><filter type='and'><condition attribute='mspp_name' operator='eq' value='$escapedRoleName'/><condition attribute='mspp_websiteid' operator='eq' value='$SiteId'/></filter></entity></fetch>"
		$roles = @(Invoke-DataverseCollection -Uri "$api/mspp_webroles?fetchXml=$([System.Uri]::EscapeDataString($fetchXml))")
		if ($roles.Count -eq 0) {
			throw "Could not resolve web role '$roleName' from local YAML or Dataverse. Run npm run sync or pass -RoleIds."
		}
		if ($roles.Count -gt 1) {
			throw "Multiple Dataverse web roles named '$roleName' were found. Run npm run sync or pass -RoleIds."
		}

		$resolvedIds += $roles[0].mspp_webroleid
	}

	return @($resolvedIds | Select-Object -Unique)
}

function Resolve-RoleReferences([string[]]$References) {
	$ids = @()
	$names = @()
	foreach ($reference in @($References)) {
		if ([string]::IsNullOrWhiteSpace($reference)) { continue }
		$value = $reference.Trim()
		if ($value -match '^[0-9a-fA-F-]{36}$') { $ids += $value }
		else { $names += $value }
	}

	return @(Resolve-WebRoleIds -ExplicitRoleIds $ids -Names $names)
}

function Get-LocalBotConsumerTargets([string]$Path) {
	if (-not (Test-Path -LiteralPath $Path)) { return @() }

	return @(Get-ChildItem -LiteralPath $Path -Filter '*.yml' | ForEach-Object {
		$bot = Parse-ScalarYamlFile $_.FullName
		[pscustomobject]@{
			Id = $bot.id
			Name = if ($bot.name) { $bot.name } else { $_.BaseName }
			Roles = @($bot.roles)
			Source = $_.FullName
			Component = $null
		}
	})
}

function Get-SiteBotConsumerTargets() {
	$fetchXml = "<fetch><entity name='powerpagecomponent'><attribute name='powerpagecomponentid'/><attribute name='name'/><attribute name='content'/><attribute name='powerpagecomponenttype'/><filter><condition attribute='powerpagesiteid' operator='eq' value='$SiteId'/><condition attribute='powerpagecomponenttype' operator='eq' value='27'/></filter></entity></fetch>"
	$components = @(Invoke-DataverseCollection -Uri "$api/powerpagecomponents?fetchXml=$([System.Uri]::EscapeDataString($fetchXml))")

	return @($components | ForEach-Object {
		[pscustomobject]@{
			Id = $_.powerpagecomponentid
			Name = $_.name
			Roles = @()
			Source = 'Dataverse site query'
			Component = $_
		}
	})
}

function Get-ComponentById([string]$ComponentId) {
	$component = Invoke-RestMethod -Uri "$api/powerpagecomponents($ComponentId)?`$select=powerpagecomponentid,name,content,powerpagecomponenttype,_powerpagesiteid_value" -Headers $headers -Method GET

	$componentSiteId = ([string]$component.'_powerpagesiteid_value').Trim('{}')
	$expectedSiteId = ([string]$SiteId).Trim('{}')

	if ($component.powerpagecomponenttype -ne 27) {
		throw "powerpagecomponent $ComponentId is type '$($component.powerpagecomponenttype)', expected '27'."
	}

	if ($componentSiteId -ne $expectedSiteId) {
		throw "powerpagecomponent $ComponentId belongs to site '$componentSiteId', expected '$expectedSiteId'."
	}

	return $component
}

function ConvertFrom-ComponentContent([object]$Component) {
	if ([string]::IsNullOrWhiteSpace([string]$Component.content)) { return [ordered]@{} }

	try {
		$content = ([string]$Component.content) | ConvertFrom-Json -AsHashtable
	}
	catch {
		throw "Could not parse bot consumer content JSON for $($Component.powerpagecomponentid): $($_.Exception.Message)"
	}

	if ($null -eq $content) { return [ordered]@{} }
	if ($content -isnot [System.Collections.IDictionary]) {
		throw "Bot consumer content JSON for $($Component.powerpagecomponentid) is not an object."
	}

	return $content
}

function Get-ContentRoleValues([System.Collections.IDictionary]$Content) {
	if (-not $Content.Contains($RoleContentKey)) { return @() }
	return @($Content[$RoleContentKey] | Where-Object { -not [string]::IsNullOrWhiteSpace([string]$_) } | ForEach-Object { ([string]$_).Trim() })
}

$targets = @(Get-LocalBotConsumerTargets -Path $YamlDir)
if ($targets.Count -gt 0) {
	Write-Host "Processing $($targets.Count) local bot consumer YAML file(s)..."

	foreach ($target in $targets) {
		if ([string]::IsNullOrWhiteSpace([string]$target.Id)) { continue }
		try {
			$target.Component = Get-ComponentById -ComponentId $target.Id
		}
		catch {
			Write-Warning "component $($target.Id) not found for $($target.Source)"
		}
	}
}
else {
	Write-Host "No local bot consumer YAML files found in $YamlDir. Querying site bot consumers from Dataverse..."
	$targets = @(Get-SiteBotConsumerTargets)
}

if ($targets.Count -eq 0) {
	Write-Host "No bot consumers found for site $SiteId. Nothing to patch."
	return
}

$defaultRoleIds = @(Resolve-WebRoleIds -ExplicitRoleIds $RoleIds -Names $RoleNames)
if ($defaultRoleIds.Count -eq 0) {
	throw 'No default bot consumer web roles resolved. Pass -RoleIds or -RoleNames.'
}

$patched = 0; $skipped = 0; $failed = 0
foreach ($target in $targets) {
	if ([string]::IsNullOrWhiteSpace([string]$target.Id)) {
		if (-not [string]::IsNullOrWhiteSpace([string]$target.Name)) {
			try {
				$escapedName = [System.Security.SecurityElement]::Escape($target.Name)
				$fetchXml = "<fetch><entity name='powerpagecomponent'><attribute name='powerpagecomponentid'/><attribute name='name'/><attribute name='content'/><attribute name='powerpagecomponenttype'/><filter><condition attribute='powerpagesiteid' operator='eq' value='$SiteId'/><condition attribute='powerpagecomponenttype' operator='eq' value='27'/><condition attribute='name' operator='eq' value='$escapedName'/></filter></entity></fetch>"
				$matches = @(Invoke-DataverseCollection -Uri "$api/powerpagecomponents?fetchXml=$([System.Uri]::EscapeDataString($fetchXml))")

				if ($matches.Count -eq 1) {
					$target.Id = $matches[0].powerpagecomponentid
					$target.Component = $matches[0]
				}
				elseif ($matches.Count -eq 0) {
					Write-Warning "no id in $($target.Source) and no bot consumer matched name '$($target.Name)'. Add an 'id' to the YAML."
					$failed++
					continue
				}
				else {
					Write-Warning "no id in $($target.Source) and multiple bot consumers matched name '$($target.Name)'. Add an 'id' to the YAML."
					$failed++
					continue
				}
			}
			catch {
				Write-Warning "no id in $($target.Source) and lookup by name failed: $($_.Exception.Message)"
				$failed++
				continue
			}
		}
		else {
			Write-Warning "no id in $($target.Source)"
			$failed++
			continue
		}
	}

	if (-not $target.Component) {
		$failed++
		continue
	}

	try {
		$targetRoleIds = if (@($target.Roles).Count -gt 0) { @(Resolve-RoleReferences -References $target.Roles) } else { @($defaultRoleIds) }
		if ($targetRoleIds.Count -eq 0) { throw "No web roles resolved for bot consumer $($target.Id)." }

		$content = ConvertFrom-ComponentContent -Component $target.Component
		$existingRoles = @(Get-ContentRoleValues -Content $content)
		$targetRoleIds = @($targetRoleIds | Select-Object -Unique)

		if ($existingRoles.Count -eq $targetRoleIds.Count -and -not (Compare-Object -ReferenceObject $existingRoles -DifferenceObject $targetRoleIds)) {
			Write-Host ("SKIP {0} already has {1} role(s)" -f $target.Name, $targetRoleIds.Count)
			$skipped++
			continue
		}

		$content[$RoleContentKey] = @($targetRoleIds)
		$json = $content | ConvertTo-Json -Depth 20
		$body = @{ content = $json } | ConvertTo-Json -Depth 5
		Invoke-RestMethod -Uri "$api/powerpagecomponents($($target.Id))" -Headers $headers -Method PATCH -Body $body | Out-Null
		Write-Host ("OK  {0} -> {1} role(s)" -f $target.Name, $targetRoleIds.Count)
		$patched++
	}
	catch {
		Write-Warning "PATCH failed for $($target.Name) ($($target.Id)): $($_.Exception.Message)"
		$failed++
	}
}

Write-Host ""
Write-Host "Bot consumers - Patched: $patched  Skipped: $skipped  Failed: $failed"
if ($failed -gt 0) {
	throw "Failed to patch $failed bot consumer component(s)."
}