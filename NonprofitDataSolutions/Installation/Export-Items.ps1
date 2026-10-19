[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    [string]$WorkspaceName,
    
    [Parameter(Mandatory = $false)]
    [string]$ItemName = $null,
    
    [Parameter(Mandatory = $false)]
    [string]$WorkspaceItemsPath = '../FabricWorkload/Workload/app/assets/items/PackageInstallerItem/Fundraising/definitions/',
    
    [Parameter(Mandatory = $false)]
    [string]$Prefix = $null,
    
    [Parameter(Mandatory = $false)]
    [string]$ItemsPrefix = "",
    
    [Parameter(Mandatory = $false)]
    [switch]$SkipDynamicVariables
)

# Remove the Import-Module line since we'll call the script directly

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

function Parse-ItemInfo([string]$Name) {
    # First remove the file extension
    $nameWithoutExtension = $Name -replace '\.[^.]+$',''
    
    # Extract the meaningful part of the name based on known patterns
    # Priority order: New naming convention -> Legacy naming (including D365) -> Fallback
    $cleanedName = if ($nameWithoutExtension -match '.*_(Fundraising_.*)$') {
        # New naming convention: PREFIX_Fundraising_* (includes D365: Fundraising_D365_*, Fundraising_SD365_*)
        $matches[1]
    } elseif ($nameWithoutExtension -match '.*_(NDS_.*|SFNPSP_.*|D365_.*)$') {
        # Legacy naming convention: PREFIX_NDS_*, PREFIX_SFNPSP_*, PREFIX_D365_*
        $legacyName = $matches[1]
        
        # Apply lakehouse-specific naming transformations
        if ($legacyName -eq "NDS_Gold") {
            "Fundraising_GD"
        } elseif ($legacyName -eq "NDS_Silver") {
            "Fundraising_SL"  
        } elseif ($legacyName -eq "SFNPSP_Bronze") {
            "Fundraising_SalesforceNPSP_BR"
        } else {
            $legacyName
        }
    } elseif ($nameWithoutExtension -match '^([A-Za-z0-9]+_)?(Fundraising_.*)$') {
        # Handle cases where items might already have the new naming without additional prefix
        $matches[2]
    } elseif ($nameWithoutExtension -match '^([A-Za-z0-9]+_)?(D365_.*)$') {
        # Handle legacy D365 items that might already have the naming without additional prefix
        $matches[2]
    } elseif ($nameWithoutExtension -match '.+_([^_]+_.+)$') {
        # Generic fallback for other patterns
        $matches[1]
    } else {
        # Use the full name if no pattern matches
        $nameWithoutExtension
    }
    
    return @{
        ItemType = $Name.split('.')[-1]
        CleanedName = $cleanedName
        OriginalName = $Name
    }
}

