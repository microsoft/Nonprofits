# Script purpose: rebuild the deployed Fabric asset names (using the same prefix/suffix rules as the
# Package Installer) and delete them by issuing REST calls through the Fabric CLI (`fab api`). The
# script loads the package definition, resolves prefix/suffix tokens (including dynamic instance
# names), locates the target workspace/folder, enumerates items inside that scope, and removes the
# matching ones in reverse deployment order so downstream dependencies (for example, notebooks that
# reference lakehouses) are removed after their dependents. It also supports preview mode through
# `-DryRun`/`-WhatIf` and cleans up the now-empty folder once all scoped items are deleted.
[CmdletBinding(SupportsShouldProcess = $true)]
param (
    [Parameter(Mandatory = $false)]
    [string]$PackageId = "Fundraising",

    [Parameter(Mandatory = $true)]
    [string]$WorkspaceName,

    [Parameter(Mandatory = $false)]
    [string]$FolderName = "Contoso",

    [Parameter(Mandatory = $false)]
    [string]$PackageInstanceName,

    [Parameter(Mandatory = $false)]
    [string]$DeploymentId,

    [Parameter(Mandatory = $false)]
    [string]$PackageRoot = (Join-Path $PSScriptRoot "..\..\Workload\app\assets\items\PackageInstallerItem"),

    [Parameter(Mandatory = $false)]
    [switch]$DryRun
)

<#!
.SYNOPSIS
    Removes Fabric items that were created by a Nonprofit Data Solutions package installation.

.DESCRIPTION
    Reads the selected package definition, reconstructs the deployed item names using the same
    prefix and suffix rules as the deployment workflow, deletes the items in reverse order, and
    removes the (now empty) Fabric folder. Use -DryRun or -WhatIf to preview the actions without
    making changes.

.PARAMETER PackageId
    Identifier of the package folder under Workload/app/assets/items/PackageInstallerItem.

.PARAMETER WorkspaceName
    Fabric workspace name (without the .Workspace suffix).

.PARAMETER FolderName
    Fabric folder containing the deployed items. Pass an empty string to target the workspace root.

.PARAMETER PackageInstanceName
    Display name that was used for the Package Installer item. Defaults to FolderName when needed.

.PARAMETER DeploymentId
    Deployment identifier whose value becomes the item name suffix when the package enables
    suffixItemNames. Required when suffixItemNames is true.

.PARAMETER PackageRoot
    Root folder that contains package definitions. Defaults to the repo location for package assets.

.PARAMETER DryRun
    Enables WhatIf-style dry runs even when the caller does not pass -WhatIf explicitly.
#>

Set-StrictMode -Version Latest

# Fix encoding issues with fab CLI Unicode output
$OutputEncoding = [System.Text.UTF8Encoding]::new()
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()

if ($DryRun.IsPresent) {
    $WhatIfPreference = $true
}

if (-not (Get-Command fab -ErrorAction SilentlyContinue)) {
    throw "fab CLI is required but was not found in PATH."
}

function Invoke-ExternalCommand {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory = $true)]
        [string]$FileName,

        [Parameter(Mandatory = $false)]
        [string[]]$Arguments = @()
    )

    $psi = [System.Diagnostics.ProcessStartInfo]::new()
    $psi.FileName = $FileName
    $psi.Arguments = ($Arguments -join ' ')
    $psi.UseShellExecute = $false
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8

    $proc = [System.Diagnostics.Process]::Start($psi)
    $stdout = $proc.StandardOutput.ReadToEnd()
    $stderr = $proc.StandardError.ReadToEnd()
    $proc.WaitForExit()

    $ansiRegex = [regex]'\u001b\[[0-9;]*[A-Za-z]'
    $cleanStdout = $ansiRegex.Replace($stdout, '')
    $cleanStderr = $ansiRegex.Replace($stderr, '')
    $cleanStdout = $cleanStdout -replace "`r`n", "`n"
    $cleanStderr = $cleanStderr -replace "`r`n", "`n"

    return [PSCustomObject]@{
        ExitCode = $proc.ExitCode
        Success = ($proc.ExitCode -eq 0)
        StandardOutput = $cleanStdout.Trim()
        StandardError = $cleanStderr.Trim()
    }
}

function Assert-FabricAuthentication {
    $result = Invoke-ExternalCommand -FileName 'fab' -Arguments @('auth', 'status')
    if (-not $result.Success) {
        throw "Fabric authentication check failed. fab auth status returned exit code $($result.ExitCode). $($result.StandardError)"
    }
}

Assert-FabricAuthentication

