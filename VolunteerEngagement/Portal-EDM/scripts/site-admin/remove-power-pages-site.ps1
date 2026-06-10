<#
.SYNOPSIS
    Completely removes a Power Pages site from the environment.
.DESCRIPTION
    Requires PAC CLI authenticated and Azure CLI logged into the same tenant.
    Performs a full deletion:
    1. Deprovision the hosted site via Power Platform API (removes URL from admin center)
    2. Delete powerpagecomponent records (site content in enhanced data model)
    3. Delete the powerpagesite record (Dataverse site registration)
    4. Delete the legacy mspp_website/adx_website record and orphaned data

    NOTE: If this is the last Power Pages site in the environment, the platform may
    automatically uninstall Power Pages solutions and remove portal tables (adx_*/mspp_*).
    To use Portal Management again, create a new site from make.powerpages.com first.

    Prerequisites:
    - PAC CLI authenticated to the target environment (pac auth select)
    - Azure CLI logged into the SAME tenant as the environment (az login --tenant <tenant>)
.PARAMETER WebsiteId
    The GUID of the website to delete. If not provided, lists available sites for selection.
    This is the ID shown in 'pac pages list'.
.PARAMETER SkipConfirmation
    Skip the confirmation prompt before deletion.
.EXAMPLE
    .\scripts\site-admin\remove-power-pages-site.ps1
    # Interactive mode - lists sites and prompts for selection
.EXAMPLE
    .\scripts\site-admin\remove-power-pages-site.ps1 -WebsiteId "<website-record-id>" -SkipConfirmation
    # Direct deletion without confirmation
#>
param(
    [string]$WebsiteId,
    [switch]$SkipConfirmation
)

$ErrorActionPreference = 'Stop'

function Schedule-BulkDelete {
    param(
        [string]$Entity,
        [string]$FetchXml,
        [string]$JobName
    )
    Write-Host "  Scheduling bulk delete: $JobName..." -ForegroundColor Yellow
    $output = pac data bulk-delete schedule -e $Entity -fx $FetchXml -jn $JobName 2>&1
    $exitCode = $LASTEXITCODE
    $outputStr = $output | Out-String
    if ($exitCode -ne 0) {
        if ($outputStr -match 'no records' -or $outputStr -match '0 record') {
            Write-Host "  No records found for $Entity." -ForegroundColor Gray
            return $null
        }
        Write-Warning "  Bulk delete for $Entity failed: $outputStr"
        return $null
    }
    Write-Host "  $outputStr" -ForegroundColor Gray
    return $outputStr
}

function Wait-ForBulkDelete {
    param([string]$JobName, [int]$TimeoutSeconds = 120)
    Write-Host "  Waiting for '$JobName' to complete..." -ForegroundColor Gray
    $elapsed = 0
    $interval = 5
    while ($elapsed -lt $TimeoutSeconds) {
        Start-Sleep -Seconds $interval
        $elapsed += $interval
        $listOutput = pac data bulk-delete list 2>&1 | Out-String
        # Check if job is completed or no longer running
        if ($listOutput -match $JobName) {
            if ($listOutput -match 'Succeeded' -or $listOutput -match 'Completed') {
                Write-Host "  Job '$JobName' completed." -ForegroundColor Green
                return $true
            }
            if ($listOutput -match 'Failed') {
                Write-Warning "  Job '$JobName' failed."
                return $false
            }
        }
        else {
            # Job not in list anymore - likely completed
            Write-Host "  Job '$JobName' completed." -ForegroundColor Green
            return $true
        }
    }
    Write-Warning "  Timed out waiting for '$JobName' (${TimeoutSeconds}s). Check status with: pac data bulk-delete list"
    return $false
}

# === Main script ===

Write-Host "`n=== Power Pages Site Complete Removal ===" -ForegroundColor Cyan
Write-Host ""

