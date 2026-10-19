[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    [string]$WorkspaceName,
    [Parameter(Mandatory = $true)]
    [string]$CapacityName
)

fab create "$WorkspaceName.Workspace" -P capacityname="$CapacityName.Capacity"