function Invoke-FabricApi {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory = $true)]
        [string]$Endpoint,

        [Parameter(Mandatory = $false)]
        [ValidateSet('GET', 'POST', 'PUT', 'PATCH', 'DELETE')]
        [string]$Method = 'GET',

        [Parameter(Mandatory = $false)]
        [object]$Body,

        [Parameter(Mandatory = $false)]
        [hashtable]$Headers
    )

    $basePath = if ($Endpoint -match '^https?://') {
        $Endpoint
    } else {
        if ($Endpoint.StartsWith('/')) { $Endpoint.Substring(1) } else { $Endpoint }
    }

    $args = @('api', '-X', $Method.ToLowerInvariant(), $basePath)

    if ($Body) {
        $jsonBody = $Body | ConvertTo-Json -Depth 10
        $args += @('-d', $jsonBody)
    }

    $result = Invoke-ExternalCommand -FileName 'fab' -Arguments $args
    if (-not $result.Success) {
        throw "fabric CLI api call failed ($Method $Endpoint): $($result.StandardError)"
    }

    if ([string]::IsNullOrWhiteSpace($result.StandardOutput)) {
        return $null
    }

    try {
        return $result.StandardOutput | ConvertFrom-Json
    }
    catch {
        throw "Unable to parse fabric CLI api response for ($Method $Endpoint): $($_.Exception.Message)"
    }
}

function Get-FabricWorkspace {
    param (
        [Parameter(Mandatory = $true)]
        [string]$DisplayName
    )

    $response = Invoke-FabricApi -Endpoint 'workspaces'
    $payload = if ($response -and $response.PSObject.Properties['text']) { $response.text } else { $response }
    $workspaces = @()
    if ($payload -and $payload.PSObject.Properties['value']) {
        $workspaces = @($payload.value)
    } elseif ($payload) {
        $workspaces = @($payload)
    }

    $trimmedTarget = $DisplayName.Trim()
    $workspace = $workspaces | Where-Object {
        [string]::Equals($_.displayName, $DisplayName, [System.StringComparison]::OrdinalIgnoreCase) -or
        [string]::Equals($_.displayName.Trim(), $trimmedTarget, [System.StringComparison]::OrdinalIgnoreCase)
    } | Select-Object -First 1

    if (-not $workspace) {
        throw "Workspace '$DisplayName' was not found via Fabric API."
    }

    return $workspace
}

