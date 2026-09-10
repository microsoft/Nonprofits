[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    [string]$WorkspaceName,

    [Parameter(Mandatory = $true)]
    [string]$ItemType
)

fab ls "$WorkspaceName.Workspace" |
    # filter out TEMP stuff
    Where-Object { $_ -like "*.$ItemType" -and $_ -notlike "*TEMP*.$ItemType" } |
    Sort-Object
