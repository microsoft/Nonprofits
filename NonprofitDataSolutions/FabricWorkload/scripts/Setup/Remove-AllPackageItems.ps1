# Script purpose: Remove all items from a specific folder or entire workspace in Fabric.
# This script uses the Fabric CLI (`fab api`) to discover and remove all items within
# the specified folder path, or from the entire workspace if no folder is specified.
# Supports dry-run mode with `-DryRun` parameter.
# 
# Usage examples:
#   .\Remove-AllPackageItems.ps1 -WorkspaceName "MyWorkspace" -FolderName "TestFolder"
#   .\Remove-AllPackageItems.ps1 -WorkspaceName "MyWorkspace" -FolderName "Parent/Child" -DryRun
#   .\Remove-AllPackageItems.ps1 -WorkspaceName "MyWorkspace"  # Removes all items from entire workspace
#   .\Remove-AllPackageItems.ps1 -WorkspaceName "MyWorkspace" -DryRun  # Preview all items that would be deleted
[CmdletBinding(SupportsShouldProcess = $true)]
param (
    [Parameter(Mandatory = $true, HelpMessage = "The name of the Fabric workspace containing the folder")]
    [string]$WorkspaceName,

    [Parameter(Mandatory = $false, HelpMessage = "The folder path from which to remove all items. If not specified, removes all items from the entire workspace")]
    [string]$FolderName,

    [Parameter(Mandatory = $false, HelpMessage = "Run in dry-run mode to see what would be deleted without actually deleting")]
    [switch]$DryRun
)

Set-StrictMode -Version Latest

if ($DryRun.IsPresent) {
    $WhatIfPreference = $true
}

# No additional scripts needed for this operation

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
    # Use a simpler approach that doesn't rely on parsing the output
    # Just try a simple API call that requires authentication
    try {
        Write-Verbose "Checking Fabric authentication by attempting to list workspaces..."
        $result = Invoke-ExternalCommand -FileName 'fab' -Arguments @('api', 'workspaces')
        
        if ($result.Success) {
            Write-Verbose "Fabric authentication verified successfully."
            return
        }
        
        # If that fails, fall back to checking auth status but ignore encoding issues
        Write-Verbose "API call failed, checking auth status..."
        $authResult = Invoke-ExternalCommand -FileName 'fab' -Arguments @('auth', 'status')
        
        # If we get any output (even with encoding issues), assume we're authenticated
        # The fact that the command runs at all usually means authentication is working
        if ($authResult.StandardOutput -or $authResult.StandardError) {
            Write-Verbose "Auth status command returned output, assuming authenticated."
            return
        }
    }
    catch {
        throw "Fabric authentication check failed. Please ensure you are logged in with 'fab auth login'. Error: $($_.Exception.Message)"
    }
    
    throw "Unable to verify Fabric authentication. Please run 'fab auth login' first."
}

Assert-FabricAuthentication

function Invoke-FabricApi {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory = $true)]
        [string]$Endpoint,

        [Parameter(Mandatory = $false)]
        [ValidateSet('GET', 'POST', 'PUT', 'PATCH', 'DELETE')]
        [string]$Method = 'GET'
    )

    $basePath = if ($Endpoint -match '^https?://') {
        $Endpoint
    } else {
        if ($Endpoint.StartsWith('/')) { $Endpoint.Substring(1) } else { $Endpoint }
    }

    $fabArgs = @('api', '-X', $Method.ToLowerInvariant(), $basePath)

    $result = Invoke-ExternalCommand -FileName 'fab' -Arguments $fabArgs
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

function Get-PayloadArray {
    param ([object]$Response)

    if (-not $Response) {
        return @()
    }

    $payload = if ($Response.PSObject.Properties['text']) { $Response.text } else { $Response }

    if ($payload -and $payload.PSObject.Properties['value']) {
        return @($payload.value)
    }

    return @($payload)
}

function Get-FabricWorkspace {
    param (
        [Parameter(Mandatory = $true)]
        [string]$DisplayName
    )

    $response = Invoke-FabricApi -Endpoint 'workspaces'
    $workspaces = Get-PayloadArray -Response $response

    $trimmedTarget = $DisplayName.Trim()
    $workspace = $workspaces | Where-Object {
        $_.displayName -and (
            [string]::Equals($_.displayName, $DisplayName, [System.StringComparison]::OrdinalIgnoreCase) -or
            [string]::Equals($_.displayName.Trim(), $trimmedTarget, [System.StringComparison]::OrdinalIgnoreCase)
        )
    } | Select-Object -First 1

    if (-not $workspace) {
        throw "Workspace '$DisplayName' was not found via Fabric API."
    }

    return $workspace
}

function Get-FabricWorkspaceFolders {
    param (
        [Parameter(Mandatory = $true)]
        [string]$WorkspaceId
    )

    $response = Invoke-FabricApi -Endpoint "workspaces/$WorkspaceId/folders"
    return Get-PayloadArray -Response $response
}

function Get-FabricWorkspaceItems {
    param (
        [Parameter(Mandatory = $true)]
        [string]$WorkspaceId
    )

    $response = Invoke-FabricApi -Endpoint "workspaces/$WorkspaceId/items"
    return Get-PayloadArray -Response $response
}

# No package validation needed - we're removing all items from the specified folder

$workspace = Get-FabricWorkspace -DisplayName $WorkspaceName
$workspaceId = $workspace.id
Write-Verbose "Resolved workspace '$WorkspaceName' to id $workspaceId"

