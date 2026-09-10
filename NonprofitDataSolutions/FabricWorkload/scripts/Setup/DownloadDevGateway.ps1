param (
    # Force flag to overwrite existing configurations and don't prompt the user
    # If not provided, it will default to false.
    [boolean]$Force = $false
)

###############################################################################
# Download the DevGateway
###############################################################################
$toolsDir = Join-Path $PSScriptRoot "..\..\tools" # Replace with your desired folder
$devGatewayDir = Join-Path $toolsDir "DevGateway"
$downloadDevGateway = $true
if((Test-Path $devGatewayDir) -and !$Force) {
    $downloadDevGateway = $downloadDevGateway = Read-Host "DevGateway available, do you want to download the latest version? (y/n)"
    $downloadDevGateway = $downloadDevGateway -eq 'y'
}
if ($downloadDevGateway -eq "y") {
    $DEV_GATEWAY_DOWNLOAD_URL = "https://download.microsoft.com/download/c/4/a/c4a0a569-87cd-4633-a81e-26ef3d4266df/DevGateway.zip"
    Write-Host "📥 Downloading DevGateway..."       
    try {
        if ($IsWindows) {
            $tempDir = $env:TEMP
        } elseif($IsLinux) {
            $tempDir = "/tmp"
        } elseif($IsMacOS) {
            # On macOS, TMPDIR is usually set to /tmp
            # but we can also use $env:TMPDIR
            $tempDir = $env:TMPDIR
        } else {        
            Write-Host "❌ Unsupported operating system. Exiting."
            exit 1
        }
        # Example usage:
        $tempZipPath = Join-Path $tempDir "DevGateway-tmp.zip"
        if (!(Test-Path $devGatewayDir)) {
            New-Item -ItemType Directory -Path $devGatewayDir | Out-Null 
        }
        # Download the ZIP file
        Invoke-WebRequest -Uri $DEV_GATEWAY_DOWNLOAD_URL -OutFile $tempZipPath
        # Extract the ZIP file
        Expand-Archive -Path $tempZipPath -DestinationPath $devGatewayDir -Force
        # Remove the temporary ZIP file
        Remove-Item $tempZipPath
        Write-Host "✅ DevGateway downloaded and extracted to $devGatewayDir"
    }
    catch {
        Write-Host "❌ Failed to download or extract DevGateway: $_"
        exit 1
    }
}
else {
    Write-Host "⏭️ Skipping DevGateway download."
}