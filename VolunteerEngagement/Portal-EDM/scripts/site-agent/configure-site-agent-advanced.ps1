# Applies JSON-defined Copilot Studio metadata to a Portal-EDM Power Pages site agent.

[CmdletBinding(SupportsShouldProcess = $true)]
param(
	[string]$OrgUrl,
	[string]$SiteId,
	[string]$SiteName,
	[string]$ProjectConfigPath,
	[string]$BotConsumerId,
	[string]$BotSchemaName,
	[string]$GptComponentId,
	[string]$SearchTopicComponentId,
	[string]$ConfigPath = (Join-Path $PSScriptRoot 'site-agent-advanced.config.json'),
	[switch]$RemoveInstructions,
	[switch]$SkipKnowledgeSources,
	[switch]$SkipLegacyTopicCleanup
)

$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot '..\shared\portal-config.ps1')

$SiteId = Resolve-PowerPagesWebsiteRecordId -WebsiteRecordId $SiteId -SiteName $SiteName -ProjectConfigPath $ProjectConfigPath
$managedBlockStart = 'BEGIN Portal-EDM advanced site-agent configuration'
$managedBlockEnd = 'END Portal-EDM advanced site-agent configuration'

if (-not $OrgUrl) {
	$orgInfo = Get-PacOrgInfo
	$OrgUrl = $orgInfo.OrgUrl.TrimEnd('/')
	Write-Host "Using PAC CLI environment: $OrgUrl"
}
else {
	$OrgUrl = $OrgUrl.TrimEnd('/')
}

if (-not (Test-Path -LiteralPath $ConfigPath)) {
	throw "Advanced site-agent config '$ConfigPath' was not found."
}

$config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json

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
$patchHeaders = $writeHeaders.Clone()
$patchHeaders['If-Match'] = '*'
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

function Get-JsonArray($object, [string]$propertyName) {
	if (-not $object -or -not ($object.PSObject.Properties.Name -contains $propertyName)) { return @() }
	return @($object.$propertyName | Where-Object { $null -ne $_ })
}

function ConvertFrom-ComponentContent($component) {
	if ([string]::IsNullOrWhiteSpace([string]$component.content)) { return [pscustomobject]@{} }

	try { return $component.content | ConvertFrom-Json }
	catch { throw "Component '$($component.name)' ($($component.powerpagecomponentid)) has invalid content JSON. $($_.Exception.Message)" }
}

function Expand-ConfigTokens([string]$value, $site) {
	if ($null -eq $value) { return $null }
	return $value.Replace('{SiteId}', [string]$site.powerpagesiteid).Replace('{SiteName}', [string]$site.name).Replace('{PrimaryDomainName}', [string]$site.primarydomainname).Replace('{OrgUrl}', $OrgUrl)
}

function ConvertTo-YamlScalar([object]$value) {
	if ($null -eq $value) { return "''" }
	if ($value -is [bool]) { return ([string]$value).ToLowerInvariant() }
	if ($value -is [int] -or $value -is [long] -or $value -is [double] -or $value -is [decimal]) { return [string]$value }

	$text = [string]$value
	if ($text -match '^[A-Za-z0-9_./:#{}?=&%+@ -]+$' -and $text -notmatch '^\s|\s$|: ') { return $text }
	return "'$($text.Replace("'", "''"))'"
}

function ConvertTo-YamlLines([object]$value, [int]$indent) {
	$spaces = ' ' * $indent
	$lines = New-Object System.Collections.Generic.List[string]

	if ($null -eq $value) {
		$lines.Add("${spaces}''")
		return @($lines)
	}

	if ($value -is [System.Collections.IEnumerable] -and $value -isnot [string] -and $value -isnot [pscustomobject]) {
		foreach ($item in $value) {
			if ($item -is [pscustomobject]) {
				$lines.Add("${spaces}-")
				foreach ($childLine in ConvertTo-YamlLines -value $item -indent ($indent + 2)) { $lines.Add($childLine) }
			}
			else {
				$lines.Add("${spaces}- $(ConvertTo-YamlScalar $item)")
			}
		}
		return @($lines)
	}

	if ($value -is [pscustomobject]) {
		foreach ($property in $value.PSObject.Properties) {
			if ($property.Value -is [pscustomobject] -or ($property.Value -is [System.Collections.IEnumerable] -and $property.Value -isnot [string])) {
				$lines.Add("$spaces$($property.Name):")
				foreach ($childLine in ConvertTo-YamlLines -value $property.Value -indent ($indent + 2)) { $lines.Add($childLine) }
			}
			else {
				$lines.Add("$spaces$($property.Name): $(ConvertTo-YamlScalar $property.Value)")
			}
		}
		return @($lines)
	}

	$lines.Add("$spaces$(ConvertTo-YamlScalar $value)")
	return @($lines)
}

