param(
    # The directory where nuget.exe should be downloaded
    [String]$TargetDirectory = (Join-Path $PSScriptRoot "..\..\tools")
)

$nugetExePath = Join-Path $TargetDirectory "nuget.exe"

# Check if nuget.exe already exists
if (Test-Path $nugetExePath) {
    Write-Host "nuget.exe already exists at $nugetExePath" -ForegroundColor Green
    return $nugetExePath
}

# Ensure target directory exists
if (-not (Test-Path $TargetDirectory)) {
    Write-Host "Creating directory: $TargetDirectory"
    New-Item -ItemType Directory -Path $TargetDirectory -Force | Out-Null
}

# Download nuget.exe from official source
$nugetUrl = "https://dist.nuget.org/win-x86-commandline/latest/nuget.exe"
Write-Host "Downloading nuget.exe from $nugetUrl to $nugetExePath..."

try {
    # Use Invoke-WebRequest to download nuget.exe
    Invoke-WebRequest -Uri $nugetUrl -OutFile $nugetExePath -UseBasicParsing
    Write-Host "Successfully downloaded nuget.exe to $nugetExePath" -ForegroundColor Green
    return $nugetExePath
} catch {
    Write-Error "Failed to download nuget.exe: $($_.Exception.Message)"
    exit 1
}
