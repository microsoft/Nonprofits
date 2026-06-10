<#
.SYNOPSIS
  Add a new language to the Volunteer Engagement SPA.

.DESCRIPTION
  Clones all MSVE_SPA English Content Snippets AND all en-US Content Pages
  for a new language. Creates the folder structures under
  .powerpages-site/content-snippets/ and .powerpages-site/web-pages/
  with the target language code.

  Content Pages are required so Power Pages serves the correct web template
  for the new language URL prefix (e.g. /fr-FR/). Without them, the Liquid
  script block that injects __VE_STRINGS is never executed.

  Partners then translate the .value.html snippet files and upload via pac pages.

.PARAMETER LanguageCode
  The BCP-47 language code (e.g. "fr-FR", "es-ES", "de-DE").

.PARAMETER LanguageId
  Optional. The Dataverse mspp_websitelanguageid for the target language.
  If omitted, the script auto-discovers it via pac org fetch.
  The language must already be enabled in Power Pages Admin.

.EXAMPLE
  # Add French (auto-discovers GUID from Dataverse)
    .\add-language.ps1 -LanguageCode "fr-FR"

  # Add French with explicit GUID
    .\add-language.ps1 -LanguageCode "fr-FR" -LanguageId "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

  # Then translate each .value.html file and upload:
  #   cd Portal-EDM; npm run deploy