function Add-BlockScalarLines([System.Collections.Generic.List[string]]$lines, [string]$propertyName, [string]$text, [int]$indent = 0) {
	$propertySpaces = ' ' * $indent
	$contentSpaces = ' ' * ($indent + 2)
	$lines.Add("${propertySpaces}${propertyName}: |-")
	foreach ($line in [regex]::Split($text, '\r?\n')) {
		if ([string]::IsNullOrWhiteSpace($line)) { $lines.Add($contentSpaces) }
		else { $lines.Add("$contentSpaces$line") }
	}
}

function Get-RootYamlBlock([string]$data, [string]$propertyName) {
	if ([string]::IsNullOrWhiteSpace($data)) { return '' }

	$lines = @([regex]::Split($data, '\r?\n'))
	for ($index = 0; $index -lt $lines.Count; $index++) {
		if ($lines[$index] -notmatch "^$([regex]::Escape($propertyName))\s*:") { continue }

		$endIndex = $lines.Count
		for ($nextIndex = $index + 1; $nextIndex -lt $lines.Count; $nextIndex++) {
			if ([string]::IsNullOrWhiteSpace($lines[$nextIndex])) { continue }
			if ($lines[$nextIndex] -notmatch '^\s') {
				$endIndex = $nextIndex
				break
			}
		}

		return ($lines[$index..($endIndex - 1)] -join "`r`n").TrimEnd()
	}

	return ''
}

function New-InstructionsText([string[]]$instructionItems, [string[]]$knowledgeItems) {
	$lines = New-Object System.Collections.Generic.List[string]

	if ($instructionItems.Count -gt 0) {
		$lines.Add('Instructions:')
		foreach ($item in $instructionItems) { $lines.Add("- $item") }
	}

	if ($knowledgeItems.Count -gt 0) {
		if ($lines.Count -gt 0) { $lines.Add('') }
		$lines.Add('Basic knowledge:')
		foreach ($item in $knowledgeItems) { $lines.Add("- $item") }
	}

	return ($lines -join "`r`n")
}

function New-GptMetadataData([string]$currentData, [string]$instructionsText, $metadataConfig) {
	if (-not [string]::IsNullOrWhiteSpace($currentData) -and $currentData -notmatch '(?m)^kind:\s+GptComponentMetadata\s*$') {
		throw 'The default GPT component data does not contain kind: GptComponentMetadata.'
	}

	$lines = New-Object System.Collections.Generic.List[string]
	$lines.Add('kind: GptComponentMetadata')

	if (-not $RemoveInstructions -and -not [string]::IsNullOrWhiteSpace($instructionsText)) {
		Add-BlockScalarLines -lines $lines -propertyName 'instructions' -text $instructionsText
	}

	if ($metadataConfig -and $metadataConfig.PSObject.Properties.Name -contains 'knowledgeSources') {
		$lines.Add('knowledgeSources:')
		foreach ($line in ConvertTo-YamlLines -value $metadataConfig.knowledgeSources -indent 2) { $lines.Add($line) }
	}

	if ($metadataConfig -and $metadataConfig.PSObject.Properties.Name -contains 'gptCapabilities') {
		$lines.Add('gptCapabilities:')
		foreach ($line in ConvertTo-YamlLines -value $metadataConfig.gptCapabilities -indent 2) { $lines.Add($line) }
	}

	$aiSettingsBlock = Get-RootYamlBlock -data $currentData -propertyName 'aISettings'
	if (-not [string]::IsNullOrWhiteSpace($aiSettingsBlock)) { $lines.Add($aiSettingsBlock) }

	return ($lines -join "`r`n").TrimEnd()
}

function Remove-LegacyManagedBlock([string]$text) {
	$pattern = "(?s)$([regex]::Escape($managedBlockStart)).*?$([regex]::Escape($managedBlockEnd))"
	return ([regex]::Replace($text, $pattern, '')).TrimEnd()
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

	if ($components.Count -eq 0) { throw "No Bot Consumer component found for Portal-EDM site $SiteId. Create or add the site agent first." }
	if ($components.Count -gt 1) { throw "Multiple Bot Consumer components were found for site $SiteId. Re-run with -BotConsumerId or -BotSchemaName." }

	return $components[0]
}

