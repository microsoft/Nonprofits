<#
.SYNOPSIS
  Generates Power Pages Content Snippet files for all MSVE_SPA localization keys.

.DESCRIPTION
  Reads fallback.ts to extract all translation keys and their English values,
  then creates the .powerpages-site/content-snippets/ folder structure for each key.
    English snippets preserve the existing deterministic GUID based on key name.
    Non-English snippets include the language code in the deterministic GUID seed.

  When -Key and -Value are provided, the new string is added to fallback.ts
  and then all snippets and the site setting are regenerated.

.PARAMETER Key
  Optional. A new localization key to add (e.g. "MSVE_SPA/Common/Retry").
  Must follow the MSVE_SPA/{Category}/{Name} convention.

.PARAMETER Value
  Required when -Key is specified. The English string value.

.PARAMETER Language
  The language folder name (e.g. "en-US", "fr-FR"). Defaults to "en-US".

.PARAMETER LanguageId
  The Dataverse Portal Language record ID. Defaults to English (eec022f9-0dc6-4496-b1fb-4d58a7a2d409).

.PARAMETER TranslationsFile
  Optional JSON file with key→translated value overrides.

.EXAMPLE
  # Generate/sync all snippets from existing fallback.ts
    .\generate-snippets.ps1

  # Add a new string (updates fallback.ts + creates snippet + updates site setting)
    .\generate-snippets.ps1 -Key "MSVE_SPA/Common/Retry" -Value "Retry"

  # Generate French snippets (with translations file)
    .\generate-snippets.ps1 -Language "fr-FR" -LanguageId "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" -TranslationsFile "./translations-fr.json"