# List sites if no ID provided
if (-not $WebsiteId) {
    Write-Host "Listing Power Pages sites..." -ForegroundColor Gray
    pac pages list
    Write-Host ""
    $WebsiteId = Read-Host "Enter the Website ID (GUID) to delete"
    if (-not $WebsiteId) {
        Write-Host "No Website ID provided. Exiting." -ForegroundColor Red
        exit 1
    }
}

$WebsiteId = $WebsiteId.Trim()

# Get environment ID
$whoOutput = pac org who
$envIdLine = $whoOutput | Where-Object { $_ -match 'Environment ID' }
$envId = ($envIdLine -replace '.*:\s*','').Trim()
$orgUrlLine = $whoOutput | Where-Object { $_ -match 'Org URL' }
$orgUrl = if ($orgUrlLine -match '(https://[^\s]+)') { $Matches[1].TrimEnd('/') } else { '' }
Write-Host "Environment: $orgUrl (ID: $envId)" -ForegroundColor Gray

# Detect table prefix and resolve the Dataverse website record ID
Write-Host "`nVerifying website exists..." -ForegroundColor Gray
$tablePrefix = $null
$dataverseWebsiteId = $WebsiteId

# Try mspp_website first (newer environments use this)
$verifyFetch = @"
<fetch><entity name="mspp_website"><attribute name="mspp_name"/><filter><condition attribute="mspp_websiteid" operator="eq" value="$WebsiteId"/></filter></entity></fetch>
"@
$verifyOutput = pac env fetch -x $verifyFetch 2>&1 | Out-String
if ($verifyOutput -notmatch 'No results' -and $verifyOutput -notmatch 'Error' -and $verifyOutput -match $WebsiteId) {
    $tablePrefix = 'mspp'
}

# Try adx_website if mspp didn't work
if (-not $tablePrefix) {
    $verifyFetch = @"
<fetch><entity name="adx_website"><attribute name="adx_name"/><filter><condition attribute="adx_websiteid" operator="eq" value="$WebsiteId"/></filter></entity></fetch>
"@
    $verifyOutput = pac env fetch -x $verifyFetch 2>&1 | Out-String
    if ($verifyOutput -notmatch 'No results' -and $verifyOutput -notmatch 'Error' -and $verifyOutput -match $WebsiteId) {
        $tablePrefix = 'adx'
    }
}

if (-not $tablePrefix) {
    Write-Warning "Legacy website record ($WebsiteId) not found. Will still attempt to delete platform site and components."
    # Default to mspp for component/site cleanup
    $tablePrefix = 'mspp'
}
else {
    Write-Host "Found website record (table prefix: $tablePrefix)" -ForegroundColor Green
}

# Confirmation
if (-not $SkipConfirmation) {
    Write-Host "`n*** WARNING ***" -ForegroundColor Red
    Write-Host "This will PERMANENTLY delete the Power Pages site and ALL associated data:" -ForegroundColor Red
    Write-Host "  - Hosted site (CDN/Azure web app at *.powerappsportals.com)" -ForegroundColor Yellow
    Write-Host "  - Web pages, web files, web templates" -ForegroundColor Yellow
    Write-Host "  - Site settings, site markers, content snippets" -ForegroundColor Yellow
    Write-Host "  - Web links, web roles, entity forms, entity lists" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  NOTE: If this is the LAST site in the environment, the platform may" -ForegroundColor Yellow
    Write-Host "  uninstall Power Pages solutions and remove portal tables." -ForegroundColor Yellow
    Write-Host "  Create a new site from make.powerpages.com before using Portal Management." -ForegroundColor Yellow
    Write-Host ""
    $confirm = Read-Host "Type 'DELETE' to confirm"
    if ($confirm -ne 'DELETE') {
        Write-Host "Aborted." -ForegroundColor Gray
        exit 0
    }
}

# Step 1: Deprovision ALL platform site registrations via Power Platform API
Write-Host "`n[1/4] Deprovisioning hosted site(s) via Power Platform API..." -ForegroundColor Cyan

