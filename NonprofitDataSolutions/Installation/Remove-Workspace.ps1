[CmdletBinding()]
param (
    [Parameter(Mandatory = $true)]
    [string]$WorkspaceName
)

fab rm -f "$WorkspaceName.Workspace"
