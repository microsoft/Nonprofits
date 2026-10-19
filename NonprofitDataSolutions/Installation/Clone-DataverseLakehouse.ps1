<#
.SYNOPSIS
    Clones Dataverse table shortcuts from a source lakehouse to a target lakehouse.

.DESCRIPTION
    This script reads all table shortcuts from a source lakehouse (typically a Dataverse lakehouse)
    and creates identical shortcuts in a target lakehouse. If the target lakehouse doesn't exist,
    it will be created. Source and target lakehouses can be in different workspaces.

    If the target lakehouse already exists, the script will add any missing shortcuts from the list.
    Existing shortcuts are skipped.

.PARAMETER SourceWorkspaceName
    The name of the workspace containing the source lakehouse.

.PARAMETER SourceLakehouseName
    The name of the source lakehouse containing the shortcuts to clone.

.PARAMETER TargetWorkspaceName
    The name of the workspace where the target lakehouse will be created/updated.
    If not specified, uses the same workspace as the source.

.PARAMETER TargetLakehouseName
    The name of the target lakehouse where shortcuts will be created. If not specified,
    will prompt for a name.

.PARAMETER CreateTargetLakehouse
    Switch to create the target lakehouse if it doesn't exist.

.PARAMETER TableNames
    Array of table names to clone. If not specified, all shortcuts will be cloned.

.EXAMPLE
    .\Clone-DataverseLakehouse.ps1 -SourceWorkspaceName "SourceWS" -SourceLakehouseName "DataverseLH" -TargetWorkspaceName "TargetWS" -TargetLakehouseName "D365_Bronze" -CreateTargetLakehouse

.EXAMPLE
    .\Clone-DataverseLakehouse.ps1 -SourceWorkspaceName "MyWorkspace" -SourceLakehouseName "DataverseLH" -TargetLakehouseName "D365_Bronze" -TableNames @("account", "contact")

.EXAMPLE
    .\Clone-DataverseLakehouse.ps1 -SourceWorkspaceName "MyWorkspace" -SourceLakehouseName "DataverseLH" -TargetLakehouseName "D365_Bronze"
    Clone within the same workspace.

.NOTES
    Requires: Microsoft Fabric CLI (fab), PowerShell 7+
#>

[CmdletBinding()]
param(
	[Parameter(Mandatory = $true)]
	[string]$SourceWorkspaceName,
    
	[Parameter(Mandatory = $true)]
	[string]$SourceLakehouseName,
    
	[Parameter(Mandatory = $false)]
	[string]$TargetWorkspaceName,
    
	[Parameter(Mandatory = $false)]
	[string]$TargetLakehouseName,
    
	[Parameter(Mandatory = $false)]
	[switch]$CreateTargetLakehouse,
    
	[Parameter(Mandatory = $false)]
	[string[]]$TableNames = @(
		'account',
		'activityparty',
		'campaign',
		'campaignactivity',
		'contact',
		'customeraddress',
		'email',
		'GlobalOptionsetMetadata',
		'letter',
		'msnfp_designatedcredit',
		'msnfp_designation',
		'msnfp_transaction',
		'opportunitysalesprocess',
		'opportunity',
		'OptionsetMetadata',
		'phonecall',
		'StateMetadata',
		'StatusMetadata',
		'workflow'
	)
)

# If target workspace not specified, use source workspace
if ([string]::IsNullOrEmpty($TargetWorkspaceName)) {
	$TargetWorkspaceName = $SourceWorkspaceName
}