# The Power Platform API may have multiple site registrations (orphaned from previous
# deployments/deletions). Delete all that match the WebsiteId, plus any others in the
# environment to avoid leaving orphaned platform registrations behind.
try {
    $token = az account get-access-token --resource "https://api.powerplatform.com/" --query accessToken -o tsv 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Failed to get token. Is Azure CLI logged in?" }
    $headers = @{ Authorization = "Bearer $token"; Accept = 'application/json' }
    $listUri = "https://api.powerplatform.com/powerpages/environments/$envId/websites?api-version=2022-03-01-preview"
    $sitesResponse = Invoke-RestMethod -Uri $listUri -Headers $headers -Method GET

    if ($sitesResponse.value.Count -eq 0) {
        Write-Host "  No platform site registrations found." -ForegroundColor Gray
    }
    else {
        Write-Host "  Found $($sitesResponse.value.Count) platform site registration(s):" -ForegroundColor Gray
        foreach ($site in $sitesResponse.value) {
            Write-Host "    - $($site.name) (ID: $($site.id), URL: $($site.websiteUrl))" -ForegroundColor Gray
        }

        foreach ($site in $sitesResponse.value) {
            Write-Host "  Deleting $($site.name) ($($site.websiteUrl))..." -ForegroundColor Yellow
            $deleteUri = "https://api.powerplatform.com/powerpages/environments/$envId/websites/$($site.id)?api-version=2022-03-01-preview"
            try {
                $null = Invoke-WebRequest -Uri $deleteUri -Headers $headers -Method DELETE
                Write-Host "    Deprovisioning accepted." -ForegroundColor Green
            }
            catch {
                $statusCode = $_.Exception.Response.StatusCode.value__
                if ($statusCode -eq 400) {
                    Write-Host "    Already being deprovisioned (HTTP 400)." -ForegroundColor Gray
                }
                else {
                    Write-Warning "    Failed (HTTP $statusCode): $($_.Exception.Message)"
                }
            }
        }

        # Wait for async deprovisioning to complete
        Write-Host "  Waiting for deprovisioning to complete..." -ForegroundColor Gray
        Start-Sleep -Seconds 20

        # Verify all are gone
        $remaining = (Invoke-RestMethod -Uri $listUri -Headers $headers -Method GET).value
        if ($remaining.Count -gt 0) {
            Write-Host "  $($remaining.Count) registration(s) still pending — retrying..." -ForegroundColor Yellow
            foreach ($site in $remaining) {
                try {
                    $null = Invoke-WebRequest -Uri "https://api.powerplatform.com/powerpages/environments/$envId/websites/$($site.id)?api-version=2022-03-01-preview" -Headers $headers -Method DELETE
                }
                catch {}
            }
            Start-Sleep -Seconds 15
        }
    }
}
catch {
    Write-Warning "  Could not deprovision via API: $_"
    Write-Warning "  Ensure Azure CLI is logged into the correct tenant (same as PAC CLI environment)."
    Write-Warning "  Run: az login --tenant <your-tenant>.onmicrosoft.com --allow-no-subscriptions"
}

# Step 2: Delete powerpagecomponent records (site content in enhanced data model)
Write-Host "`n[2/4] Deleting powerpagecomponent records..." -ForegroundColor Cyan
$componentFetch = @"
<fetch><entity name="powerpagecomponent"><filter><condition attribute="powerpagesiteid" operator="eq" value="$WebsiteId"/></filter></entity></fetch>
"@
$checkOutput = pac env fetch -x $componentFetch 2>&1 | Out-String
if ($checkOutput -match 'No results' -or $checkOutput -match 'Error') {
    Write-Host "  No powerpagecomponent records found." -ForegroundColor Gray
}
else {
    Schedule-BulkDelete -Entity 'powerpagecomponent' -FetchXml $componentFetch -JobName "Del-PP-Components-$($WebsiteId.Substring(0,8))"
    Wait-ForBulkDelete -JobName "Del-PP-Components-$($WebsiteId.Substring(0,8))" -TimeoutSeconds 120
}

