[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    [string]$WorkspaceName,

    [Parameter(Mandatory = $false)]
    [string]$ItemName = $null,

    [Parameter(Mandatory = $false)]
    [string]$ItemsPrefix = "",

    [Parameter(Mandatory = $false)]
    [string]$TargetDirectory = "./Export"
)

function Invoke-FabCommand {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command,
        
        [Parameter(Mandatory = $false)]
        [string[]]$Arguments = @(),
        
        [Parameter(Mandatory = $false)]
        [string]$WorkingDirectory = (Get-Location).Path
    )
    
    try {
        $argumentString = $Arguments -join " "
        $fullCommand = if ($argumentString) { "$Command $argumentString" } else { $Command }
        Write-Verbose "Executing: fab $fullCommand"

        $psi = [System.Diagnostics.ProcessStartInfo]::new()
        $psi.FileName               = 'fab'
        $psi.Arguments              = $fullCommand
        $psi.UseShellExecute        = $false
        $psi.RedirectStandardOutput = $true
        $psi.RedirectStandardError  = $true
        $psi.WorkingDirectory       = $WorkingDirectory

        # Explicitly tell the Process how to decode bytes → text:
        $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
        $psi.StandardErrorEncoding  = [System.Text.Encoding]::UTF8

        # If you still need Python to emit UTF-8, too:
        $psi.EnvironmentVariables['PYTHONIOENCODING'] = 'utf-8'
        $proc = [System.Diagnostics.Process]::Start($psi)

        $stdOut = ($proc.StandardOutput.ReadToEnd() -replace "`r`n", "`n").Trim() -replace "&#x27;", "`'"
        $stdErr = ($proc.StandardError.ReadToEnd() -replace "`r`n", "`n").Trim() -replace "&#x27;", "`'"

        $proc.WaitForExit()

        Write-Verbose "Exit code: $($proc.ExitCode)"
        Write-Verbose "=== STDOUT ==="
        Write-Verbose $stdOut
        Write-Verbose "=== STDERR ==="
        Write-Verbose $stdErr

        return [PSCustomObject]@{
            ExitCode = $proc.ExitCode
            StandardOutput = $stdOut
            StandardError = $stdErr
            Success = ($proc.ExitCode -eq 0)
            Output = @($stdOut, $stdErr) | Where-Object { $_ }
        }
    }
    catch {
        Write-Verbose "Exception occurred: $($_.Exception.Message)"
        return [PSCustomObject]@{
            ExitCode = -1
            StandardOutput = ""
            StandardError = $_.Exception.Message
            Success = $false
            Output = @($_.Exception.Message)
        }
    }
}

Write-Host "🚀 Simple Fabric Item Export" -ForegroundColor Cyan
Write-Host "   Workspace: $WorkspaceName" -ForegroundColor Gray
if ($ItemName) {
    Write-Host "   Item: $ItemName" -ForegroundColor Gray
}
if (-not [string]::IsNullOrEmpty($ItemsPrefix)) {
    Write-Host "   Item Prefix: $ItemsPrefix" -ForegroundColor Gray
}
Write-Host "   Target: $TargetDirectory" -ForegroundColor Gray
Write-Host ""

# Create target directory if it doesn't exist
if (-not (Test-Path $TargetDirectory)) {
    New-Item -ItemType Directory -Path $TargetDirectory -Force | Out-Null
}

# Get all items in workspace
Write-Host "📋 Listing workspace items..." -ForegroundColor White
$listResult = Invoke-FabCommand -Command "ls" -Arguments @("`"$WorkspaceName.Workspace/`"")
if (-not $listResult.Success) {
    Write-Host "   ❌ Failed to list workspace items" -ForegroundColor Red
    exit 1
}
$lines = $listResult.StandardOutput -split "`n" | Where-Object { $_.Trim() -ne "" }

$items = @()
foreach ($line in $lines) {
    $fullName = $line.Trim()
    if ([string]::IsNullOrEmpty($fullName)) { continue }
    
    # Extract item type from extension (e.g., "MyItem.Notebook" -> type is "Notebook")
    if ($fullName -match '\.([^.]+)$') {
        $itemType = $matches[1]
        $itemName = $fullName
        
        $matchesRequestedItem = [string]::IsNullOrEmpty($ItemName) -or $itemName -eq $ItemName
        $matchesRequestedPrefix = [string]::IsNullOrEmpty($ItemsPrefix) -or $itemName.StartsWith($ItemsPrefix)

        if ($matchesRequestedItem -and $matchesRequestedPrefix) {
            $items += [PSCustomObject]@{
                Type = $itemType
                Name = $itemName
            }
        }
    }
}

Write-Host "   Found $($items.Count) items to export" -ForegroundColor Green
Write-Host ""

# Export each item
$exported = 0
$skipped = 0

foreach ($item in $items) {
    $itemType = $item.Type
    $itemName = $item.Name
    
    # Determine subfolder based on type
    $subfolder = switch ($itemType) {
        "Notebook" { "Notebooks" }
        "DataPipeline" { "DataPipelines" }
        "Report" { "Reports" }
        "SemanticModel" { "SemanticModels" }
        "Lakehouse" { "Lakehouses" }
        default { $itemType }
    }
    
    $targetPath = Join-Path $TargetDirectory $subfolder
    if (-not (Test-Path $targetPath)) {
        New-Item -ItemType Directory -Path $targetPath -Force | Out-Null
    }
    
    # Ensure path ends with a directory separator for directory export
    $directorySeparator = [System.IO.Path]::DirectorySeparatorChar
    if (-not $targetPath.EndsWith($directorySeparator)) {
        $targetPath = $targetPath + $directorySeparator
    }
    
    $fabricPath = "$WorkspaceName.Workspace/$itemName"
    
    Write-Host "📦 Exporting: " -NoNewline -ForegroundColor Cyan
    Write-Host "$itemName " -NoNewline -ForegroundColor White
    Write-Host "($itemType)" -ForegroundColor Gray
    
    try {
        $result = Invoke-FabCommand -Command "export" -Arguments @("-f", "`"$fabricPath`"", "-o", "`"$targetPath`"")
        
        if ($result.Success) {
            Write-Host "   ✅ Exported successfully" -ForegroundColor Green
            $exported++
        } else {
            Write-Host "   ⚠️  Export failed: $($result.StandardError)" -ForegroundColor Yellow
            $skipped++
        }
    }
    catch {
        Write-Host "   ⚠️  Export failed: $($_.Exception.Message)" -ForegroundColor Yellow
        $skipped++
    }
}

Write-Host ""
Write-Host "✨ Export Complete" -ForegroundColor Green
Write-Host "   Exported: $exported items" -ForegroundColor Green
Write-Host "   Skipped: $skipped items" -ForegroundColor Yellow
Write-Host "   Target: $TargetDirectory" -ForegroundColor Gray