#region Utility Functions

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
		Write-Verbose "Executing: fab $Command $Arguments"

		$psi = [System.Diagnostics.ProcessStartInfo]::new()
		$psi.FileName = 'fab'
		
		# Use ArgumentList for safer argument passing (requires PowerShell Core / 5.1+)
		$psi.ArgumentList.Add($Command)
		foreach ($arg in $Arguments) {
			$psi.ArgumentList.Add($arg)
		}
		
		$psi.UseShellExecute = $false
		$psi.RedirectStandardOutput = $true
		$psi.RedirectStandardError = $true
		$psi.WorkingDirectory = $WorkingDirectory

		# Explicitly tell the Process how to decode bytes → text:
		$psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
		$psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8

		# Set Python to emit UTF-8:
		$psi.EnvironmentVariables['PYTHONIOENCODING'] = 'utf-8'
		$proc = [System.Diagnostics.Process]::Start($psi)

		$stdOut = ($proc.StandardOutput.ReadToEnd() -replace "`r`n", "`n").Trim() -replace "&#x27;", "'"
		$stdErr = ($proc.StandardError.ReadToEnd() -replace "`r`n", "`n").Trim() -replace "&#x27;", "'"

		$proc.WaitForExit()

		Write-Verbose "Exit code: $($proc.ExitCode)"
		Write-Verbose "=== STDOUT ==="
		Write-Verbose $stdOut
		Write-Verbose "=== STDERR ==="
		Write-Verbose $stdErr

		return [PSCustomObject]@{
			ExitCode       = $proc.ExitCode
			StandardOutput = $stdOut
			StandardError  = $stdErr
			Success        = ($proc.ExitCode -eq 0)
			Output         = @($stdOut, $stdErr) | Where-Object { $_ }
		}
	}
	catch {
		Write-Verbose "Exception occurred: $($_.Exception.Message)"
		return [PSCustomObject]@{
			ExitCode       = -1
			StandardOutput = ""
			StandardError  = $_.Exception.Message
			Success        = $false
			Output         = @($_.Exception.Message)
		}
	}
}

function Get-LakehouseShortcuts {
	param(
		[string]$WorkspaceId,
		[string]$LakehouseId,
		[string]$LakehouseName
	)
    
	Write-Host "📋 Reading shortcuts from lakehouse: $LakehouseName" -ForegroundColor Cyan
    
	# Use Fabric API to get shortcuts
	$apiPath = "workspaces/$WorkspaceId/items/$LakehouseId/shortcuts"
	$apiResult = Invoke-FabCommand -Command "api" -Arguments @($apiPath)
    
	if (-not $apiResult.Success) {
		Write-Host "   ❌ Failed to get shortcuts via API: $($apiResult.StandardError)" -ForegroundColor Red
		return @()
	}
    
	# Parse JSON response
	try {
		$jsonString = $apiResult.StandardOutput
		if ($jsonString -is [array]) {
			$jsonString = $jsonString -join ""
		}
        
		$response = $jsonString | ConvertFrom-Json
		$shortcuts = @()
        
		foreach ($shortcut in $response.text.value) {
			$shortcuts += [PSCustomObject]@{
				Name   = $shortcut.name
				Path   = $shortcut.path
				Target = $shortcut.target
			}
		}
        
		Write-Host "   ✅ Found $($shortcuts.Count) shortcuts" -ForegroundColor Green
		return $shortcuts
	}
	catch {
		Write-Host "   ❌ Failed to parse API response: $_" -ForegroundColor Red
		return @()
	}
}

function Get-ShortcutDefinition {
	param(
		[PSCustomObject]$Shortcut
	)
    
	# Return the target definition from the shortcut object
	# The API already provides the full definition
	return [PSCustomObject]@{
		path   = $Shortcut.Path
		target = $Shortcut.Target
	}
}

function Test-LakehouseExists {
	param(
		[string]$WorkspaceId,
		[string]$LakehouseName
	)
    
	$apiResult = Invoke-FabCommand -Command "api" -Arguments @("workspaces/$WorkspaceId/lakehouses")
	if (-not $apiResult.Success) {
		return $false
	}
    
	try {
		$jsonString = $apiResult.StandardOutput
		if ($jsonString -is [array]) {
			$jsonString = $jsonString -join ""
		}
		$response = $jsonString | ConvertFrom-Json
		$lakehouse = $response.text.value | Where-Object { $_.displayName -eq $LakehouseName } | Select-Object -First 1
		return ($null -ne $lakehouse)
	}
	catch {
		return $false
	}
}