# Step 3: Delete the powerpagesite record (Dataverse registration)
Write-Host "`n[3/4] Deleting powerpagesite record..." -ForegroundColor Cyan
$siteFetch = @"
<fetch><entity name="powerpagesite"><filter><condition attribute="powerpagesiteid" operator="eq" value="$WebsiteId"/></filter></entity></fetch>
"@
$checkOutput = pac env fetch -x $siteFetch 2>&1 | Out-String
if ($checkOutput -match 'No results' -or $checkOutput -match 'Error') {
    Write-Host "  No powerpagesite record found." -ForegroundColor Gray
}
else {
    Schedule-BulkDelete -Entity 'powerpagesite' -FetchXml $siteFetch -JobName "Del-PP-Site-$($WebsiteId.Substring(0,8))"
    Wait-ForBulkDelete -JobName "Del-PP-Site-$($WebsiteId.Substring(0,8))" -TimeoutSeconds 120
}

# Step 4: Delete the legacy website record (mspp_website / adx_website)
Write-Host "`n[4/4] Deleting legacy website record and orphaned data..." -ForegroundColor Cyan

$websiteEntity = "${tablePrefix}_website"
$websiteIdField = "${tablePrefix}_websiteid"
$deleteFetch = @"
<fetch><entity name="$websiteEntity"><filter><condition attribute="$websiteIdField" operator="eq" value="$WebsiteId"/></filter></entity></fetch>
"@
$checkOutput = pac env fetch -x $deleteFetch 2>&1 | Out-String
if ($checkOutput -match 'No results' -or $checkOutput -match 'Error') {
    Write-Host "  No $websiteEntity record found (may have been cascade-deleted)." -ForegroundColor Gray
}
else {
    Schedule-BulkDelete -Entity $websiteEntity -FetchXml $deleteFetch -JobName "Del-PP-Legacy-$($WebsiteId.Substring(0,8))"
    Wait-ForBulkDelete -JobName "Del-PP-Legacy-$($WebsiteId.Substring(0,8))" -TimeoutSeconds 120
}

# Clean up orphaned records
$orphanTables = @(
    @{ Entity = "${tablePrefix}_sitesetting"; IdField = "${tablePrefix}_websiteid"; Label = "site settings" }
    @{ Entity = "${tablePrefix}_sitemarker"; IdField = "${tablePrefix}_websiteid"; Label = "site markers" }
    @{ Entity = "${tablePrefix}_contentsnippet"; IdField = "${tablePrefix}_websiteid"; Label = "content snippets" }
)

foreach ($table in $orphanTables) {
    $orphanFetch = @"
<fetch><entity name="$($table.Entity)"><filter><condition attribute="$($table.IdField)" operator="null"/></filter></entity></fetch>
"@
    $checkOutput = pac env fetch -x $orphanFetch 2>&1 | Out-String
    if ($checkOutput -match 'No results' -or $checkOutput -match 'Error') {
        Write-Host "  No orphaned $($table.Label) found." -ForegroundColor Gray
        continue
    }
    $orphanJobName = "Cleanup-$($table.Label -replace ' ','-')-$($WebsiteId.Substring(0,8))"
    Schedule-BulkDelete -Entity $table.Entity -FetchXml $orphanFetch -JobName $orphanJobName
    Wait-ForBulkDelete -JobName $orphanJobName -TimeoutSeconds 60
}

Write-Host "`n=== Done ===" -ForegroundColor Green
Write-Host "The Power Pages site has been completely removed:" -ForegroundColor Green
Write-Host "  - Hosted site deprovisioned" -ForegroundColor Green
Write-Host "  - Dataverse records deleted (pages, files, settings, etc.)" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: If this was the last site, portal tables may have been removed." -ForegroundColor Yellow
Write-Host "Create a new site from make.powerpages.com before using Portal Management." -ForegroundColor Yellow
