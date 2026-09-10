#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Scans DataPipelines and Notebooks folders for dynamic variables and creates a JSON mapping file.

.DESCRIPTION
    This script scans all JSON and notebook files in the DataPipelines and Notebooks folders 
    within the FabricWorkload definitions directory. It searches for dynamic variables in the 
    format {VARIABLE_NAME} or {{VARIABLE_NAME}} and creates a JSON mapping file with:
    - folder name
    - jsonpath (file path relative to definitions folder)
    - dynamic variable (including the braces)

.PARAMETER DefinitionsPath
    The path to the definitions folder. Defaults to the relative path from the Installation folder.

.PARAMETER OutputFile
    The name of the output JSON file. Defaults to 'dynamic-variables-mapping.json' in the current folder.

.EXAMPLE
    .\Scan-DynamicVariables.ps1

.EXAMPLE
    .\Scan-DynamicVariables.ps1 -OutputFile "my-variables.json"
#>

param(
	[string]$DefinitionsPath = "..\FabricWorkload\Workload\app\assets\items\PackageInstallerItem\Fundraising\definitions",
	[string]$OutputFile = "dynamic-variables-mapping.json"
)

# Function to find dynamic variables with their JSON paths
function Find-DynamicVariablesWithPaths {
	param(
		[string]$Content,
		[string]$FilePath,
		[switch]$NotebookFile
	)
    
	$results = @()
    
	# Pattern matches {VARIABLE_NAME} or {{VARIABLE_NAME}}
	# Allows letters (a-z, A-Z), digits (0-9), and underscores
	$pattern = '\{\{?[a-zA-Z0-9_]+\}?\}'
    
	# Allowed variables for notebooks (configuration variables only)
	$allowedNotebookVariables = @(
		'{WORKSPACE_ID}',
		'{DYNAMICS_LAKEHOUSE_NAME}',
		'{DYNAMICS_LAKEHOUSE_ID}',
		'{BRONZE_LAKEHOUSE_NAME}',
		'{BRONZE_LAKEHOUSE_ID}',
		'{SILVER_LAKEHOUSE_NAME}',
		'{SILVER_LAKEHOUSE_ID}',
		'{GOLD_LAKEHOUSE_NAME}',
		'{GOLD_LAKEHOUSE_ID}'
	)
    
	try {
		# Try to parse as JSON to provide better paths
		$jsonObj = $Content | ConvertFrom-Json -ErrorAction Stop
        
		# Recursively search through JSON structure
		$results = Search-JsonForVariables -JsonObject $jsonObj -CurrentPath '$' -Pattern $pattern
        
		# Filter notebook variables if this is a notebook file (case-sensitive match)
		if ($NotebookFile) {
			$results = $results | Where-Object { $allowedNotebookVariables -ccontains $_.value }
		}
	}
	catch {
		# If not valid JSON or parsing fails, fall back to simple text search
		$regexMatches = [regex]::Matches($Content, $pattern)
        
		foreach ($match in $regexMatches) {
			$varValue = $match.Value
            
			# Filter notebook variables if this is a notebook file (case-sensitive match)
			if (-not $NotebookFile -or $allowedNotebookVariables -ccontains $varValue) {
				$results += [PSCustomObject]@{
					path  = "$.content"
					value = $varValue
				}
			}
		}
	}
    
	return $results
}

# Recursive function to search JSON structure
function Search-JsonForVariables {
	param(
		$JsonObject,
		[string]$CurrentPath,
		[string]$Pattern,
		$ParentObject = $null,
		[string]$PropertyName = ""
	)
    
	$results = @()
    
	if ($null -eq $JsonObject) {
		return $results
	}
    
	if ($JsonObject -is [string]) {
		$regexMatches = [regex]::Matches($JsonObject, $Pattern)
		foreach ($match in $regexMatches) {
			$results += [PSCustomObject]@{
				path  = $CurrentPath
				value = $match.Value
			}
		}
	}
	elseif ($JsonObject -is [array]) {
		for ($i = 0; $i -lt $JsonObject.Count; $i++) {
			$item = $JsonObject[$i]
            
			# Check if array items have a 'name' property for better path description
			if ($item -is [PSCustomObject] -and $item.PSObject.Properties['name'] -and $item.name -is [string]) {
				# Use name-based filter instead of index
				$itemName = $item.name
				$newPath = "$CurrentPath[?(@.name == '$itemName')]"
			}
			else {
				# Fall back to index
				$newPath = "$CurrentPath[$i]"
			}
            
			$results += Search-JsonForVariables -JsonObject $item -CurrentPath $newPath -Pattern $Pattern -ParentObject $JsonObject -PropertyName ""
		}
	}
	elseif ($JsonObject -is [PSCustomObject] -or $JsonObject -is [System.Collections.Hashtable]) {
		foreach ($prop in $JsonObject.PSObject.Properties) {
			$propName = $prop.Name
			$propValue = $prop.Value
            
			$newPath = "$CurrentPath.$propName"
            
			$results += Search-JsonForVariables -JsonObject $propValue -CurrentPath $newPath -Pattern $Pattern -ParentObject $JsonObject -PropertyName $propName
		}
	}
    
	return $results
}

