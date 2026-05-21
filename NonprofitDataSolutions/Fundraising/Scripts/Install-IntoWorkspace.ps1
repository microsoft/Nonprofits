<#
.SYNOPSIS
    Nonprofit Data Solutions (NDS) - Workspace Installation Script

.DESCRIPTION
    This script installs the complete Nonprofit Data Solutions framework into a Microsoft Fabric workspace.
    It creates lakehouses, imports notebooks, configures data pipelines, and sets up semantic models and reports.

.PARAMETER WorkspaceName
    The name of the target Microsoft Fabric workspace where NDS will be installed.
    
.PARAMETER Prefix
    Optional prefix to add to all created resources. Default is 'DEMO_'.
    Use 'PROD_' for production environments or leave empty for no prefix.

.PARAMETER ImportSampleData
    This parameter has been removed. Sample data is now imported by default.

.PARAMETER SkipSampleData
    Switch to skip importing sample data. By default, sample data is imported during installation.

.PARAMETER SkipConfirmation
    Skip confirmation prompts for automated installations.

.PARAMETER LoadFromFile
    Load runtime variables from a previously saved JSON file instead of initializing with defaults.
    Useful for resuming interrupted installations or debugging.

.EXAMPLE
    .\Install-IntoWorkspace.ps1 -WorkspaceName "MyNonprofitWorkspace" -Prefix "PROD_"
    
.EXAMPLE
    .\Install-IntoWorkspace.ps1 -WorkspaceName "TestWorkspace" -SkipConfirmation

.EXAMPLE
    .\Install-IntoWorkspace.ps1 -WorkspaceName "ProdWorkspace" -SkipSampleData
    Install without importing sample data.

.EXAMPLE
    .\Install-IntoWorkspace.ps1 -WorkspaceName "TestWorkspace" -Prefix "TEST_" -LoadFromFile
    Resume installation using previously saved runtime variables.

.NOTES
    Version: 1.1
    Author: Microsoft Nonprofit Solutions Team
    Requires: Microsoft Fabric CLI (fab), PowerShell 7+
    
    Sample data is imported by default. Use -SkipSampleData to skip sample data import.
#>

[CmdletBinding(SupportsShouldProcess)]
param (
    [Parameter(
        Mandatory = $true,
        HelpMessage = "Enter the name of your Microsoft Fabric workspace"
    )]
    [ValidateNotNullOrEmpty()]
    [string]$WorkspaceName,
    
    [Parameter(
        Mandatory = $false,
        HelpMessage = "Enter a prefix for all resources (e.g., 'PROD_', 'TEST_')"
    )]
    [ValidatePattern('^[A-Za-z0-9_]*$')]
    [string]$Prefix = 'DEMO_',
    
    [Parameter(
        Mandatory = $false,
        HelpMessage = "Path to the workspace items definitions directory"
    )]
    [string]$WorkspaceItemsPath = '../Solution/',
    
    [Parameter(
        Mandatory = $false,
        HelpMessage = "Skip confirmation prompts for automated installations"
    )]
    [switch]$SkipConfirmation,
    
    [Parameter(
        Mandatory = $false,
        HelpMessage = "Skip importing sample data (sample data is imported by default)"
    )]
    [switch]$SkipSampleData,
    
    [Parameter(
        Mandatory = $false,
        HelpMessage = "Load runtime variables from previously saved file instead of initializing with defaults"
    )]
    [switch]$LoadFromFile
)

#region Script Header and Initialization
$Script:StartTime = Get-Date
$Script:Version = "1.1"

# Runtime variables collection - stores IDs, names, and configuration for all artifacts
# Names are initialized early with the Prefix applied
# IDs and connection details are populated during installation
# Variable names match those in dynamic-variables-mapping.json
$Script:RuntimeVariables = @{
    # ===== Workspace =====
    "WORKSPACE_ID" = $null  # Populated by Use-Workspace
    
    # ===== Connections =====
    "SALESFORCE_CONNECTION_ID" = $null      # Populated by Setup-SalesforceConnection
    "SALESFORCE_CONNECTION_NAME" = $null    # Populated by Setup-SalesforceConnection
    
    # ===== Lakehouses - Names initialized by Initialize-ArtifactNames, IDs populated during creation =====
    "BRONZE_LAKEHOUSE_ID" = $null           # Populated by Create-Sfnpsp_BronzeLakehouse
    "BRONZE_LAKEHOUSE_NAME" = $null         # Initialized by Initialize-ArtifactNames
    "DYNAMICS_LAKEHOUSE_ID" = $null         # Populated by Setup-D365Lakehouse
    "DYNAMICS_LAKEHOUSE_NAME" = $null       # Populated by Setup-D365Lakehouse (user-selected)
    "GOLD_LAKEHOUSE_ID" = $null             # Populated by Create-GoldLakehouse
    "GOLD_LAKEHOUSE_NAME" = $null           # Initialized by Initialize-ArtifactNames
    "GOLD_LAKEHOUSE_SQL_ENDPOINT" = $null   # Populated by Create-GoldLakehouse
    "SILVER_LAKEHOUSE_ID" = $null           # Populated by Create-SilverLakehouse
    "SILVER_LAKEHOUSE_NAME" = $null         # Initialized by Initialize-ArtifactNames
    
    # ===== Notebooks - Names initialized by Initialize-ArtifactNames, IDs populated during import =====
    "BRONZE_CONFIG_NOTEBOOK_ID" = $null                             # Populated by Import-Fundraising_SalesforceNPSP_ConfigNotebook
    "BRONZE_MERGE_STAGING_DATA_NOTEBOOK_ID" = $null                 # Populated by Import-Fundraising_SalesforceNPSP_BR_MergeNotebook
    "Fundraising_SalesforceNPSP_Transform_Notebook" = $null         # Populated by Import-Fundraising_SalesforceNPSP_TransformNotebook
    "SALESFORCE_TRANSFORM_NOTEBOOK_ID" = $null                      # Populated by Import-Fundraising_SalesforceNPSP_TransformNotebook
    "CONFIG_NOTEBOOK_ID" = $null                                    # Populated by Import-ConfigNotebook
    "D365_CONFIG_NOTEBOOK_ID" = $null                               # Populated by Import-Fundraising_D365_ConfigNotebook
    "Fundraising_D365_Transform_Notebook" = $null                   # Populated by Import-Fundraising_D365_TransformNotebook
    "D365_TRANSFORM_NOTEBOOK_ID" = $null                            # Populated by Import-Fundraising_D365_TransformNotebook
    "GOLD_CREATE_SCHEMA_NOTEBOOK_ID" = $null                        # Populated by Import-GoldCreateSchemaNotebook
    "GOLD_CREATE_SEGMENTS_NOTEBOOK_ID" = $null                      # Populated by Import-GoldCreateSegmentsNotebook
    "SILVER_CREATE_DEFAULT_CONFIGURATION_NOTEBOOK_ID" = $null       # Populated by Import-SilverCreateDefaultConfigurationNotebook
    "SILVER_CREATE_SCHEMA_NOTEBOOK_ID" = $null                      # Populated by Import-SilverCreateSchemaNotebook
    "SILVER_IMPORT_SAMPLE_DATA_NOTEBOOK_ID" = $null                 # Populated by Import-SilverImportSampleDataNotebook
    "SILVER_TO_GOLD_ENRICHMENT_NOTEBOOK_ID" = $null                 # Populated by Import-SilverToGoldEnrichmentNotebook
    
    # ===== Notebooks - Names for %run references (initialized by Initialize-ArtifactNames) =====
    "Fundraising_Config" = $null                                    # Initialized by Initialize-ArtifactNames
    "Fundraising_BR_Ingestion" = $null                              # Initialized by Initialize-ArtifactNames
    "Fundraising_D365_Config" = $null                               # Initialized by Initialize-ArtifactNames
    "Fundraising_D365_Transform" = $null                            # Initialized by Initialize-ArtifactNames
    "Fundraising_SalesforceNPSP_Config" = $null                     # Initialized by Initialize-ArtifactNames
    "Fundraising_SL_CreateSchema" = $null                           # Initialized by Initialize-ArtifactNames
    "Fundraising_SL_DefaultConfig" = $null                          # Initialized by Initialize-ArtifactNames
    
    # ===== Pipelines - Names initialized by Initialize-ArtifactNames, IDs populated during import =====
    "BRONZE_INGESTION_PIPELINE_ID" = $null                          # Populated by Import-BronzeIngestionOrchestrationPipeline
    "Fundraising_SalesforceNPSP_BR_Load" = $null                    # Initialized by Initialize-ArtifactNames
    "Fundraising_SalesforceNPSP_BR_Load_DataPipeline" = $null       # Populated by Import-SFNPSP_BronzeIngestionPipeline
    "ORCHESTRATION_PIPELINE_ID" = $null                             # Populated by Import-OrchestrationPipeline
    "SILVER_TO_GOLD_ENRICHMENT_PIPELINE_ID" = $null                 # Populated by Import-SilverToGoldOrchestrationPipeline
    
    # ===== Folders =====
    "FOLDER_ID" = $null                                             # Populated by Create-Folder
    
    # ===== Semantic Models & Reports - Names initialized by Initialize-ArtifactNames =====
    "SEMANTIC_MODEL_NAME" = $null                                   # Initialized by Initialize-ArtifactNames
    "REPORT_NAME" = $null                                           # Initialized by Initialize-ArtifactNames
}

function Initialize-RuntimeVariables {
    <#
    .SYNOPSIS
    Initializes RuntimeVariables either from saved file or with default artifact names.
    
    .DESCRIPTION
    When LoadFromFile is specified, loads previously saved RuntimeVariables from JSON file.
    Otherwise, pre-generates all artifact names using the $Prefix parameter and stores them in RuntimeVariables.
    This ensures all names are available for Apply-DynamicVariables before any resources are created.
    Called early in the installation process, right after parameters are validated.
    
    .PARAMETER Prefix
    The prefix to apply to all artifact names (only used when not loading from file).
    
    .PARAMETER WorkspaceName
    The workspace name (used for file naming when loading from file).
    
    .PARAMETER LoadFromFile
    If specified, loads RuntimeVariables from saved JSON file instead of initializing with defaults.
    #>
    param(
        [Parameter(Mandatory = $false)]
        [string]$Prefix,
        
        [Parameter(Mandatory = $false)]
        [string]$WorkspaceName,
        
        [Parameter(Mandatory = $false)]
        [switch]$LoadFromFile
    )
    
    if ($LoadFromFile) {
        Write-Log "Loading runtime variables from saved file..." -Level "INFO"
        $loaded = Load-RuntimeVariables -WorkspaceName $WorkspaceName -Prefix $Prefix
        
        if ($loaded) {
            Write-Log "Runtime variables loaded successfully from file" -Level "SUCCESS"
            return
        } else {
            Write-Log "No saved runtime variables found, will initialize with defaults" -Level "WARNING"
            # Fall through to initialize with defaults
        }
    }
    
    Write-Log "Initializing artifact names with prefix: $Prefix" -Level "INFO"
    
    # Initialize Folder Name based on Prefix
    if (-not [string]::IsNullOrWhiteSpace($Prefix)) {
        $Script:FolderName = $Prefix
        
        # Ensure prefix ends with underscore for resources, but keep folder name without it (if it was added)
        if (-not $Prefix.EndsWith('_')) {
            $Prefix = "${Prefix}_"
            $Script:Prefix = $Prefix
            Write-Log "Added trailing underscore to prefix. New Prefix: '$Prefix'" -Level "INFO"
        }
        
        Write-Log "Using folder name: $Script:FolderName" -Level "INFO"
    } else {
        $Script:FolderName = $null
    }

    # Lakehouses (except D365 which is user-selected)
    $Script:RuntimeVariables["BRONZE_LAKEHOUSE_NAME"] = "${Prefix}Fundraising_SalesforceNPSP_BR"
    $Script:RuntimeVariables["SILVER_LAKEHOUSE_NAME"] = "${Prefix}Fundraising_SL"
    $Script:RuntimeVariables["GOLD_LAKEHOUSE_NAME"] = "${Prefix}Fundraising_GD"
    
    # Notebooks - %run reference names
    $Script:RuntimeVariables["Fundraising_Config"] = "${Prefix}Fundraising_Config"
    $Script:RuntimeVariables["Fundraising_BR_Ingestion"] = "${Prefix}Fundraising_BR_Ingestion"
    $Script:RuntimeVariables["Fundraising_D365_Config"] = "${Prefix}Fundraising_D365_Config"
    $Script:RuntimeVariables["Fundraising_D365_Transform"] = "${Prefix}Fundraising_D365_Transform"
    $Script:RuntimeVariables["Fundraising_SalesforceNPSP_Config"] = "${Prefix}Fundraising_SalesforceNPSP_Config"
    $Script:RuntimeVariables["Fundraising_SL_CreateSchema"] = "${Prefix}Fundraising_SL_CreateSchema"
    $Script:RuntimeVariables["Fundraising_SL_DefaultConfig"] = "${Prefix}Fundraising_SL_DefaultConfig"
    
    # Pipelines - pipeline name references
    $Script:RuntimeVariables["Fundraising_SalesforceNPSP_BR_Load"] = "${Prefix}Fundraising_SalesforceNPSP_BR_Load"
    
    # Semantic Models & Reports
    $Script:RuntimeVariables["SEMANTIC_MODEL_NAME"] = "${Prefix}Fundraising_Intelligence_Semantic"
    $Script:RuntimeVariables["REPORT_NAME"] = "${Prefix}Fundraising_Intelligence"
    
    Write-Log "Artifact names initialized successfully" -Level "SUCCESS"
}

# Create Logs directory if it doesn't exist
$LogsDir = Join-Path $PSScriptRoot "Logs"
if (-not (Test-Path $LogsDir)) {
    New-Item -Path $LogsDir -ItemType Directory -Force | Out-Null
}

$Script:LogFile = Join-Path $LogsDir "NDS-Installation-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Display professional header
function Show-Header {
    Clear-Host
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                                            ║" -ForegroundColor Cyan
    Write-Host "║                      NONPROFIT DATA SOLUTIONS (NDS)                        ║" -ForegroundColor Cyan
    Write-Host "║                          Workspace Installation                            ║" -ForegroundColor Cyan
    Write-Host "║                                                                            ║" -ForegroundColor Cyan
    Write-Host "║                              Version $Script:Version                                   ║" -ForegroundColor Cyan
    Write-Host "║                    Microsoft Nonprofit Solutions Team                      ║" -ForegroundColor Cyan
    Write-Host "║                                                                            ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

# Enhanced logging function
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO",
        [switch]$NoConsole = $true
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    # Write to log file
    Add-Content -Path $Script:LogFile -Value $logEntry -Encoding UTF8
    
    # Write to console unless suppressed
    if (-not $NoConsole) {
        switch ($Level) {
            "ERROR" { Write-Host $Message -ForegroundColor Red }
            "WARNING" { Write-Host $Message -ForegroundColor Yellow }
            "SUCCESS" { Write-Host $Message -ForegroundColor Green }
            "INFO" { Write-Host $Message -ForegroundColor White }
            "PROGRESS" { Write-Host $Message -ForegroundColor Cyan }
            default { Write-Host $Message }
        }
    }
}

