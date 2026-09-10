param (
    #Indicates if the files should be validated before building the package
    [boolean]$ValidateFiles = $false,
    # The environment (DEV, PPE, or PROD) for the manifest package
    [ValidateSet("DEV", "PPE", "PROD")]
    [String]$Environment = "DEV",
    # The version number to use for the NuGet package
    [String]$Version = "1.0.0"
)

Write-Host "Building Nuget Package for Environment: $Environment, Version: $Version ..."

################################################
# Setup Workload with the specified version
################################################
Write-Host "Setting up workload with version: $Version"

################################################
# Build the current nuget package
################################################
if($ValidateFiles -eq $true) {
    Write-Output "Validating configuration files..."
    $ScriptsDir = Join-Path $PSScriptRoot "Manifest\ValidationScripts"

    & "$ScriptsDir\RemoveErrorFile.ps1" -outputDirectory $ScriptsDir
    & "$ScriptsDir\ManifestValidator.ps1" -inputDirectory $manifestDir -inputXml "WorkloadManifest.xml" -inputXsd "WorkloadDefinition.xsd" -outputDirectory $ScriptsDir
    & "$ScriptsDir\ItemManifestValidator.ps1" -inputDirectory $manifestDir -inputXsd "ItemDefinition.xsd" -workloadManifest "WorkloadManifest.xml" -outputDirectory $ScriptsDir

    $validationErrorFile = Join-Path $ScriptsDir "ValidationErrors.txt"
    if (Test-Path $validationErrorFile) {
        Write-Host "Validation errors found. See $validationErrorFile"
        Get-Content $validationErrorFile | Write-Host
        exit 1
    }
}

################################################
# Ensure nuget.exe is available
################################################
$nugetPath = Join-Path $PSScriptRoot "..\..\tools\nuget.exe"

if (-not (Test-Path $nugetPath)) {
    Write-Host "Nuget executable not found at $nugetPath. Downloading..."
    $downloadScript = Join-Path $PSScriptRoot "..\Utils\DownloadNuget.ps1"
    if (Test-Path $downloadScript) {
        $nugetPath = & $downloadScript
    } else {
        Write-Error "DownloadNuget.ps1 script not found at $downloadScript"
        exit 1
    }
}

$nuspecPath = Join-Path $PSScriptRoot "..\..\config\Manifest\ManifestPackage.nuspec"
$outputDir = Join-Path $PSScriptRoot "..\..\config\Manifest\"

Write-Host "Environment: $Environment"
Write-Host "Using configuration in $outputDir"

# Update the nuspec file to include environment in package ID and set version
$nuspecContent = Get-Content $nuspecPath -Raw
$nuspecContent = $nuspecContent -replace '<id>ManifestPackage</id>', "<id>ManifestPackage-$Environment</id>"
$nuspecContent = $nuspecContent -replace '{{VERSION}}', $Version
$tempNuspecPath = Join-Path $PSScriptRoot "..\..\config\Manifest\ManifestPackage-$Environment.nuspec"
Set-Content -Path $tempNuspecPath -Value $nuspecContent

Write-Host "Updated NuSpec file with Environment: $Environment and Version: $Version" -ForegroundColor Green

# Display the updated content for verification
Write-Host "NuSpec content preview:" -ForegroundColor Yellow
$previewLines = ($nuspecContent -split "`n")[0..10]
foreach ($line in $previewLines) {
    Write-Host "  $line" -ForegroundColor Gray
}

if($IsWindows -or $env:OS -eq "Windows_NT"){
    & $nugetPath pack $tempNuspecPath -OutputDirectory $outputDir -Verbosity detailed
} else {
    # On Mac and Linux, we need to use mono to run the script
    # alternatively, we could use dotnet tool if available
    # nuget pack $nuspecFile -OutputDirectory $outputDir -Verbosity detailed 2>&1   
    mono $nugetPath pack $tempNuspecPath -OutputDirectory $outputDir -Verbosity detailed
}

# Clean up the temporary nuspec file
Remove-Item $tempNuspecPath -ErrorAction SilentlyContinue

Write-Host "Created a new ManifestPackage in $outputDir." -ForegroundColor Blue

