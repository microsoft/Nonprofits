# Adds Volunteer Engagement / Volunteer Management knowledge sources to a Portal-EDM site agent.
#
# This script targets Power Pages Enhanced Data Model sites only. It creates or updates
# a site-specific Dataverse dvtablesearch, links it to the EDM powerpagesite row and the
# site-agent default GPT component, and keeps the Anonymous Users guard in place for
# non-public VolunteerPortal knowledge sources. The script ends with a Dataverse readback
# summary showing roles, GPT-linked table searches, and active source entities.

[CmdletBinding(SupportsShouldProcess = $true)]
param(
	[string]$OrgUrl,
	[string]$SiteId,
	[string]$SiteName,
	[string]$ProjectConfigPath,
	[string]$BotConsumerId,
	[string]$BotSchemaName,
	[string]$GptComponentId,
	[string]$TableSearchName,
	[ValidateSet('Public', 'VolunteerPortal')]
	[string]$Profile = 'Public',
	[string[]]$EntityLogicalNames = @(),
	[switch]$ReplaceEntities,
	[switch]$IgnoreMissingEntities,
	[switch]$IncludeVolunteerManagementModelAppSearch,
	[switch]$RequireVolunteerManagementModelAppSearch,
	[switch]$AllowAnonymousAccessToNonPublicKnowledgeSources,
	[string]$VolunteerManagementAppUniqueName = 'msnfp_NonprofitVolunteerManagement'
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

if (-not $TableSearchName) {
	$TableSearchName = "$SiteId-ve-vm-site-agent"
}

$token = Get-DataverseAccessToken -OrgUrl $OrgUrl
$headers = @{
	Authorization   = "Bearer $token"
	Accept          = 'application/json'
	'OData-Version' = '4.0'
}
$writeHeaders = @{
	Authorization   = "Bearer $token"
	Accept          = 'application/json'
	'OData-Version' = '4.0'
	'Content-Type'  = 'application/json'
}
$patchHeaders = @{
	Authorization   = "Bearer $token"
	Accept          = 'application/json'
	'OData-Version' = '4.0'
	'Content-Type'  = 'application/json'
	'If-Match'      = '*'
}
$api = "$OrgUrl/api/data/v9.2"

function Escape-ODataString([string]$value) {
	return $value.Replace("'", "''")
}

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

function Get-EdmPowerPagesSite {
	try {
		return Invoke-RestMethod -Uri "$api/powerpagesites($SiteId)?`$select=powerpagesiteid,name,primarydomainname,datamodelversion" -Headers $headers -Method GET
	}
	catch {
		throw "No Portal-EDM powerpagesite record was found for site $SiteId. This script supports Enhanced Data Model sites only. $($_.Exception.Message)"
	}
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
		throw "No Bot Consumer component found for Portal-EDM site $SiteId$schemaHint. Create or add the site agent first."
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

function Resolve-BotSchemaName($botConsumer) {
	if (-not [string]::IsNullOrWhiteSpace($BotSchemaName)) {
		return $BotSchemaName.Trim()
	}

	$content = ConvertFrom-ComponentContent $botConsumer
	if ([string]::IsNullOrWhiteSpace([string]$content.botschemaname)) {
		throw "Bot Consumer '$($botConsumer.name)' ($($botConsumer.powerpagecomponentid)) does not contain a botschemaname. Re-run with -BotSchemaName."
	}

	return [string]$content.botschemaname
}

function Get-RoleComponents {
	$fetchXml = "<fetch><entity name='powerpagecomponent'><attribute name='powerpagecomponentid'/><attribute name='name'/><attribute name='powerpagecomponenttype'/><attribute name='content'/><filter><condition attribute='powerpagesiteid' operator='eq' value='$SiteId'/><condition attribute='powerpagecomponenttype' operator='eq' value='11'/></filter></entity></fetch>"
	return @(Invoke-DataverseCollection -Uri "$api/powerpagecomponents?fetchXml=$([System.Uri]::EscapeDataString($fetchXml))")
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

function Get-AgentRoleSummary($botConsumer) {
	$roleComponents = @(Get-RoleComponents)
	$roleIds = @(Get-BotConsumerRoleIds -botConsumer $botConsumer)
	$roleNames = New-Object System.Collections.Generic.List[string]
	$hasAnonymousRole = $false

	foreach ($roleId in $roleIds) {
		$role = $roleComponents | Where-Object { $_.powerpagecomponentid -eq $roleId } | Select-Object -First 1
		if (-not $role) {
			$roleNames.Add("<unknown> ($roleId)")
			continue
		}

		$roleNames.Add($role.name)
		$roleContent = ConvertFrom-ComponentContent $role
		if ($role.name -eq 'Anonymous Users' -or $roleContent.anonymoususersrole -eq $true) {
			$hasAnonymousRole = $true
		}
	}

	return [pscustomobject]@{
		RoleIds = $roleIds
		RoleNames = @($roleNames)
		HasAnonymousRole = $hasAnonymousRole
	}
}

function Get-GptComponent([string]$schemaName) {
	if (-not [string]::IsNullOrWhiteSpace($GptComponentId)) {
		return Invoke-RestMethod -Uri "$api/botcomponents($($GptComponentId.Trim()))?`$select=botcomponentid,name,schemaname,componenttype" -Headers $headers -Method GET
	}

	$gptSchemaName = "$schemaName.gpt.default"
	$encodedFilter = [System.Uri]::EscapeDataString("schemaname eq '$(Escape-ODataString $gptSchemaName)' and componenttype eq 15")
	$components = @(Invoke-DataverseCollection -Uri "$api/botcomponents?`$select=botcomponentid,name,schemaname,componenttype&`$filter=$encodedFilter")

	if ($components.Count -eq 0) {
		throw "No default GPT component '$gptSchemaName' was found. Publish or refresh the site agent, or re-run with -GptComponentId."
	}
	if ($components.Count -gt 1) {
		$available = ($components | ForEach-Object { "'$($_.name)' ($($_.botcomponentid), schema=$($_.schemaname))" }) -join ', '
		throw "Multiple default GPT components matched '$gptSchemaName': $available. Re-run with -GptComponentId."
	}

	return $components[0]
}

function Get-DefaultEntityLogicalNames {
	$publicEntities = @(
		'msnfp_publicengagementopportunity',
		'msnfp_engagementopportunityschedule',
		'msnfp_engagementopportunityparticipantqual',
		'msnfp_preferencetype',
		'msnfp_qualificationtype'
	)

	if ($Profile -eq 'Public') {
		return $publicEntities
	}

	return @(
		$publicEntities + @(
			'msnfp_engagementopportunity',
			'contact',
			'msnfp_participation',
			'msnfp_participationschedule',
			'msnfp_availability',
			'msnfp_preference',
			'msnfp_qualification'
		)
	) | ForEach-Object { $_ }
}

function Get-PublicEntityLogicalNames {
	return @(
		'msnfp_publicengagementopportunity',
		'msnfp_engagementopportunityschedule',
		'msnfp_engagementopportunityparticipantqual',
		'msnfp_preferencetype',
		'msnfp_qualificationtype'
	)
}

function Test-UsesNonPublicKnowledgeSource([string[]]$entityNames) {
	if ($IncludeVolunteerManagementModelAppSearch) {
		return $true
	}

	$publicEntities = @(Get-PublicEntityLogicalNames)
	foreach ($entityName in $entityNames) {
		if ($publicEntities -notcontains $entityName) {
			return $true
		}
	}

	return $false
}

function Assert-AgentKnowledgeSourceSafety($botConsumer, [string[]]$entityNames) {
	$roleSummary = Get-AgentRoleSummary -botConsumer $botConsumer
	$roleText = if ($roleSummary.RoleNames.Count -gt 0) { $roleSummary.RoleNames -join ', ' } else { '<none>' }
	Write-Host "Site agent web roles: $roleText"

	if (-not (Test-UsesNonPublicKnowledgeSource -entityNames $entityNames)) {
		return
	}

	if ($roleSummary.HasAnonymousRole -and -not $AllowAnonymousAccessToNonPublicKnowledgeSources) {
		throw "This site agent is assigned to Anonymous Users. Non-public knowledge sources are blocked because they can expose VolunteerPortal or Volunteer Management data through an anonymous chat surface. Remove the Anonymous Users role first and use -Profile Public until non-public access is deliberately reviewed."
	}
}

function Test-DataverseEntityExists([string]$logicalName) {
	try {
		Invoke-RestMethod -Uri "$api/EntityDefinitions(LogicalName='$(Escape-ODataString $logicalName)')?`$select=LogicalName" -Headers $headers -Method GET | Out-Null
		return $true
	}
	catch {
		return $false
	}
}

function Get-TableSearchByName([string]$name) {
	$encodedFilter = [System.Uri]::EscapeDataString("name eq '$(Escape-ODataString $name)'")
	$tableSearchResults = @(Invoke-DataverseCollection -Uri "$api/dvtablesearchs?`$select=dvtablesearchid,name,searchtype,statecode,statuscode,appmoduleuniquename&`$filter=$encodedFilter")
	if ($tableSearchResults.Count -gt 1) {
		$available = ($tableSearchResults | ForEach-Object { "'$($_.name)' ($($_.dvtablesearchid))" }) -join ', '
		throw "Multiple dvtablesearch records named '$name' were found: $available. Re-run with -TableSearchName."
	}

	if ($tableSearchResults.Count -eq 1) {
		return $tableSearchResults[0]
	}

	return $null
}

function New-TableSearch([string]$name) {
	$body = @{
		name = $name
		searchtype = 0
	} | ConvertTo-Json -Depth 5

	$createHeaders = $writeHeaders.Clone()
	$createHeaders['Prefer'] = 'return=representation'
	return Invoke-RestMethod -Uri "$api/dvtablesearchs" -Headers $createHeaders -Method POST -Body $body
}

function Ensure-SiteTableSearch {
	$existing = Get-TableSearchByName -name $TableSearchName
	if ($existing) {
		Write-Host "Using existing Dataverse table search '$($existing.name)' ($($existing.dvtablesearchid))"
		return $existing
	}

	if ($PSCmdlet.ShouldProcess($TableSearchName, 'Create Portal-EDM site-agent Dataverse table search')) {
		$created = New-TableSearch -name $TableSearchName
		Write-Host "Created Dataverse table search '$($created.name)' ($($created.dvtablesearchid))"
		return $created
	}

	Write-Host "Table search '$TableSearchName' does not exist. -WhatIf stopped before child entities and associations."
	return $null
}

function Get-TableSearchEntities([string]$tableSearchId) {
	return @(Invoke-DataverseCollection -Uri "$api/dvtablesearchentities?`$select=dvtablesearchentityid,name,entitylogicalname,_dvtablesearch_value&`$filter=_dvtablesearch_value eq $tableSearchId")
}

function Ensure-TableSearchEntity([object]$tableSearch, [string]$logicalName, [object[]]$existingEntities) {
	$existing = @($existingEntities | Where-Object { $_.entitylogicalname -eq $logicalName })
	if ($existing.Count -gt 0) {
		Write-Host "Table search already includes $logicalName"
		return
	}

	if (-not (Test-DataverseEntityExists -logicalName $logicalName)) {
		$message = "Dataverse table '$logicalName' was not found in $OrgUrl."
		if ($IgnoreMissingEntities) {
			Write-Host "$message Skipping." -ForegroundColor DarkYellow
			return
		}

		throw "$message Re-run with -IgnoreMissingEntities to skip unavailable optional tables."
	}

	$body = @{
		name = "$($tableSearch.name).$logicalName"
		entitylogicalname = $logicalName
		'DVTableSearch@odata.bind' = "/dvtablesearchs($($tableSearch.dvtablesearchid))"
	} | ConvertTo-Json -Depth 5

	if ($PSCmdlet.ShouldProcess($logicalName, "Add to table search '$($tableSearch.name)'")) {
		Invoke-RestMethod -Uri "$api/dvtablesearchentities" -Headers $writeHeaders -Method POST -Body $body | Out-Null
		Write-Host "Added $logicalName to table search '$($tableSearch.name)'"
	}
}

function Remove-TableSearchEntities([object]$tableSearch) {
	$existingEntities = @(Get-TableSearchEntities -tableSearchId $tableSearch.dvtablesearchid)
	foreach ($entity in $existingEntities) {
		if ($PSCmdlet.ShouldProcess($entity.entitylogicalname, "Remove from table search '$($tableSearch.name)'") ) {
			Invoke-RestMethod -Uri "$api/dvtablesearchentities($($entity.dvtablesearchentityid))" -Headers $patchHeaders -Method DELETE | Out-Null
			Write-Host "Removed $($entity.entitylogicalname) from table search '$($tableSearch.name)'"
		}
	}
}

function Get-AssociatedTableSearchIds([string]$entitySet, [string]$recordId, [string]$relationship) {
	$record = Invoke-RestMethod -Uri "$api/$entitySet($recordId)?`$expand=$relationship(`$select=dvtablesearchid,name)" -Headers $headers -Method GET
	$property = $record.PSObject.Properties[$relationship]
	if (-not $property) { return @() }
	return @($property.Value | ForEach-Object { $_.dvtablesearchid })
}

function Ensure-TableSearchAssociation([string]$sourceSet, [string]$sourceId, [string]$relationship, [object]$tableSearch, [string]$description) {
	$associatedIds = @(Get-AssociatedTableSearchIds -entitySet $sourceSet -recordId $sourceId -relationship $relationship)
	if ($associatedIds -contains $tableSearch.dvtablesearchid) {
		Write-Host "$description already linked to '$($tableSearch.name)'"
		return
	}

	$body = @{ '@odata.id' = "$api/dvtablesearchs($($tableSearch.dvtablesearchid))" } | ConvertTo-Json -Depth 5
	if ($PSCmdlet.ShouldProcess($description, "Associate table search '$($tableSearch.name)'") ) {
		Invoke-RestMethod -Uri "$api/$sourceSet($sourceId)/$relationship/`$ref" -Headers $writeHeaders -Method POST -Body $body | Out-Null
		Write-Host "Linked $description to '$($tableSearch.name)'"
	}
}

function Get-VolunteerManagementModelAppTableSearch {
	$encodedFilter = [System.Uri]::EscapeDataString("appmoduleuniquename eq '$(Escape-ODataString $VolunteerManagementAppUniqueName)' and statecode eq 0")
	$modelAppSearchResults = @(Invoke-DataverseCollection -Uri "$api/dvtablesearchs?`$select=dvtablesearchid,name,appmoduleuniquename,statecode,statuscode&`$filter=$encodedFilter")
	if ($modelAppSearchResults.Count -eq 0) {
		$message = "No active Volunteer Management model-app table search was found for app unique name '$VolunteerManagementAppUniqueName'."
		if ($RequireVolunteerManagementModelAppSearch) { throw $message }
		Write-Host "$message Skipping optional VM model-app source." -ForegroundColor DarkYellow
		return $null
	}

	$preferred = @($modelAppSearchResults | Where-Object { $_.name -like 'msft_dvtablesearch_aiplugin_model_*' })
	if ($preferred.Count -gt 0) {
		return $preferred[0]
	}

	return $modelAppSearchResults[0]
}

function Get-GptLinkedTableSearches([string]$gptComponentId) {
	return @(Invoke-DataverseCollection -Uri "$api/botcomponents($gptComponentId)/botcomponent_dvtablesearch?`$select=dvtablesearchid,name")
}

function Write-ReadbackSummary($site, $botConsumer, $gptComponent, $siteTableSearch) {
	$roleSummary = Get-AgentRoleSummary -botConsumer $botConsumer
	$gptLinkedSearches = @(Get-GptLinkedTableSearches -gptComponentId $gptComponent.botcomponentid)
	$siteTableSearchEntities = if ($siteTableSearch) {
		@(Get-TableSearchEntities -tableSearchId $siteTableSearch.dvtablesearchid | Sort-Object entitylogicalname)
	}
	else {
		@()
	}
	$publicEntities = @(Get-PublicEntityLogicalNames)
	$nonPublicEntities = @($siteTableSearchEntities.entitylogicalname | Where-Object { $publicEntities -notcontains $_ } | Select-Object -Unique)

	$summary = [ordered]@{
		siteId = $site.powerpagesiteid
		siteName = $site.name
		botConsumerId = $botConsumer.powerpagecomponentid
		botConsumerName = $botConsumer.name
		botRoleIds = $roleSummary.RoleIds
		botRoleNames = $roleSummary.RoleNames
		gptComponentId = $gptComponent.botcomponentid
		gptComponentName = $gptComponent.name
		gptLinkedTableSearches = @($gptLinkedSearches | ForEach-Object { [ordered]@{ id = $_.dvtablesearchid; name = $_.name } })
		activeTableSearchId = if ($siteTableSearch) { $siteTableSearch.dvtablesearchid } else { $null }
		activeTableSearchName = if ($siteTableSearch) { $siteTableSearch.name } else { $null }
		entityLogicalNames = @($siteTableSearchEntities.entitylogicalname)
		nonPublicEntitiesPresent = $nonPublicEntities
	}

	Write-Host 'Readback summary:'
	Write-Host ($summary | ConvertTo-Json -Depth 10)
}

$site = Get-EdmPowerPagesSite
$botConsumer = Get-BotConsumerComponent
$resolvedBotSchemaName = Resolve-BotSchemaName -botConsumer $botConsumer
$gptComponent = Get-GptComponent -schemaName $resolvedBotSchemaName

$entitiesToApply = if ($EntityLogicalNames.Count -gt 0) {
	@($EntityLogicalNames | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | ForEach-Object { $_.Trim() } | Select-Object -Unique)
}
else {
	@(Get-DefaultEntityLogicalNames | Select-Object -Unique)
}

if ($entitiesToApply.Count -eq 0) {
	throw 'No Dataverse table logical names were selected. Pass -EntityLogicalNames or choose a built-in -Profile.'
}

Assert-AgentKnowledgeSourceSafety -botConsumer $botConsumer -entityNames $entitiesToApply

Write-Host "Portal-EDM site: $($site.name) ($($site.powerpagesiteid)) $($site.primarydomainname)"
Write-Host "Site agent schema: $resolvedBotSchemaName"
Write-Host "Default GPT component: $($gptComponent.name) ($($gptComponent.botcomponentid))"
Write-Host "Profile: $Profile"

$siteTableSearch = Ensure-SiteTableSearch
if ($siteTableSearch) {
	if ($ReplaceEntities) {
		Remove-TableSearchEntities -tableSearch $siteTableSearch
	}

	$existingEntities = @(Get-TableSearchEntities -tableSearchId $siteTableSearch.dvtablesearchid)
	foreach ($logicalName in $entitiesToApply) {
		Ensure-TableSearchEntity -tableSearch $siteTableSearch -logicalName $logicalName -existingEntities $existingEntities
	}

	Ensure-TableSearchAssociation -sourceSet 'powerpagesites' -sourceId $site.powerpagesiteid -relationship 'powerpagesite_dvtablesearch' -tableSearch $siteTableSearch -description "Portal-EDM site '$($site.name)'"
	Ensure-TableSearchAssociation -sourceSet 'botcomponents' -sourceId $gptComponent.botcomponentid -relationship 'botcomponent_dvtablesearch' -tableSearch $siteTableSearch -description "site agent GPT component '$($gptComponent.name)'"
}

if ($IncludeVolunteerManagementModelAppSearch) {
	$vmTableSearch = Get-VolunteerManagementModelAppTableSearch
	if ($vmTableSearch) {
		Ensure-TableSearchAssociation -sourceSet 'powerpagesites' -sourceId $site.powerpagesiteid -relationship 'powerpagesite_dvtablesearch' -tableSearch $vmTableSearch -description "Portal-EDM site '$($site.name)'"
		Ensure-TableSearchAssociation -sourceSet 'botcomponents' -sourceId $gptComponent.botcomponentid -relationship 'botcomponent_dvtablesearch' -tableSearch $vmTableSearch -description "site agent GPT component '$($gptComponent.name)'"
	}
}

Write-Host 'Power Pages site agent VE/VM customization completed.'
Write-ReadbackSummary -site $site -botConsumer $botConsumer -gptComponent $gptComponent -siteTableSearch $siteTableSearch
Write-Host 'Publish the site agent in Copilot Studio if the runtime does not pick up new Dataverse knowledge sources immediately.'