# Progress tracking
$Script:TotalSteps = 12
$Script:CurrentStep = 0

function Show-Progress {
    param(
        [string]$Activity,
        [string]$Status = "In Progress..."
    )
    
    $Script:CurrentStep++
    $percentComplete = [math]::Round(($Script:CurrentStep / $Script:TotalSteps) * 100)
    
    Write-Progress -Activity "Installing Nonprofit Data Solutions" -Status "$Activity - $Status" -PercentComplete $percentComplete
    Write-Log "[$Script:CurrentStep/$Script:TotalSteps] $Activity" -Level "PROGRESS"
}

Show-Header

Write-Log "Starting Nonprofit Data Solutions installation" -Level "INFO"
Write-Log "Workspace: $WorkspaceName" -Level "INFO"
Write-Log "Prefix: $Prefix" -Level "INFO"
Write-Log "Skip Sample Data: $SkipSampleData" -Level "INFO"
Write-Log "Log file: $Script:LogFile" -Level "INFO"

#region Utility Functions
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)

function Read-JsonFile ($path) {
    try {
        Get-Content $path -Raw -Encoding UTF8 | ConvertFrom-Json
    }
    catch {
        Write-Log "Failed to read JSON file: $path - $($_.Exception.Message)" -Level "ERROR"
        throw
    }
}

function Write-ToFileSystem ($path, $content) {
    try {
        $json = $content | ConvertTo-Json -Depth 20
        [System.IO.File]::WriteAllText($path, $json, $utf8NoBom)
    }
    catch {
        Write-Log "Failed to write to file: $path - $($_.Exception.Message)" -Level "ERROR"
        throw
    }
}

function Test-Prerequisites {
    Write-Log "Checking prerequisites..." -Level "INFO"
    
    # Check if fab CLI is available
    if (-not (Get-Command fab -ErrorAction SilentlyContinue)) {
        Write-Log "Microsoft Fabric CLI (fab) is not installed or not in PATH" -Level "ERROR"
        Write-Log "Please install it from: https://learn.microsoft.com/rest/api/fabric/articles/fabric-command-line-interface" -Level "INFO"
        throw "Prerequisites not met"
    }
    
    # Check if pip is available for nb-clean
    if (-not (Get-Command pip -ErrorAction SilentlyContinue)) {
        Write-Log "Python pip is not available. This may be required for notebook processing." -Level "WARNING"
    }
    
    Write-Log "Prerequisites check completed successfully" -Level "SUCCESS"
}

function Confirm-Action {
    param(
        [string]$Message,
        [string]$Title = "Confirm Action"
    )
    
    if ($SkipConfirmation) {
        return $true
    }
    
    # Box configuration
    $boxWidth = 78
    $contentWidth = $boxWidth - 4  # Account for "║ " and " ║"
    
    Write-Host ""
    
    # Top border
    Write-Host "╔$('═' * ($boxWidth - 2))╗" -ForegroundColor Yellow
    
    # Title line - center the title
    $titlePadding = [math]::Max(0, [math]::Floor(($contentWidth - $Title.Length) / 2))
    $titleRightPadding = $contentWidth - $Title.Length - $titlePadding
    $titleLine = "║ $(' ' * $titlePadding)$Title$(' ' * $titleRightPadding) ║"
    Write-Host $titleLine -ForegroundColor Yellow
    
    # Separator
    Write-Host "╠$('═' * ($boxWidth - 2))╣" -ForegroundColor Yellow
    
    # Process message content
    $messageLines = $Message -split "`r?`n" | Where-Object { $_ -ne $null }
    
    foreach ($line in $messageLines) {
        $trimmedLine = $line.TrimEnd()
        
        if ($trimmedLine.Length -eq 0) {
            # Empty line
            Write-Host "║$(' ' * ($boxWidth - 2))║" -ForegroundColor Yellow
        }
        elseif ($trimmedLine.Length -le $contentWidth) {
            # Line fits within box
            $padding = $contentWidth - $trimmedLine.Length
            Write-Host "║ $trimmedLine$(' ' * $padding) ║" -ForegroundColor Yellow
        }
        else {
            # Line needs wrapping
            $remainingText = $trimmedLine
            while ($remainingText.Length -gt 0) {
                if ($remainingText.Length -le $contentWidth) {
                    # Last piece fits
                    $padding = $contentWidth - $remainingText.Length
                    Write-Host "║ $remainingText$(' ' * $padding) ║" -ForegroundColor Yellow
                    break
                }
                
                # Find good break point
                $breakPoint = $contentWidth
                $lastSpace = $remainingText.LastIndexOf(' ', $breakPoint - 1)
                
                if ($lastSpace -gt 0 -and $lastSpace -gt ($contentWidth * 0.7)) {
                    $breakPoint = $lastSpace
                }
                
                $linePart = $remainingText.Substring(0, $breakPoint).TrimEnd()
                $padding = $contentWidth - $linePart.Length
                Write-Host "║ $linePart$(' ' * $padding) ║" -ForegroundColor Yellow
                
                $remainingText = $remainingText.Substring($breakPoint).TrimStart()
            }
        }
    }
    
    # Bottom border
    Write-Host "╚$('═' * ($boxWidth - 2))╝" -ForegroundColor Yellow
    Write-Host ""
    
    # Prompt for confirmation
    do {
        $response = Read-Host "Do you want to continue? (Y/N)"
        if ($response -match '^[YyNn]$') {
            break
        }
        Write-Host "Please enter Y (Yes) or N (No)" -ForegroundColor Red
    } while ($true)
    
    return $response -match '^[Yy]$'
}
#endregion

#region Core Functions

function Apply-DynamicVariables {
    <#
    .SYNOPSIS
    Applies dynamic variable replacements to a JSON file using JSONPath mappings and runtime values.
    
    .DESCRIPTION
    Reads the dynamic-variables-mapping.json file, finds entries for the specified file,
    and replaces placeholders with runtime values from the $Script:RuntimeVariables collection.
    The relative path is automatically calculated from the FilePath and the workspace items base path.
    
    .PARAMETER FilePath
    The full path to the JSON file (notebook-content.ipynb or pipeline-content.json).
    #>
    param(
        [Parameter(Mandatory = $true)]
        [string]$FilePath
    )
    
    try {
        # Calculate RelativePath from FilePath using script variable
        $basePath = $script:workspaceItemsTempPath
        
        if (-not $basePath) {
            Write-Log "Cannot calculate relative path: `$script:workspaceItemsTempPath is not set" -Level "ERROR"
            throw "`$script:workspaceItemsTempPath must be set before calling Apply-DynamicVariables"
        }
        
        # Normalize paths for comparison
        $normalizedFilePath = [System.IO.Path]::GetFullPath($FilePath)
        $normalizedBasePath = [System.IO.Path]::GetFullPath($basePath)
        
        # Ensure base path ends with directory separator
        if (-not $normalizedBasePath.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
            $normalizedBasePath += [System.IO.Path]::DirectorySeparatorChar
        }
        
        # Check if FilePath is under the base path
        if (-not $normalizedFilePath.StartsWith($normalizedBasePath, [System.StringComparison]::OrdinalIgnoreCase)) {
            Write-Log "FilePath is not under WorkspaceItemsPath. FilePath: $normalizedFilePath, BasePath: $normalizedBasePath" -Level "ERROR"
            throw "FilePath must be under WorkspaceItemsPath"
        }
        
        # Calculate relative path and convert to forward slashes (for consistency with mapping file)
        $RelativePath = $normalizedFilePath.Substring($normalizedBasePath.Length).Replace('\', '/')
        Write-Log "  Calculated relative path: $RelativePath"
        
        Write-Log "Applying dynamic variables to: $RelativePath" -Level "INFO"
        
        # Read the mapping file
        $mappingFile = Join-Path $PSScriptRoot "dynamic-variables-mapping.json"
        if (-not (Test-Path $mappingFile)) {
            Write-Log "Mapping file not found: $mappingFile" -Level "WARNING"
            return
        }
        
        $mapping = Get-Content $mappingFile -Raw | ConvertFrom-Json
        
        # Find variables for this file
        $fileVariables = @()
        foreach ($folderMapping in $mapping.mappings) {
            foreach ($fileMapping in $folderMapping.files) {
                # Compare relative paths
                if ($fileMapping.file -eq $RelativePath) {
                    $fileVariables += $fileMapping.dynamic_variables
                    Write-Log "  Found $($fileMapping.dynamic_variables.Count) variables for this file" -Level "INFO"
                    break
                }
            }
            if ($fileVariables.Count -gt 0) { break }
        }
        
        if ($fileVariables.Count -eq 0) {
            Write-Log "  No dynamic variables found for this file" -Level "INFO"
            return
        }
        
        # Read and parse the file
        $content = Get-Content $FilePath -Raw -Encoding UTF8
        $jsonObj = $content | ConvertFrom-Json
        
        $variablesApplied = 0
        $variablesFailed = 0
        
        # Apply each variable mapping
        foreach ($varMapping in $fileVariables) {
            $path = $varMapping.path
            $templateValue = $varMapping.value
            
            # Resolve template value using runtime variables
            $runtimeValue = Resolve-TemplateValue -TemplateValue $templateValue
            
            Write-Log "    Attempting: $path = $runtimeValue" -Level "INFO"
            
            $success = Set-JsonPathValue -JsonObject $jsonObj -Path $path -NewValue $runtimeValue
            
            if ($success) {
                $variablesApplied++
                Write-Log "    Applied: $path = $runtimeValue" -Level "INFO"
            } else {
                $variablesFailed++
                Write-Log "    Failed to apply: $path = $runtimeValue" -Level "WARNING"
            }
        }
        
        # Save file if changes were made
        if ($variablesApplied -gt 0) {
            $newContent = $jsonObj | ConvertTo-Json -Depth 100
            Set-Content -Path $FilePath -Value $newContent -Encoding UTF8 -NoNewline
            Write-Log "   ✅ Applied $variablesApplied dynamic variables" -Level "SUCCESS"
            Write-Log "  Applied $variablesApplied variables ($variablesFailed failed)" -Level "SUCCESS"
        }
    }
    catch {
        Write-Log "  Error applying dynamic variables: $_" -Level "ERROR"
    }
}

function Resolve-TemplateValue {
    <#
    .SYNOPSIS
    Resolves template placeholders like {WORKSPACE_ID} with actual runtime values.
    
    .PARAMETER TemplateValue
    The template string containing placeholders (e.g., "{WORKSPACE_ID}" or "%run <NotebookName>").
    #>
    param(
        [string]$TemplateValue
    )
    
    $result = $TemplateValue
    
    # Replace all {{VariableName}} placeholders (names) with runtime values
    $doubleMatches = [regex]::Matches($result, '\{\{([A-Za-z0-9_]+)\}\}')
    foreach ($match in $doubleMatches) {
        $variableName = $match.Groups[1].Value
        if ($Script:RuntimeVariables.ContainsKey($variableName)) {
            $runtimeValue = $Script:RuntimeVariables[$variableName]
            if ($null -ne $runtimeValue) {
                $result = $result.Replace($match.Value, $runtimeValue)
                Write-Log "      Resolved {{$variableName}} -> $runtimeValue" -Level "INFO"
            }
            else {
                Write-Log "    Runtime variable is null: $variableName" -Level "WARNING"
            }
        }
        else {
            Write-Log "    Runtime variable not found: $variableName" -Level "WARNING"
        }
    }
    
    # Replace all {VARIABLE_NAME} placeholders (IDs) with runtime values
    $singleMatches = [regex]::Matches($result, '\{([A-Za-z0-9_]+)\}')
    foreach ($match in $singleMatches) {
        $variableName = $match.Groups[1].Value
        if ($Script:RuntimeVariables.ContainsKey($variableName)) {
            $runtimeValue = $Script:RuntimeVariables[$variableName]
            if ($null -ne $runtimeValue) {
                $result = $result.Replace($match.Value, $runtimeValue)
                Write-Log "      Resolved {$variableName} -> $runtimeValue" -Level "INFO"
            }
            else {
                Write-Log "    Runtime variable is null: $variableName" -Level "WARNING"
            }
        }
        else {
            Write-Log "    Runtime variable not found: $variableName" -Level "WARNING"
        }
    }
    
    # Handle %run <NotebookName> patterns - replace with runtime notebook names
    if ($result -match '^%run <(.+?)>(.*)$') {
        $baseNotebookName = $Matches[1]
        $parameters = $Matches[2]
        
        # Look up the runtime notebook name (with prefix) directly by the base name
        if ($Script:RuntimeVariables.ContainsKey($baseNotebookName)) {
            $runtimeNotebookName = $Script:RuntimeVariables[$baseNotebookName]
            $result = "%run $runtimeNotebookName$parameters"
            Write-Log "      Resolved notebook reference: $baseNotebookName -> $runtimeNotebookName" -Level "INFO"
        }
        else {
            Write-Log "    Runtime notebook name not found for: $baseNotebookName" -Level "WARNING"
        }
    }
    
    return $result
}

function Set-JsonPathValue {
    <#
    .SYNOPSIS
    Navigates a JSON object using JSONPath notation and sets a value.
    
    .PARAMETER JsonObject
    The parsed JSON object (from ConvertFrom-Json).
    
    .PARAMETER Path
    The JSONPath string (e.g., "$.cells[0].source[0]" or "$.properties.activities[?(@.name == 'Import sample data')].typeProperties.notebookId").
    
    .PARAMETER NewValue
    The value to set at the specified path.
    #>
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

function Show-RuntimeVariables {
    <#
    .SYNOPSIS
    Displays the current state of all runtime variables in a formatted table.
    
    .DESCRIPTION
    Shows all runtime variables from the $Script:RuntimeVariables hashtable,
    sorted alphabetically by name. Only displays when -Verbose is specified.
    #>
    [CmdletBinding()]
    param()
    
    if ($PSCmdlet.MyInvocation.BoundParameters['Verbose']) {
        Write-Host ""
        Write-Host "   📋 Runtime Variables State:" -ForegroundColor Cyan
        Write-Host "   $('=' * 76)" -ForegroundColor Gray
        $Script:RuntimeVariables.GetEnumerator() | Sort-Object Name | Format-Table -AutoSize
        Write-Host ""
        Write-Host "   $('=' * 76)" -ForegroundColor Gray
        Write-Host ""
    }
}

function Save-RuntimeVariables {
    <#
    .SYNOPSIS
    Saves runtime variables to a JSON file for persistence and debugging.
    
    .DESCRIPTION
    Serializes the RuntimeVariables hashtable to a JSON file in the Logs directory.
    The file is named with the workspace and prefix for easy identification.
    Only the latest version is kept.
    
    .PARAMETER WorkspaceName
    The name of the workspace (used in filename).
    
    .PARAMETER Prefix
    The prefix used for resources (used in filename).
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$WorkspaceName,
        
        [Parameter(Mandatory = $true)]
        [string]$Prefix
    )
    
    try {
        $sanitizedPrefix = $Prefix -replace '[^A-Za-z0-9_]', '_'
        $sanitizedWorkspace = $WorkspaceName -replace '[^A-Za-z0-9_]', '_'
        $fileName = "RuntimeVariables-${sanitizedPrefix}${sanitizedWorkspace}.json"
        $filePath = Join-Path $PSScriptRoot $fileName
        
        # Sort the hashtable keys alphabetically before converting to JSON
        $sortedVariables = [ordered]@{}
        $Script:RuntimeVariables.Keys | Sort-Object | ForEach-Object {
            $sortedVariables[$_] = $Script:RuntimeVariables[$_]
        }
        
        $json = $sortedVariables | ConvertTo-Json -Depth 10
        Set-Content -Path $filePath -Value $json -Encoding UTF8
        
        Write-Log "Runtime variables saved to: $filePath" -Level "INFO"
        Write-Verbose "   💾 Runtime variables saved to: $fileName"
    }
    catch {
        Write-Log "Failed to save runtime variables: $($_.Exception.Message)" -Level "WARNING"
    }
}

function Load-RuntimeVariables {
    <#
    .SYNOPSIS
    Loads runtime variables from a JSON file if it exists.
    
    .DESCRIPTION
    Attempts to load previously saved RuntimeVariables from a JSON file.
    This allows resuming installations or using previously configured values.
    
    .PARAMETER WorkspaceName
    The name of the workspace (used in filename).
    
    .PARAMETER Prefix
    The prefix used for resources (used in filename).
    
    .RETURNS
    Returns $true if variables were loaded, $false otherwise.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$WorkspaceName,
        
        [Parameter(Mandatory = $true)]
        [string]$Prefix
    )
    
    try {
        $sanitizedPrefix = $Prefix -replace '[^A-Za-z0-9_]', '_'
        $sanitizedWorkspace = $WorkspaceName -replace '[^A-Za-z0-9_]', '_'
        $fileName = "RuntimeVariables-${sanitizedPrefix}${sanitizedWorkspace}.json"
        $filePath = Join-Path $PSScriptRoot $fileName
        
        if (Test-Path $filePath) {
            $json = Get-Content $filePath -Raw -Encoding UTF8
            $loadedVars = $json | ConvertFrom-Json
            
            # Merge loaded variables into RuntimeVariables (only non-null values)
            $loadedCount = 0
            foreach ($property in $loadedVars.PSObject.Properties) {
                if ($null -ne $property.Value -and $property.Value -ne "") {
                    $Script:RuntimeVariables[$property.Name] = $property.Value
                    $loadedCount++
                }
            }
            
            Write-Host ""
            Write-Host "   📂 " -NoNewline -ForegroundColor Cyan
            Write-Host "Loaded $loadedCount runtime variables from: " -NoNewline -ForegroundColor White
            Write-Host "$fileName" -ForegroundColor Gray
            Write-Log "Loaded $loadedCount runtime variables from: $filePath" -Level "INFO"
            
            return $true
        }
        
        return $false
    }
    catch {
        Write-Log "Failed to load runtime variables: $($_.Exception.Message)" -Level "WARNING"
        return $false
    }
}