#>
param(
    [Parameter(Mandatory)]
    [string]$LanguageCode,

    [string]$LanguageId
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
$snippetsDir = Join-Path $repoRoot "Portal-EDM/.powerpages-site/content-snippets"

# ── Auto-discover LanguageId from Dataverse if not provided ───────────
if (-not $LanguageId) {
    Write-Host "Looking up language '$LanguageCode' in Dataverse..." -ForegroundColor Cyan
    $fetchXml = "<fetch><entity name='mspp_websitelanguage'><attribute name='mspp_websitelanguageid'/><attribute name='mspp_languagecode'/><filter><condition attribute='mspp_languagecode' operator='eq' value='$LanguageCode'/></filter></entity></fetch>"
    $result = pac org fetch -x $fetchXml 2>&1
    $guidMatch = [regex]::Match(($result | Out-String), '([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})')
    if ($guidMatch.Success) {
        $LanguageId = $guidMatch.Groups[1].Value
        Write-Host "  Found: $LanguageId" -ForegroundColor Green
    } else {
        Write-Error "Language '$LanguageCode' not found in Dataverse. Enable it in Power Pages Admin first, or pass -LanguageId manually."
        return
    }
}

# ── Ensure MultiLanguage/DisplayLanguageCodeInURL is True ─────────────
$siteSettingsDir = Join-Path $repoRoot "Portal-EDM/.powerpages-site/site-settings"
$urlSettingPath = Join-Path $siteSettingsDir "MultiLanguage-DisplayLanguageCodeInURL.sitesetting.yml"
if (Test-Path $urlSettingPath) {
    $urlSettingContent = Get-Content $urlSettingPath -Raw -Encoding utf8
    if ($urlSettingContent -match 'value:\s*"?False"?') {
        Write-Host "Setting MultiLanguage/DisplayLanguageCodeInURL to True..." -ForegroundColor Yellow
        $urlSettingContent = $urlSettingContent -replace 'value:\s*"?False"?', 'value: "True"'
        [System.IO.File]::WriteAllText($urlSettingPath, $urlSettingContent, [System.Text.UTF8Encoding]::new($false))
        Write-Host "  Updated. Language URL prefixes (/en-US/, /$LanguageCode/) will be enabled on next deploy." -ForegroundColor Green
    } else {
        Write-Host "MultiLanguage/DisplayLanguageCodeInURL is already True." -ForegroundColor Green
    }
} else {
    Write-Warning "Site setting file not found: $urlSettingPath"
    Write-Warning "You must manually set MultiLanguage/DisplayLanguageCodeInURL to True for language URL prefixes to work."
}

# ── Find all English MSVE_SPA snippet folders ─────────────────────────
$englishDirs = Get-ChildItem $snippetsDir -Directory -Filter "msve_spa-*" |
    ForEach-Object { Join-Path $_.FullName "en-US" } |
    Where-Object { Test-Path $_ }

# ── Also clone Account page-copy snippets (load profile.js on Liquid auth pages) ──
$accountPageCopyDirs = Get-ChildItem $snippetsDir -Directory -Filter "account-*-pagecopy" |
    ForEach-Object { Join-Path $_.FullName "en-US" } |
    Where-Object { Test-Path $_ }
$englishDirs = @($englishDirs) + @($accountPageCopyDirs)

if ($englishDirs.Count -eq 0) {
    Write-Error "No English MSVE_SPA snippets found. Run generate-snippets.ps1 first."
    return
}

Write-Host "Found $($englishDirs.Count) English snippets to clone for '$LanguageCode'" -ForegroundColor Cyan

# ── Helper: deterministic GUID from string ────────────────────────────
function Get-DeterministicGuid {
    param([string]$InputString)
    $bytes = [System.Text.Encoding]::UTF8.GetBytes("MSVE_SPA_SNIPPET:$InputString")
    $hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
    $hash[6] = ($hash[6] -band 0x0F) -bor 0x40
    $hash[8] = ($hash[8] -band 0x3F) -bor 0x80
    return [guid]::new(
        [BitConverter]::ToInt32($hash, 0),
        [BitConverter]::ToInt16($hash, 4),
        [BitConverter]::ToInt16($hash, 6),
        $hash[8], $hash[9], $hash[10], $hash[11],
        $hash[12], $hash[13], $hash[14], $hash[15]
    ).ToString()
}

# ── Clone each snippet for the new language ───────────────────────────
$created = 0
$skipped = 0

foreach ($enDir in $englishDirs) {
    $parentDir = Split-Path $enDir -Parent
    $targetDir = Join-Path $parentDir $LanguageCode

    # Find the English yml
    $enYml = Get-ChildItem $enDir -Filter "*.contentsnippet.yml" | Select-Object -First 1
    if (-not $enYml) { continue }

    $baseName = $enYml.BaseName -replace '\.contentsnippet$', ''
    $targetYml = Join-Path $targetDir "$baseName.contentsnippet.yml"

    if (Test-Path $targetYml) {
        $skipped++
        continue
    }

    # Read English yml to get the snippet name and optional type
    $enContent = Get-Content $enYml.FullName -Raw -Encoding utf8
    $nameMatch = [regex]::Match($enContent, 'name:\s*(.+)')
    $snippetName = $nameMatch.Groups[1].Value.Trim()
    $typeMatch = [regex]::Match($enContent, 'type:\s*(.+)')

    # Generate a new GUID for this language variant
    $guid = Get-DeterministicGuid "${snippetName}:${LanguageCode}"

    # Create target directory
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null

    # Write yml with new language ID and GUID
    $yml = @"
contentsnippetlanguageid: $LanguageId
display_name: $snippetName
id: $guid
name: $snippetName
"@
    if ($typeMatch.Success) {
        $yml += "`ntype: $($typeMatch.Groups[1].Value.Trim())"
    }
    [System.IO.File]::WriteAllText($targetYml, $yml, [System.Text.UTF8Encoding]::new($false))

    # Copy the English value as a starting point for translation
    $enValueFile = Get-ChildItem $enDir -Filter "*.contentsnippet.value.html" | Select-Object -First 1
    if ($enValueFile) {
        $targetValue = Join-Path $targetDir "$baseName.contentsnippet.value.html"
        $enText = [System.IO.File]::ReadAllText($enValueFile.FullName, [System.Text.UTF8Encoding]::new($false))
        [System.IO.File]::WriteAllText($targetValue, $enText, [System.Text.UTF8Encoding]::new($false))
    }

    $created++
}

Write-Host ""
Write-Host "Done! Created $created snippet(s) for '$LanguageCode', skipped $skipped existing." -ForegroundColor Green

# ── Clone Content Pages for the new language ──────────────────────────
$webPagesDir = Join-Path $repoRoot "Portal-EDM/.powerpages-site/web-pages"
$pagesCreated = 0
$pagesSkipped = 0

$webPageDirs = Get-ChildItem $webPagesDir -Directory |
    Where-Object { Test-Path (Join-Path $_.FullName "content-pages/en-US") }

Write-Host ""
Write-Host "Cloning $($webPageDirs.Count) content page(s) for '$LanguageCode'..." -ForegroundColor Cyan

foreach ($pageDir in $webPageDirs) {
    $enDir = Join-Path $pageDir.FullName "content-pages/en-US"
    $targetDir = Join-Path $pageDir.FullName "content-pages/$LanguageCode"

    if (Test-Path $targetDir) {
        $pagesSkipped++
        continue
    }

    # Find the English yml
    $enYml = Get-ChildItem $enDir -Filter "*.webpage.yml" | Select-Object -First 1
    if (-not $enYml) { continue }

    $baseName = $enYml.BaseName -replace '\.webpage$', ''

    # Generate a deterministic GUID for this content page
    $pageGuid = Get-DeterministicGuid "WEBPAGE:${baseName}:${LanguageCode}"

    # Read and update the yml — only change id and webpagelanguageid
    $ymlLines = Get-Content $enYml.FullName -Encoding utf8
    $newLines = foreach ($line in $ymlLines) {
        if ($line -match '^id:\s') {
            "id: $pageGuid"
        } elseif ($line -match '^webpagelanguageid:\s') {
            "webpagelanguageid: $LanguageId"
        } else {
            $line
        }
    }
    $ymlContent = ($newLines -join "`n") + "`n"

    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    $targetYmlPath = Join-Path $targetDir "$baseName.webpage.yml"
    [System.IO.File]::WriteAllText($targetYmlPath, $ymlContent, [System.Text.UTF8Encoding]::new($false))

    # Copy sidecar files (.copy.html, .summary.html, .custom_javascript.js, .custom_css.css)
    $sidecarPatterns = @("*.webpage.copy.html", "*.webpage.summary.html", "*.webpage.custom_javascript.js", "*.webpage.custom_css.css")
    foreach ($pattern in $sidecarPatterns) {
        $sidecar = Get-ChildItem $enDir -Filter $pattern | Select-Object -First 1
        if ($sidecar) {
            $targetSidecar = Join-Path $targetDir $sidecar.Name
            $content = [System.IO.File]::ReadAllText($sidecar.FullName, [System.Text.UTF8Encoding]::new($false))
            [System.IO.File]::WriteAllText($targetSidecar, $content, [System.Text.UTF8Encoding]::new($false))
        }
    }

    $pagesCreated++
}

Write-Host "Done! Created $pagesCreated content page(s), skipped $pagesSkipped existing." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Translate each .value.html file in the '$LanguageCode' folders:" -ForegroundColor Yellow
Write-Host "     $snippetsDir\msve_spa-*\$LanguageCode\*.value.html" -ForegroundColor Gray
Write-Host "     NOTE: Use pwsh (PowerShell 7+), NOT powershell (5.1), to avoid" -ForegroundColor Gray
Write-Host "     double-encoding of accented characters (e.g. e-acute -> A-tilde + copyright)." -ForegroundColor Gray
Write-Host "  2. Deploy and restart:" -ForegroundColor Yellow
Write-Host "     cd Portal-EDM; npm run deploy" -ForegroundColor Gray
Write-Host "     npm run site:restart" -ForegroundColor Gray