#>
param(
    [string]$Key,
    [string]$Value,
    [string]$Language = "en-US",
    [string]$LanguageId = "eec022f9-0dc6-4496-b1fb-4d58a7a2d409",
    [string]$TranslationsFile
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
$fallbackPath = Join-Path $repoRoot "Portal-EDM/src/i18n/fallback.ts"
$snippetsDir = Join-Path $repoRoot "Portal-EDM/.powerpages-site/content-snippets"

# ── Handle -Key / -Value: insert into fallback.ts first ───────────────
$keyInserted = $false
if ($Key) {
    if (-not $Value -and $Value -ne '') {
        Write-Error "-Value is required when -Key is specified."
        return
    }
    if ($Key -notmatch '^MSVE_SPA/[A-Za-z]+/[A-Za-z0-9_]+$') {
        Write-Error "Key must follow MSVE_SPA/{Category}/{Name} convention. Got: $Key"
        return
    }

    $fbContent = Get-Content $fallbackPath -Raw -Encoding utf8
    if ($fbContent -match [regex]::Escape("'$Key'")) {
        Write-Host "Key '$Key' already exists in fallback.ts — skipping insert" -ForegroundColor Yellow
    } else {
        # Insert before the closing '};'
        $escapedValue = $Value.Replace("'", "\'")
        $newLine = "`t'$Key': '$escapedValue',"
        $fbContent = $fbContent -replace '(\r?\n)};\s*$', "`$1$newLine`$1};`n"
        [System.IO.File]::WriteAllText($fallbackPath, $fbContent, [System.Text.UTF8Encoding]::new($false))
        Write-Host "Added '$Key' to fallback.ts" -ForegroundColor Green
        $keyInserted = $true
    }
}

# ── Parse fallback.ts ─────────────────────────────────────────────────
Write-Host "Reading keys from fallback.ts..." -ForegroundColor Cyan
$content = Get-Content $fallbackPath -Raw -Encoding utf8

$entries = [System.Collections.Generic.List[hashtable]]::new()
$regex = [regex]"'(MSVE_SPA/[^']+)':\s*'([^']*)'"
$fallbackMatches = $regex.Matches($content)

foreach ($m in $fallbackMatches) {
    $entries.Add(@{
        Key   = $m.Groups[1].Value
        Value = $m.Groups[2].Value
    })
}

Write-Host "  Found $($entries.Count) keys" -ForegroundColor Green

# ── Load translations override if provided ────────────────────────────
$translations = @{}
if ($TranslationsFile) {
    if (-not (Test-Path $TranslationsFile)) {
        Write-Error "Translations file not found: $TranslationsFile"
        return
    }
    Write-Host "Loading translations from $TranslationsFile..." -ForegroundColor Cyan
    $translations = Get-Content $TranslationsFile -Raw -Encoding utf8 | ConvertFrom-Json -AsHashtable
    Write-Host "  Loaded $($translations.Count) translations" -ForegroundColor Green
}

# ── Helper: deterministic GUID from string ────────────────────────────
function Get-DeterministicGuid {
    param([string]$InputString)
    $bytes = [System.Text.Encoding]::UTF8.GetBytes("MSVE_SPA_SNIPPET:$InputString")
    $hash = [System.Security.Cryptography.SHA256]::Create().ComputeHash($bytes)
    # Use first 16 bytes of SHA-256 as GUID, set version 4 bits
    $hash[6] = ($hash[6] -band 0x0F) -bor 0x40  # version 4
    $hash[8] = ($hash[8] -band 0x3F) -bor 0x80  # variant
    return [guid]::new(
        [BitConverter]::ToInt32($hash, 0),
        [BitConverter]::ToInt16($hash, 4),
        [BitConverter]::ToInt16($hash, 6),
        $hash[8], $hash[9], $hash[10], $hash[11],
        $hash[12], $hash[13], $hash[14], $hash[15]
    ).ToString()
}

function Get-SnippetGuidSeed {
    param(
        [string]$Key,
        [string]$Language
    )

    if ($Language -eq "en-US") { return $Key }
    return "${Key}:${Language}"
}

# ── Helper: key to folder name ────────────────────────────────────────
function Get-FolderName {
    param([string]$Key)
    # MSVE_SPA/Common/Save → msve_spa-common-save
    return $Key.ToLower().Replace('/', '-')
}

# ── Helper: key to file-safe name ─────────────────────────────────────
function Get-FileName {
    param([string]$Key)
    # MSVE_SPA/Common/Save → MSVE_SPA-Common-Save
    return $Key.Replace('/', '-')
}

# ── Generate snippet files ────────────────────────────────────────────
$created = 0
$skipped = 0

foreach ($entry in $entries) {
    $key = $entry.Key
    $value = if ($translations.ContainsKey($key)) { $translations[$key] } else { $entry.Value }

    $folderName = Get-FolderName $key
    $fileName = Get-FileName $key
    $guid = Get-DeterministicGuid (Get-SnippetGuidSeed -Key $key -Language $Language)

    $snippetDir = Join-Path $snippetsDir $folderName
    $langDir = Join-Path $snippetDir $Language

    # Skip if yml already exists for this language
    $ymlPath = Join-Path $langDir "$fileName.contentsnippet.yml"
    $htmlPath = Join-Path $langDir "$fileName.contentsnippet.value.html"

    if (Test-Path $ymlPath) {
        $skipped++
        continue
    }

    # Create directory
    New-Item -ItemType Directory -Path $langDir -Force | Out-Null

    # Write YAML
    $yml = @"
contentsnippetlanguageid: $LanguageId
display_name: $key
id: $guid
name: $key
"@
    [System.IO.File]::WriteAllText($ymlPath, $yml, [System.Text.UTF8Encoding]::new($false))

    # Write value HTML
    [System.IO.File]::WriteAllText($htmlPath, $value, [System.Text.UTF8Encoding]::new($false))

    $created++
}

# ── Regenerate MSVE_SPA-Keys site setting ────────────────────────────
$siteSettingsDir = Join-Path $repoRoot "Portal-EDM/.powerpages-site/site-settings"
$siteSettingPath = Join-Path $siteSettingsDir "MSVE_SPA-Keys.sitesetting.yml"

$csv = ($entries | ForEach-Object { $_.Key }) -join ','

# Preserve existing GUID if the file already exists; otherwise generate one
$ssGuid = "3f403f6f-215c-b435-be78-964acd4ab4cf"
if (Test-Path $siteSettingPath) {
    $existingContent = Get-Content $siteSettingPath -Raw -Encoding utf8
    $guidMatch = [regex]::Match($existingContent, '^id:\s*([0-9a-f-]{36})', 'Multiline')
    if ($guidMatch.Success) {
        $ssGuid = $guidMatch.Groups[1].Value
    }
}

New-Item -ItemType Directory -Path $siteSettingsDir -Force | Out-Null
$ssYml = "id: $ssGuid`nname: MSVE_SPA/Keys`nsource: 0`nvalue: $csv"
[System.IO.File]::WriteAllText($siteSettingPath, $ssYml, [System.Text.UTF8Encoding]::new($false))

# ── Re-sort fallback.ts if we added a key ────────────────────────────
if ($keyInserted) {
    $syncScript = Join-Path $PSScriptRoot "sync-strings.ps1"
    if (Test-Path $syncScript) {
        Write-Host "Re-sorting fallback.ts..." -ForegroundColor Cyan
        & $syncScript
    }
}

Write-Host ""
Write-Host "Done! Created $created snippet(s), skipped $skipped existing." -ForegroundColor Green
Write-Host "Updated MSVE_SPA/Keys site setting ($($entries.Count) keys)" -ForegroundColor Green
Write-Host "Snippets location: $snippetsDir" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review the generated files" -ForegroundColor Yellow
Write-Host "  2. Deploy:  cd Portal-EDM; npm run deploy" -ForegroundColor Yellow