function Apply-AllDynamicVariables {
    <#
    .SYNOPSIS
    Applies dynamic variable replacements to all workspace item files based on mapping configuration.
    
    .DESCRIPTION
    Iterates through all files defined in dynamic-variables-mapping.json and applies runtime variable
    substitutions for variables that have been populated (non-null). This is called after copying
    workspace items to the build directory and after artifact names have been initialized.
    
    .PARAMETER WorkspaceItemsPath
    The path to the workspace items directory (typically the Build directory).
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$WorkspaceItemsPath
    )
    
    Write-Host ""
    Write-Host "🔄 " -NoNewline -ForegroundColor Cyan
    Write-Host "Applying dynamic variables to workspace items" -ForegroundColor White
    Write-Log "Applying dynamic variables to all workspace items" -Level "INFO"
    
    try {
        # Read the mapping file
        $mappingFile = Join-Path $PSScriptRoot "dynamic-variables-mapping.json"
        if (-not (Test-Path $mappingFile)) {
            Write-Log "Mapping file not found: $mappingFile" -Level "WARNING"
            Write-Host "   ⚠️  Mapping file not found - skipping dynamic variable application" -ForegroundColor Yellow
            return
        }
        
        $mapping = Get-Content $mappingFile -Raw | ConvertFrom-Json
        
        $totalFiles = 0
        $processedFiles = 0
        $skippedFiles = 0
        
        # Count total files
        foreach ($folderMapping in $mapping.mappings) {
            $totalFiles += $folderMapping.files.Count
        }
        
        Write-Host "   📋 Processing $totalFiles files..." -ForegroundColor Gray
        
        # Process each folder and file in the mapping
        foreach ($folderMapping in $mapping.mappings) {
            foreach ($fileMapping in $folderMapping.files) {
                $relativePath = $fileMapping.file
                $filePath = Join-Path $WorkspaceItemsPath $relativePath
                
                # Check if file exists
                if (-not (Test-Path $filePath)) {
                    Write-Verbose "   ⚠️  File not found: $relativePath"
                    $skippedFiles++
                    continue
                }
                
                # Check if this file has any variables that are populated
                $hasPopulatedVars = $false
                foreach ($varMapping in $fileMapping.dynamic_variables) {
                    $templateValue = $varMapping.value
                    
                    # Check if template contains any populated runtime variables
                    $matches = [regex]::Matches($templateValue, '\{([A-Z_]+)\}')
                    foreach ($match in $matches) {
                        $variableName = $match.Groups[1].Value
                        if ($Script:RuntimeVariables.ContainsKey($variableName) -and 
                            $null -ne $Script:RuntimeVariables[$variableName]) {
                            $hasPopulatedVars = $true
                            break
                        }
                    }
                    
                    # Check for %run notebook references
                    if ($templateValue -match '^%run <(.+?)>') {
                        $baseNotebookName = $Matches[1]
                        if ($Script:RuntimeVariables.ContainsKey($baseNotebookName) -and 
                            $null -ne $Script:RuntimeVariables[$baseNotebookName]) {
                            $hasPopulatedVars = $true
                            break
                        }
                    }
                    
                    if ($hasPopulatedVars) { break }
                }
                
                # Only process if we have populated variables
                if ($hasPopulatedVars) {
                    Write-Verbose "   🔧 Processing: $relativePath"
                    Apply-DynamicVariables -FilePath $filePath
                    $processedFiles++
                }
                else {
                    Write-Verbose "   ⏭️  Skipping (no populated vars): $relativePath"
                    $skippedFiles++
                }
            }
        }
        
        Write-Host "   ✅ Dynamic variables applied" -ForegroundColor Green
        Write-Host "      📊 Processed: $processedFiles files, Skipped: $skippedFiles files" -ForegroundColor Gray
        Write-Log "Applied dynamic variables to $processedFiles files ($skippedFiles skipped)" -Level "SUCCESS"
    }
    catch {
        Write-Host "   ❌ Failed to apply dynamic variables: $($_.Exception.Message)" -ForegroundColor Red
        Write-Log "Error applying dynamic variables: $_" -Level "ERROR"
        throw
    }
}

function Upload-FilesToLakehouse ($localPath, $lakehouseName, $subPath) {
    try {
        # Get file count first
        $files = Get-ChildItem -Path $localPath -File -Filter "*.csv"
        $fileCount = $files.Count
        
        if ($fileCount -eq 0) {
            Write-Host "   ⚠️  No CSV files found to upload" -ForegroundColor Yellow
            return
        }
        
        # Create the destination path
        $fabricPath = "$WorkspaceName.Workspace/${lakehouseName}.Lakehouse/Files/$subPath"
        
        # Suppress all output during upload operations
        $originalProgress = $ProgressPreference
        $ProgressPreference = 'SilentlyContinue'

        try {
            # Create directory structure silently
            Write-Log "Creating fabric path: $fabricPath" -Level "INFO"
            Invoke-FabCommand -Command "create" -Arguments @($fabricPath) -ErrorAction SilentlyContinue | Out-Null
            Write-Host "   📂 Fabric path created: $fabricPath" -ForegroundColor Gray
        }
        catch {
            if ($_.Exception.Message -match "`[PathAlreadyExists`]") {
                Write-Host "   📂 Fabric path already exists: $fabricPath" -ForegroundColor Gray
            }
            else {
                Write-Log "Failed to create fabric path: $fabricPath - $($_.Exception.Message)" -Level "ERROR"
                Write-Host "   ❌ Failed to create fabric path: $fabricPath - $($_.Exception.Message)" -ForegroundColor Red
                throw
            }
        }

        Write-Host "   📂 Uploading $fileCount CSV files..." -ForegroundColor Gray
        
        # Upload files with simple progress tracking
        $currentFile = 0
        $successCount = 0
        
        foreach ($file in $files) {
            $currentFile++
            $percentComplete = [math]::Round(($currentFile / $fileCount) * 100)
            
            # Simple status indicator
            Write-Host "   📄 " -NoNewline -ForegroundColor Gray
            Write-Host "[$currentFile/$fileCount] " -NoNewline -ForegroundColor White
            Write-Host "$($file.Name)..." -NoNewline -ForegroundColor Gray
            
            try {
                # Upload file completely silently
                $copyOutput = Invoke-FabCommand -Command "cp" -Arguments @($file.FullName, "$fabricPath/") -ErrorAction Stop
                Write-Host " ✅" -ForegroundColor Green
                $successCount++
            }
            catch {
                Write-Host " ❌" -ForegroundColor Red
                Write-Host "   Error uploading $($file.Name): $($_.Exception.Message)" -ForegroundColor Red
            }
        }
        
        # Restore progress preference
        $ProgressPreference = $originalProgress
        
        if ($successCount -eq $fileCount) {
            Write-Host "   ✅ All $fileCount files uploaded successfully" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  $successCount of $fileCount files uploaded" -ForegroundColor Yellow
        }
        
        Write-Log "Uploaded $successCount of $fileCount files to $lakehouseName" -Level "SUCCESS"
    }
    catch {
        $ProgressPreference = $originalProgress
        Write-Host "   ❌ Upload failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Log "Failed to upload files to lakehouse: $($_.Exception.Message)" -Level "ERROR"
        throw
    }
}

function Setup-SalesforceConnection {
    # Skip if already configured
    if ($null -ne $Script:RuntimeVariables["SALESFORCE_CONNECTION_ID"] -and 
        $Script:RuntimeVariables["SALESFORCE_CONNECTION_ID"] -ne "") {
        Write-Log "Salesforce connection already configured (ID: $($Script:RuntimeVariables['SALESFORCE_CONNECTION_ID'])), skipping setup" -Level "INFO"
        return
    }
    
    Write-Log "Setting up Salesforce connection..." -Level "INFO"
    
    try {
        $connections = Invoke-FabCommand -Command "ls" -Arguments @(".connections", "-l")
        
        $lines = $connections -split "`n"
        $salesforceConnections = @()
        
        foreach ($line in $lines) {
            if ($line -match "^\s*(.+?)\s+([a-f0-9-]{36})\s+Salesforce\s+") {
                $salesforceConnections += @{
                    Name = $matches[1]
                    Id = $matches[2]
                }
            }
        }

        if ($salesforceConnections.Count -eq 0) {
            Write-Log "No Salesforce connection found in the Fabric tenant." -Level "WARNING"
            Write-Log "The Salesforce export pipeline will be created with a placeholder connection." -Level "WARNING"
            Write-Log "You can update the connection manually after installation or rerun the installation once you create a Salesforce connection." -Level "INFO"
            $Script:RuntimeVariables["SALESFORCE_CONNECTION_ID"] = "SalesforceConnectionIdPlaceholder"
            $Script:RuntimeVariables["SALESFORCE_CONNECTION_NAME"] = "SalesforceConnectionNamePlaceholder"
        }
        else {
            Write-Host ""
            Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
            Write-Host "║                        SALESFORCE CONNECTIONS FOUND                        ║" -ForegroundColor Green
            Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
            Write-Host ""
            
            for ($i = 0; $i -lt $salesforceConnections.Count; $i++) {
                $displayName = $salesforceConnections[$i].Name -replace '\.Connection$', ''
                Write-Host "  $($i + 1). " -NoNewline -ForegroundColor Cyan
                Write-Host "$displayName" -ForegroundColor White
                Write-Host "     🆔 ID: $($salesforceConnections[$i].Id)" -ForegroundColor Gray
                Write-Host ""
            }

            Write-Host "  0. " -NoNewline -ForegroundColor Yellow
            Write-Host "Use placeholder (configure manually later)" -ForegroundColor Yellow
            Write-Host ""

            do {
                $selection = Read-Host "Please select a Salesforce connection (0-$($salesforceConnections.Count))"
                if ($selection -match '^\d+$' -and [int]$selection -ge 0 -and [int]$selection -le $salesforceConnections.Count) {
                    break
                }
                Write-Host "❌ Invalid selection. Please enter a number between 0 and $($salesforceConnections.Count)." -ForegroundColor Red
                Write-Host ""
            } while ($true)

            if ($selection -eq 0) {
                $Script:RuntimeVariables["SALESFORCE_CONNECTION_ID"] = "SalesforceConnectionIdPlaceholder"
                $Script:RuntimeVariables["SALESFORCE_CONNECTION_NAME"] = "SalesforceConnectionNamePlaceholder"
                Write-Log "Using placeholder connection - manual configuration required later" -Level "WARNING"
            }
            else {
                $selectedConnection = $salesforceConnections[$selection - 1]
                $Script:RuntimeVariables["SALESFORCE_CONNECTION_ID"] = $selectedConnection.Id
                $Script:RuntimeVariables["SALESFORCE_CONNECTION_NAME"] = $selectedConnection.Id
                $selectedName = $selectedConnection.Name -replace '\.Connection$', ''
                Write-Log "Selected Salesforce connection: $selectedName" -Level "SUCCESS"
            }
        }
        
        # Store Salesforce connection ID and Name in runtime variables
        # (already stored above in both branches)
    }
    catch {
        Write-Log "Error setting up Salesforce connection: $($_.Exception.Message)" -Level "ERROR"
        Write-Log "Proceeding with placeholder connection" -Level "WARNING"
        $Script:RuntimeVariables["SALESFORCE_CONNECTION_ID"] = "SalesforceConnectionIdPlaceholder"
        $Script:RuntimeVariables["SALESFORCE_CONNECTION_NAME"] = "SalesforceConnectionNamePlaceholder"
    }
}

