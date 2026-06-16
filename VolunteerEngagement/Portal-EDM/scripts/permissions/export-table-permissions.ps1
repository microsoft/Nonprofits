# Exports mspp_entitypermissions for the site into .powerpages-site/table-permissions/*.tablepermission.yml.
# EDM v2 reads role arrays from the adx_entitypermission_webrole key in powerpagecomponent content.
param(
	[string]$OrgUrl,
	[string]$SiteId,
	[string]$SiteName,
	[string]$ProjectConfigPath
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
$h = @{ Authorization = "Bearer $token"; Accept = "application/json"; "OData-Version" = "4.0" }

function Invoke-DataverseCollection([string]$Uri) {
	$items = @()
	while ($Uri) {
		$response = Invoke-RestMethod -Uri $Uri -Headers $h
		$items += @($response.value)
		$Uri = $response.'@odata.nextLink'
	}
	return $items
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$outDir = Join-Path $repoRoot ".powerpages-site/table-permissions"
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

$perms = @(Invoke-DataverseCollection -Uri "$OrgUrl/api/data/v9.2/mspp_entitypermissions?`$filter=_mspp_websiteid_value eq $SiteId")
if ($perms.Count -eq 0) {
	throw "No table permissions found for site $SiteId in $OrgUrl. Check the selected PAC environment and website record ID."
}
Write-Host "Fetched $($perms.Count) permissions from site $SiteId"

$rolesByPerm = @{}

# EDM v2 reads table-permission roles from the powerpagecomponent content JSON.
$componentFetchXml = "<fetch><entity name='powerpagecomponent'><attribute name='powerpagecomponentid'/><attribute name='content'/><filter><condition attribute='powerpagesiteid' operator='eq' value='$SiteId'/><condition attribute='powerpagecomponenttype' operator='eq' value='18'/></filter></entity></fetch>"
$components = @(Invoke-DataverseCollection -Uri "$OrgUrl/api/data/v9.2/powerpagecomponents?fetchXml=$([System.Uri]::EscapeDataString($componentFetchXml))")
foreach ($component in $components) {
	try {
		$content = $component.content | ConvertFrom-Json
	}
	catch {
		Write-Warning "Could not parse component content for $($component.powerpagecomponentid): $($_.Exception.Message)"
		continue
	}

	$roles = @()
	foreach ($roleProperty in @('adx_entitypermission_webrole', 'entitypermission_webrole')) {
		if ($content.PSObject.Properties.Name -contains $roleProperty) {
			$roles = @($content.PSObject.Properties[$roleProperty].Value)
			break
		}
	}

	if ($roles.Count -gt 0) {
		$rolesByPerm[$component.powerpagecomponentid] = @($roles)
	}
}

# Older exports may still have intersect rows; use them as a fallback.
$intersect = @(Invoke-DataverseCollection -Uri "$OrgUrl/api/data/v9.2/mspp_entitypermission_webroleset")
foreach ($row in $intersect) {
	if (-not $rolesByPerm.ContainsKey($row.mspp_entitypermissionid)) {
		$rolesByPerm[$row.mspp_entitypermissionid] = @()
	}
	$rolesByPerm[$row.mspp_entitypermissionid] = @($rolesByPerm[$row.mspp_entitypermissionid]) + $row.mspp_webroleid
}

$roleBindingCount = ($rolesByPerm.Values | ForEach-Object { @($_).Count } | Measure-Object -Sum).Sum
Write-Host "Fetched $roleBindingCount role binding(s) from component content and $($intersect.Count) intersect row(s) across all permissions"
if ($roleBindingCount -eq 0) {
	throw 'No table permission role bindings found in powerpagecomponent content or intersect rows. Refusing to export role-less table permissions.'
}

function Convert-ToFileName([string]$s) {
	foreach ($c in ([System.IO.Path]::GetInvalidFileNameChars() + @('(', ')', '&', ','))) {
		$s = $s.Replace("$c", '-')
	}
	$s = $s -replace '\s+', '-'
	$s = $s -replace '-+', '-'
	$s.Trim('-').ToLowerInvariant()
}

function ConvertTo-YamlBool($v) {
	if ($null -eq $v) { return 'false' }
	return ([bool]$v).ToString().ToLowerInvariant()
}

# Remove existing yml files so renames/deletes propagate
Get-ChildItem -LiteralPath $outDir -Filter '*.tablepermission.yml' -ErrorAction SilentlyContinue | Remove-Item -Force

foreach ($p in $perms) {
	$roleIds = @()
	if ($rolesByPerm.ContainsKey($p.mspp_entitypermissionid)) {
		$roleIds = @($rolesByPerm[$p.mspp_entitypermissionid])
	}

	$lines = New-Object System.Collections.Generic.List[string]
	$lines.Add("append: $(ConvertTo-YamlBool $p.mspp_append)")
	$lines.Add("appendto: $(ConvertTo-YamlBool $p.mspp_appendto)")
	$lines.Add("create: $(ConvertTo-YamlBool $p.mspp_create)")
	$lines.Add("delete: $(ConvertTo-YamlBool $p.mspp_delete)")
	$lines.Add("entitylogicalname: $($p.mspp_entitylogicalname)")
	$lines.Add("entityname: $($p.mspp_entityname)")
	if ($roleIds.Count -gt 0) {
		$lines.Add("adx_entitypermission_webrole:")
		foreach ($r in $roleIds) { $lines.Add("- $r") }
	}
	else {
		$lines.Add("adx_entitypermission_webrole: []")
	}
	$lines.Add("id: $($p.mspp_entitypermissionid)")
	$lines.Add("parententitypermission: $($p._mspp_parententitypermission_value)")
	if ($p.mspp_contactrelationship) { $lines.Add("contactrelationship: $($p.mspp_contactrelationship)") }
	if ($p.mspp_accountrelationship) { $lines.Add("accountrelationship: $($p.mspp_accountrelationship)") }
	if ($p.mspp_parentrelationship) { $lines.Add("parentrelationship: $($p.mspp_parentrelationship)") }
	$lines.Add("read: $(ConvertTo-YamlBool $p.mspp_read)")
	$lines.Add("scope: $($p.mspp_scope)")
	$lines.Add("write: $(ConvertTo-YamlBool $p.mspp_write)")

	$name = Convert-ToFileName $p.mspp_entityname
	$file = Join-Path $outDir "$name.tablepermission.yml"
	[System.IO.File]::WriteAllText($file, ($lines -join "`n") + "`n")
	Write-Host "  wrote $name.tablepermission.yml ($($roleIds.Count) roles)"
}

Write-Host ""
Write-Host "Done. $($perms.Count) files in $outDir"
