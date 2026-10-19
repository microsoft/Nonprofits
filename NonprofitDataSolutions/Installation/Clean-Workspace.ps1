[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    [string]$WorkspaceName
)

$canDelete = @('.Notebook', '.Lakehouse', '.DataPipeline', '.Reflex', '.Report')

# Delete whatever possible
$items = fab ls "$WorkspaceName.Workspace"
foreach ($item in $items) {
    if ($canDelete | Where-Object { $item.EndsWith($_) }) {
        fab rm -f "$WorkspaceName.Workspace/$item"
    }
}

# Delete remaining semantic models (must be done after deleting lakehouses)
$items = fab ls "$WorkspaceName.Workspace"
foreach ($item in $items) {
    if ($item.EndsWith('.SemanticModel')) {
        fab rm -f "$WorkspaceName.Workspace/$item"
    }
}

# Print remaining items
$items = fab ls "$WorkspaceName.Workspace"
if ($items.Count -eq 0) {
    Write-Output "Workspace is clean."
} else {
    Write-Output "Remaining items in workspace:"
    $items | ForEach-Object { Write-Output $_ }
}