function New-Lakehouse {
	param(
		[string]$WorkspaceName,
		[string]$LakehouseName,
		[string]$WorkspaceId
	)
    
	Write-Host "🏗️  Creating lakehouse: $WorkspaceName/$LakehouseName" -ForegroundColor Cyan
    
	# Try using API to create lakehouse instead of fab create
	$payload = @{
		displayName = $LakehouseName
		description = "Created by Clone-DataverseLakehouse script"
	}
	
	$jsonContent = $payload | ConvertTo-Json -Depth 10 -Compress
	
	$apiPath = "workspaces/$WorkspaceId/lakehouses"
	$result = Invoke-FabCommand -Command "api" -Arguments @($apiPath, "-X", "post", "-H", "content-type=application/json", "-i", $jsonContent)
	
	# Check actual API response status code
		$apiSuccess = $false
		if ($result.StandardOutput) {
			try {
				$response = ($result.StandardOutput -split "`n" | Where-Object { $_.Trim() }) -join "`n" | ConvertFrom-Json
				if ($response.status_code -and $response.status_code -ge 200 -and $response.status_code -lt 300) {
					$apiSuccess = $true
				}
			}
			catch {
				$apiSuccess = $result.Success
			}
		}
		else {
			$apiSuccess = $result.Success
		}
		
		if ($apiSuccess) {
			Write-Host "   ✅ Lakehouse created successfully" -ForegroundColor Green
			return $true
		}
		else {
			Write-Host "   ❌ Failed to create lakehouse: $($result.StandardError)" -ForegroundColor Red
			Write-Verbose "Full output: $($result.StandardOutput)"
			return $false
		}
}

function New-LakehouseShortcut {
	param(
		[string]$WorkspaceId,
		[string]$LakehouseId,
		[string]$ShortcutName,
		[PSCustomObject]$ShortcutDefinition
	)
    
	Write-Host "   📌 Creating shortcut: " -NoNewline -ForegroundColor Gray
	Write-Host "$ShortcutName" -ForegroundColor White
    
	# Prepare shortcut payload - use the exact structure from the API
	$payload = @{
		name   = $ShortcutName
		path   = $ShortcutDefinition.path
		target = $ShortcutDefinition.target
	}
    
	Write-Verbose "Payload: $($payload | ConvertTo-Json -Depth 10 -Compress)"
    
	$jsonContent = $payload | ConvertTo-Json -Depth 10 -Compress
	
	# Create shortcut using Fabric API
	$apiPath = "workspaces/$WorkspaceId/items/$LakehouseId/shortcuts"
	Write-Verbose "API Path: $apiPath"
	$result = Invoke-FabCommand -Command "api" -Arguments @($apiPath, "-X", "post", "-H", "content-type=application/json", "-i", $jsonContent)
	
	Write-Verbose "Exit Code: $($result.ExitCode)"
		Write-Verbose "Success: $($result.Success)"
		if ($result.StandardOutput) {
			Write-Verbose "Output: $($result.StandardOutput)"
		}
		if ($result.StandardError) {
			Write-Verbose "Error: $($result.StandardError)"
		}
        
		# Check actual API response status code
		$apiSuccess = $false
		if ($result.StandardOutput) {
			try {
				$response = ($result.StandardOutput -split "`n" | Where-Object { $_.Trim() }) -join "`n" | ConvertFrom-Json
				if ($response.status_code -and $response.status_code -ge 200 -and $response.status_code -lt 300) {
					$apiSuccess = $true
				}
			}
			catch {
				# If we can't parse the response, fall back to exit code
				$apiSuccess = $result.Success
			}
		}
		else {
			$apiSuccess = $result.Success
		}
        
		if ($apiSuccess) {
			Write-Host "      ✅ Created" -ForegroundColor Green
			return $true
		}
		else {
			# Check if it already exists
			$errorText = $result.StandardError + $result.StandardOutput
			if ($errorText -match "already exists" -or $errorText -match "PathAlreadyExists" -or $errorText -match "ItemAlreadyExists") {
				Write-Host "      ⏭️  Already exists" -ForegroundColor Yellow
				return $true
			}
            
			$errorMsg = if ($result.StandardError) { $result.StandardError } else { $result.StandardOutput }
			Write-Host "      ❌ Failed: $errorMsg" -ForegroundColor Red
			return $false
		}
}

#endregion