function Setup-D365Lakehouse {
    # Skip if already configured
    if ($null -ne $Script:RuntimeVariables["DYNAMICS_LAKEHOUSE_NAME"] -and 
        $Script:RuntimeVariables["DYNAMICS_LAKEHOUSE_NAME"] -ne "") {
        Write-Log "D365 lakehouse already configured (Name: $($Script:RuntimeVariables['DYNAMICS_LAKEHOUSE_NAME'])), skipping setup" -Level "INFO"
        return
    }
    
    Write-Log "Setting up D365 lakehouse connection..." -Level "INFO"
    
    try {
        $lakehouses = Invoke-FabCommand -Command "ls" -Arguments @("$WorkspaceName.Workspace", "-l")
        
        Write-Log "Raw lakehouse output: $lakehouses" -Level "INFO"
        
        $lines = $lakehouses -split "`n"
        $d365Lakehouses = @()
        
        Write-Log "Processing $($lines.Count) lines for lakehouse detection" -Level "INFO"
        
        # Parse lakehouse list - all lakehouses in the workspace
        foreach ($line in $lines) {
            # Match format for Lakehouse items: Name.Lakehouse    Id
            # Handle cases where GUID might be on next line due to terminal width
            if ($line -match "^\s*(.+\.Lakehouse)\s+([a-f0-9-]{8,36}[a-f0-9-]*)") {
                $fullLakehouseName = $matches[1].Trim()
                $lakehouseId = $matches[2].Trim()
                
                # Remove .Lakehouse suffix to get the actual lakehouse name
                $lakehouseName = $fullLakehouseName -replace '\.Lakehouse$', ''
                
                Write-Log "Found lakehouse candidate: '$lakehouseName' (ID: $lakehouseId)" -Level "INFO"
                
                # Skip header and empty lines
                if ($lakehouseName -ne "name" -and ![string]::IsNullOrWhiteSpace($lakehouseName)) {
                    $d365Lakehouses += @{
                        Name = $lakehouseName
                        Id = $lakehouseId
                    }
                    Write-Log "Added lakehouse: $lakehouseName" -Level "SUCCESS"
                }
            } else {
                Write-Log "Line did not match lakehouse pattern: '$line'" -Level "INFO"
            }
        }

        Write-Host ""
        Write-Host "╔════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
        Write-Host "║                          D365 LAKEHOUSES AVAILABLE                         ║" -ForegroundColor Green
        Write-Host "╚════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
        Write-Host ""
        
        if ($d365Lakehouses.Count -eq 0) {
            Write-Log "No D365 lakehouse found in the Fabric workspace." -Level "WARNING"
            Write-Log "The D365 notebooks will be created with placeholder lakehouse references." -Level "WARNING"
            Write-Log "You can update the lakehouse references manually after installation or rerun the installation once you add a D365 lakehouse." -Level "INFO"
        }
        else {
            for ($i = 0; $i -lt $d365Lakehouses.Count; $i++) {
                Write-Host "  $($i + 1). " -NoNewline -ForegroundColor Cyan
                Write-Host "$($d365Lakehouses[$i].Name)" -ForegroundColor White
                Write-Host "     🆔 ID: $($d365Lakehouses[$i].Id)" -ForegroundColor Gray
                Write-Host ""
            }
        }

        Write-Host "  0. " -NoNewline -ForegroundColor Yellow
        Write-Host "Use placeholder (configure manually later)" -ForegroundColor Yellow
        Write-Host ""

        do {
            $selection = Read-Host "Please select a D365 lakehouse (0-$($d365Lakehouses.Count))"
            if ($selection -match '^\d+$' -and [int]$selection -ge 0 -and [int]$selection -le $d365Lakehouses.Count) {
                break
            }
            Write-Host "❌ Invalid selection. Please enter a number between 0 and $($d365Lakehouses.Count)." -ForegroundColor Red
            Write-Host ""
        } while ($true)

        if ($selection -eq 0) {
            $Script:RuntimeVariables["DYNAMICS_LAKEHOUSE_NAME"] = "D365LakehouseNamePlaceholder"
            $Script:RuntimeVariables["DYNAMICS_LAKEHOUSE_ID"] = "D365LakehouseIdPlaceholder"
            Write-Log "Using placeholder lakehouse - manual configuration required later" -Level "WARNING"
        }
        else {
            $selectedLakehouse = $d365Lakehouses[$selection - 1]
            $Script:RuntimeVariables["DYNAMICS_LAKEHOUSE_NAME"] = $selectedLakehouse.Name
            Write-Log "Selected D365 lakehouse: $($selectedLakehouse.Name)" -Level "SUCCESS"
        }
    }
    catch {
        Write-Log "Error setting up D365 lakehouse: $($_.Exception.Message)" -Level "ERROR"
        Write-Log "Proceeding with placeholder lakehouse" -Level "WARNING"
        $Script:RuntimeVariables["DYNAMICS_LAKEHOUSE_NAME"] = "D365LakehouseNamePlaceholder"
        $Script:RuntimeVariables["DYNAMICS_LAKEHOUSE_ID"] = "D365LakehouseIdPlaceholder"
    }
    
    # Get the lakehouse ID for the existing D365 lakehouse (only if not using placeholder)
    if ($Script:RuntimeVariables["DYNAMICS_LAKEHOUSE_NAME"] -ne "D365LakehouseNamePlaceholder") {
        $fabricPath = "$WorkspaceName.Workspace/$($Script:RuntimeVariables['DYNAMICS_LAKEHOUSE_NAME']).Lakehouse"
        
        try {
            $Script:RuntimeVariables["DYNAMICS_LAKEHOUSE_ID"] = Get-FabItem $fabricPath "id"
            Write-Host ""
            Write-Host "   ✅ Found D365 lakehouse: " -NoNewline -ForegroundColor Green
            Write-Host "$($Script:RuntimeVariables['DYNAMICS_LAKEHOUSE_NAME'])" -ForegroundColor Yellow
            Write-Log "D365 lakehouse connected: $($Script:RuntimeVariables['DYNAMICS_LAKEHOUSE_NAME']) (ID: $($Script:RuntimeVariables['DYNAMICS_LAKEHOUSE_ID']))" -Level "SUCCESS"
        } catch {
            Write-Host ""
            Write-Host "   ❌ Could not find D365 lakehouse '$($Script:RuntimeVariables['DYNAMICS_LAKEHOUSE_NAME'])' in workspace" -ForegroundColor Red
            Write-Host "      Falling back to placeholder configuration" -ForegroundColor Red
            Write-Log "Failed to find D365 lakehouse: $($Script:RuntimeVariables['DYNAMICS_LAKEHOUSE_NAME']) - $($_.Exception.Message)" -Level "ERROR"
            Write-Log "Using placeholder lakehouse configuration" -Level "WARNING"
            $Script:RuntimeVariables["DYNAMICS_LAKEHOUSE_NAME"] = "D365LakehouseNamePlaceholder"
            $Script:RuntimeVariables["DYNAMICS_LAKEHOUSE_ID"] = "D365LakehouseIdPlaceholder"
        }
    }
}

function Invoke-FabCommand {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command,
        
        [Parameter(Mandatory = $false)]
        [string[]]$Arguments = @(),
        
        [Parameter(Mandatory = $false)]
        [string]$WorkingDirectory = (Get-Location).Path,
        
        [Parameter(Mandatory = $false)]
        [switch]$NoOutput
    )
    
    try {
        # Strip unsupported .Folder/ segments from fab CLI paths.
        # The fab CLI does not support .Folder as an item type, so paths like
        # "workspace.Workspace/folder.Folder/item.Notebook" must be reduced to
        # "workspace.Workspace/item.Notebook". Folder management is handled
        # separately via the Fabric REST API.
        $Arguments = @($Arguments | ForEach-Object {
            $_ -replace '/[^/\s]+\.Folder/', '/'
        })

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

        # Set Python to emit UTF-8:
        $psi.EnvironmentVariables['PYTHONIOENCODING'] = 'utf-8'
        $proc = [System.Diagnostics.Process]::Start($psi)

        $stdOut = ""
        $stdErr = ""
        
        if ($proc.StandardOutput) {
            $stdOut = ($proc.StandardOutput.ReadToEnd() -replace "`r`n", "`n").Trim()
        }
        if ($proc.StandardError) {
            $stdErr = ($proc.StandardError.ReadToEnd() -replace "`r`n", "`n").Trim()
        }

        $proc.WaitForExit()

        Write-Verbose "Exit code: $($proc.ExitCode)"
        Write-Verbose "=== STDOUT ==="
        Write-Verbose $stdOut
        Write-Verbose "=== STDERR ==="
        Write-Verbose $stdErr

        if ($proc.ExitCode -ne 0) {
            throw $stdOut.Trim()
        }

        # Return just the output string for compatibility with existing code
        # When NoOutput is specified, we return stdout even on error to allow error checking
        return $stdOut.Trim()
    }
    catch {
        Write-Log "Failed to execute fab command: $($_.Exception.Message)" -Level "ERROR"
        throw
    }
}

function Invoke-FabApi {
    <#
    .SYNOPSIS
    Calls the Fabric REST API via the fab CLI and handles response parsing.

    .DESCRIPTION
    Wraps Invoke-FabCommand for 'fab api' calls. The fab CLI wraps all API responses
    in {"status_code": ..., "text": ...} and returns exit code 0 even for HTTP errors.
    This function unwraps the response, checks the HTTP status code, and throws on errors.

    .RETURNS
    The unwrapped response body (the content of the "text" field).
    #>
    param(
        [Parameter(Mandatory = $true)]
        [string]$Endpoint,

        [Parameter(Mandatory = $false)]
        [string]$Method = "get",

        [Parameter(Mandatory = $false)]
        [string]$BodyFile = $null
    )

    $apiArgs = @($Endpoint, "-X", $Method)
    if ($BodyFile) { $apiArgs += @("-i", $BodyFile) }

    $raw = Invoke-FabCommand -Command "api" -Arguments $apiArgs
    $parsed = $raw | ConvertFrom-Json

    # fab api wraps every response: {"status_code": <int>, "text": <object>}
    $statusCode = if ($null -ne $parsed.status_code) { [int]$parsed.status_code } else { 200 }
    $responseBody = if ($null -ne $parsed.text) { $parsed.text } else { $parsed }

    if ($statusCode -ge 400) {
        $errorMsg = if ($responseBody.message) { $responseBody.message } else { "HTTP $statusCode" }
        throw "Fabric API error ($statusCode): $errorMsg"
    }

    return $responseBody
}

function Get-FabItemId {
    <#
    .SYNOPSIS
    Retrieves the ID of a Fabric item using the fab CLI with optional retry mechanism.
    
    .DESCRIPTION
    This function retrieves the ID (GUID) of a Fabric item by its path. It handles common
    error cases and validates that the returned value is a valid GUID. By default, it performs
    a single attempt. When -WithRetry is specified, it includes a retry mechanism with
    progress indication for when resources are not immediately available (e.g., after creation).
    
    .PARAMETER FabricPath
    The path to the Fabric item (e.g., "workspace/item-name").
    
    .PARAMETER WithRetry
    Whether to use retry mechanism with progress indication. Default is $false for single attempt.
    Use this parameter when checking for resources after creation/import operations.
    
    .RETURNS
    Returns the item ID as a string if found and valid, otherwise returns $null.
    
    .EXAMPLE
    # Single attempt for existence check
    $itemId = Get-FabItemId -FabricPath "workspace/my-notebook"
    
    .EXAMPLE
    # Retry with progress for post-creation check
    $itemId = Get-FabItemId -FabricPath "workspace/my-notebook" -WithRetry
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$FabricPath,
        
        [Parameter(Mandatory = $false)]
        [switch]$WithRetry
    )
    
    try {
        Write-Verbose "Getting ID for Fabric item: $FabricPath $(if ($WithRetry) { '(with retry)' } else { '(single attempt)' })"
        
        # Helper function to attempt getting and validating the item ID
        function Get-ValidatedItemId {
            param([string]$Path)
            
            try {
                $itemId = Invoke-FabCommand -Command "get" -Arguments @($Path, "-q", "id") -NoOutput
                
                # Validate the returned ID
                if ([string]::IsNullOrWhiteSpace($itemId)) {
                    Write-Verbose "Item ID is null or empty for '$Path'"
                    return $null
                }
                # Check for common "not found" indicators
                elseif ($itemId -eq "None" -or $itemId -match '^\s*\[NotFound\].*') {
                    Write-Verbose "Item not found for '$Path' (returned: $itemId)"
                    return $null
                }
                # Validate that the ID is a proper GUID format
                else {
                    $guidPattern = '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
                    if ($itemId -notmatch $guidPattern) {
                        Write-Verbose "Item ID '$itemId' is not a valid GUID format for '$Path'"
                        return $null
                    }
                    else {
                        # Valid GUID found
                        Write-Verbose "Successfully retrieved item ID '$itemId' for '$Path'"
                        return $itemId.Trim()
                    }
                }
            }
            catch {
                Write-Verbose "Failed to get item ID for '$Path': $_"
                return $null
            }
        }
        
        # If not using retry, perform single attempt
        if (-not $WithRetry) {
            return Get-ValidatedItemId -Path $FabricPath
        }
        
        # With WithRetry: use retry mechanism for post-creation scenarios
        $itemId = $null
        $attempts = 0
        $maxAttempts = 5  # 10+ seconds timeout
        $progressShown = $false
        
        do {
            $itemId = Get-ValidatedItemId -Path $FabricPath
            
            if ($itemId) {
                # Valid GUID found
                if ($progressShown) {
                    Write-Host " ✅" -ForegroundColor Green
                }
                return $itemId
            }
            
            # If we don't have a valid ID yet, wait and retry
            $attempts++
            
            if ($attempts -eq 1) {
                $resourceName = ($FabricPath -split "/")[-1]
                Write-Host "   ⏳ Waiting for " -NoNewline -ForegroundColor Yellow
                Write-Host "$resourceName" -NoNewline -ForegroundColor White
                Write-Host " to become available" -NoNewline -ForegroundColor Yellow
                $progressShown = $true
            }
            
            if ($attempts -gt $maxAttempts) {
                if ($progressShown) {
                    Write-Host ""
                    Write-Log "Timeout waiting for '$FabricPath' to become available" -Level "ERROR"
                }
                Write-Verbose "Timeout waiting for '$FabricPath' to become available after $maxAttempts attempts"
                return $null
            }
            
            Start-Sleep -Seconds 2
            if ($progressShown) {
                Write-Host "." -NoNewline -ForegroundColor Yellow
            }
        }
        while ($attempts -le $maxAttempts)
        
        Write-Verbose "Failed to get valid item ID for '$FabricPath' after $attempts attempts"
        return $null
    }
    catch {
        Write-Verbose "Error getting item ID for '$FabricPath': $_"
        return $null
    }
}

