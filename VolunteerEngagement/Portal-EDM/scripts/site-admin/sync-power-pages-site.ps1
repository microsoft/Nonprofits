<#
.SYNOPSIS
	Downloads Power Pages code-site metadata for the configured Portal-EDM site.
#>
param(
	[string]$WebsiteRecordId,
	[string]$SiteName,
	[string]$ProjectConfigPath
)

$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot '..\shared\portal-config.ps1')

$WebsiteRecordId = Resolve-PowerPagesWebsiteRecordId -WebsiteRecordId $WebsiteRecordId -SiteName $SiteName -ProjectConfigPath $ProjectConfigPath

$portalRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$downloadRoot = Join-Path ([System.IO.Path]::GetTempPath()) "portal-edm-sync-$([guid]::NewGuid().ToString('N'))"
$replacementSitePath = Join-Path $portalRoot ".powerpages-site.replacement-$([guid]::NewGuid().ToString('N'))"
$backupSitePath = $null

Push-Location $portalRoot
try {
	New-Item -ItemType Directory -Path $downloadRoot -Force | Out-Null
	Write-Host "Downloading Power Pages code-site metadata for website $WebsiteRecordId..." -ForegroundColor Cyan
	pac pages download-code-site --path $downloadRoot --webSiteId $WebsiteRecordId --overwrite
	if ($LASTEXITCODE -ne 0) { throw 'Power Pages code-site download failed.' }

	$downloadedSites = @(Get-ChildItem -LiteralPath $downloadRoot -Recurse -Force -Directory -Filter '.powerpages-site')
	if ($downloadedSites.Count -eq 0) {
		throw "Power Pages download completed, but no .powerpages-site folder was found under $downloadRoot."
	}
	if ($downloadedSites.Count -gt 1) {
		throw "Power Pages download produced multiple .powerpages-site folders under $downloadRoot. Cannot choose safely."
	}

	$downloadedSitePath = $downloadedSites[0].FullName
	$targetSitePath = Join-Path $portalRoot '.powerpages-site'

	Move-Item -LiteralPath $downloadedSitePath -Destination $replacementSitePath -Force
	if (Test-Path -LiteralPath $targetSitePath) {
		$backupSitePath = Join-Path $portalRoot ".powerpages-site.backup-$([guid]::NewGuid().ToString('N'))"
		Move-Item -LiteralPath $targetSitePath -Destination $backupSitePath -Force
	}
	try {
		Move-Item -LiteralPath $replacementSitePath -Destination $targetSitePath -Force
	}
	catch {
		if ($backupSitePath -and (Test-Path -LiteralPath $backupSitePath) -and -not (Test-Path -LiteralPath $targetSitePath)) {
			Move-Item -LiteralPath $backupSitePath -Destination $targetSitePath -Force
		}
		throw
	}
	if ($backupSitePath -and (Test-Path -LiteralPath $backupSitePath)) {
		Remove-Item -LiteralPath $backupSitePath -Recurse -Force
	}

	Write-Host 'Updated .powerpages-site metadata.' -ForegroundColor Green
}
finally {
	if (Test-Path -LiteralPath $replacementSitePath) { Remove-Item -LiteralPath $replacementSitePath -Recurse -Force -ErrorAction SilentlyContinue }
	if ($backupSitePath -and (Test-Path -LiteralPath $backupSitePath)) { Remove-Item -LiteralPath $backupSitePath -Recurse -Force -ErrorAction SilentlyContinue }
	if (Test-Path -LiteralPath $downloadRoot) { Remove-Item -LiteralPath $downloadRoot -Recurse -Force -ErrorAction SilentlyContinue }
	Pop-Location
}