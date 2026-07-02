param(
    [Parameter(Mandatory = $true)]
    [string]$FabricPath,
    [Parameter(Mandatory = $true)]
    [string]$LocalPath
)

$files = fab ls $FabricPath

if (-not (Test-Path $LocalPath)) { New-Item -ItemType Directory -Path $LocalPath | Out-Null }

foreach ($file in $files) {
    fab cp "$FabricPath/$file" $LocalPath
}