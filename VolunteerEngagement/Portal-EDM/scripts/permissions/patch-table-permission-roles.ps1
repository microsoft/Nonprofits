# Patch powerpagecomponent content JSON to embed web role arrays.
#
# Type-18 (table permission): embed entitypermission_webrole from the
# tablepermission.yml source files.
#
# Workaround for pac CLI 2.6.4 bug: pac uploads intersect rows but does NOT
# write the role arrays into the powerpagecomponent.content JSON. The EDM v2
# runtime reads roles from that JSON, so components end up with zero roles
# causing 403s.

param(
	[string]$OrgUrl,
	[string]$SiteId,
	[string]$SiteName,
	[string]$ProjectConfigPath,
	[string]$YamlDir = (Join-Path $PSScriptRoot '..\..\.powerpages-site\table-permissions')
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

function Parse-Yaml([string]$path) {
	$lines = Get-Content -LiteralPath $path
	$result = @{ roles = @() }
	$inRoles = $false
	foreach ($l in $lines) {
		if ($l -match '^(adx_)?entitypermission_webrole:\s*$') { $inRoles = $true; continue }
		if ($inRoles) {
			if ($l -match '^-\s*(\S+)\s*$') { $result.roles += $Matches[1]; continue }
			else { $inRoles = $false }
		}
		if ($l -match '^id:\s*(\S+)\s*$')                                 { $result.id = $Matches[1] }
		elseif ($l -match '^entitylogicalname:\s*(\S+)\s*$')               { $result.entitylogicalname = $Matches[1] }
		elseif ($l -match '^entityname:\s*(.+?)\s*$')                      { $result.entityname = $Matches[1] }
		elseif ($l -match '^scope:\s*(\S+)\s*$')                           { $result.scope = [int]$Matches[1] }
		elseif ($l -match '^read:\s*(true|false)\s*$')                     { $result.read = [bool]::Parse($Matches[1]) }
		elseif ($l -match '^write:\s*(true|false)\s*$')                    { $result.write = [bool]::Parse($Matches[1]) }
		elseif ($l -match '^create:\s*(true|false)\s*$')                   { $result.create = [bool]::Parse($Matches[1]) }
		elseif ($l -match '^delete:\s*(true|false)\s*$')                   { $result.delete = [bool]::Parse($Matches[1]) }
		elseif ($l -match '^append:\s*(true|false)\s*$')                   { $result.append = [bool]::Parse($Matches[1]) }
		elseif ($l -match '^appendto:\s*(true|false)\s*$')                 { $result.appendto = [bool]::Parse($Matches[1]) }
		elseif ($l -match '^parententitypermission:\s*(\S+)\s*$')          { $result.parententitypermission = $Matches[1] }
		elseif ($l -match '^contactrelationship:\s*(\S+)\s*$')             { $result.contactrelationship = $Matches[1] }
		elseif ($l -match '^accountrelationship:\s*(\S+)\s*$')             { $result.accountrelationship = $Matches[1] }
		elseif ($l -match '^parentrelationship:\s*(\S+)\s*$')              { $result.parentrelationship = $Matches[1] }
	}
	return [pscustomobject]$result
}

if (-not (Test-Path -LiteralPath $YamlDir)) {
	throw "Table permission YAML folder not found: $YamlDir"
}

$files = @(Get-ChildItem -LiteralPath $YamlDir -Filter *.tablepermission.yml)
if ($files.Count -eq 0) {
	throw "No table permission YAML files found in $YamlDir"
}
Write-Host "Processing $($files.Count) table permissions..."

$patched = 0; $skipped = 0; $failed = 0
foreach ($f in $files) {
	$y = Parse-Yaml $f.FullName
	if (-not $y.id) { Write-Warning "no id in $($f.Name)"; $skipped++; continue }

	try {
		$comp = Invoke-RestMethod -Uri "$api/powerpagecomponents($($y.id))" -Headers $headers -Method GET
	} catch {
		Write-Warning "component $($y.id) not found for $($f.Name)"
		$failed++; continue
	}

	# Build new ordered content object.
	# N:N keys in powerpagecomponent content JSON MUST use adx_ prefix —
	# the EDM v2 runtime reads roles from these keys.
	$new = [ordered]@{
		adx_entitypermission_webrole = @($y.roles)
		append                   = [bool]$y.append
		appendto                 = [bool]$y.appendto
		create                   = [bool]$y.create
		delete                   = [bool]$y.delete
		entitylogicalname        = $y.entitylogicalname
		entityname               = $y.entityname
		parententitypermission   = if ($y.parententitypermission) { $y.parententitypermission } else { $null }
		read                     = [bool]$y.read
		scope                    = [int]$y.scope
		websiteid                = $SiteId
		write                    = [bool]$y.write
	}
	if ($y.contactrelationship) { $new['contactrelationship'] = $y.contactrelationship }
	if ($y.accountrelationship) { $new['accountrelationship'] = $y.accountrelationship }
	if ($y.parentrelationship)  { $new['parentrelationship']  = $y.parentrelationship }

	$json = $new | ConvertTo-Json -Depth 5

	$body = @{ content = $json } | ConvertTo-Json -Depth 5
	try {
		Invoke-RestMethod -Uri "$api/powerpagecomponents($($y.id))" -Headers $headers -Method PATCH -Body $body | Out-Null
		Write-Host ("OK  {0} -> {1} role(s)" -f $f.BaseName, $y.roles.Count)
		$patched++
	} catch {
		Write-Warning "PATCH failed for $($f.Name): $($_.Exception.Message)"
		$failed++
	}
}

Write-Host ""
Write-Host "Table permissions - Patched: $patched  Skipped: $skipped  Failed: $failed"
if ($failed -gt 0) {
	throw "Failed to patch $failed table permission component(s)."
}
