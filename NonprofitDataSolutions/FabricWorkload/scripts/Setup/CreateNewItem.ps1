param (
    # The name of the workload, used for the Entra App and the workload in the Fabric portal
    [String]$WorkloadName = "Org.NonprofitData",
    # The name of the item, used for the item in the Fabric portal
    # Items will be created with the {WorkloadName}.{ItemName} format in Fabric
    [String]$ItemName,
    [String]$srcItemName = "Fundraising"
)

###############################################################################
# Functions used in the script
# These functions are used to copy files and replace placeholders in the content
###############################################################################
function Replace-SourceItemPath {
    param (
        [String]$Path
    )
    return $Path -replace $srcItemName, $ItemName 
}

function Replace-SourceItemContent {
    param (
        [string]$Content
    )
    $content = $content -replace $srcItemName, $ItemName
    return $content
}

function Copy-SourceItemFile {
    param (
        [string]$SourceFile,
        [string]$DestinationFile
    )
    $content = Get-Content $SourceFile -Raw
    $content = Replace-SourceItemContent $content

    New-Item -Path $DestinationFile -ItemType File -Force | Out-Null
    Set-Content -Path $DestinationFile -Value $content -Force
    Write-Output " $DestinationFile"
}

function Replace-Content {
    param (
        [string]$SourceFile,
        [hashtable]$Replacments
    )
    $content = Get-Content $SourceFile -Raw
    foreach ($key in $Replacments.Keys) {
        Write-Output "Replacing '$key' with '$($Replacments[$key])' in $SourceFile"
        $content = $content -replace $key, $Replacments[$key]
    }

    Set-Content -Path $SourceFile -Value $content -Force
}

function RecursiveCopy {
    param (
        [string]$dir,
        [string]$srcPlaceholder,
        [String]$targetValue
    )
    Get-ChildItem -Recurse -Path $srCodeDir -File -Filter $srcPlaceholder |
    ForEach-Object {
        $srcFile = $_.FullName
        $targetFile = Replace-SourceItemPath -Path $srcFile
        Copy-SourceItemFile -SourceFile $srcFile -DestinationFile $targetFile
    }
}



###############################################################################
# Configure the item
###############################################################################
$srCodeDir = Join-Path $PSScriptRoot "..\..\Workload\app\items\${srcItemName}Item"
$targetFile = Replace-SourceItemPath -Path $srcFile
Write-Output "Using ${srcItemName} sample in $srCodeDir as source"
Write-Host ""
Write-Host "Creating code files..."
$targetCodeDir = Join-Path $PSScriptRoot "..\..\Workload\app\items\${ItemName}Item-editor"
Write-Host "Write the item code in:"
Write-Host " $targetCodeDir"

###############################################################################
# Writing code files
# This will create a new item in the app\items directory
###############################################################################
Get-ChildItem -Recurse -Path $srCodeDir -File |  
    ForEach-Object {
        $srcFile = $_.FullName
        $targetFile = Replace-SourceItemPath -Path $srcFile
        Copy-SourceItemFile -SourceFile $srcFile -DestinationFile $targetFile
    }
# assets
$srcFile = Join-Path  $PSScriptRoot "..\..\Workload\app\assets\items\${srcItemName}\EditorEmpty.jpg"
if (Test-Path $srcFile) {
    $targetFile = Join-Path $PSScriptRoot "..\..\Workload\app\assets\items\${itemName}\EditorEmpty.jpg"
    Copy-SourceItemFile -SourceFile $srcFile -DestinationFile $targetFile
} else {
    Write-Host "Couldn't find ${srcFile}" -ForegroundColor Red
}


###############################################################################
# Writing manifest files
# This will create a new item in the Manfiest directory
###############################################################################
Write-Host ""
Write-Host "Creating manifest files..."
# Item.xml file
$srcFile = Join-Path $PSScriptRoot "..\..\config\templates\Manifest\${srcItemName}Item.xml"
if (Test-Path $srcFile) {
    $targetFile = Join-Path $PSScriptRoot "..\..\config\Manifest\${itemName}Item.xml"
    Copy-SourceItemFile -SourceFile $srcFile -DestinationFile $targetFile
} else {
    Write-Host "${srcItemName}Item.xml not found at $targetFile" -ForegroundColor Red
}
# Item.json file
$srcFile = Join-Path $PSScriptRoot "..\..\config\templates\Manifest\${srcItemName}Item.json"
if (Test-Path $srcFile) {
    $targetFile = Join-Path $PSScriptRoot "..\..\config\Manifest\${itemName}Item.json"
    Copy-SourceItemFile -SourceFile $srcFile -DestinationFile $targetFile
    $replacements = @{
        $srcItemName = $ItemName
        #"{{WORKLOAD_NAME}}" = $WorkloadName
    }
    Replace-Content -SourceFile $targetFile -Replacements $replacements
} else {
    Write-Host "Couldn't find ${srcFile}" -ForegroundColor Red
}
# assets
$srcFile = Join-Path $PSScriptRoot "..\..\config\templates\Manifest\assets\images\${srcItemName}Item-icon.png"
if (Test-Path $srcFile) {
    $targetFile = Join-Path $PSScriptRoot "..\..\config\Manifest\assets\images\${itemName}Item-icon.png"
    Copy-SourceItemFile -SourceFile $srcFile -DestinationFile $targetFile
} else {
   Write-Host "Couldn't find ${srcFile}" -ForegroundColor Red
}



Write-Host ""
$targetFile = Join-Path $PSScriptRoot "..\..\config\Manifest\Product.json"
$targetFile = Resolve-Path $targetFile
Write-Host "TODO: Add the configuration Section to the Product.json file!" -ForegroundColor Blue
Write-Host "The file you need to change is:"
Write-Host " $targetFile"

Write-Host ""
$targetFile = Join-Path $PSScriptRoot "..\..\config\Manifest\assets\locales"
$targetFile = Resolve-Path $targetFile
Write-Host "TODO: Add the Translations to the Manifest asset files!" -ForegroundColor Blue
Write-Host "The file you need to change are located here:"
Write-Host " $targetFile"

Write-Host ""
$targetFile = Join-Path $PSScriptRoot "..\..\Workload\app\App.tsx"
$targetFile = Resolve-Path $targetFile
$routingEntry = "${ItemName}Item-editor"
Write-Host "TODO: add the routing for '$routingEntry' to the App.tsx file!" -ForegroundColor Blue
Write-Host "The file you need to change is:"
Write-Host " $targetFile"