function Get-FabItem ($fabricPath, $property, $silent = $false) {
    try {
        $result = Invoke-FabCommand -Command "get" -Arguments @($fabricPath, "-q", $property) -NoOutput

        if ($result -eq "None" -or [string]::IsNullOrEmpty($result)) {
            $resourceName = ($fabricPath -split "/")[-1]
            Write-Host "   ⏳ Waiting for " -NoNewline -ForegroundColor Yellow
            Write-Host "$resourceName" -NoNewline -ForegroundColor White
            Write-Host " to become available" -NoNewline -ForegroundColor Yellow
            
            $attempts = 0
            do {
                Start-Sleep -Seconds 2
                $result = Invoke-FabCommand -Command "get" -Arguments @($fabricPath, "-q", $property) -NoOutput
                Write-Host "." -NoNewline -ForegroundColor Yellow
                $attempts++
                
                if ($attempts -gt 5) { # 10+ seconds timeout
                    Write-Host ""
                    Write-Log "Timeout waiting for $resourceName to become available" -Level "ERROR"
                    throw "Resource creation timeout"
                }
            }
            while ($result -eq "None" -or [string]::IsNullOrEmpty($result))
            
            Write-Host " ✅" -ForegroundColor Green
        }

        return $result
    }
    catch {
        Write-Log "Failed to get Fabric item: $fabricPath - $($_.Exception.Message)" -Level "ERROR"
        throw
    }
}

function Move-ItemToFolder {
    <#
    .SYNOPSIS
    Moves a Fabric item into a folder using the Fabric REST API.
    
    .DESCRIPTION
    Since the fab CLI does not support .Folder as an item type, folder management
    is handled via the Fabric REST API. This function moves an item into a folder
    after it has been created/imported at the workspace root, using the dedicated
    POST /items/{itemId}/move endpoint.
    #>
    param(
        [Parameter(Mandatory = $true)]
        [string]$ItemId,
        
        [Parameter(Mandatory = $false)]
        [string]$FolderId = $Script:RuntimeVariables["FOLDER_ID"],
        
        [Parameter(Mandatory = $false)]
        [string]$ItemName = ""
    )
    
    if (-not $FolderId -or -not $ItemId) { return }
    
    try {
        $workspaceId = $Script:RuntimeVariables["WORKSPACE_ID"]
        
        # Use the dedicated /move endpoint to assign item to folder
        $body = @{
            targetFolderId = $FolderId
        } | ConvertTo-Json -Compress
        
        $tempFile = Join-Path ([System.IO.Path]::GetTempPath()) "fab-move-$([guid]::NewGuid().ToString('N')).json"
        Set-Content -Path $tempFile -Value $body -Encoding UTF8 -NoNewline
        
        try {
            Invoke-FabApi -Endpoint "workspaces/$workspaceId/items/$ItemId/move" -Method "post" -BodyFile $tempFile | Out-Null
            
            if ($ItemName) {
                Write-Host "   📂 Moved to folder '$Script:FolderName'" -ForegroundColor Gray
                Write-Log "Moved '$ItemName' to folder '$Script:FolderName' (FolderId: $FolderId)" -Level "SUCCESS"
            }
        }
        finally {
            Remove-Item -Path $tempFile -Force -ErrorAction SilentlyContinue
        }
    }
    catch {
        Write-Host "   ⚠️ Failed to move '$ItemName' to folder: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Log "Could not move item '$ItemName' ($ItemId) to folder '${FolderId}': $($_.Exception.Message)" -Level "WARNING"
    }
}

function New-FabricResource {
    param(
        [string]$ResourceType,
        [string]$ResourceName,
        [string]$FabricPath,
        [string]$Description = ""
    )
    
    Write-Host ""
    Write-Host "📦 " -NoNewline -ForegroundColor Cyan
    Write-Host "Creating ${ResourceType}: " -NoNewline -ForegroundColor White
    Write-Host "$ResourceName" -ForegroundColor Cyan
    if ($Description) {
        Write-Host "   💡 $Description" -ForegroundColor Gray
    }
    
    try {
        # Check if resource already exists
        $existingId = Get-FabItemId -FabricPath $FabricPath
        Write-Verbose "Existing ID: $existingId"
        
        if ($existingId) {
            Write-Host "   ⚠️ " -NoNewline -ForegroundColor Yellow
            Write-Host "${ResourceType} already exists - using existing resource" -ForegroundColor Yellow
            Write-Log "$ResourceType '$ResourceName' already exists (ID: $existingId)" -Level "WARNING"
            return $existingId
        }
        
        # Create the resource
        Write-Host "   🔨 Creating..." -ForegroundColor Gray
        $output = Invoke-FabCommand -Command "create" -Arguments @($FabricPath)
        Write-Host "   ✅ " -NoNewline -ForegroundColor Green
        Write-Host "${ResourceType} created successfully" -ForegroundColor Green

        # Get the ID of the created resource with progress indication
        $resourceId = Get-FabItemId -FabricPath $FabricPath -WithRetry
        Write-Host "   🆔 ID: " -NoNewline -ForegroundColor Gray
        Write-Host "$resourceId" -ForegroundColor White
        
        # Move to folder if one was created
        if ($Script:RuntimeVariables["FOLDER_ID"]) {
            Move-ItemToFolder -ItemId $resourceId -ItemName $ResourceName
        }
        
        Write-Log "$ResourceType '$ResourceName' created successfully (ID: $resourceId)" -Level "SUCCESS"
        return $resourceId
    }
    catch {
        Write-Host "   ❌ " -NoNewline -ForegroundColor Red
        Write-Host "Failed to create ${ResourceType}" -ForegroundColor Red
        Write-Log "Failed to create $ResourceType '$ResourceName': $($_.Exception.Message)" -Level "ERROR"
        throw
    }
}

function Import-FabricResource {
    param(
        [string]$ResourceType,
        [string]$ResourceName,
        [string]$FabricPath,
        [string]$LocalPath,
        [string]$Description = ""
    )
    
    Write-Host ""
    Write-Host "📥 " -NoNewline -ForegroundColor Cyan
    Write-Host "Importing ${ResourceType}: " -NoNewline -ForegroundColor White
    Write-Host "$ResourceName" -ForegroundColor Cyan
    if ($Description) {
        Write-Host "   💡 $Description" -ForegroundColor Gray
    }
    
    try {
        # Apply dynamic variables before importing
        # Determine the content file based on resource type
        $contentFile = switch ($ResourceType) {
            "Notebook" { "notebook-content.ipynb" }
            "Data Pipeline" { "pipeline-content.json" }
            default { $null }
        }
        
        if ($contentFile) {
            $contentPath = Join-Path $LocalPath $contentFile
            if (Test-Path $contentPath) {
                Write-Verbose "   🔧 Applying dynamic variables to $contentFile..."
                Apply-DynamicVariables -FilePath $contentPath
            }
        }
        
        # Check if resource already exists
        $existingId = Get-FabItemId -FabricPath $FabricPath
        
        $isUpdate = $false
        if ($existingId) {
            $isUpdate = $true
            Write-Host "   🔄 Updating existing ${ResourceType}..." -ForegroundColor Yellow
        }
        else {
            Write-Host "   🔨 Importing new ${ResourceType}..." -ForegroundColor Gray
        }
        
        # Import the resource
        $output = Invoke-FabCommand -Command "import" -Arguments @("-f", $FabricPath, "-i", $LocalPath)
        
        # Get the ID of the imported resource with progress indication
        $resourceId = Get-FabItemId -FabricPath $FabricPath -WithRetry
        
        if ($isUpdate) {
            Write-Host "   ✅ " -NoNewline -ForegroundColor Green
            Write-Host "${ResourceType} updated successfully" -ForegroundColor Green
            Write-Log "$ResourceType '$ResourceName' updated successfully (ID: $resourceId)" -Level "SUCCESS"
        }
        else {
            Write-Host "   ✅ " -NoNewline -ForegroundColor Green
            Write-Host "${ResourceType} imported successfully (ID: $resourceId)" -ForegroundColor Green
            Write-Log "$ResourceType '$ResourceName' imported successfully (ID: $resourceId)" -Level "SUCCESS"
            
            # Move to folder if one was created (only for new imports, not updates)
            if ($Script:RuntimeVariables["FOLDER_ID"]) {
                Move-ItemToFolder -ItemId $resourceId -ItemName $ResourceName
            }
        }
        
        #Write-Host "   🆔 ID: " -NoNewline -ForegroundColor Gray
        #Write-Host "$resourceId" -ForegroundColor White
        
        return $resourceId
    }
    catch {
        Write-Host "   ❌ " -NoNewline -ForegroundColor Red
        Write-Host "Failed to import ${ResourceType}" -ForegroundColor Red
        Write-Log "Failed to import $ResourceType '$ResourceName': $($_.Exception.Message)" -Level "ERROR"
        throw
    }
}

function Use-Workspace {
    # Skip if already connected
    if ($null -ne $Script:RuntimeVariables["WORKSPACE_ID"] -and 
        $Script:RuntimeVariables["WORKSPACE_ID"] -ne "") {
        Write-Log "Workspace already connected (ID: $($Script:RuntimeVariables['WORKSPACE_ID'])), skipping connection" -Level "INFO"
        return
    }
    
    Write-Host ""
    Write-Host "🌐 " -NoNewline -ForegroundColor Cyan
    Write-Host "Connecting to workspace: " -NoNewline -ForegroundColor White
    Write-Host "$WorkspaceName" -ForegroundColor Cyan
    
    try {
        $workspacePath = "$WorkspaceName.Workspace"
        $Script:RuntimeVariables["WORKSPACE_ID"] = Get-FabItemId -FabricPath $workspacePath -WithRetry
        
        Write-Host "   ✅ " -NoNewline -ForegroundColor Green
        Write-Host "Successfully connected to workspace" -ForegroundColor Green
        Write-Host "   🆔 ID: " -NoNewline -ForegroundColor Gray
        Write-Host "$($Script:RuntimeVariables['WORKSPACE_ID'])" -ForegroundColor White
        
        Write-Log "Successfully connected to workspace '$WorkspaceName' (ID: $($Script:RuntimeVariables['WORKSPACE_ID']))" -Level "SUCCESS"
    }
    catch {
        Write-Host "   ❌ " -NoNewline -ForegroundColor Red
        Write-Host "Failed to connect to workspace" -ForegroundColor Red
        Write-Log "Failed to connect to workspace '$WorkspaceName': $($_.Exception.Message)" -Level "ERROR"
        throw
    }
}

function Create-Folder {
    if (-not $Script:FolderName) {
        return
    }

    $workspaceId = $Script:RuntimeVariables["WORKSPACE_ID"]
    Write-Host ""
    Write-Host "📁 " -NoNewline -ForegroundColor Cyan
    Write-Host "Creating folder: " -NoNewline -ForegroundColor White
    Write-Host "$Script:FolderName" -ForegroundColor Cyan
    Write-Host "   💡 Folder for $Prefix resources" -ForegroundColor Gray
    Write-Log "Creating folder '$Script:FolderName' via Fabric REST API..." -Level "INFO"

    try {
        # Check if folder already exists using the dedicated /folders endpoint
        $foldersResponse = Invoke-FabApi -Endpoint "workspaces/$workspaceId/folders" -Method "get"

        $folderList = if ($foldersResponse.value) { $foldersResponse.value } else { @() }
        $existingFolder = $folderList | Where-Object { $_.displayName -eq $Script:FolderName }

        if ($existingFolder) {
            $Script:RuntimeVariables["FOLDER_ID"] = $existingFolder.id
            Write-Host "   ⚠️ " -NoNewline -ForegroundColor Yellow
            Write-Host "Folder already exists - using existing folder" -ForegroundColor Yellow
            Write-Host "   🆔 ID: " -NoNewline -ForegroundColor Gray
            Write-Host "$($existingFolder.id)" -ForegroundColor White
            Write-Log "Folder '$Script:FolderName' already exists (ID: $($existingFolder.id))" -Level "WARNING"
            return
        }

        # Create folder via the dedicated /folders endpoint
        Write-Host "   🔨 Creating..." -ForegroundColor Gray
        $body = @{
            displayName = $Script:FolderName
        } | ConvertTo-Json -Compress

        $tempFile = Join-Path ([System.IO.Path]::GetTempPath()) "fab-folder-$([guid]::NewGuid().ToString('N')).json"
        Set-Content -Path $tempFile -Value $body -Encoding UTF8 -NoNewline

        try {
            $folderInfo = Invoke-FabApi -Endpoint "workspaces/$workspaceId/folders" -Method "post" -BodyFile $tempFile

            $Script:RuntimeVariables["FOLDER_ID"] = $folderInfo.id
            Write-Host "   ✅ " -NoNewline -ForegroundColor Green
            Write-Host "Folder created successfully" -ForegroundColor Green
            Write-Host "   🆔 ID: " -NoNewline -ForegroundColor Gray
            Write-Host "$($folderInfo.id)" -ForegroundColor White
            Write-Log "Folder '$Script:FolderName' created (ID: $($folderInfo.id))" -Level "SUCCESS"
        }
        finally {
            Remove-Item -Path $tempFile -Force -ErrorAction SilentlyContinue
        }
    }
    catch {
        Write-Host "   ⚠️ " -NoNewline -ForegroundColor Yellow
        Write-Host "Could not create folder - items will be created in workspace root" -ForegroundColor Yellow
        Write-Log "Failed to create folder '$Script:FolderName': $($_.Exception.Message). Items will be in workspace root." -Level "WARNING"
        $Script:FolderName = $null
        $Script:RuntimeVariables["FOLDER_ID"] = $null
    }
}