function Export-Item([string]$ItemName, [string]$WorkspaceName) {
    $itemInfo = Parse-ItemInfo -Name $ItemName
    
    Write-Verbose "Processing item: $ItemName"
    Write-Verbose "  ItemType: $($itemInfo.ItemType)"
    Write-Verbose "  CleanedName: $($itemInfo.CleanedName)"

    if ($itemInfo.ItemType -notin $supportedItemTypes) {
        Write-Host "Skipping unsupported item type for: $ItemName" -ForegroundColor Yellow
        return
    }

    Write-Host "Exporting item ($($itemInfo.CleanedName); $($itemInfo.ItemType)): STARTED" 

    # Export the item
    $fabricPath = "$WorkspaceName.Workspace/$ItemName"
    $exportItemFolder = "$($itemInfo.ItemType)s"
    $exportPath = (Join-Path $WorkspaceItemsPath $exportItemFolder)
    
    Write-Verbose "  Fabric path: $fabricPath"
    Write-Verbose "  Export path: $exportPath"
    
    # Execute fab export and capture output properly
    Write-Verbose "Starting fabric export command..."
    Write-Verbose "Command: fab export -f `"$fabricPath`" -o `"$exportPath`""
    
    $result = Invoke-FabCommand -Command "export" -Arguments @("-f", "`"$fabricPath`"", "-o", "`"$exportPath`"")
    
    Write-Verbose "Fabric export completed with exit code: $($result.ExitCode)"
    if ($result.StandardOutput) {
        Write-Verbose "Export stdout: $($result.StandardOutput)"
    }
    if ($result.StandardError) {
        Write-Verbose "Export stderr: $($result.StandardError)"
    }
    
    if ($result.Success) {
        Write-Host "Exporting item ($($itemInfo.CleanedName); $($itemInfo.ItemType)): DONE" -ForegroundColor Green

        # move $exportPath to new directory
        $exportedItemPath = Join-Path $exportPath $ItemName
        if (Test-Path -Path $exportedItemPath) {
            $newExportPath = Join-Path $exportPath "$($itemInfo.CleanedName).$($itemInfo.ItemType)"
            Write-Verbose "Moving exported item from $exportedItemPath to $newExportPath"
            
            # Check if source and target names are identical, skip rename if so
            if ($ItemName -eq "$($itemInfo.CleanedName).$($itemInfo.ItemType)") {
                Write-Verbose "Source and target names are identical, skipping rename operation"
                $newExportPath = $exportedItemPath  # Use the existing path
            }
            else {
                # Check if target directory already exists
                if (Test-Path -Path $newExportPath) {
                    Remove-Item -Path $newExportPath -Recurse -Force | Out-Null
                }
                
                # Perform the move operation
                try {
                    Move-Item -Path $exportedItemPath -Destination $newExportPath -Force
                    Write-Verbose "Successfully moved exported item to: $newExportPath"
                } catch {
                    Write-Host "Failed to move exported item: $($_.Exception.Message)" -ForegroundColor Red
                    return
                }
            }

            # remove .platform metadata file
            $platformFilePath = Join-Path $newExportPath ".platform"
            if (Test-Path -Path $platformFilePath) {
                Remove-Item -Path $platformFilePath -Force -ErrorAction SilentlyContinue
            }

            if ($itemInfo.ItemType -eq "Notebook") {
                Write-Host "Cleaning notebook $($newExportPath):" -ForegroundColor Cyan -NoNewLine
                $nbContentPath = Join-Path $newExportPath "notebook-content.ipynb"

                if (Test-Path -Path $nbContentPath) {
                    try {
                        # remove synapse_widget notebook metadata
                        $jsonContent = Get-Content $nbContentPath -Raw -Encoding UTF8 | ConvertFrom-Json
                        if ($jsonContent.metadata -and $jsonContent.metadata.PSObject.Properties["synapse_widget"]) {
                            $jsonContent.metadata.PSObject.Properties.Remove("synapse_widget") | Out-Null
                        }
                        $jsonContent | ConvertTo-Json -Depth 100 | Set-Content -Path $nbContentPath -Encoding $utf8NoBom

                        # Clean notebook (keep [tags, microsoft, editable] cell metadata)
                        nb-clean clean --preserve-cell-metadata tags microsoft editable -- $nbContentPath

                        Write-Host " DONE" -ForegroundColor Cyan
                    } catch {
                        Write-Host " FAILED" -ForegroundColor Red
                        Write-Host "Error cleaning notebook: $($_.Exception.Message)" -ForegroundColor DarkRed
                    }
                } else {
                    Write-Host " FAILED" -ForegroundColor Red
                    Write-Host "Notebook content file not found: $nbContentPath" -ForegroundColor DarkRed
                }
            }
            
            # Apply dynamic variables if not skipped
            if (-not $SkipDynamicVariables) {
                # Find the definition file based on item type
                $definitionFile = $null
                if ($itemInfo.ItemType -eq "Notebook") {
                    $definitionFile = Get-ChildItem -Path $newExportPath -Filter "notebook-content.ipynb" -File | Select-Object -First 1
                } elseif ($itemInfo.ItemType -eq "DataPipeline") {
                    $definitionFile = Get-ChildItem -Path $newExportPath -Filter "pipeline-content.json" -File | Select-Object -First 1
                } else {
                    # For other item types, try to find any .json file
                    $definitionFile = Get-ChildItem -Path $newExportPath -Filter "*.json" -File | Select-Object -First 1
                }
                
                if ($definitionFile) {
                    $mappingFile = Join-Path $PSScriptRoot "dynamic-variables-mapping.json"
                    Apply-DynamicVariables -FilePath $definitionFile.FullName -MappingFile $mappingFile
                }
            }
        }
        else {
            Write-Host "Export path does not exist: $exportedItemPath" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "Exporting item ($($itemInfo.CleanedName); $($itemInfo.ItemType)): FAILED (exit code $($result.ExitCode))" -ForegroundColor Red
        if ($result.Output) {
            Write-Host "Error details: $($result.Output -join "`n")" -ForegroundColor DarkRed
        }
    }
}


$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

$supportedItemTypes = @("Notebook", "DataPipeline", "SemanticModel", "Report", "Trigger")
# Build skip items list dynamically based on prefix
$skipItems = @()

if ($Prefix) {
    # New naming convention - skip auto-generated semantic models for lakehouses
    $skipItems += @(
        "${Prefix}Fundraising_GD.SemanticModel",
        "${Prefix}Fundraising_SL.SemanticModel", 
        "${Prefix}Fundraising_SalesforceNPSP_BR.SemanticModel"
    )
    
    # D365 lakehouse semantic models (auto-generated) - these should typically be skipped
    # D365 notebooks (Fundraising_D365_Config, Fundraising_D365_Transform) are kept as they contain business logic
}

# Legacy skip items for backward compatibility
$skipItems += @(
    # Legacy naming convention
    "PuPrDEV_NDS_Gold.SemanticModel",
    "PuPrDEV_NDS_Lakehouse_Bronze_Salesforce.SemanticModel",
    "PuPrDEV_NDS_Lakehouse_Gold.SemanticModel",
    "PuPrDEV_NDS_Lakehouse_Silver_Salesforce.SemanticModel",
    "PuPrDEV_NDS_Lakehouse_Silver.SemanticModel",
    "PuPrDEV_NDS_Silver.SemanticModel",
    "PuPrDEV_SFNPSP_Bronze.SemanticModel",
    "PuPrDEV_SFNPSP_Silver.SemanticModel"
)

# Items to skip based on patterns (lakehouse auto-generated semantic models)
$skipPatterns = @(
    '.*_Lakehouse_.*\.SemanticModel$',
    '.*_Fundraising_GD\.SemanticModel$',
    '.*_Fundraising_SL\.SemanticModel$', 
    '.*_Fundraising_SalesforceNPSP_BR\.SemanticModel$',
    '.*_NDS_Gold\.SemanticModel$',          # Legacy: NDS_Gold -> Fundraising_GD
    '.*_NDS_Silver\.SemanticModel$',        # Legacy: NDS_Silver -> Fundraising_SL  
    '.*_SFNPSP_Bronze\.SemanticModel$',     # Legacy: SFNPSP_Bronze -> Fundraising_SalesforceNPSP_BR
    '.*_D365.*\.SemanticModel$',            # Skip legacy D365 lakehouse semantic models (auto-generated)
    '.*_Fundraising_D365.*\.SemanticModel$', # Skip new D365 lakehouse semantic models (auto-generated)
    '.*_Fundraising_SD365.*\.SemanticModel$' # Skip new D365 lakehouse semantic models (auto-generated)
)

function Should-SkipItem([string]$ItemName) {
    # Check static skip list
    if ($skipItems -contains $ItemName) {
        return $true
    }
    
    # Check skip patterns
    foreach ($pattern in $skipPatterns) {
        if ($ItemName -match $pattern) {
            return $true
        }
    }
    
    return $false
}

function Apply-DynamicVariables {
    param(
        [string]$FilePath,
        [string]$MappingFile
    )
    
    Write-Verbose "Apply-DynamicVariables called with:"
    Write-Verbose "  FilePath: $FilePath"
    Write-Verbose "  MappingFile: $MappingFile"
    
    if (-not (Test-Path $MappingFile)) {
        Write-Verbose "  Mapping file not found: $MappingFile - skipping dynamic variables"
        return
    }
    
    try {
        # Read the mapping
        $mapping = Get-Content $MappingFile -Raw | ConvertFrom-Json
        
        Write-Verbose "  Definitions path from mapping: $($mapping.metadata.definitions_path)"
        
        # Find variables for this specific file
        $fileVariables = @()
        foreach ($folderMapping in $mapping.mappings) {
            foreach ($fileMapping in $folderMapping.files) {
                $mappingFilePath = Join-Path $mapping.metadata.definitions_path $fileMapping.file
                
                Write-Verbose "  Comparing: '$mappingFilePath' with '$FilePath'"
                
                if ($mappingFilePath -eq $FilePath) {
                    $fileVariables += $fileMapping.dynamic_variables
                    Write-Verbose "  Found matching file with $($fileMapping.dynamic_variables.Count) variables"
                    break
                }
            }
            if ($fileVariables.Count -gt 0) { break }
        }
        
        if ($fileVariables.Count -eq 0) {
            Write-Verbose "  No dynamic variables found for this file"
            return
        }
        
        # Read and parse the file
        $content = Get-Content $FilePath -Raw
        $jsonObj = $content | ConvertFrom-Json
        
        $variablesApplied = 0
        
        # Apply each variable mapping
        foreach ($varMapping in $fileVariables) {
            $path = $varMapping.path
            $dynamicVariable = $varMapping.value
            
            Write-Verbose "    Attempting: $path = $dynamicVariable"
            
            $success = Set-JsonPathValue -JsonObject $jsonObj -Path $path -NewValue $dynamicVariable
            
            if ($success) {
                $variablesApplied++
                Write-Verbose "    Applied: $path = $dynamicVariable"
            } else {
                Write-Verbose "    Failed to apply: $path"
            }
        }
        
        # Save file if changes were made
        if ($variablesApplied -gt 0) {
            $newContent = $jsonObj | ConvertTo-Json -Depth 100
            Set-Content -Path $FilePath -Value $newContent -Encoding UTF8 -NoNewline
            Write-Host "  Applied $variablesApplied dynamic variables" -ForegroundColor Cyan
        }
    }
    catch {
        Write-Verbose "  Error applying dynamic variables: $_"
    }
}

function Set-JsonPathValue {
    param(
        $JsonObject,
        [string]$Path,
        [string]$NewValue
    )
    
    # Parse the JSONPath - Remove the leading $. and split carefully
    $pathString = $Path -replace '^\$\.', ''
    
    # Split by dots, but keep filter expressions together
    $pathParts = @()
    $currentPart = ""
    $inFilter = $false
    
    for ($i = 0; $i -lt $pathString.Length; $i++) {
        $char = $pathString[$i]
        
        if ($char -eq '[') {
            $inFilter = $true
            $currentPart += $char
        }
        elseif ($char -eq ']') {
            $inFilter = $false
            $currentPart += $char
        }
        elseif ($char -eq '.' -and -not $inFilter) {
            if ($currentPart) {
                $pathParts += $currentPart
                $currentPart = ""
            }
        }
        else {
            $currentPart += $char
        }
    }
    
    if ($currentPart) {
        $pathParts += $currentPart
    }
    
    $current = $JsonObject
    $parent = $null
    $parentKey = $null
    $arrayIndex = -1
    
    for ($i = 0; $i -lt $pathParts.Count; $i++) {
        $part = $pathParts[$i]
        $isLast = ($i -eq $pathParts.Count - 1)
        
        # Handle array with filter like "activities[?(@.name == 'Import sample data')]"
        if ($part -match '^(.+?)\[\?\(@\.(\w+)\s*==\s*[''"](.+?)[''"]\)\]$') {
            $arrayName = $Matches[1]
            $filterProperty = $Matches[2]
            $filterValue = $Matches[3]
            
            if ($current.PSObject.Properties[$arrayName]) {
                $array = $current.$arrayName
                $matchedItem = $array | Where-Object { $_.$filterProperty -eq $filterValue } | Select-Object -First 1
                
                if ($matchedItem) {
                    $parent = $current
                    $parentKey = $arrayName
                    $current = $matchedItem
                }
                else {
                    return $false
                }
            }
        }
        # Handle simple array index like "activities[0]" or "source[0]"
        elseif ($part -match '^(.+?)\[(\d+)\]$') {
            $arrayName = $Matches[1]
            $index = [int]$Matches[2]
            
            if ($current.PSObject.Properties[$arrayName]) {
                $array = $current.$arrayName
                if ($index -lt $array.Count) {
                    if ($isLast) {
                        # For array element at final position, set directly
                        $array[$index] = $NewValue
                        return $true
                    }
                    else {
                        $parent = $current
                        $parentKey = $arrayName
                        $arrayIndex = $index
                        $current = $array[$index]
                    }
                }
                else {
                    return $false
                }
            }
        }
        # Handle property access
        else {
            if ($isLast) {
                # This is the final property - set the value
                if ($current.PSObject.Properties[$part]) {
                    $current.$part = $NewValue
                    return $true
                }
                else {
                    return $false
                }
            }
            else {
                # Navigate deeper
                if ($current.PSObject.Properties[$part]) {
                    $parent = $current
                    $parentKey = $part
                    $arrayIndex = -1
                    $current = $current.$part
                }
                else {
                    return $false
                }
            }
        }
    }
    
    return $true
}


# For PowerShell Core and Windows PowerShell 5.1 alike:
# [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
# [Console]::InputEncoding  = [System.Text.Encoding]::UTF8
# $OutputEncoding           = [System.Text.Encoding]::UTF8  # for redirection operators

# Install nb-clean if not already installed
if (-not (Get-Command nb-clean -ErrorAction SilentlyContinue)) {
    Write-Host "Installing nb-clean..."
    pip install nb-clean
}

if ($ItemName) {
    # Process only the specified item
    Write-Host "Processing single item: $ItemName" -ForegroundColor Cyan
    
    if (Should-SkipItem -ItemName $ItemName) {
        Write-Host "Item is in skip list or matches skip pattern: $ItemName" -ForegroundColor Yellow
        return
    }
    
    Export-Item -WorkspaceName $WorkspaceName -ItemName $ItemName
    
    # & "./Setup-WorkspaceItems.ps1" -WorkspaceItemsPath $WorkspaceItemsPath
}
else {
    # Process all items (original behavior)
    Write-Host "Listing items from workspace: $WorkspaceName" -ForegroundColor Cyan
    $listResult = Invoke-FabCommand -Command "ls" -Arguments @("`"$WorkspaceName.Workspace`"")
    if ($listResult.Success) {
        $items = $listResult.StandardOutput -split "`n" |
            Where-Object { $_ -like "$ItemsPrefix*" -and $_ -notlike "TEMP_*" } |
            Sort-Object
        
        Write-Host "Found $($items.Count) items to process" -ForegroundColor Cyan
        
        $items | Foreach-Object {
            $currentItem = $_
            Write-Verbose "Checking item: ""$currentItem"""
            
            if (Should-SkipItem -ItemName $currentItem) {
                Write-Verbose "Skipping item: $currentItem"
                return
            }
            
            Export-Item -WorkspaceName $WorkspaceName -ItemName $currentItem
        }

        # & "./Setup-WorkspaceItems.ps1" -WorkspaceItemsPath $WorkspaceItemsPath
    }
    else {
        Write-Host "Failed to list workspace items: $($listResult.StandardError)" -ForegroundColor Red
    }
}