function Resolve-BotSchemaName($botConsumer) {
	if (-not [string]::IsNullOrWhiteSpace($BotSchemaName)) { return $BotSchemaName.Trim() }

	$content = ConvertFrom-ComponentContent $botConsumer
	if ([string]::IsNullOrWhiteSpace([string]$content.botschemaname)) {
		throw "Bot Consumer '$($botConsumer.name)' ($($botConsumer.powerpagecomponentid)) does not contain a botschemaname. Re-run with -BotSchemaName."
	}

	return [string]$content.botschemaname
}

function Get-GptComponent([string]$schemaName) {
	if (-not [string]::IsNullOrWhiteSpace($GptComponentId)) {
		return Invoke-RestMethod -Uri "$api/botcomponents($($GptComponentId.Trim()))?`$select=botcomponentid,name,schemaname,componenttype,data,_parentbotid_value" -Headers $headers -Method GET
	}

	$gptSchemaName = "$schemaName.gpt.default"
	$encodedFilter = [System.Uri]::EscapeDataString("schemaname eq '$(Escape-ODataString $gptSchemaName)' and componenttype eq 15")
	$components = @(Invoke-DataverseCollection -Uri "$api/botcomponents?`$select=botcomponentid,name,schemaname,componenttype,data,_parentbotid_value&`$filter=$encodedFilter")

	if ($components.Count -eq 0) { throw "No default GPT component '$gptSchemaName' was found. Publish or refresh the site agent, or re-run with -GptComponentId." }
	if ($components.Count -gt 1) { throw "Multiple default GPT components matched '$gptSchemaName'. Re-run with -GptComponentId." }

	return $components[0]
}

function Get-SearchTopicComponent([string]$schemaName) {
	if (-not [string]::IsNullOrWhiteSpace($SearchTopicComponentId)) {
		return Invoke-RestMethod -Uri "$api/botcomponents($($SearchTopicComponentId.Trim()))?`$select=botcomponentid,name,schemaname,componenttype,data" -Headers $headers -Method GET
	}

	$searchSchemaName = "$schemaName.topic.Search"
	$encodedFilter = [System.Uri]::EscapeDataString("schemaname eq '$(Escape-ODataString $searchSchemaName)' and componenttype eq 9")
	$components = @(Invoke-DataverseCollection -Uri "$api/botcomponents?`$select=botcomponentid,name,schemaname,componenttype,data&`$filter=$encodedFilter")

	if ($components.Count -eq 0) { return $null }
	if ($components.Count -gt 1) { throw "Multiple Conversational boosting topics matched '$searchSchemaName'. Re-run with -SearchTopicComponentId." }

	return $components[0]
}

function Get-KnowledgeSourceComponent([string]$schemaName) {
	$encodedFilter = [System.Uri]::EscapeDataString("schemaname eq '$(Escape-ODataString $schemaName)' and componenttype eq 16")
	$components = @(Invoke-DataverseCollection -Uri "$api/botcomponents?`$select=botcomponentid,name,schemaname,componenttype,data,description&`$filter=$encodedFilter")
	if ($components.Count -gt 1) { throw "Multiple Knowledge Source components matched schema '$schemaName'." }
	if ($components.Count -eq 1) { return $components[0] }
	return $null
}

function New-KnowledgeSourceData($knowledgeSource, $site) {
	if (-not ($knowledgeSource.PSObject.Properties.Name -contains 'source')) { throw "Knowledge source '$($knowledgeSource.name)' is missing source." }

	$source = $knowledgeSource.source.PSObject.Copy()
	foreach ($property in $source.PSObject.Properties) {
		if ($property.Value -is [string]) { $source.$($property.Name) = Expand-ConfigTokens -value $property.Value -site $site }
	}

	$lines = New-Object System.Collections.Generic.List[string]
	if ($knowledgeSource.PSObject.Properties.Name -contains 'componentName') { $lines.Add("componentName: $(ConvertTo-YamlScalar (Expand-ConfigTokens -value ([string]$knowledgeSource.componentName) -site $site))") }
	if ($knowledgeSource.PSObject.Properties.Name -contains 'description') { Add-BlockScalarLines -lines $lines -propertyName 'description' -text (Expand-ConfigTokens -value ([string]$knowledgeSource.description) -site $site) }
	$lines.Add('kind: KnowledgeSourceConfiguration')
	$lines.Add('source:')
	foreach ($line in ConvertTo-YamlLines -value $source -indent 2) { $lines.Add($line) }
	return ($lines -join "`r`n")
}

