function Get-PortalProjectConfig {
	[CmdletBinding()]
	param(
		[string]$ProjectConfigPath
	)

	if (-not $ProjectConfigPath) {
		$ProjectConfigPath = Join-Path $PSScriptRoot '..\..\powerpages.config.json'
	}

	$resolvedProjectConfigPath = Resolve-Path -LiteralPath $ProjectConfigPath -ErrorAction SilentlyContinue
	if (-not $resolvedProjectConfigPath) {
		throw "Power Pages project config not found: $ProjectConfigPath"
	}

	try {
		$config = Get-Content -LiteralPath $resolvedProjectConfigPath.Path -Raw | ConvertFrom-Json
	}
	catch {
		throw "Power Pages project config is not valid JSON: $($resolvedProjectConfigPath.Path). $($_.Exception.Message)"
	}

	return $config
}

function Get-LocalPowerPagesWebsiteMetadata {
	[CmdletBinding()]
	param(
		[string]$WebsiteMetadataPath
	)

	if (-not $WebsiteMetadataPath) {
		$WebsiteMetadataPath = Join-Path $PSScriptRoot '..\..\.powerpages-site\website.yml'
	}

	$resolvedWebsiteMetadataPath = Resolve-Path -LiteralPath $WebsiteMetadataPath -ErrorAction SilentlyContinue
	if (-not $resolvedWebsiteMetadataPath) {
		return $null
	}

	$metadata = [ordered]@{
		Path = $resolvedWebsiteMetadataPath.Path
		Id = $null
		Name = $null
	}

	foreach ($line in Get-Content -LiteralPath $resolvedWebsiteMetadataPath.Path) {
		if ($line -match '^\s*(?<key>id|name)\s*:\s*(?<value>.*?)\s*$') {
			$value = $Matches.value.Trim()
			if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
				$value = $value.Substring(1, $value.Length - 2)
			}

			if ($Matches.key -eq 'id') { $metadata.Id = $value }
			elseif ($Matches.key -eq 'name') { $metadata.Name = $value }
		}
	}

	return [pscustomobject]$metadata
}

function Get-PortalSiteName {
	[CmdletBinding()]
	param(
		[string]$SiteName,
		[string]$ProjectConfigPath
	)

	if (-not [string]::IsNullOrWhiteSpace($SiteName)) {
		return $SiteName.Trim()
	}

	$websiteMetadata = Get-LocalPowerPagesWebsiteMetadata
	if ($websiteMetadata -and -not [string]::IsNullOrWhiteSpace([string]$websiteMetadata.Name)) {
		return ([string]$websiteMetadata.Name).Trim()
	}

	$config = Get-PortalProjectConfig -ProjectConfigPath $ProjectConfigPath
	if (-not ($config.PSObject.Properties.Name -contains 'siteName') -or [string]::IsNullOrWhiteSpace([string]$config.siteName)) {
		throw "Could not resolve Power Pages site name. Pass -SiteName, restore .powerpages-site/website.yml, or update powerpages.config.json."
	}

	return ([string]$config.siteName).Trim()
}

function Get-PacPowerPagesSites {
	[CmdletBinding()]
	param()

	$output = pac pages list 2>&1
	if ($LASTEXITCODE -ne 0) {
		throw "Could not list Power Pages websites from the selected PAC environment. $($output | Out-String)"
	}

	$sites = @()
	foreach ($line in $output) {
		if ($line -match '^\s*\[\d+\]\s+(?<id>[0-9a-fA-F-]{36})\s+(?<name>.+?)\s*$') {
			$sites += [pscustomobject]@{
				WebsiteRecordId = $Matches.id
				FriendlyName = $Matches.name.Trim()
			}
		}
	}

	return $sites
}