# Main script logic
Write-Host "Scanning for dynamic variables..." -ForegroundColor Cyan

# Resolve the full path
$definitionsFullPath = Resolve-Path $DefinitionsPath -ErrorAction Stop
Write-Host "Definitions path: $definitionsFullPath" -ForegroundColor Gray

# Initialize results hashtable (grouped by folder)
$folderGroups = @{}

# Scan DataPipelines folder
$dataPipelinesPath = Join-Path $definitionsFullPath "DataPipelines"
if (Test-Path $dataPipelinesPath) {
	Write-Host "`nScanning DataPipelines..." -ForegroundColor Yellow
    
	$pipelineFiles = Get-ChildItem -Path $dataPipelinesPath -Recurse -File -Include "*.json"
    
	foreach ($file in $pipelineFiles) {
		$relativePath = $file.FullName.Substring($definitionsFullPath.Path.Length + 1).Replace('\', '/')
		$folderName = $file.Directory.Name
        
		Write-Host "  Processing: $relativePath" -ForegroundColor Gray
        
		$content = Get-Content $file.FullName -Raw
		$variablesWithPaths = Find-DynamicVariablesWithPaths -Content $content -FilePath $relativePath
        
		if ($variablesWithPaths.Count -gt 0) {
			if (-not $folderGroups.ContainsKey($folderName)) {
				$folderGroups[$folderName] = @()
			}
            
			foreach ($varInfo in $variablesWithPaths) {
				$folderGroups[$folderName] += [PSCustomObject]@{
					file  = $relativePath
					path  = $varInfo.path
					value = $varInfo.value
				}
			}
		}
	}
    
	Write-Host "  Found $($pipelineFiles.Count) pipeline files" -ForegroundColor Green
}

# Scan Notebooks folder
$notebooksPath = Join-Path $definitionsFullPath "Notebooks"
if (Test-Path $notebooksPath) {
	Write-Host "`nScanning Notebooks..." -ForegroundColor Yellow
    
	# Get all .ipynb files (notebook content files)
	$notebookFiles = Get-ChildItem -Path $notebooksPath -Recurse -File -Include "*.ipynb", "*.json"
    
	foreach ($file in $notebookFiles) {
		$relativePath = $file.FullName.Substring($definitionsFullPath.Path.Length + 1).Replace('\', '/')
		$folderName = $file.Directory.Name
        
		Write-Host "  Processing: $relativePath" -ForegroundColor Gray
        
		$content = Get-Content $file.FullName -Raw
		$variablesWithPaths = Find-DynamicVariablesWithPaths -Content $content -FilePath $relativePath -NotebookFile
        
		if ($variablesWithPaths.Count -gt 0) {
			if (-not $folderGroups.ContainsKey($folderName)) {
				$folderGroups[$folderName] = @()
			}
            
			foreach ($varInfo in $variablesWithPaths) {
				$folderGroups[$folderName] += [PSCustomObject]@{
					file  = $relativePath
					path  = $varInfo.path
					value = $varInfo.value
				}
			}
		}
		
		# Also scan for %run commands in notebook cells
		try {
			$notebookJson = $content | ConvertFrom-Json
			if ($notebookJson.cells) {
				for ($cellIndex = 0; $cellIndex -lt $notebookJson.cells.Count; $cellIndex++) {
					$cell = $notebookJson.cells[$cellIndex]
					if ($cell.source -and $cell.source -is [array]) {
						for ($lineIndex = 0; $lineIndex -lt $cell.source.Count; $lineIndex++) {
							$line = $cell.source[$lineIndex]
							# Match %run command with optional parameters
							# Captures the entire %run line
							if ($line -match '^\s*%run\s+(.+)$') {
								$runCommand = $Matches[1].Trim()
								
								# Extract the notebook name
								# Handle both formats: "<NotebookName>" (already processed) and "PREFIX_NotebookName" (needs processing)
								$notebookName = $runCommand
								if ($runCommand -match '^<([^>]+)>') {
									# Already in <NotebookName> format - just use the whole command as is
									$dynamicValue = "%run $runCommand"
								}
								else {
									# Extract just the notebook name (first part before any whitespace or {)
									if ($runCommand -match '^([^\s{]+)') {
										$notebookName = $Matches[1].Trim()
									}
									
									# Extract the base notebook name (remove prefix if present)
									# e.g., "PREFIX_NDS_Config" -> "NDS_Config"
									# or "NEW_Fundraising_D365_Config" -> "Fundraising_D365_Config"
									$baseNotebookName = $notebookName
									
									# Remove common prefixes (workspace-specific prefixes)
									# Look for pattern: PREFIX_ActualName where PREFIX is uppercase/alphanumeric
									if ($baseNotebookName -match '^([A-Z0-9]+)_(.+)$') {
										$baseNotebookName = $Matches[2]
									}
									
									# Store the complete %run line with the cleaned notebook name
									# e.g., "%run <NotebookName>" or "%run <NotebookName> { \"param\": true }"
									$dynamicValue = $runCommand -replace [regex]::Escape($notebookName), "<$baseNotebookName>"
									$dynamicValue = "%run $dynamicValue"
								}
								
								if (-not $folderGroups.ContainsKey($folderName)) {
									$folderGroups[$folderName] = @()
								}
								
								$folderGroups[$folderName] += [PSCustomObject]@{
									file  = $relativePath
									path  = "`$.cells[$cellIndex].source[$lineIndex]"
									value = $dynamicValue
								}
							}
						}
					}
				}
			}
		}
		catch {
			# If notebook parsing fails, skip %run scanning for this file
			Write-Verbose "Could not parse notebook for %run commands: $relativePath"
		}
	}
    
	Write-Host "  Found $($notebookFiles.Count) notebook files" -ForegroundColor Green
}

# Build final results array
$results = @()
foreach ($folderName in $folderGroups.Keys | Sort-Object) {
	# Group variables by file within this folder
	$fileGroups = @{}
    
	foreach ($varInfo in $folderGroups[$folderName]) {
		$fileName = $varInfo.file
        
		if (-not $fileGroups.ContainsKey($fileName)) {
			$fileGroups[$fileName] = @()
		}
        
		$fileGroups[$fileName] += [PSCustomObject]@{
			path  = $varInfo.path
			value = $varInfo.value
		}
	}
    
	# Build files array
	$filesArray = @()
	foreach ($fileName in $fileGroups.Keys | Sort-Object) {
		$filesArray += [PSCustomObject]@{
			file              = $fileName
			dynamic_variables = @($fileGroups[$fileName] | Sort-Object -Property value, path)
		}
	}
    
	$results += [PSCustomObject]@{
		folder_name = $folderName
		files       = @($filesArray)
	}
}

# Calculate statistics
$totalEntries = 0
$uniqueVariables = @{}
$uniqueFiles = @{}

foreach ($folder in $results) {
	foreach ($file in $folder.files) {
		$uniqueFiles[$file.file] = $true
		foreach ($var in $file.dynamic_variables) {
			$totalEntries++
			$uniqueVariables[$var.value] = $true
		}
	}
}

# Output summary
Write-Host "`n" -NoNewline
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Total entries: $totalEntries" -ForegroundColor Green
Write-Host "  Unique variables: $($uniqueVariables.Count)" -ForegroundColor Green
Write-Host "  Unique files: $($uniqueFiles.Count)" -ForegroundColor Green
Write-Host "  Folders: $($results.Count)" -ForegroundColor Green

# Convert to JSON and save
$outputPath = Join-Path (Get-Location) $OutputFile

# Add metadata to the JSON output
$output = @{
	metadata = @{
		generated_at     = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
		definitions_path = $definitionsFullPath.Path
		total_entries    = $totalEntries
		unique_variables = $uniqueVariables.Count
		unique_files     = $uniqueFiles.Count
		folders          = $results.Count
	}
	mappings = $results
}

$output | ConvertTo-Json -Depth 10 | Set-Content -Path $outputPath -Encoding UTF8 -NoNewline

Write-Host "`nOutput saved to: $outputPath" -ForegroundColor Green

# Display a sample of unique variables
Write-Host "`nSample of unique variables found:" -ForegroundColor Cyan
$uniqueVariables.Keys | Sort-Object | Select-Object -First 10 | ForEach-Object {
	Write-Host "  $_" -ForegroundColor Gray
}

if ($uniqueVariables.Count -gt 10) {
	Write-Host "  ... and $($uniqueVariables.Count - 10) more" -ForegroundColor Gray
}