function Create-Sfnpsp_BronzeLakehouse {
    # Skip if already created
    if ($null -ne $Script:RuntimeVariables["BRONZE_LAKEHOUSE_ID"]) {
        Write-Log "Bronze lakehouse already exists (ID: $($Script:RuntimeVariables['BRONZE_LAKEHOUSE_ID'])), skipping creation" -Level "INFO"
        return
    }
    
    $lakehouseName = $Script:RuntimeVariables["BRONZE_LAKEHOUSE_NAME"]
    if ($Script:FolderName) {
        $fabricPath = "$WorkspaceName.Workspace/$Script:FolderName.Folder/${lakehouseName}.Lakehouse"
    } else {
        $fabricPath = "$WorkspaceName.Workspace/${lakehouseName}.Lakehouse"
    }
    
    $Script:RuntimeVariables["BRONZE_LAKEHOUSE_ID"] = New-FabricResource `
        -ResourceType "Lakehouse" `
        -ResourceName $lakehouseName `
        -FabricPath $fabricPath `
        -Description "Bronze layer for Salesforce NPSP data ingestion"
}

function Create-SilverLakehouse {
    # Skip if already created
    if ($null -ne $Script:RuntimeVariables["SILVER_LAKEHOUSE_ID"]) {
        Write-Log "Silver lakehouse already exists (ID: $($Script:RuntimeVariables['SILVER_LAKEHOUSE_ID'])), skipping creation" -Level "INFO"
        return
    }
    
    $lakehouseName = $Script:RuntimeVariables["SILVER_LAKEHOUSE_NAME"]
    if ($Script:FolderName) {
        $fabricPath = "$WorkspaceName.Workspace/$Script:FolderName.Folder/${lakehouseName}.Lakehouse"
    } else {
        $fabricPath = "$WorkspaceName.Workspace/${lakehouseName}.Lakehouse"
    }
    
    $Script:RuntimeVariables["SILVER_LAKEHOUSE_ID"] = New-FabricResource `
        -ResourceType "Lakehouse" `
        -ResourceName $lakehouseName `
        -FabricPath $fabricPath `
        -Description "Silver layer for standardized nonprofit data"
}

function Create-GoldLakehouse {
    # Skip if already created
    if ($null -ne $Script:RuntimeVariables["GOLD_LAKEHOUSE_ID"]) {
        Write-Log "Gold lakehouse already exists (ID: $($Script:RuntimeVariables['GOLD_LAKEHOUSE_ID'])), skipping creation" -Level "INFO"
        return
    }
    
    $lakehouseName = $Script:RuntimeVariables["GOLD_LAKEHOUSE_NAME"]
    if ($Script:FolderName) {
        $fabricPath = "$WorkspaceName.Workspace/$Script:FolderName.Folder/${lakehouseName}.Lakehouse"
    } else {
        $fabricPath = "$WorkspaceName.Workspace/${lakehouseName}.Lakehouse"
    }
    
    $Script:RuntimeVariables["GOLD_LAKEHOUSE_ID"] = New-FabricResource `
        -ResourceType "Lakehouse" `
        -ResourceName $lakehouseName `
        -FabricPath $fabricPath `
        -Description "Gold layer for analytics-ready data and insights"
    
    # Get SQL endpoint for semantic model configuration
    Write-Host "   🔗 Retrieving SQL endpoint..." -ForegroundColor Gray
    $Script:RuntimeVariables["GOLD_LAKEHOUSE_SQL_ENDPOINT"] = Get-FabItem $fabricPath "properties.sqlEndpointProperties.connectionString"
    Write-Host "   ✅ SQL endpoint configured" -ForegroundColor Green
}

