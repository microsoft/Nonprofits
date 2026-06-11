# Restart Power Pages site to clear server-side cache.
#
# Uses the Power Platform REST API:
#   POST https://api.powerplatform.com/powerpages/environments/{envId}/websites/{id}/restart
#
# Auth: az CLI (has PowerPages.Websites.Write delegated permission).
# Requires: az CLI logged in, pac CLI authenticated.

param(
	[string]$EnvironmentId,
	[string]$WebsiteRecordId,
	[string]$Subdomain,
	[string]$SiteName,
	[string]$ProjectConfigPath
)

$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot '..\shared\portal-config.ps1')

$WebsiteRecordId = Resolve-PowerPagesWebsiteRecordId -WebsiteRecordId $WebsiteRecordId -SiteName $SiteName -ProjectConfigPath $ProjectConfigPath

# Verify az CLI is authenticated
$azAccountOutput = az account show 2>&1
if ($LASTEXITCODE -ne 0) {
	Write-Host 'Not logged in to Azure CLI.' -ForegroundColor Red
	Write-Host 'Run "az login" first, then retry.' -ForegroundColor Yellow
	exit 1
}

# Auto-detect environment ID from pac CLI
if (-not $EnvironmentId) {
	$orgInfo = Get-PacOrgInfo
	$EnvironmentId = $orgInfo.EnvironmentId
	Write-Host "Using PAC CLI environment: $EnvironmentId"
}

$api = 'https://api.powerplatform.com'

# Look up the Power Platform site ID (different from the Dataverse website record ID)
Write-Host 'Looking up site in Power Platform API...' -ForegroundColor DarkGray
$sites = az rest --method get --url "$api/powerpages/environments/$EnvironmentId/websites?api-version=2024-10-01" --resource $api | ConvertFrom-Json
$site = $sites.value | Where-Object { ($Subdomain -and $_.subdomain -eq $Subdomain) -or $_.websiteRecordId -eq $WebsiteRecordId -or $_.properties.websiteRecordId -eq $WebsiteRecordId } | Sort-Object createdOn -Descending | Select-Object -First 1
if (-not $site) { throw "Site not found (subdomain=$Subdomain, websiteRecordId=$WebsiteRecordId)." }

$siteId = $site.id
Write-Host "Found site: $($site.name) ($($site.websiteUrl)) - id=$siteId" -ForegroundColor DarkGray

$uri = "$api/powerpages/environments/$EnvironmentId/websites/$siteId/restart?api-version=2024-10-01"

Write-Host "Restarting site..." -ForegroundColor Cyan
az rest --method post --url $uri --resource $api
if ($LASTEXITCODE -ne 0) { throw 'Site restart failed.' }

Write-Host 'Site restarted - server-side cache cleared.' -ForegroundColor Green