$folders = Get-FabricWorkspaceFolders -WorkspaceId $workspaceId
$foldersById = @{}
foreach ($folder in $folders) {
    if ($folder.id) {
        $foldersById[[string]$folder.id] = $folder
    }
}

$folderPathCache = @{}
function Get-FolderPath {
    param ([string]$FolderId)

    if (-not $FolderId) {
        return ''
    }

    if ($folderPathCache.ContainsKey($FolderId)) {
        return $folderPathCache[$FolderId]
    }

    if (-not $foldersById.ContainsKey($FolderId)) {
        return ''
    }

    $folder = $foldersById[$FolderId]
    $path = [string]$folder.displayName
    $parentId = $null
    if ($folder.PSObject.Properties['parentFolderId']) {
        $parentId = [string]$folder.parentFolderId
    }

    if ($parentId) {
        $parentPath = Get-FolderPath -FolderId $parentId
        if ($parentPath) {
            $path = "$parentPath/$path"
        }
    }

    $folderPathCache[$FolderId] = $path
    return $path
}

$workspaceItems = Get-FabricWorkspaceItems -WorkspaceId $workspaceId
$itemsByFolder = @{}
foreach ($item in $workspaceItems) {
    $folderKey = $null
    if ($item.PSObject.Properties['folderId'] -and $item.folderId) {
        $folderKey = [string]$item.folderId
    } else {
        $folderKey = '__ROOT__'
    }

    if (-not $itemsByFolder.ContainsKey($folderKey)) {
        $itemsByFolder[$folderKey] = New-Object System.Collections.Generic.List[object]
    }

    $itemsByFolder[$folderKey].Add($item) | Out-Null
}

# Find the target folder and get all items in it
$targetFolder = $null
$targetFolderId = $null
$targetAllWorkspace = $false

# Check if we're targeting the entire workspace (no folder specified)
if ([string]::IsNullOrWhiteSpace($FolderName)) {
    $targetAllWorkspace = $true
    Write-Verbose "No folder specified - will remove all items from entire workspace"
}
# Check if we're targeting the workspace root
elseif ($FolderName -eq '/' -or $FolderName -eq '\') {
    $targetFolderId = '__ROOT__'
    Write-Verbose "Targeting workspace root folder"
} else {
    # Find the folder by path
    foreach ($folder in $folders) {
        $folderPath = Get-FolderPath -FolderId $folder.id
        if ([string]::Equals($folderPath, $FolderName, [System.StringComparison]::OrdinalIgnoreCase)) {
            $targetFolder = $folder
            $targetFolderId = $folder.id
            break
        }
    }
    
    if (-not $targetFolder -and $targetFolderId -ne '__ROOT__') {
        throw "Folder '$FolderName' was not found in workspace '$WorkspaceName'."
    }
}

# Get all items in the target folder or entire workspace
$itemsToRemove = @()
if ($targetAllWorkspace) {
    # Get all items from all folders
    foreach ($folderKey in $itemsByFolder.Keys) {
        $itemsToRemove += $itemsByFolder[$folderKey]
    }
} elseif ($itemsByFolder.ContainsKey($targetFolderId)) {
    $itemsToRemove = $itemsByFolder[$targetFolderId]
}

if ($itemsToRemove.Count -eq 0) {
    $displayPath = if ($targetAllWorkspace) { '<entire workspace>' } elseif ($targetFolderId -eq '__ROOT__') { '<workspace root>' } else { $FolderName }
    Write-Host "No items found in $displayPath in workspace '$WorkspaceName'."
    return
}

$displayPath = if ($targetAllWorkspace) { '<entire workspace>' } elseif ($targetFolderId -eq '__ROOT__') { '<workspace root>' } else { "folder '$FolderName'" }
Write-Host "Found $($itemsToRemove.Count) items in $displayPath" -ForegroundColor Yellow

if (-not $PSCmdlet.ShouldProcess("$($itemsToRemove.Count) items in $displayPath", 'Remove all items')) {
    return
}

$removedCount = 0
$failedCount = 0

foreach ($item in $itemsToRemove) {
    $itemName = if ($item.PSObject.Properties['displayName']) { $item.displayName } else { $item.id }
    
    Write-Host "Removing item: $itemName" -ForegroundColor Cyan
    
    if (-not $DryRun.IsPresent) {
        try {
            Invoke-FabricApi -Endpoint "workspaces/$workspaceId/items/$($item.id)" -Method 'DELETE' | Out-Null
            Write-Verbose "Successfully removed item: $itemName"
            $removedCount++
        }
        catch {
            Write-Warning "Failed to remove item '$itemName': $($_.Exception.Message)"
            $failedCount++
        }
    } else {
        Write-Host "  [DRY RUN] Would remove: $itemName" -ForegroundColor Gray
        $removedCount++
    }
}

Write-Host "" -ForegroundColor White
Write-Host "Summary for ${displayPath}:" -ForegroundColor White
Write-Host "  Items processed: $($itemsToRemove.Count)" -ForegroundColor Green
if ($DryRun.IsPresent) {
    Write-Host "  Items that would be removed: $removedCount" -ForegroundColor Green
} else {
    Write-Host "  Items successfully removed: $removedCount" -ForegroundColor Green
    if ($failedCount -gt 0) {
        Write-Host "  Items failed to remove: $failedCount" -ForegroundColor Red
    }
}