function Ensure-KnowledgeSourceComponent([string]$botId, [string]$botSchemaName, $knowledgeSource, $site) {
	if ([string]::IsNullOrWhiteSpace([string]$knowledgeSource.name)) { throw 'Knowledge source name is required.' }

	$schemaSuffix = if (-not [string]::IsNullOrWhiteSpace([string]$knowledgeSource.schemaSuffix)) { [string]$knowledgeSource.schemaSuffix } else { ([string]$knowledgeSource.name) -replace '[^A-Za-z0-9_.]', '' }
	$schemaName = "$botSchemaName.knowledge.$schemaSuffix"
	$data = New-KnowledgeSourceData -knowledgeSource $knowledgeSource -site $site
	$description = if ($knowledgeSource.PSObject.Properties.Name -contains 'description') { Expand-ConfigTokens -value ([string]$knowledgeSource.description) -site $site } else { $null }
	$existing = Get-KnowledgeSourceComponent -schemaName $schemaName

	if ($existing) {
		$body = @{}
		if ($existing.name -ne $knowledgeSource.name) { $body.name = $knowledgeSource.name }
		if ($existing.data -ne $data) { $body.data = $data }
		if ($description -and $existing.description -ne $description) { $body.description = $description }

		if ($body.Count -eq 0) {
			Write-Host "Knowledge source '$($knowledgeSource.name)' is already up to date ($($existing.botcomponentid))."
			return [pscustomobject]@{ id = $existing.botcomponentid; name = $existing.name; schemaName = $existing.schemaname; changed = $false }
		}

		if ($PSCmdlet.ShouldProcess($schemaName, "Update Knowledge Source component '$($knowledgeSource.name)'") ) {
			Invoke-RestMethod -Uri "$api/botcomponents($($existing.botcomponentid))" -Headers $patchHeaders -Method PATCH -Body ($body | ConvertTo-Json -Depth 20) | Out-Null
			Write-Host "Updated Knowledge Source component '$($knowledgeSource.name)' ($($existing.botcomponentid))."
		}

		return [pscustomobject]@{ id = $existing.botcomponentid; name = $knowledgeSource.name; schemaName = $schemaName; changed = $true }
	}

	$body = @{
		name = [string]$knowledgeSource.name
		schemaname = $schemaName
		componenttype = 16
		data = $data
		'parentbotid@odata.bind' = "/bots($botId)"
	}
	if ($description) { $body.description = $description }

	if ($PSCmdlet.ShouldProcess($schemaName, "Create Knowledge Source component '$($knowledgeSource.name)'") ) {
		$createHeaders = $writeHeaders.Clone()
		$createHeaders['Prefer'] = 'return=representation'
		$created = Invoke-RestMethod -Uri "$api/botcomponents" -Headers $createHeaders -Method POST -Body ($body | ConvertTo-Json -Depth 20)
		Write-Host "Created Knowledge Source component '$($knowledgeSource.name)' ($($created.botcomponentid))."
		return [pscustomobject]@{ id = $created.botcomponentid; name = $created.name; schemaName = $created.schemaname; changed = $true }
	}

	return [pscustomobject]@{ id = $null; name = $knowledgeSource.name; schemaName = $schemaName; changed = $true }
}

function Clear-LegacyTopicManagedBlock($searchTopic) {
	if (-not $searchTopic -or [string]::IsNullOrWhiteSpace([string]$searchTopic.data)) { return [pscustomobject]@{ changed = $false; reason = 'No search topic data' } }
	if ($searchTopic.data -notmatch [regex]::Escape($managedBlockStart)) { return [pscustomobject]@{ changed = $false; reason = 'No legacy managed block' } }

	$updatedData = Remove-LegacyManagedBlock -text $searchTopic.data
	if ($updatedData -eq $searchTopic.data) { return [pscustomobject]@{ changed = $false; reason = 'No legacy change produced' } }

	if ($PSCmdlet.ShouldProcess($searchTopic.schemaname, 'Remove legacy topic-level Portal-EDM managed instructions block')) {
		Invoke-RestMethod -Uri "$api/botcomponents($($searchTopic.botcomponentid))" -Headers $patchHeaders -Method PATCH -Body (@{ data = $updatedData } | ConvertTo-Json -Depth 20) | Out-Null
		Write-Host "Removed legacy managed block from '$($searchTopic.name)' ($($searchTopic.botcomponentid))."
	}

	return [pscustomobject]@{ changed = $true; reason = 'Removed legacy managed block' }
}

