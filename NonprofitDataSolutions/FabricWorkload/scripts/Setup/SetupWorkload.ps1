param (
    # Only the FERemote hosting type is supported for now
    [ValidateSet("Remote", "FERemote")]
    [string]$HostingType,
    # The name of the workload, used for the Entra App and the workload in the Fabric portal
    [String]$WorkloadName = "Org.MyWorkloadSample",
    # The display name of the workload, used in the Fabric portal
    [String]$WorkloadDisplayName = "My Sample Workload",
    # The Workspace Id to use for development
    # If not provided, the user will be prompted to enter it.
    [String]$DevWorkspaceId = "00000000-0000-0000-0000-000000000000",
    # The Entra Application ID for the frontend
    # If not provided, the user will be prompted to enter it or create a new one.
    [String]$AADFrontendAppId = "00000000-0000-0000-0000-000000000000",
    # The Entra Application ID for the backend
    # Not used in the current setup, but can be used for future backend app configurations
    [String]$AADBackendAppId,
    # The version of the workload, used for the manifest package
    [String]$WorkloadVersion = "1.0.0",
    # The environment (DEV, PPE, or PROD) for the manifest package
    [ValidateSet("DEV", "PPE", "PROD")]
    [String]$Environment = "DEV",
    # The frontend URL for the workload
    [String]$FrontendUrl = "http://127.0.0.1:60006/",
    # Force flag to overwrite existing configurations and don't prompt the user
    # If not provided, it will default to false.
    [boolean]$Force = $false,
    # Skip workload configuration setup (useful for CI/CD pipelines that only need manifest setup)
    [boolean]$SkipWorkloadSetup = $false
)

if ($HostingType -eq "FERemote" -or $HostingType -eq "Remote") {
    Write-Output "Using Hosting template $HostingType"
} else {
    Write-Host "Invalid parameter. Use 'Remote' or 'FERemote'."
    exit 1
}

# Define key-value dictionary for replacements
$replacements = @{
    "WORKLOAD_NAME" = $WorkloadName
    "FRONTEND_APP_ID" = $AADFrontendAppId
    "BACKEND_APP_ID" = $AADBackendAppId
    "WORKLOAD_VERSION" = $WorkloadVersion
    "DEV_WORKSPACE_ID" = $DevWorkspaceId
    "FRONTEND_URL" = $FrontendUrl
    "ENVIRONMENT" = $Environment
}

###############################################################################
# Setup Workload
###############################################################################
$srcTemplateDir = Join-Path $PSScriptRoot "..\..\config\templates"
$srcManifestDir = Join-Path $srcTemplateDir "Manifest\"
Write-Output "Using template in $srcManifestDir"

$destDir = Join-Path $PSScriptRoot "..\..\config"
$destManifestDir = Join-Path $PSScriptRoot "..\..\config\Manifest"
if (!(Test-Path $destManifestDir)) { New-Item -ItemType Directory -Path $destManifestDir | Out-Null }

Write-Output "Workload Name: $WorkloadName"
Write-Output "AAD Frontend App ID: $AADFrontendAppId"
Write-Output "AAD Backend App ID: $AADBackendAppId"
Write-Output "Workload Version: $WorkloadVersion"
Write-Output "Frontend URL: $FrontendUrl"
Write-Output "Environment: $Environment"


###############################################################################
# Writing the Manifest files
###############################################################################

# Copy the template files to the destination directory
Write-Output ""
Write-Output "Writing Manifest files ..."
$writeManifestFiles = $true
if (((Test-Path $destManifestDir) -and (Get-ChildItem -Path $destManifestDir -Recurse | Measure-Object).Count -ne 0) -and !$Force) {
    $writeManifestFiles = Read-Host "Manifest directory not empty, do you want to override the files with the templates? (y/n)" 
    $writeManifestFiles = $writeManifestFiles -eq 'y'
}
if($writeManifestFiles) {
    Copy-Item -Path $srcManifestDir -Destination $destDir -Recurse -Force
    Get-ChildItem -Recurse -Path $destManifestDir -File | 
        Where-Object { $_.Extension -in ".json", ".xml", ".nuspec" } | 
        ForEach-Object {
            $filePath = $_.FullName
            $content = Get-Content $filePath -Raw
            foreach ($key in $replacements.Keys) {
                $content = $content -replace "\{\{$key\}\}", $replacements[$key]
            }
            Set-Content -Path $filePath -Value $content -Force
            Write-Output "$filePath"
        }
}

# Updating the names 
$srcFile = Join-Path $destManifestDir "\assets\locales\en-US\translations.json"
if (Test-Path $srcFile) {
    $content = Get-Content $srcFile -Raw
    foreach ($key in $replacements.Keys) {
        $content = $content -replace "WDKv2 Sample Workload", $WorkloadDisplayName
    }
    Set-Content -Path $srcFile -Value $content -Force
    Write-Host "Updated translations in $srcFile"
} else {
    Write-Host "$srcFile not found!" -ForegroundColor Red
}


# Use a temporary nuspec file
Write-Output "Create nuspec file ..."

# Use Join-Path and [IO.Path]::DirectorySeparatorChar for cross-platform compatibility
$nuspecManifestDir = Join-Path $srcTemplateDir "Manifest"
$srcNuspecFile = Join-Path $nuspecManifestDir "ManifestPackage.nuspec"
$destNuspecFile = Join-Path $destManifestDir "ManifestPackage.nuspec"

# Read and update nuspec content
$nuspecContent = Get-Content $srcNuspecFile -Raw
# Use the correct directory separator for the current OS
$sep = [IO.Path]::DirectorySeparatorChar
$nuspecContent = $nuspecContent -replace '<ManifestFolder>', ($destManifestDir + $sep)
foreach ($key in $replacements.Keys) {
    $nuspecContent = $nuspecContent -replace "\{\{$key\}\}", $replacements[$key]
}

# Write to the temporary nuspec file
Set-Content $destNuspecFile -Value $nuspecContent -Force
Write-Output "$destNuspecFile"

###############################################################################
# Writing the Workload config files
###############################################################################

if (-not $SkipWorkloadSetup) {
    Write-Output "Writing Workload files ..."
    $srcWorkloadDir = Join-Path $srcTemplateDir "Workload"
    $destWorkloadDir = Join-Path $PSScriptRoot "..\..\Workload"

    Write-Host "The Workload destination dir $destWorkloadDir"
    Write-Host "The Workload src dir $srcWorkloadDir"

    # Get all files in the source directory
    Get-ChildItem -Path $srcWorkloadDir -Force
    Get-ChildItem -Path $srcWorkloadDir -Force -File | ForEach-Object {
        $filePath = $_.FullName
        $content = Get-Content $filePath -Raw
        $destPath = Join-Path $destWorkloadDir $_.Name

        $writeFile = $true
        if ((Test-Path $destPath) -and !$Force) {         
            $writeFile = Read-Host "File  $_ exists do you want to override it with the templates? (y/n)"      
        }

        if($writeFile) {
            Write-Host "Processing file: $filePath"
            foreach ($key in $replacements.Keys) {
                $content = $content -replace "\{\{$key\}\}", $replacements[$key]
            }
            Set-Content -Path $destPath -Value $content -Force
            Write-Output "$destPath"
        } else {
            Write-Host "Skipping file: $filePath"
        }
    }
} else {
    Write-Host "Skipping Workload configuration setup (SkipWorkloadSetup = true)"
}

Write-Host "Setup Workload finished successfully ..."  -ForegroundColor Green

# Explicitly set exit code to 0 for success
exit 0