function Upload-LakehouseData {
    if ($script:enableImportSampleData) {
        Write-Host ""
        Write-Host "📤 " -NoNewline -ForegroundColor Cyan
        Write-Host "Importing Sample Data" -ForegroundColor White
        Write-Host "   Adding unified sample data to Silver lakehouse..." -ForegroundColor Gray
        
        Upload-FilesToLakehouse `
            (Resolve-Path ("../Data/SampleData")) `
            $Script:RuntimeVariables["SILVER_LAKEHOUSE_NAME"] `
            "nds-silver-sampledata"
            
        Write-Host ""
        Write-Host "   ✅ " -NoNewline -ForegroundColor Green
        Write-Host "Sample data import completed" -ForegroundColor Green
        Write-Log "Sample data import completed" -Level "SUCCESS"
    }
    else {
        Write-Host ""
        Write-Host "⏭️  " -NoNewline -ForegroundColor Yellow
        Write-Host "Skipping Sample Data Import" -ForegroundColor White
        Write-Host "   Sample data import was not requested" -ForegroundColor Gray
        Write-Log "Skipping sample data import (not requested)" -Level "INFO"
    }
}

function Import-ConfigNotebook {
    # Skip if already imported
    if ($null -ne $Script:RuntimeVariables["CONFIG_NOTEBOOK_ID"]) {
        Write-Log "Config notebook already exists (ID: $($Script:RuntimeVariables['CONFIG_NOTEBOOK_ID'])), skipping import" -Level "INFO"
        return
    }
    
    $localPath = Resolve-Path (Join-Path $workspaceItemsTempPath "Notebooks/Fundraising_Config.Notebook")
    $notebookName = $Script:RuntimeVariables["Fundraising_Config"]
    if ($Script:FolderName) {
        $fabricPath = "$WorkspaceName.Workspace/$Script:FolderName.Folder/${notebookName}.Notebook"
    } else {
        $fabricPath = "$WorkspaceName.Workspace/${notebookName}.Notebook"
    }

    $Script:RuntimeVariables["CONFIG_NOTEBOOK_ID"] = Import-FabricResource `
        -ResourceType "Notebook" `
        -ResourceName $notebookName `
        -FabricPath $fabricPath `
        -LocalPath $localPath `
        -Description "Core configuration notebook with lakehouse references"
}

function Import-Fundraising_SalesforceNPSP_ConfigNotebook {
    # Skip if already imported
    if ($null -ne $Script:RuntimeVariables["BRONZE_CONFIG_NOTEBOOK_ID"]) {
        Write-Log "Salesforce NPSP Config notebook already exists (ID: $($Script:RuntimeVariables['BRONZE_CONFIG_NOTEBOOK_ID'])), skipping import" -Level "INFO"
        return
    }
    
    $localPath = Resolve-Path (Join-Path $workspaceItemsTempPath "Notebooks/Fundraising_SalesforceNPSP_Config.Notebook")
    $notebookName = $Script:RuntimeVariables["Fundraising_SalesforceNPSP_Config"]
    if ($Script:FolderName) {
        $fabricPath = "$WorkspaceName.Workspace/$Script:FolderName.Folder/${notebookName}.Notebook"
    } else {
        $fabricPath = "$WorkspaceName.Workspace/${notebookName}.Notebook"
    }
    
    $Script:RuntimeVariables["BRONZE_CONFIG_NOTEBOOK_ID"] = Import-FabricResource `
        -ResourceType "Notebook" `
        -ResourceName $notebookName `
        -FabricPath $fabricPath `
        -LocalPath $localPath `
        -Description "Salesforce NPSP configuration settings"
}

function Import-Fundraising_SalesforceNPSP_BR_MergeNotebook {
    # Skip if already imported
    if ($null -ne $Script:RuntimeVariables["BRONZE_MERGE_STAGING_DATA_NOTEBOOK_ID"]) {
        Write-Log "Bronze Merge notebook already exists (ID: $($Script:RuntimeVariables['BRONZE_MERGE_STAGING_DATA_NOTEBOOK_ID'])), skipping import" -Level "INFO"
        return
    }
    
    $localPath = Resolve-Path (Join-Path $workspaceItemsTempPath "Notebooks/Fundraising_SalesforceNPSP_BR_Merge.Notebook")
    $notebookName = "${Prefix}Fundraising_SalesforceNPSP_BR_Merge"
    if ($Script:FolderName) {
        $fabricPath = "$WorkspaceName.Workspace/$Script:FolderName.Folder/${notebookName}.Notebook"
    } else {
        $fabricPath = "$WorkspaceName.Workspace/${notebookName}.Notebook"
    }
    
    $Script:RuntimeVariables["BRONZE_MERGE_STAGING_DATA_NOTEBOOK_ID"] = Import-FabricResource `
        -ResourceType "Notebook" `
        -ResourceName $notebookName `
        -FabricPath $fabricPath `
        -LocalPath $localPath `
        -Description "Merges Salesforce staging data into bronze tables"
}

function Import-SilverCreateSchemaNotebook {
    # Skip if already imported
    if ($null -ne $Script:RuntimeVariables["SILVER_CREATE_SCHEMA_NOTEBOOK_ID"]) {
        Write-Log "Silver CreateSchema notebook already exists (ID: $($Script:RuntimeVariables['SILVER_CREATE_SCHEMA_NOTEBOOK_ID'])), skipping import" -Level "INFO"
        return
    }
    
    $localPath = Resolve-Path (Join-Path $workspaceItemsTempPath "Notebooks/Fundraising_SL_CreateSchema.Notebook")
    $notebookName = $Script:RuntimeVariables["Fundraising_SL_CreateSchema"]
    if ($Script:FolderName) {
        $fabricPath = "$WorkspaceName.Workspace/$Script:FolderName.Folder/${notebookName}.Notebook"
    } else {
        $fabricPath = "$WorkspaceName.Workspace/${notebookName}.Notebook"
    }
    
    $Script:RuntimeVariables["SILVER_CREATE_SCHEMA_NOTEBOOK_ID"] = Import-FabricResource `
        -ResourceType "Notebook" `
        -ResourceName $notebookName `
        -FabricPath $fabricPath `
        -LocalPath $localPath `
        -Description "Creates standardized schema in Silver lakehouse"
}

function Import-SilverCreateDefaultConfigurationNotebook {
    # Skip if already imported
    if ($null -ne $Script:RuntimeVariables["SILVER_CREATE_DEFAULT_CONFIGURATION_NOTEBOOK_ID"]) {
        Write-Log "Silver DefaultConfig notebook already exists (ID: $($Script:RuntimeVariables['SILVER_CREATE_DEFAULT_CONFIGURATION_NOTEBOOK_ID'])), skipping import" -Level "INFO"
        return
    }
    
    $localPath = Resolve-Path (Join-Path $workspaceItemsTempPath "Notebooks/Fundraising_SL_DefaultConfig.Notebook")
    $notebookName = $Script:RuntimeVariables["Fundraising_SL_DefaultConfig"]
    if ($Script:FolderName) {
        $fabricPath = "$WorkspaceName.Workspace/$Script:FolderName.Folder/${notebookName}.Notebook"
    } else {
        $fabricPath = "$WorkspaceName.Workspace/${notebookName}.Notebook"
    }

    $Script:RuntimeVariables["SILVER_CREATE_DEFAULT_CONFIGURATION_NOTEBOOK_ID"] = Import-FabricResource `
        -ResourceType "Notebook" `
        -ResourceName $notebookName `
        -FabricPath $fabricPath `
        -LocalPath $localPath `
        -Description "Sets up default configuration data"
}

function Import-Fundraising_SalesforceNPSP_TransformNotebook {
    # Skip if already imported
    if ($null -ne $Script:RuntimeVariables["Fundraising_SalesforceNPSP_Transform_Notebook"]) {
        Write-Log "Salesforce Transform notebook already exists (ID: $($Script:RuntimeVariables['SALESFORCE_TRANSFORM_NOTEBOOK_ID'])), skipping import" -Level "INFO"
        return
    }
    
    $localPath = Resolve-Path (Join-Path $workspaceItemsTempPath "Notebooks/Fundraising_SalesforceNPSP_Transform.Notebook")
    $notebookName = "${Prefix}Fundraising_SalesforceNPSP_Transform"
    if ($Script:FolderName) {
        $fabricPath = "$WorkspaceName.Workspace/$Script:FolderName.Folder/${notebookName}.Notebook"
    } else {
        $fabricPath = "$WorkspaceName.Workspace/${notebookName}.Notebook"
    }
    
    $notebookId = Import-FabricResource `
        -ResourceType "Notebook" `
        -ResourceName $notebookName `
        -FabricPath $fabricPath `
        -LocalPath $localPath `
        -Description "Transforms Salesforce bronze data to silver layer"

    $Script:RuntimeVariables["Fundraising_SalesforceNPSP_Transform_Notebook"] = $notebookId
    $Script:RuntimeVariables["SALESFORCE_TRANSFORM_NOTEBOOK_ID"] = $notebookId
}

function Import-Fundraising_D365_ConfigNotebook {
    # Skip if already imported
    if ($null -ne $Script:RuntimeVariables["D365_CONFIG_NOTEBOOK_ID"]) {
        Write-Log "D365 Config notebook already exists (ID: $($Script:RuntimeVariables['D365_CONFIG_NOTEBOOK_ID'])), skipping import" -Level "INFO"
        return
    }
    
    $localPath = Resolve-Path (Join-Path $workspaceItemsTempPath "Notebooks/Fundraising_D365_Config.Notebook")
    $notebookName = "${Prefix}Fundraising_D365_Config"
    if ($Script:FolderName) {
        $fabricPath = "$WorkspaceName.Workspace/$Script:FolderName.Folder/${notebookName}.Notebook"
    } else {
        $fabricPath = "$WorkspaceName.Workspace/${notebookName}.Notebook"
    }

    # Store notebook name in runtime variables (for %run references)
    $Script:RuntimeVariables["Fundraising_D365_Config"] = $notebookName
    
    $Script:RuntimeVariables["D365_CONFIG_NOTEBOOK_ID"] = Import-FabricResource `
        -ResourceType "Notebook" `
        -ResourceName $notebookName `
        -FabricPath $fabricPath `
        -LocalPath $localPath `
        -Description "Dynamics 365 configuration settings"
}

function Import-Fundraising_D365_TransformNotebook {
    # Skip if already imported
    if ($null -ne $Script:RuntimeVariables["Fundraising_D365_Transform_Notebook"]) {
        Write-Log "D365 Transform notebook already exists (ID: $($Script:RuntimeVariables['D365_TRANSFORM_NOTEBOOK_ID'])), skipping import" -Level "INFO"
        return
    }
    
    $localPath = Resolve-Path (Join-Path $workspaceItemsTempPath "Notebooks/Fundraising_D365_Transform.Notebook")
    $notebookName = "${Prefix}Fundraising_D365_Transform"
    if ($Script:FolderName) {
        $fabricPath = "$WorkspaceName.Workspace/$Script:FolderName.Folder/${notebookName}.Notebook"
    } else {
        $fabricPath = "$WorkspaceName.Workspace/${notebookName}.Notebook"
    }
    
    # Store notebook name in runtime variables (for %run references)
    $Script:RuntimeVariables["Fundraising_D365_Transform"] = $notebookName
    
    $notebookId = Import-FabricResource `
        -ResourceType "Notebook" `
        -ResourceName $notebookName `
        -FabricPath $fabricPath `
        -LocalPath $localPath `
        -Description "Transforms Dynamics 365 bronze data to silver layer"

    $Script:RuntimeVariables["Fundraising_D365_Transform_Notebook"] = $notebookId
    $Script:RuntimeVariables["D365_TRANSFORM_NOTEBOOK_ID"] = $notebookId
}

function Import-SilverImportSampleDataNotebook {
    # Skip if already imported
    if ($null -ne $Script:RuntimeVariables["SILVER_IMPORT_SAMPLE_DATA_NOTEBOOK_ID"]) {
        Write-Log "Silver SampleData notebook already exists (ID: $($Script:RuntimeVariables['SILVER_IMPORT_SAMPLE_DATA_NOTEBOOK_ID'])), skipping import" -Level "INFO"
        return
    }
    
    $localPath = Resolve-Path (Join-Path $workspaceItemsTempPath "Notebooks/Fundraising_SL_SampleData.Notebook")
    $notebookName = "${Prefix}Fundraising_SL_SampleData"
    if ($Script:FolderName) {
        $fabricPath = "$WorkspaceName.Workspace/$Script:FolderName.Folder/${notebookName}.Notebook"
    } else {
        $fabricPath = "$WorkspaceName.Workspace/${notebookName}.Notebook"
    }
    
    $Script:RuntimeVariables["SILVER_IMPORT_SAMPLE_DATA_NOTEBOOK_ID"] = Import-FabricResource `
        -ResourceType "Notebook" `
        -ResourceName $notebookName `
        -FabricPath $fabricPath `
        -LocalPath $localPath `
        -Description "Imports sample data for testing and demonstration"
}

function Import-GoldCreateSchemaNotebook {
    # Skip if already imported
    if ($null -ne $Script:RuntimeVariables["GOLD_CREATE_SCHEMA_NOTEBOOK_ID"]) {
        Write-Log "Gold CreateSchema notebook already exists (ID: $($Script:RuntimeVariables['GOLD_CREATE_SCHEMA_NOTEBOOK_ID'])), skipping import" -Level "INFO"
        return
    }
    
    $localPath = Resolve-Path (Join-Path $workspaceItemsTempPath "Notebooks/Fundraising_GD_CreateSchema.Notebook")
    $notebookName = "${Prefix}Fundraising_GD_CreateSchema"
    if ($Script:FolderName) {
        $fabricPath = "$WorkspaceName.Workspace/$Script:FolderName.Folder/${notebookName}.Notebook"
    } else {
        $fabricPath = "$WorkspaceName.Workspace/${notebookName}.Notebook"
    }
    
    $Script:RuntimeVariables["GOLD_CREATE_SCHEMA_NOTEBOOK_ID"] = Import-FabricResource `
        -ResourceType "Notebook" `
        -ResourceName $notebookName `
        -FabricPath $fabricPath `
        -LocalPath $localPath `
        -Description "Creates analytics-ready schema in Gold lakehouse"
}

function Import-GoldCreateSegmentsNotebook {
    # Skip if already imported
    if ($null -ne $Script:RuntimeVariables["GOLD_CREATE_SEGMENTS_NOTEBOOK_ID"]) {
        Write-Log "Gold CreateSegments notebook already exists (ID: $($Script:RuntimeVariables['GOLD_CREATE_SEGMENTS_NOTEBOOK_ID'])), skipping import" -Level "INFO"
        return
    }
    
    $localPath = Resolve-Path (Join-Path $workspaceItemsTempPath "Notebooks/Fundraising_GD_CreateSegments.Notebook")
    $notebookName = "${Prefix}Fundraising_GD_CreateSegments"
    if ($Script:FolderName) {
        $fabricPath = "$WorkspaceName.Workspace/$Script:FolderName.Folder/${notebookName}.Notebook"
    } else {
        $fabricPath = "$WorkspaceName.Workspace/${notebookName}.Notebook"
    }
    
    $Script:RuntimeVariables["GOLD_CREATE_SEGMENTS_NOTEBOOK_ID"] = Import-FabricResource `
        -ResourceType "Notebook" `
        -ResourceName $notebookName `
        -FabricPath $fabricPath `
        -LocalPath $localPath `
        -Description "Creates constituent segments for analytics"
}

function Import-SilverToGoldEnrichmentNotebook {
    # Skip if already imported
    if ($null -ne $Script:RuntimeVariables["SILVER_TO_GOLD_ENRICHMENT_NOTEBOOK_ID"]) {
        Write-Log "Silver to Gold Enrichment notebook already exists (ID: $($Script:RuntimeVariables['SILVER_TO_GOLD_ENRICHMENT_NOTEBOOK_ID'])), skipping import" -Level "INFO"
        return
    }
    
    $localPath = Resolve-Path (Join-Path $workspaceItemsTempPath "Notebooks/Fundraising_SL_GD_Enrichment.Notebook")
    $notebookName = "${Prefix}Fundraising_SL_GD_Enrichment"
    if ($Script:FolderName) {
        $fabricPath = "$WorkspaceName.Workspace/$Script:FolderName.Folder/${notebookName}.Notebook"
    } else {
        $fabricPath = "$WorkspaceName.Workspace/${notebookName}.Notebook"
    }
    
    $Script:RuntimeVariables["SILVER_TO_GOLD_ENRICHMENT_NOTEBOOK_ID"] = Import-FabricResource `
        -ResourceType "Notebook" `
        -ResourceName $notebookName `
        -FabricPath $fabricPath `
        -LocalPath $localPath `
        -Description "Enriches and transforms data from Silver to Gold"
}

function Import-SFNPSP_BronzeIngestionPipeline {
    # Skip if already imported
    if ($null -ne $Script:RuntimeVariables["Fundraising_SalesforceNPSP_BR_Load_DataPipeline"]) {
        Write-Log "Salesforce NPSP BR Load pipeline already exists (ID: $($Script:RuntimeVariables['Fundraising_SalesforceNPSP_BR_Load_DataPipeline'])), skipping import" -Level "INFO"
        return
    }
    
    $localPath = Resolve-Path (Join-Path $workspaceItemsTempPath "DataPipelines/Fundraising_SalesforceNPSP_BR_Load.DataPipeline")
    $pipelineName = $Script:RuntimeVariables["Fundraising_SalesforceNPSP_BR_Load"]
    if ($Script:FolderName) {
        $fabricPath = "$WorkspaceName.Workspace/$Script:FolderName.Folder/${pipelineName}.DataPipeline"
    } else {
        $fabricPath = "$WorkspaceName.Workspace/${pipelineName}.DataPipeline"
    }
    
    $Script:RuntimeVariables["Fundraising_SalesforceNPSP_BR_Load_DataPipeline"] = Import-FabricResource `
        -ResourceType "Data Pipeline" `
        -ResourceName $pipelineName `
        -FabricPath $fabricPath `
        -LocalPath $localPath `
        -Description "Ingests Salesforce NPSP data into Bronze lakehouse"
}

function Import-BronzeIngestionOrchestrationPipeline {
    # Skip if already imported
    if ($null -ne $Script:RuntimeVariables["BRONZE_INGESTION_PIPELINE_ID"]) {
        Write-Log "Bronze Ingestion pipeline already exists (ID: $($Script:RuntimeVariables['BRONZE_INGESTION_PIPELINE_ID'])), skipping import" -Level "INFO"
        return
    }
    
    $localPath = Resolve-Path (Join-Path $workspaceItemsTempPath "DataPipelines/Fundraising_BR_Ingestion.DataPipeline")
    $pipelineName = $Script:RuntimeVariables["Fundraising_BR_Ingestion"]
    if ($Script:FolderName) {
        $fabricPath = "$WorkspaceName.Workspace/$Script:FolderName.Folder/${pipelineName}.DataPipeline"
    } else {
        $fabricPath = "$WorkspaceName.Workspace/${pipelineName}.DataPipeline"
    }

    $Script:RuntimeVariables["BRONZE_INGESTION_PIPELINE_ID"] = Import-FabricResource `
        -ResourceType "Data Pipeline" `
        -ResourceName $pipelineName `
        -FabricPath $fabricPath `
        -LocalPath $localPath `
        -Description "Orchestrates all bronze data ingestion processes"
}

function Import-SilverToGoldOrchestrationPipeline {
    # Skip if already imported
    if ($null -ne $Script:RuntimeVariables["SILVER_TO_GOLD_ENRICHMENT_PIPELINE_ID"]) {
        Write-Log "Silver to Gold Enrichment pipeline already exists (ID: $($Script:RuntimeVariables['SILVER_TO_GOLD_ENRICHMENT_PIPELINE_ID'])), skipping import" -Level "INFO"
        return
    }
    
    $localPath = Resolve-Path (Join-Path $workspaceItemsTempPath "DataPipelines/Fundraising_SL_GD_Enrichment.DataPipeline")
    $pipelineName = "${Prefix}Fundraising_SL_GD_Enrichment"
    if ($Script:FolderName) {
        $fabricPath = "$WorkspaceName.Workspace/$Script:FolderName.Folder/${pipelineName}.DataPipeline"
    } else {
        $fabricPath = "$WorkspaceName.Workspace/${pipelineName}.DataPipeline"
    }
    
    $Script:RuntimeVariables["SILVER_TO_GOLD_ENRICHMENT_PIPELINE_ID"] = Import-FabricResource `
        -ResourceType "Data Pipeline" `
        -ResourceName $pipelineName `
        -FabricPath $fabricPath `
        -LocalPath $localPath `
        -Description "Enriches silver data to analytics-ready gold layer"
}

function Import-OrchestrationPipeline {
    # Skip if already imported
    if ($null -ne $Script:RuntimeVariables["ORCHESTRATION_PIPELINE_ID"]) {
        Write-Log "Orchestration pipeline already exists (ID: $($Script:RuntimeVariables['ORCHESTRATION_PIPELINE_ID'])), skipping import" -Level "INFO"
        return
    }
    
    $localPath = Resolve-Path (Join-Path $workspaceItemsTempPath "DataPipelines/Fundraising_Orchestration.DataPipeline")
    $pipelineName = "${Prefix}Fundraising_Orchestration"
    if ($Script:FolderName) {
        $fabricPath = "$WorkspaceName.Workspace/$Script:FolderName.Folder/${pipelineName}.DataPipeline"
    } else {
        $fabricPath = "$WorkspaceName.Workspace/${pipelineName}.DataPipeline"
    }
    
    $Script:RuntimeVariables["ORCHESTRATION_PIPELINE_ID"] = Import-FabricResource `
        -ResourceType "Data Pipeline" `
        -ResourceName $pipelineName `
        -FabricPath $fabricPath `
        -LocalPath $localPath `
        -Description "Main orchestration pipeline for end-to-end data processing"
}

function Create-Lakehouses {
    Write-Host ""
    Write-Host "🏗️ " -NoNewline -ForegroundColor Cyan
    Write-Host "Creating Data Lakehouses" -ForegroundColor White
    Write-Host "   Setting up SFNPSP Bronze, Silver, and Gold data layers..." -ForegroundColor Gray
    Write-Host "   (D365 lakehouse already configured from Power Platform)" -ForegroundColor Gray
    
    # Create new lakehouses for SFNPSP and NDS layers
    Create-Sfnpsp_BronzeLakehouse
    Create-SilverLakehouse
    Create-GoldLakehouse
    
    Write-Host ""
    Write-Host "   ✅ " -NoNewline -ForegroundColor Green
    Write-Host "All lakehouses created successfully" -ForegroundColor Green
    Write-Log "All lakehouses created successfully" -Level "SUCCESS"
}

function Import-Notebooks {
    Write-Host ""
    Write-Host "📒 " -NoNewline -ForegroundColor Cyan
    Write-Host "Importing Notebooks" -ForegroundColor White
    Write-Host "   Deploying data processing and transformation logic..." -ForegroundColor Gray
    
    Import-ConfigNotebook
    Import-Fundraising_SalesforceNPSP_ConfigNotebook
    Import-Fundraising_SalesforceNPSP_BR_MergeNotebook
    Import-SilverCreateSchemaNotebook
    Import-SilverCreateDefaultConfigurationNotebook
    Import-Fundraising_SalesforceNPSP_TransformNotebook
    Import-Fundraising_D365_ConfigNotebook
    Import-Fundraising_D365_TransformNotebook
    Import-SilverImportSampleDataNotebook
    Import-GoldCreateSchemaNotebook
    Import-GoldCreateSegmentsNotebook
    Import-SilverToGoldEnrichmentNotebook
    
    Write-Host ""
    Write-Host "   ✅ " -NoNewline -ForegroundColor Green
    Write-Host "All notebooks imported successfully (12 notebooks)" -ForegroundColor Green
    Write-Log "All notebooks imported successfully" -Level "SUCCESS"
}

function Import-DataPipelines {
    Write-Host ""
    Write-Host "🔄 " -NoNewline -ForegroundColor Cyan
    Write-Host "Importing Data Pipelines" -ForegroundColor White
    Write-Host "   Setting up data ingestion and orchestration workflows..." -ForegroundColor Gray
    
    Import-SFNPSP_BronzeIngestionPipeline
    Import-BronzeIngestionOrchestrationPipeline
    Import-SilverToGoldOrchestrationPipeline
    Import-OrchestrationPipeline
    
    Write-Host ""
    Write-Host "   ✅ " -NoNewline -ForegroundColor Green
    Write-Host "All data pipelines imported successfully (4 pipelines)" -ForegroundColor Green
    Write-Log "All data pipelines imported successfully" -Level "SUCCESS"
}

function Import-SemanticModels {
    $script:semanticModelName = "${Prefix}Fundraising_Intelligence_Semantic"
    $localPath = Resolve-Path (Join-Path $workspaceItemsTempPath "SemanticModels/Fundraising_Intelligence_Semantic.SemanticModel")
    if ($Script:FolderName) {
        $fabricPath = "$WorkspaceName.Workspace/$Script:FolderName.Folder/${semanticModelName}.SemanticModel"
    } else {
        $fabricPath = "$WorkspaceName.Workspace/${semanticModelName}.SemanticModel"
    }

    # Update semantic model configuration for Direct Lake
    Write-Host "   🔧 Configuring semantic model connections..." -ForegroundColor Gray
    $expressionsPath = Join-Path $localPath 'definition\expressions.tmdl'
    $content = Get-Content $expressionsPath -Raw -Encoding UTF8
    # Replace placeholders in Sql.Database() function for Direct Lake connection
    $content = $content -replace '\{GOLD_LAKEHOUSE_SQL_SERVER\}', $Script:RuntimeVariables["GOLD_LAKEHOUSE_SQL_ENDPOINT"]
    $content = $content -replace '\{GOLD_LAKEHOUSE_SQL_ENDPOINT\}', $Script:RuntimeVariables["GOLD_LAKEHOUSE_NAME"]
    Set-Content -Path $expressionsPath -Value $content -Encoding UTF8 -NoNewline

    $script:semanticModelId = Import-FabricResource `
        -ResourceType "Semantic Model" `
        -ResourceName $semanticModelName `
        -FabricPath $fabricPath `
        -LocalPath $localPath `
        -Description "Fundraising intelligence semantic model for analytics"
}

function Import-Reports {
    $script:reportName = "${Prefix}Fundraising_Intelligence"
    $localPath = Resolve-Path (Join-Path $workspaceItemsTempPath "Reports/Fundraising_Intelligence.Report")
    if ($Script:FolderName) {
        $fabricPath = "$WorkspaceName.Workspace/$Script:FolderName.Folder/${reportName}.Report"
    } else {
        $fabricPath = "$WorkspaceName.Workspace/${reportName}.Report"
    }

    # Update report configuration
    Write-Host "   🔧 Configuring report connections..." -ForegroundColor Gray
    $jsonPath = Join-Path $localPath 'definition.pbir'
    $reportDef = Read-JsonFile $jsonPath
    $byConnection = $reportDef.datasetReference.byConnection
    $byConnection.connectionString = "Data Source=powerbi://api.powerbi.com/v1.0/myorg/${WorkspaceName};initial catalog=${semanticModelName};integrated security=ClaimsToken;semanticmodelid=${semanticModelId}"
    Write-ToFileSystem $jsonPath $reportDef

    $script:reportId = Import-FabricResource `
        -ResourceType "Power BI Report" `
        -ResourceName $reportName `
        -FabricPath $fabricPath `
        -LocalPath $localPath `
        -Description "Fundraising intelligence dashboard and analytics"
}


#endregion

#region Main Execution and Summary

function Show-InstallationSummary {
    param([bool]$Success, [string]$ErrorMessage = "")
    
    $endTime = Get-Date
    $duration = $endTime - $Script:StartTime
    
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor $(if($Success) { "Green" } else { "Red" })
    Write-Host "║                           INSTALLATION SUMMARY                               ║" -ForegroundColor $(if($Success) { "Green" } else { "Red" })
    Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor $(if($Success) { "Green" } else { "Red" })
    Write-Host ""
    
    if ($Success) {
        # Read names from RuntimeVariables where they were stored during installation
        $sfnpspBronzeLakehouseName = $Script:RuntimeVariables["BRONZE_LAKEHOUSE_NAME"]
        $silverLakehouseName = $Script:RuntimeVariables["SILVER_LAKEHOUSE_NAME"]
        $goldLakehouseName = $Script:RuntimeVariables["GOLD_LAKEHOUSE_NAME"]
        $semanticModelName = $Script:RuntimeVariables["SEMANTIC_MODEL_NAME"]
        $reportName = $Script:RuntimeVariables["REPORT_NAME"]
        $orchestrationPipelineName = $Script:RuntimeVariables["Fundraising_SalesforceNPSP_BR_Load"]

        Write-Host "🎉 " -NoNewline -ForegroundColor Green
        Write-Host "Nonprofit Data Solutions installation completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 " -NoNewline -ForegroundColor Cyan
        Write-Host "Installation Summary:" -ForegroundColor White
        Write-Host "   • Workspace: " -NoNewline -ForegroundColor Gray
        Write-Host "$WorkspaceName" -ForegroundColor White
        Write-Host "   • Prefix: " -NoNewline -ForegroundColor Gray
        Write-Host "$Prefix" -ForegroundColor White
        Write-Host "   • Duration: " -NoNewline -ForegroundColor Gray
        Write-Host "$($duration.ToString('hh\:mm\:ss'))" -ForegroundColor White
        Write-Host "   • Sample Data: " -NoNewline -ForegroundColor Gray
        Write-Host "$(if(-not $SkipSampleData) { 'Imported' } else { 'Skipped' })" -ForegroundColor White
        Write-Host ""
        
        Write-Host "🏗️ " -NoNewline -ForegroundColor Cyan
        Write-Host "Resources Created:" -ForegroundColor White
        Write-Host "   • Lakehouses: " -NoNewline -ForegroundColor Gray
        Write-Host "$($sfnpspBronzeLakehouseName), $($silverLakehouseName), $($goldLakehouseName)" -ForegroundColor White
        Write-Host "   • Notebooks: " -NoNewline -ForegroundColor Gray
        Write-Host "12 notebooks imported" -ForegroundColor White
        Write-Host "   • Pipelines: " -NoNewline -ForegroundColor Gray
        Write-Host "4 data pipelines configured" -ForegroundColor White
        Write-Host "   • Semantic Model: " -NoNewline -ForegroundColor Gray
        Write-Host "$semanticModelName" -ForegroundColor White
        Write-Host "   • Report: " -NoNewline -ForegroundColor Gray
        Write-Host "$reportName" -ForegroundColor White
        Write-Host ""
        
        Write-Host "📝 " -NoNewline -ForegroundColor Yellow
        Write-Host "Next Steps:" -ForegroundColor White
        Write-Host "   1. Review the installed components in your Fabric workspace" -ForegroundColor Gray
        Write-Host "   2. Configure any remaining Salesforce connections if needed" -ForegroundColor Gray
        Write-Host "   3. Configure a connection from $semanticModelName semantic model to $goldLakehouseName lakehouse" -ForegroundColor Gray
        Write-Host "   4. Run $orchestrationPipelineName pipeline to ingest, transform and enrich data" -ForegroundColor Gray
        Write-Host "   5. Refresh $semanticModelName semantic model" -ForegroundColor Gray
        Write-Host "   6. Customize reports and dashboards as needed" -ForegroundColor Gray
        Write-Host ""
        
        Write-Host "📄 " -NoNewline -ForegroundColor Cyan
        Write-Host "Log file saved to: " -NoNewline -ForegroundColor Gray
        Write-Host "$Script:LogFile" -ForegroundColor White
    }
    else {
        Write-Host "❌ " -NoNewline -ForegroundColor Red
        Write-Host "Installation failed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "🔍 " -NoNewline -ForegroundColor Yellow
        Write-Host "Error Details:" -ForegroundColor White
        Write-Host "   $ErrorMessage" -ForegroundColor Red
        Write-Host ""
        Write-Host "📄 " -NoNewline -ForegroundColor Cyan
        Write-Host "Check the log file for more details: " -NoNewline -ForegroundColor Gray
        Write-Host "$Script:LogFile" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 " -NoNewline -ForegroundColor Yellow
        Write-Host "Troubleshooting Tips:" -ForegroundColor White
        Write-Host "   • Ensure you have proper permissions to the Fabric workspace" -ForegroundColor Gray
        Write-Host "   • Verify the Microsoft Fabric CLI is properly configured" -ForegroundColor Gray
        Write-Host "   • Check network connectivity to Microsoft Fabric services" -ForegroundColor Gray
    }
    
    Write-Host ""
}

# Install nb-clean if not already installed
function Install-Prerequisites {
    Write-Log "Installing required prerequisites..." -Level "INFO"
    
    if (-not (Get-Command nb-clean -ErrorAction SilentlyContinue)) {
        Write-Log "Installing nb-clean package..." -Level "INFO"
        try {
            pip install nb-clean
            Write-Log "nb-clean installed successfully" -Level "SUCCESS"
        }
        catch {
            Write-Log "Failed to install nb-clean: $($_.Exception.Message)" -Level "WARNING"
            Write-Log "Continuing without nb-clean - some notebook processing may be affected" -Level "WARNING"
        }
    }
    else {
        Write-Log "nb-clean is already installed" -Level "SUCCESS"
    }
}

# Main execution
$ErrorActionPreference = 'Stop'
#$VerbosePreference = 'SilentlyContinue'  # Suppress verbose output from external commands
$InformationPreference = 'SilentlyContinue'  # Suppress information streams
$script:enableImportSampleData = -not $SkipSampleData.IsPresent  # Import by default unless skipped

# Create unique build path for parallel installations
$buildBaseDir = Join-Path $PSScriptRoot 'Build'
$sanitizedPrefix = $Prefix -replace '[^A-Za-z0-9_]', '_'  # Replace any non-alphanumeric chars with underscore
$sanitizedWorkspace = $WorkspaceName -replace '[^A-Za-z0-9_]', '_'  # Replace any non-alphanumeric chars with underscore
$buildDirName = "${sanitizedPrefix}${sanitizedWorkspace}"
$script:workspaceItemsTempPath = Join-Path $buildBaseDir $buildDirName

# Ensure the build directory exists
if (-not (Test-Path $buildBaseDir)) {
    New-Item -ItemType Directory -Path $buildBaseDir -Force | Out-Null
    Write-Log "Created build base directory: $buildBaseDir" -Level "INFO"
}

Write-Log "Using build directory: $script:workspaceItemsTempPath" -Level "INFO"

# Initialize runtime variables - either load from file or generate defaults with prefix
# Use -LoadFromFile switch to resume from a previous installation
if ($LoadFromFile) {
    Initialize-RuntimeVariables -Prefix $Prefix -WorkspaceName $WorkspaceName -LoadFromFile
} else {
    Initialize-RuntimeVariables -Prefix $Prefix -WorkspaceName $WorkspaceName
}

try {
    # Full installation process
    Write-Log "Starting installation process..." -Level "INFO"
    
    # Step 1: Prerequisites
    Show-Progress "Checking prerequisites" "Validating environment and dependencies"
    Test-Prerequisites
    Install-Prerequisites
    
    # Step 2: Confirmation
    if (-not $SkipConfirmation) {
        $confirmMessage = @"
This will install Nonprofit Data Solutions into workspace '$WorkspaceName' with prefix '$Prefix'.

The following resources will be created:
• 3 Lakehouses (Bronze, Silver, Gold)
• 12 Notebooks for data processing
• 4 Data pipelines
• 1 Semantic model
• 1 Power BI report
$(if(-not $SkipSampleData) { "`n• Sample data will be imported" } else { "" })

This process may take 10-15 minutes to complete.
"@
        
        if (-not (Confirm-Action -Message $confirmMessage -Title "Install Nonprofit Data Solutions")) {
            Write-Log "Installation cancelled by user" -Level "INFO"
            return
        }
    }
    
    # Step 3: Configure connections
    Show-Progress "Configuring connections" "Setting up data source connections"
    Setup-SalesforceConnection
    Setup-D365Lakehouse
    
    # Step 4: Pre-build setup
    Show-Progress "Preparing workspace items" "Copying and processing configuration files"
    
    # Create the unique build directory if it doesn't exist
    if (-not (Test-Path $script:workspaceItemsTempPath)) {
        New-Item -ItemType Directory -Path $script:workspaceItemsTempPath -Force | Out-Null
        Write-Log "Created workspace items directory: $script:workspaceItemsTempPath" -Level "INFO"
    }
    
    # Copy workspace items to the unique build directory
    $workspaceItemsSourcePath = if ([System.IO.Path]::IsPathRooted($WorkspaceItemsPath)) {
        $WorkspaceItemsPath
    } else {
        Join-Path $PSScriptRoot $WorkspaceItemsPath
    }

    $workspaceItemsSourcePath = Resolve-Path -Path $workspaceItemsSourcePath -ErrorAction SilentlyContinue

    if (-not $workspaceItemsSourcePath) {
        throw "Workspace items source path not found: $WorkspaceItemsPath"
    }

    Write-Log "Copying workspace items from: $workspaceItemsSourcePath" -Level "INFO"
    Write-Host "   📦 Copying workspace items from source path..." -ForegroundColor Gray
    Copy-Item -Path (Join-Path $workspaceItemsSourcePath '*') -Destination $script:workspaceItemsTempPath -Recurse -Force | Out-Null
    Write-Host "   ✅ Workspace items copied" -ForegroundColor Green

    # Step 5: Workspace validation
    Show-Progress "Validating workspace" "Connecting to Microsoft Fabric workspace"
    Use-Workspace
    
    # Create folder if needed
    Create-Folder

    # Show runtime variables state before applying
    if ($PSBoundParameters.ContainsKey('Verbose')) {
        Show-RuntimeVariables -Verbose
    }
    
    # Apply all dynamic variables upfront (for artifact names, connections, lakehouses)
    if ($PSBoundParameters.ContainsKey('Verbose')) {
        Apply-AllDynamicVariables -WorkspaceItemsPath $script:workspaceItemsTempPath -Verbose
    } else {
        Apply-AllDynamicVariables -WorkspaceItemsPath $script:workspaceItemsTempPath
    }

    # Step 6: Create lakehouses
    Show-Progress "Creating lakehouses" "Setting up Bronze, Silver, and Gold data layers"
    Create-Lakehouses

    # Step 7: Upload data
    Show-Progress "Uploading data" "Importing sample datasets (unless skipped)"
    Upload-LakehouseData
    
    # Step 8: Import notebooks
    Show-Progress "Importing notebooks" "Deploying data processing and transformation logic"
    Import-Notebooks
    
    # Step 9: Import pipelines
    Show-Progress "Configuring pipelines" "Setting up data orchestration workflows"
    Import-DataPipelines
    
    # Step 10: Import semantic models
    Show-Progress "Creating semantic models" "Building analytical data models"
    Import-SemanticModels
    
    # Step 11: Import reports
    Show-Progress "Deploying reports" "Installing Power BI dashboards and visualizations"
    Import-Reports
    
    # Step 12: Completion
    Show-Progress "Finalizing installation" "Completing setup and validation"
    
    Write-Progress -Activity "Installing Nonprofit Data Solutions" -Completed
    
    Write-Log "Installation completed successfully" -Level "SUCCESS"
    Show-InstallationSummary -Success $true
}
catch {
    $errorMsg = $_.Exception.Message
    Write-Log "Installation failed: $errorMsg" -Level "ERROR"
    Write-Progress -Activity "Installing Nonprofit Data Solutions" -Completed
    Show-InstallationSummary -Success $false -ErrorMessage $errorMsg
    
    # Re-throw the exception to maintain original behavior
    throw
}
finally {
    # Save runtime variables for debugging and resume capability
    Save-RuntimeVariables -WorkspaceName $WorkspaceName -Prefix $Prefix
    
    # Show final runtime variables state (only if -Verbose)
    if ($PSBoundParameters.ContainsKey('Verbose')) {
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "                        FINAL RUNTIME VARIABLES STATE" -ForegroundColor Cyan
        Write-Host "═══════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Show-RuntimeVariables -Verbose
    }
    
    # Clean up temporary files
    # if (Test-Path $script:workspaceItemsTempPath) {
    #     Write-Log "Cleaning up temporary files..." -Level "INFO"
    #     Remove-Item -Path $script:workspaceItemsTempPath -Recurse -Force | Out-Null
    # }
    
    Write-Log "Installation process completed" -Level "INFO"
}
#endregion