param (
    [boolean]$InteractiveLogin = $true
)

################################################
# Make sure Manifest is built
################################################
# Run BuildManifestPackage.ps1 with absolute path
$buildManifestPackageScript = Join-Path $PSScriptRoot "..\Build\BuildManifestPackage.ps1"
if (Test-Path $buildManifestPackageScript) {
    $buildManifestPackageScript = (Resolve-Path $buildManifestPackageScript).Path
    & $buildManifestPackageScript 
} else {
    Write-Host "BuildManifestPackage.ps1 not found at $buildManifestPackageScript"
    exit 1
}

################################################
# Starting the Frontend
################################################
$fileExe = ""
if($IsWindows) { 
    $fileExe = Join-Path $PSScriptRoot "..\..\tools\DevGateway\Microsoft.Fabric.Workload.DevGateway.exe"
} else { 
    $fileExe = Join-Path $PSScriptRoot "..\..\tools\DevGateway\Microsoft.Fabric.Workload.DevGateway.dll"
}

$CONFIGURATIONFILE = Resolve-Path -Path (Join-Path $PSScriptRoot "..\..\config\DevGateway\workload-dev-mode.json")
$CONFIGURATIONFILE = $CONFIGURATIONFILE.Path
Write-Host "DevGateway used: $fileExe"
Write-Host "Configuration xsfile used: $CONFIGURATIONFILE"

$token = ""
# For Codespaces, we can't use interactive login, so we need to use az login with device code
# This is required to get the access token for the Fabric API
if ($env:CODESPACES -eq "true" -or -not $InteractiveLogin -or $IsMacOS) {
    # Check if already logged in
    $account = az account show 2>$null
    if (-not $account) {
        Write-Host "Not logged in. You ndeed to perform az login..." -ForegroundColor Red
        az config set core.login_experience_v2=off | Out-Null
        $fabricTentanID = Read-Host "Enter your Fabric tenant id"
        $loginResult = az login -t $fabricTentanID --allow-no-subscriptions --use-device-code
    }

    $token = az account get-access-token --scope https://analysis.windows.net/powerbi/api/.default --query accessToken -o tsv 
}
$config = Get-Content -Path $CONFIGURATIONFILE -Raw | ConvertFrom-Json 
$manifestPackageFilePath = $config.ManifestPackageFilePath 
$devWorkspaceId = $config.WorkspaceGuid 
$workloadEndpointURL = $config.WorkloadEndpointURL 
$logLevel = "Information"


if($IsWindows) { 
    & $fileExe -DevMode:LocalConfigFilePath $CONFIGURATIONFILE
} else {   
    # Check if we're on ARM64 Mac and need x64 runtime
    $arch = uname -m
    if ($arch -eq "arm64") {
        $x64DotnetPath = "/usr/local/share/dotnet/x64/dotnet"
        if (Test-Path $x64DotnetPath) {
            Write-Host "Using x64 .NET runtime for ARM64 Mac compatibility..." -ForegroundColor Yellow
            & $x64DotnetPath $fileExe -LogLevel $logLevel -DevMode:UserAuthorizationToken $token -DevMode:ManifestPackageFilePath $manifestPackageFilePath -DevMode:WorkspaceGuid $devWorkspaceId -DevMode:WorkloadEndpointUrl $workloadEndpointURL
        } else {
            Write-Host "ERROR: This application requires x64 .NET runtime, but you're on ARM64 Mac." -ForegroundColor Red
            Write-Host "Please install x64 .NET 8 Runtime from: https://dotnet.microsoft.com/download/dotnet/8.0" -ForegroundColor Red
            Write-Host "Make sure to download the x64 version (not ARM64)." -ForegroundColor Red
            exit 1
        }
    } else {
        & dotnet $fileExe -LogLevel $logLevel -DevMode:UserAuthorizationToken $token -DevMode:ManifestPackageFilePath $manifestPackageFilePath -DevMode:WorkspaceGuid $devWorkspaceId -DevMode:WorkloadEndpointUrl $workloadEndpointURL
    }
}