function Get-FabricFolder {
    param (
        [Parameter(Mandatory = $true)]
        [string]$WorkspaceId,

        [Parameter(Mandatory = $true)]
        [string]$FolderName
    )

    $response = Invoke-FabricApi -Endpoint "workspaces/$WorkspaceId/folders"
    $payload = if ($response -and $response.PSObject.Properties['text']) { $response.text } else { $response }
    $folders = @()
    if ($payload -and $payload.PSObject.Properties['value']) {
        $folders = @($payload.value)
    } elseif ($payload) {
        $folders = @($payload)
    }

    if ($folders.Count -eq 0) {
        throw "Workspace $WorkspaceId does not contain any folders."
    }

    $segments = $FolderName -split '[\\/]'
    $segments = @($segments | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    if ($segments.Count -eq 0) {
        throw "Folder path '$FolderName' is invalid."
    }

    $currentParentId = $null
    $currentFolder = $null

    for ($i = 0; $i -lt $segments.Count; $i++) {
        $segment = $segments[$i]
        $trimmedSegment = $segment.Trim()
        $matches = $folders | Where-Object {
            [string]::Equals($_.displayName.Trim(), $trimmedSegment, [System.StringComparison]::OrdinalIgnoreCase) -and (
                ($currentParentId -and $_.PSObject.Properties['parentFolderId'] -and $_.parentFolderId -eq $currentParentId) -or
                (-not $currentParentId -and (-not $_.PSObject.Properties['parentFolderId'] -or [string]::IsNullOrWhiteSpace([string]$_.parentFolderId)))
            )
        }

        $currentFolder = $matches | Select-Object -First 1
        if (-not $currentFolder) {
            $pathSoFar = ($segments[0..$i] -join '/')
            throw "Folder segment '$segment' was not found in workspace $WorkspaceId (path: $pathSoFar)."
        }

        $currentParentId = $currentFolder.id
    }

    return $currentFolder
}

function Get-FabricWorkspaceItems {
    param (
        [Parameter(Mandatory = $true)]
        [string]$WorkspaceId
    )

    $response = Invoke-FabricApi -Endpoint "workspaces/$WorkspaceId/items"
    $payload = if ($response -and $response.PSObject.Properties['text']) { $response.text } else { $response }

    if ($payload -and $payload.PSObject.Properties['value']) {
        return @($payload.value)
    }

    if ($payload) {
        return @($payload)
    }

    return @()
}

function Remove-FabricItemById {
    param (
        [Parameter(Mandatory = $true)]
        [string]$WorkspaceId,

        [Parameter(Mandatory = $true)]
        [string]$ItemId
    )

    Invoke-FabricApi -Endpoint "workspaces/$WorkspaceId/items/$ItemId" -Method 'DELETE' | Out-Null
}

function Remove-FabricFolderById {
    param (
        [Parameter(Mandatory = $true)]
        [string]$WorkspaceId,

        [Parameter(Mandatory = $true)]
        [string]$FolderId
    )

    Invoke-FabricApi -Endpoint "workspaces/$WorkspaceId/folders/$FolderId" -Method 'DELETE' | Out-Null
}

function Resolve-PrefixValue {
    param (
        [Parameter(Mandatory = $false)]
        $RawPrefix,

        [Parameter(Mandatory = $false)]
        [string]$InstanceName,

        [Parameter(Mandatory = $false)]
        [string]$PackageId,

        [Parameter(Mandatory = $false)]
        [string]$PackageDisplayName
    )

    if ($null -eq $RawPrefix -or [string]::IsNullOrWhiteSpace([string]$RawPrefix)) {
        return ''
    }

    $rawString = [string]$RawPrefix
    if ($rawString -eq 'PackageInstallerItemName') {
        $candidate = ''
        if ($InstanceName) {
            $candidate = $InstanceName.Trim()
        }
        if (-not $candidate) {
            if ($PackageId) {
                $candidate = $PackageId.Trim()
            } elseif ($PackageDisplayName) {
                $candidate = $PackageDisplayName.Trim()
            }
        }
        if (-not $candidate) {
            return ''
        }
        if ($candidate.EndsWith('_')) {
            return $candidate
        }
        return "${candidate}_"
    }

    return $rawString
}

function Resolve-SuffixValue {
    param (
        [Parameter(Mandatory = $true)]
        [bool]$UseSuffix,

        [Parameter(Mandatory = $false)]
        [string]$DeploymentId
    )

    if (-not $UseSuffix) {
        return ''
    }

    $trimmed = if ($DeploymentId) { $DeploymentId.Trim() } else { '' }
    if (-not $trimmed) {
        throw "DeploymentId is required because suffixItemNames is enabled for this package."
    }

    return "_${trimmed}"
}

if (-not $PackageInstanceName -and $FolderName) {
    $segments = @($FolderName -split '[\\/]' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    if ($segments.Count -gt 0) {
        $PackageInstanceName = $segments[-1]
        Write-Verbose "Defaulted PackageInstanceName to final folder segment '$PackageInstanceName'"
    } else {
        $PackageInstanceName = $FolderName
    }
}

$packageFolder = Join-Path $PackageRoot $PackageId
if (-not (Test-Path $packageFolder)) {
    throw "Package folder not found: $packageFolder"
}

$packageFile = Join-Path $packageFolder 'package.json'
if (-not (Test-Path $packageFile)) {
    throw "Unable to locate package.json at $packageFile"
}

Write-Verbose "Loading package definition from $packageFile"
$packageDefinition = Get-Content -Path $packageFile -Raw | ConvertFrom-Json

if (-not $packageDefinition.items) {
    Write-Warning "Package $PackageId does not define any deployable items."
    return
}

$deploymentConfig = $packageDefinition.deploymentConfig
$useSuffix = $false
if ($deploymentConfig -and $deploymentConfig.PSObject.Properties['suffixItemNames']) {
    $useSuffix = [bool]$deploymentConfig.suffixItemNames
}

$rawPrefix = $null
if ($deploymentConfig -and $deploymentConfig.PSObject.Properties['prefixItemNames']) {
    $rawPrefix = $deploymentConfig.prefixItemNames
}

$resolvedPrefix = Resolve-PrefixValue -RawPrefix $rawPrefix -InstanceName $PackageInstanceName -PackageId $packageDefinition.id -PackageDisplayName $packageDefinition.displayName
$resolvedSuffix = Resolve-SuffixValue -UseSuffix $useSuffix -DeploymentId $DeploymentId

Write-Verbose "Resolved prefix: '$resolvedPrefix'"
Write-Verbose "Resolved suffix: '$resolvedSuffix'"

$packageItems = @($packageDefinition.items)
if ($packageItems.Count -eq 0) {
    Write-Warning "Package $PackageId does not contain any items to remove."
    return
}

$workspace = Get-FabricWorkspace -DisplayName $WorkspaceName
$workspaceId = $workspace.id
Write-Verbose "Resolved workspace '$WorkspaceName' to id $workspaceId"

$targetFolderId = $null
$folderLabel = $null
if ($FolderName) {
    $folderInfo = Get-FabricFolder -WorkspaceId $workspaceId -FolderName $FolderName
    $targetFolderId = $folderInfo.id
    $folderLabel = "Folder $FolderName"
    Write-Verbose "Resolved folder '$FolderName' to id $targetFolderId"
}

$workspaceItems = Get-FabricWorkspaceItems -WorkspaceId $workspaceId
$itemsInScope = @($workspaceItems | Where-Object {
    if ($targetFolderId) {
        return ($_.PSObject.Properties['folderId'] -and $_.folderId -eq $targetFolderId)
    }
    return -not $_.PSObject.Properties['folderId'] -or [string]::IsNullOrWhiteSpace([string]$_.folderId)
})

$existingLookup = @{}
foreach ($existing in $itemsInScope) {
    if (-not $existing.displayName -or -not $existing.type) {
        continue
    }
    $key = ("{0}.{1}" -f $existing.displayName, $existing.type).ToLowerInvariant()
    $existingLookup[$key] = $existing
}

$removedItems = New-Object System.Collections.Generic.List[string]
$missingItems = New-Object System.Collections.Generic.List[string]
$failedItems = New-Object System.Collections.Generic.List[string]
$skippedItems = New-Object System.Collections.Generic.List[string]

for ($index = $packageItems.Count - 1; $index -ge 0; $index--) {
    $item = $packageItems[$index]
    if (-not $item.displayName -or -not $item.type) {
        Write-Verbose "Skipping package entry at index $index because displayName or type is missing."
        continue
    }

    $decoratedName = "${resolvedPrefix}$($item.displayName)$resolvedSuffix"
    $fabricItemLeaf = "${decoratedName}.$($item.type)"
    $lookupKey = $fabricItemLeaf.ToLowerInvariant()

    if (-not $existingLookup.ContainsKey($lookupKey)) {
        Write-Warning "Item not found in Fabric folder scope: $fabricItemLeaf"
        $missingItems.Add($fabricItemLeaf) | Out-Null
        continue
    }

    if (-not $PSCmdlet.ShouldProcess($fabricItemLeaf, "Remove Fabric item via REST API")) {
        Write-Verbose "Skipping removal of $fabricItemLeaf (WhatIf/DryRun)."
        $skippedItems.Add($fabricItemLeaf) | Out-Null
        continue
    }

    $existingItem = $existingLookup[$lookupKey]
    Write-Host "Removing $fabricItemLeaf" -ForegroundColor Cyan

    try {
        Remove-FabricItemById -WorkspaceId $workspaceId -ItemId $existingItem.id
        $removedItems.Add($fabricItemLeaf) | Out-Null
        $existingLookup.Remove($lookupKey) | Out-Null
    }
    catch {
        $warningMessage = "Failed to remove {0}: {1}" -f $fabricItemLeaf, $_.Exception.Message
        Write-Warning $warningMessage
        $failedItems.Add($fabricItemLeaf) | Out-Null
    }
}

if ($targetFolderId) {
    $remainingInFolder = @(Get-FabricWorkspaceItems -WorkspaceId $workspaceId | Where-Object { $_.PSObject.Properties['folderId'] -and $_.folderId -eq $targetFolderId })
    if ($remainingInFolder.Count -gt 0) {
        $names = $remainingInFolder | ForEach-Object { "{0}.{1}" -f $_.displayName, $_.type }
        Write-Verbose "Folder $FolderName still contains items: $($names -join ', ')"
    } else {
        if ($PSCmdlet.ShouldProcess($folderLabel, "Remove empty Fabric folder via REST API")) {
            try {
                Remove-FabricFolderById -WorkspaceId $workspaceId -FolderId $targetFolderId
                Write-Host "Removed empty folder $FolderName" -ForegroundColor Green
            }
            catch {
                $warningMessage = "Failed to remove folder {0}: {1}" -f $FolderName, $_.Exception.Message
                Write-Warning $warningMessage
                $failedItems.Add($folderLabel) | Out-Null
            }
        } else {
            Write-Verbose "Skipping removal of folder $FolderName (WhatIf/DryRun)."
            $skippedItems.Add($folderLabel) | Out-Null
        }
    }
}

Write-Host ""  # spacer
Write-Host "Cleanup summary" -ForegroundColor White
Write-Host "----------------" -ForegroundColor White
Write-Host "Removed: $($removedItems.Count)"
Write-Host "Missing: $($missingItems.Count)"
Write-Host "Failed: $($failedItems.Count)"
Write-Host "Skipped: $($skippedItems.Count)"

if ($missingItems.Count -gt 0) {
    Write-Host "Missing items:" -ForegroundColor Yellow
    $missingItems | ForEach-Object { Write-Host "  $_" }
}

if ($failedItems.Count -gt 0) {
    Write-Host "Failed items:" -ForegroundColor Red
    $failedItems | ForEach-Object { Write-Host "  $_" }
}

if ($skippedItems.Count -gt 0) {
    Write-Host "Skipped items (WhatIf/DryRun):" -ForegroundColor Cyan
    $skippedItems | ForEach-Object { Write-Host "  $_" }
}