function Resolve-PowerPagesWebsiteRecordId {
	[CmdletBinding()]
	param(
		[string]$WebsiteRecordId,
		[string]$SiteName,
		[string]$ProjectConfigPath
	)

	if (-not [string]::IsNullOrWhiteSpace($WebsiteRecordId)) {
		return $WebsiteRecordId.Trim()
	}

	$websiteMetadata = Get-LocalPowerPagesWebsiteMetadata
	$localWebsiteRecordId = if ($websiteMetadata -and -not [string]::IsNullOrWhiteSpace([string]$websiteMetadata.Id)) { ([string]$websiteMetadata.Id).Trim() } else { $null }
	$resolvedSiteName = Get-PortalSiteName -SiteName $SiteName -ProjectConfigPath $ProjectConfigPath
	$sites = @(Get-PacPowerPagesSites)
	$matches = @($sites | Where-Object { $_.FriendlyName -eq $resolvedSiteName })
	$localIdMatches = if ($localWebsiteRecordId) { @($sites | Where-Object { $_.WebsiteRecordId -eq $localWebsiteRecordId }) } else { @() }

	if ($localWebsiteRecordId) {
		if ($localIdMatches.Count -eq 0) {
			$availableSites = ($sites | ForEach-Object { "'$($_.FriendlyName)' ($($_.WebsiteRecordId))" }) -join ', '
			if ([string]::IsNullOrWhiteSpace($availableSites)) { $availableSites = '<none>' }
			Write-Warning "Local .powerpages-site/website.yml points to website ID $localWebsiteRecordId, but that ID was not listed in the selected PAC environment. Continuing with the local ID so first deploy/import flows can proceed. Available sites: $availableSites."
			return $localWebsiteRecordId
		}

		if ($localIdMatches.Count -gt 1) {
			throw "PAC CLI returned duplicate entries for website ID $localWebsiteRecordId. Pass -WebsiteRecordId/-SiteId to choose the intended target."
		}

		if ($localIdMatches[0].FriendlyName -ne $resolvedSiteName) {
			Write-Warning "Local .powerpages-site/website.yml ID $localWebsiteRecordId belongs to site '$($localIdMatches[0].FriendlyName)' in the selected PAC environment, while local/configured name is '$resolvedSiteName'. Continuing by ID because Power Pages site names can be renamed. Run sync to refresh website.yml, and update powerpages.config.json if this rename should be the new fallback name."
		}

		Write-Host "Resolved Power Pages site '$($localIdMatches[0].FriendlyName)' using .powerpages-site/website.yml ID $localWebsiteRecordId"
		return $localWebsiteRecordId
	}

	if ($matches.Count -eq 0) {
		$availableSites = ($sites | ForEach-Object { "'$($_.FriendlyName)' ($($_.WebsiteRecordId))" }) -join ', '
		if ([string]::IsNullOrWhiteSpace($availableSites)) { $availableSites = '<none>' }
		throw "Power Pages site '$resolvedSiteName' was not found in the selected PAC environment and no local website ID is available. Restore .powerpages-site/website.yml or pass -WebsiteRecordId/-SiteId for the intended target. Available sites: $availableSites."
	}

	if ($matches.Count -gt 1) {
		$matchingIds = ($matches | ForEach-Object { $_.WebsiteRecordId }) -join ', '
		throw "Multiple Power Pages sites named '$resolvedSiteName' were found in the selected PAC environment: $matchingIds. Sync from the intended site ID first or pass -WebsiteRecordId/-SiteId to choose one."
	}

	Write-Host "Resolved Power Pages site '$resolvedSiteName' to website record ID $($matches[0].WebsiteRecordId)"
	return $matches[0].WebsiteRecordId
}

function Get-PacOrgInfo {
	[CmdletBinding()]
	param()

	$output = pac org who --json 2>&1
	if ($LASTEXITCODE -ne 0) {
		throw "PAC CLI is not authenticated to an environment. Run 'pac auth select' or 'pac auth create' first. $($output | Out-String)"
	}

	try {
		$orgInfo = $output | ConvertFrom-Json
	}
	catch {
		throw "Could not parse PAC CLI environment details. $($_.Exception.Message)"
	}

	if ([string]::IsNullOrWhiteSpace([string]$orgInfo.OrgUrl)) {
		throw 'PAC CLI did not return an OrgUrl for the selected environment.'
	}

	return $orgInfo
}

function Get-DataverseAccessToken {
	[CmdletBinding()]
	param(
		[Parameter(Mandatory)][string]$OrgUrl
	)

	$resourceUrl = $OrgUrl.TrimEnd('/')
	$accessToken = (Get-AzAccessToken -ResourceUrl $resourceUrl -WarningAction SilentlyContinue -ErrorAction Stop).Token
	$token = if ($accessToken -is [System.Security.SecureString]) {
		[System.Net.NetworkCredential]::new('', $accessToken).Password
	} else {
		$accessToken
	}

	if ([string]::IsNullOrWhiteSpace([string]$token)) {
		throw "Could not get an Azure access token for $resourceUrl. Run 'Connect-AzAccount' for the same tenant as the PAC environment."
	}

	return $token
}