#region Main Execution

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                            ║" -ForegroundColor Cyan
Write-Host "║                    CLONE LAKEHOUSE SHORTCUTS UTILITY                       ║" -ForegroundColor Cyan
Write-Host "║                                                                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Get or prompt for target lakehouse name
if ([string]::IsNullOrEmpty($TargetLakehouseName)) {
	Write-Host "📝 Target lakehouse name not specified" -ForegroundColor Yellow
	$TargetLakehouseName = Read-Host "   Enter target lakehouse name"
    
	if ([string]::IsNullOrEmpty($TargetLakehouseName)) {
		Write-Host "   ❌ Target lakehouse name is required" -ForegroundColor Red
		exit 1
	}
}

Write-Host ""

# Get workspace and lakehouse IDs once
Write-Host "🔍 Resolving workspace and lakehouse IDs..." -ForegroundColor White

# Get source workspace ID
$wsListResult = Invoke-FabCommand -Command "ls" -Arguments @(".", "-l")
if (-not $wsListResult.Success) {
	Write-Host "   ❌ Failed to list workspaces" -ForegroundColor Red
	exit 1
}

Write-Verbose "Workspace list output:"
Write-Verbose ($wsListResult.StandardOutput | Out-String)

$sourceWorkspaceId = $null
$targetWorkspaceId = $null

foreach ($line in ($wsListResult.StandardOutput -split "`n")) {
	Write-Verbose "Checking line: $line"
	if ($line -match "^\s*$SourceWorkspaceName\.Workspace\s+([a-f0-9-]{36})") {
		$sourceWorkspaceId = $matches[1]
		Write-Verbose "Found source workspace ID: $sourceWorkspaceId"
	}
	if ($line -match "^\s*$TargetWorkspaceName\.Workspace\s+([a-f0-9-]{36})") {
		$targetWorkspaceId = $matches[1]
		Write-Verbose "Found target workspace ID: $targetWorkspaceId"
	}
}

if (-not $sourceWorkspaceId) {
	Write-Host "   ❌ Could not find source workspace: '$SourceWorkspaceName'" -ForegroundColor Red
	Write-Host "   Available workspaces:" -ForegroundColor Yellow
	$wsListResult.StandardOutput -split "`n" | Where-Object { $_ -match "\.Workspace" } | ForEach-Object { Write-Host "     $_" -ForegroundColor Yellow }
	exit 1
}

if (-not $targetWorkspaceId) {
	Write-Host "   ❌ Could not find target workspace: '$TargetWorkspaceName'" -ForegroundColor Red
	Write-Host "   Available workspaces:" -ForegroundColor Yellow
	$wsListResult.StandardOutput -split "`n" | Where-Object { $_ -match "\.Workspace" } | ForEach-Object { Write-Host "     $_" -ForegroundColor Yellow }
	exit 1
}

# Check if target lakehouse exists
$targetExists = Test-LakehouseExists -WorkspaceId $targetWorkspaceId -LakehouseName $TargetLakehouseName

if (-not $targetExists) {
	if ($CreateTargetLakehouse) {
		Write-Host "   🔨 Creating target lakehouse: $TargetLakehouseName" -ForegroundColor Cyan
		if (-not (New-Lakehouse -WorkspaceName $TargetWorkspaceName -LakehouseName $TargetLakehouseName -WorkspaceId $targetWorkspaceId)) {
			Write-Host "   ❌ Failed to create target lakehouse" -ForegroundColor Red
			exit 1
		}
		Write-Host "   ⏳ Waiting for lakehouse to be available..." -ForegroundColor Cyan
		Start-Sleep -Seconds 5
	}
	else {
		Write-Host "   ❌ Target lakehouse does not exist: $TargetWorkspaceName/$TargetLakehouseName" -ForegroundColor Red
		Write-Host "   Use -CreateTargetLakehouse to create it automatically" -ForegroundColor Yellow
		exit 1
	}
}
else {
	Write-Host "   ✅ Target lakehouse found: $TargetLakehouseName" -ForegroundColor Green
}

# Get source lakehouse ID using API
$sourceLhResult = Invoke-FabCommand -Command "api" -Arguments @("workspaces/$sourceWorkspaceId/lakehouses")
if (-not $sourceLhResult.Success) {
	Write-Host "   ❌ Failed to list source lakehouses" -ForegroundColor Red
	exit 1
}

