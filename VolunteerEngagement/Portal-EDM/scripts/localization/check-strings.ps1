<#
.SYNOPSIS
  Validates that every t() call in the SPA references a key in fallback.ts,
  and every key in fallback.ts has a matching Content Snippet file.

.DESCRIPTION
  Three-way alignment check:
    1. SPA t() calls  →  fallback.ts keys  (missing = build error)
    2. fallback.ts keys  →  Content Snippets  (missing = warning)
    3. Content Snippets  →  fallback.ts keys  (orphaned = warning)

.EXAMPLE
    .\check-strings.ps1
#>

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
$srcDir = Join-Path $repoRoot "Portal-EDM/src"
$fallbackPath = Join-Path $repoRoot "Portal-EDM/src/i18n/fallback.ts"
$snippetsDir = Join-Path $repoRoot "Portal-EDM/.powerpages-site/content-snippets"

$errors = 0
$warnings = 0

# ── 1. Parse all keys from fallback.ts ────────────────────────────────
Write-Host "Checking fallback.ts..." -ForegroundColor Cyan
$fbContent = Get-Content $fallbackPath -Raw -Encoding utf8
$fbKeys = [System.Collections.Generic.HashSet[string]]::new()
$fbRegex = [regex]"'(MSVE_SPA/[^']+)'"
foreach ($m in $fbRegex.Matches($fbContent)) {
    [void]$fbKeys.Add($m.Groups[1].Value)
}
Write-Host "  $($fbKeys.Count) keys in fallback.ts" -ForegroundColor Gray

# ── 2. Scan all t() calls in SPA source ──────────────────────────────
Write-Host "Scanning SPA source for t() calls..." -ForegroundColor Cyan
$usedKeys = [System.Collections.Generic.HashSet[string]]::new()
$tCallRegex = [regex]"(?<![a-zA-Z_])t\(\s*'(MSVE_SPA/[^']+)'\s*[,)]"
$tCallRegex2 = [regex]'(?<![a-zA-Z_])t\(\s*"(MSVE_SPA/[^"]+)"\s*[,)]'
$templateRegex = [regex]"(?<![a-zA-Z_])t\(\s*``(MSVE_SPA/[^``]+)``\s*[,)]"

$sourceFiles = Get-ChildItem $srcDir -Recurse -Include "*.tsx","*.ts" |
    Where-Object { $_.FullName -notmatch 'fallback\.ts$' -and $_.FullName -notmatch '\.d\.ts$' }

foreach ($file in $sourceFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding utf8
    foreach ($m in $tCallRegex.Matches($content)) {
        [void]$usedKeys.Add($m.Groups[1].Value)
    }
    foreach ($m in $tCallRegex2.Matches($content)) {
        [void]$usedKeys.Add($m.Groups[1].Value)
    }
    # Template literal t(`MSVE_SPA/Day/${day.label}`) → extract prefix
    foreach ($m in $templateRegex.Matches($content)) {
        $val = $m.Groups[1].Value
        if ($val -match '^(MSVE_SPA/[^$]+)\$\{') {
            # Dynamic key — skip validation (e.g. Day/Sun through Day/Sat)
        }
    }
}
Write-Host "  $($usedKeys.Count) unique t() keys found in source" -ForegroundColor Gray

# ── 3. Check: t() keys must exist in fallback.ts ─────────────────────
Write-Host ""
Write-Host "Check 1: t() keys → fallback.ts" -ForegroundColor Yellow
$missingInFallback = $usedKeys | Where-Object { -not $fbKeys.Contains($_) } | Sort-Object
if ($missingInFallback.Count -gt 0) {
    foreach ($key in $missingInFallback) {
        Write-Host "  ERROR: t('$key') used in source but missing from fallback.ts" -ForegroundColor Red
        $errors++
    }
} else {
    Write-Host "  All t() keys found in fallback.ts" -ForegroundColor Green
}

# ── 4. Check: fallback.ts keys should have Content Snippets ──────────
Write-Host ""
Write-Host "Check 2: fallback.ts keys → Content Snippets" -ForegroundColor Yellow
$snippetNames = [System.Collections.Generic.HashSet[string]]::new()
$snippetDirs = Get-ChildItem $snippetsDir -Directory -Filter "msve_spa-*" -ErrorAction SilentlyContinue
foreach ($dir in $snippetDirs) {
    $enDir = Join-Path $dir.FullName "en-US"
    if (-not (Test-Path $enDir)) { continue }
    $yml = Get-ChildItem $enDir -Filter "*.contentsnippet.yml" -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $yml) { continue }
    $ymlContent = Get-Content $yml.FullName -Raw -Encoding utf8
    $nameMatch = [regex]::Match($ymlContent, 'name:\s*(.+)')
    if ($nameMatch.Success) {
        [void]$snippetNames.Add($nameMatch.Groups[1].Value.Trim())
    }
}

$missingSnippets = $fbKeys | Where-Object { -not $snippetNames.Contains($_) } | Sort-Object
if ($missingSnippets.Count -gt 0) {
    foreach ($key in $missingSnippets) {
        Write-Host "  WARN: '$key' in fallback.ts but no Content Snippet file" -ForegroundColor DarkYellow
        $warnings++
    }
    Write-Host "  Run generate-snippets.ps1 to create missing snippets" -ForegroundColor DarkYellow
} else {
    Write-Host "  All fallback.ts keys have Content Snippets" -ForegroundColor Green
}

# ── 5. Check: orphaned Content Snippets ───────────────────────────────
Write-Host ""
Write-Host "Check 3: Content Snippets → fallback.ts (orphans)" -ForegroundColor Yellow
$orphaned = $snippetNames | Where-Object { -not $fbKeys.Contains($_) } | Sort-Object
if ($orphaned.Count -gt 0) {
    foreach ($key in $orphaned) {
        Write-Host "  WARN: Content Snippet '$key' exists but not in fallback.ts (orphaned)" -ForegroundColor DarkYellow
        $warnings++
    }
} else {
    Write-Host "  No orphaned Content Snippets" -ForegroundColor Green
}

# ── 6. Check: unused fallback keys ───────────────────────────────────
Write-Host ""
Write-Host "Check 4: Unused fallback.ts keys (not referenced by t())" -ForegroundColor Yellow
# Exclude dynamic keys that are composed via template literals
$unusedKeys = $fbKeys | Where-Object {
    -not $usedKeys.Contains($_) -and
    $_ -notmatch 'MSVE_SPA/Day/' -and       # Dynamic: t(`MSVE_SPA/Day/${...}`)
    $_ -notmatch 'MSVE_SPA/Status/' -and     # Dynamic: via helper functions
    $_ -notmatch 'MSVE_SPA/Location/'         # Dynamic: via getLocationLabel
} | Sort-Object

if ($unusedKeys.Count -gt 0) {
    foreach ($key in $unusedKeys) {
        Write-Host "  INFO: '$key' in fallback.ts but no direct t() call found" -ForegroundColor DarkGray
    }
} else {
    Write-Host "  All keys are referenced" -ForegroundColor Green
}

# ── Summary ───────────────────────────────────────────────────────────
Write-Host ""
if ($errors -gt 0) {
    Write-Host "FAILED: $errors error(s), $warnings warning(s)" -ForegroundColor Red
    exit 1
} elseif ($warnings -gt 0) {
    Write-Host "PASSED with $warnings warning(s)" -ForegroundColor Yellow
} else {
    Write-Host "PASSED: All checks green" -ForegroundColor Green
}
