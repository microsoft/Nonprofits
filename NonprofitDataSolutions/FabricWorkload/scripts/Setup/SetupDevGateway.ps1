param (
    # The Workspace Id to use for development
    [String]$DevWorkspaceId,
    # The version of the workload, used for the manifest package
    [String]$WorkloadVersion = "1.0.0",
    # The environment (DEV, PPE, or PROD) for the manifest package
    [ValidateSet("DEV", "PPE", "PROD")]
    [String]$Environment = "DEV",
    # Force flag to overwrite existing configurations and don't prompt the user
    # If not provided, it will default to false.
    [boolean]$Force = $false
)

###############################################################################
# Download the DevGateway
###############################################################################
$downloadDevGatewayScript = Join-Path $PSScriptRoot "..\Setup\DownloadDevGateway.ps1"
if (Test-Path $downloadDevGatewayScript) {   
    Write-Host "Running DownloadDevGateway.ps1..."
    & $downloadDevGatewayScript -Force $Force 
} else {
    Write-Error "DownloadDevGateway.ps1 not found at $downloadDevGatewayScript"
    exit 1
}

###############################################################################
# Setup DevGateway configuration files
###############################################################################
$srcDir = Join-Path $PSScriptRoot "..\..\config\templates\DevGateway"
Write-Output "Using template in $srcDir"
$destDir = Join-Path $PSScriptRoot "..\..\config\DevGateway"
if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir | Out-Null }
Write-Output "Writing configuration files in $destDir"

$manifestConfigFile= Join-Path $PSScriptRoot ".\..\..\config"
if (!(Test-Path $manifestConfigFile)) { New-Item -ItemType Directory -Path $manifestConfigFile | Out-Null }
$manifestDir = (Resolve-Path -Path (Join-Path $PSScriptRoot "..\..\config")).Path
$manifestFile = Join-Path $manifestDir "Manifest\ManifestPackage-$Environment.$WorkloadVersion.nupkg"
Write-Output "Manifest location used $manifestFile"

# Define key-value dictionary for replacements
$replacements = @{
    "DEV_WORKSPACE_ID"                     = $DevWorkspaceId
    "WORLOAD_MANIFEST_PACKAGE_FILE_PATH" = [regex]::Escape($manifestFile).Replace("\.", ".")
    "WORKLOAD_VERSION"                   = $WorkloadVersion
}

###############################################################################
# Copy the template files to the destination directory 
################################################################################
Get-ChildItem -Path $srcDir -File | ForEach-Object {
    $filePath = $_.FullName
    $content = Get-Content $filePath -Raw

    foreach ($key in $replacements.Keys) {
        $content = $content -replace "\{\{$key\}\}", $replacements[$key]
    }

    $destPath = Join-Path $destDir $_.Name
    Set-Content -Path $destPath -Value $content
}

Write-Host "Setup DevGateway finished successfully ..."  -ForegroundColor Green