$sourceLakehouseId = $null
try {
	$jsonString = $sourceLhResult.StandardOutput
	if ($jsonString -is [array]) {
		$jsonString = $jsonString -join ""
	}
	$response = $jsonString | ConvertFrom-Json
	$lakehouse = $response.text.value | Where-Object { $_.displayName -eq $SourceLakehouseName } | Select-Object -First 1
	if ($lakehouse) {
		$sourceLakehouseId = $lakehouse.id
	}
}
catch {
	Write-Host "   ❌ Failed to parse source lakehouses: $_" -ForegroundColor Red
	exit 1
}

if (-not $sourceLakehouseId) {
	Write-Host "   ❌ Could not find source lakehouse ID" -ForegroundColor Red
	exit 1
}

# Get target lakehouse ID using API
$targetLhResult = Invoke-FabCommand -Command "api" -Arguments @("workspaces/$targetWorkspaceId/lakehouses")
if (-not $targetLhResult.Success) {
	Write-Host "   ❌ Failed to list target lakehouses" -ForegroundColor Red
	exit 1
}

$targetLakehouseId = $null
try {
	$jsonString = $targetLhResult.StandardOutput
	if ($jsonString -is [array]) {
		$jsonString = $jsonString -join ""
	}
	$response = $jsonString | ConvertFrom-Json
	$lakehouse = $response.text.value | Where-Object { $_.displayName -eq $TargetLakehouseName } | Select-Object -First 1
	if ($lakehouse) {
		$targetLakehouseId = $lakehouse.id
	}
}
catch {
	Write-Host "   ❌ Failed to parse target lakehouses: $_" -ForegroundColor Red
	exit 1
}

if (-not $targetLakehouseId) {
	Write-Host "   ❌ Could not find target lakehouse ID" -ForegroundColor Red
	exit 1
}

Write-Host "   ✅ IDs resolved" -ForegroundColor Green
Write-Host ""

# Get shortcuts from source lakehouse
$shortcuts = Get-LakehouseShortcuts -WorkspaceId $sourceWorkspaceId -LakehouseId $sourceLakehouseId -LakehouseName $SourceLakehouseName

if ($shortcuts.Count -eq 0) {
	Write-Host "⚠️  No shortcuts found in source lakehouse" -ForegroundColor Yellow
	exit 0
}

Write-Host ""

# Clone shortcuts
$shortcutsToClone = $shortcuts
if ($TableNames -and $TableNames.Count -gt 0) {
	$shortcutsToClone = $shortcuts | Where-Object { $_.Name -in $TableNames }
	Write-Host "🔄 Cloning $($shortcutsToClone.Count) specific tables to: $TargetWorkspaceName/$TargetLakehouseName" -ForegroundColor Cyan
	Write-Host "   Tables: $($TableNames -join ', ')" -ForegroundColor Gray
}
else {
	Write-Host "🔄 Cloning all $($shortcuts.Count) shortcuts to: $TargetWorkspaceName/$TargetLakehouseName" -ForegroundColor Cyan
}
$successCount = 0
$failedCount = 0

foreach ($shortcut in $shortcutsToClone) {
	# Get shortcut definition (from the API response)
	$definition = Get-ShortcutDefinition -Shortcut $shortcut
    
	if ($null -eq $definition) {
		Write-Host "   ⚠️  Could not read definition for: $($shortcut.Name)" -ForegroundColor Yellow
		$failedCount++
		continue
	}
    
	# Create shortcut in target lakehouse
	if (New-LakehouseShortcut -WorkspaceId $targetWorkspaceId -LakehouseId $targetLakehouseId -ShortcutName $shortcut.Name -ShortcutDefinition $definition) {
		$successCount++
	}
	else {
		$failedCount++
	}
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                              CLONING COMPLETE                              ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "   📊 Summary:" -ForegroundColor White
Write-Host "      ✅ Successful: $successCount shortcuts" -ForegroundColor Green
if ($failedCount -gt 0) {
	Write-Host "      ❌ Failed: $failedCount shortcuts" -ForegroundColor Red
}
Write-Host "      📍 Source: $SourceWorkspaceName/$SourceLakehouseName" -ForegroundColor Gray
Write-Host "      📍 Target: $TargetWorkspaceName/$TargetLakehouseName" -ForegroundColor Gray
Write-Host ""

#endregion