$site = Get-EdmPowerPagesSite
$botConsumer = Get-BotConsumerComponent
$resolvedBotSchemaName = Resolve-BotSchemaName -botConsumer $botConsumer
$gptComponent = Get-GptComponent -schemaName $resolvedBotSchemaName
$botId = $gptComponent._parentbotid_value
if ([string]::IsNullOrWhiteSpace([string]$botId)) { throw "Default GPT component '$($gptComponent.schemaname)' is missing parent bot lookup." }

$instructions = @(Get-JsonArray -object $config -propertyName 'instructions' | ForEach-Object { Expand-ConfigTokens -value ([string]$_) -site $site })
$knowledge = @(Get-JsonArray -object $config -propertyName 'knowledge' | ForEach-Object { Expand-ConfigTokens -value ([string]$_) -site $site })
if (-not $RemoveInstructions -and $instructions.Count -eq 0 -and $knowledge.Count -eq 0) {
	throw "Config '$ConfigPath' must contain at least one instructions or knowledge item unless -RemoveInstructions is used."
}

Write-Host "Portal-EDM site: $($site.name) ($($site.powerpagesiteid)) $($site.primarydomainname)"
Write-Host "Site agent schema: $resolvedBotSchemaName"
Write-Host "Default GPT component: $($gptComponent.name) ($($gptComponent.botcomponentid))"
Write-Host "Config: $ConfigPath"

$instructionsText = if ($RemoveInstructions) { '' } else { New-InstructionsText -instructionItems $instructions -knowledgeItems $knowledge }
$metadataConfig = if ($config.PSObject.Properties.Name -contains 'gptMetadata') { $config.gptMetadata } else { $null }
$gptData = New-GptMetadataData -currentData $gptComponent.data -instructionsText $instructionsText -metadataConfig $metadataConfig

if ($gptData -ne $gptComponent.data) {
	if ($PSCmdlet.ShouldProcess($gptComponent.schemaname, 'Patch Overview-visible GPT component metadata')) {
		Invoke-RestMethod -Uri "$api/botcomponents($($gptComponent.botcomponentid))" -Headers $patchHeaders -Method PATCH -Body (@{ data = $gptData } | ConvertTo-Json -Depth 20) | Out-Null
		Write-Host 'Updated default GPT component metadata.'
	}
}
else {
	Write-Host 'Default GPT component metadata is already up to date.'
}

$knowledgeResults = @()
if (-not $SkipKnowledgeSources) {
	foreach ($knowledgeSource in Get-JsonArray -object $config -propertyName 'knowledgeSourceComponents') {
		$knowledgeResults += Ensure-KnowledgeSourceComponent -botId $botId -botSchemaName $resolvedBotSchemaName -knowledgeSource $knowledgeSource -site $site
	}
}

$legacyCleanup = [pscustomobject]@{ changed = $false; reason = 'Skipped' }
if (-not $SkipLegacyTopicCleanup) {
	$legacyCleanup = Clear-LegacyTopicManagedBlock -searchTopic (Get-SearchTopicComponent -schemaName $resolvedBotSchemaName)
}

$summary = [ordered]@{
	siteId = $site.powerpagesiteid
	botConsumerId = $botConsumer.powerpagecomponentid
	gptComponentId = $gptComponent.botcomponentid
	gptMetadataChanged = ($gptData -ne $gptComponent.data)
	instructionLineCount = if ($instructionsText) { @([regex]::Split($instructionsText, '\r?\n')).Count } else { 0 }
	visibleMarkerPresent = $instructionsText.Contains($managedBlockStart) -or $instructionsText.Contains($managedBlockEnd)
	knowledgeSources = $knowledgeResults
	legacyTopicCleanup = $legacyCleanup
}

Write-Host 'Power Pages site agent advanced configuration completed.'
Write-Host ($summary | ConvertTo-Json -Depth 10)
Write-Host 'Refresh Copilot Studio Overview. Publish the site agent if runtime behavior does not pick up metadata changes immediately.'