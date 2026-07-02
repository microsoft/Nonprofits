function Open-MicrosoftEdgeAndWait {
    param (
        [Parameter(Mandatory = $true)]
        [string]$url
    )
    
    $edgePaths = @(
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
    )
    $edge = $edgePaths | Where-Object { Test-Path $_ } | Select-Object -First 1
    if (-not $edge) {
        throw "Cannot find msedge.exe in Program Files or Program Files (x86)."
    }

    # Start Edge as a true app-window and grab the Process object
    # --user-data-dir ensures a fresh process rather than a stub.
    $userDataDir = Join-Path $env:TEMP ("EdgeProfile_" + [guid]::NewGuid())

    $proc = Start-Process -FilePath $edge `
        -ArgumentList @(
            "--app=$url",
            "--window-size=1200,800",
            "--user-data-dir=$userDataDir"
        ) `
        -PassThru

    # Wait until that process has actually created its window
    while (-not $proc.MainWindowHandle) {
        Start-Sleep -Milliseconds 100
    }

    # Then block until the user closes it
    $proc.WaitForExit()

    # Clean up the temp profile (optional)
    Remove-Item -Recurse -Force $userDataDir

    Write-Host "OAuth dialog closed — continuing script."
}

# Example usage:
Open-MicrosoftEdgeAndWait -url 'https://app.fabric.microsoft.com/groups/46eea40f-9e37-491e-ac74-93900ff249ae/settings/datasets/1bc0e354-de1f-4e9b-90fa-ae817a1b3d8e?experience=fabric-developer'