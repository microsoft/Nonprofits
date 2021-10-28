<#

# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

.SYNOPSIS
    Creates MSI for SqlServer

.DESCRIPTION
    Creates Manage Service Identity Service Principal for SQL Server.

.PARAMETER ResourceGroupName
    Name of the resource group where SQL Server is deployed e.g. "mstsidhsqlweudev"

.PARAMETER SqlServerName
    Name of the SqlServer e.g. "mstsidhsqlweudev"

.OUTPUTS
   No objects are outputed

.EXAMPLE
    ./Create-SqlServerMsi -ResourceGroupName "mstsidhrgweudev" -SqlServerName "mstsidhsqlweudev"

.NOTES
    -Script requires AzureRM Modules installed on the machine where script is executed (requires administrator rights)
    -Script requires Owner of the subscription/resource group to log in e.g. Login-AzureRmAccount -SubscriptionId '{subscriptionId}' - this need to be executed only once. This is going to be executed by the upstram script
    -Check parameter details for instructions
    
    ### Setup - install modules (requires admin rights)
    Install-Module AzureRm  
#>

param(
    #[Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $ResourceGroupName = "oxfamdhrguksdev",

    #[Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $SqlServerName = "oxfamdhsqlserveruksdev"
)

### Clear Screen
# Uncomment below line to clear screen
#cls;

### Login
# Uncomment below line to login
# Login-AzureRmAccount -SubscriptionId '{subscriptionId}'

### Execute Script
Write-Host "### Script Started - Create-SqlServerMsi";
try
{
    # Check if MSI exist on SqlServer
    $sqlServer = Get-AzureRmSqlServer `
        -ResourceGroupName $ResourceGroupName `
        -ServerName $SqlServerName

    $msi = $sqlServer.Identity

    # Creates new MSI for Sql Server if does not exists
    if ($null -eq $msi)
    {
        # Creating new MSI for Sql Server
        Set-AzureRmSqlServer `
            -ResourceGroupName $ResourceGroupName `
            -ServerName $SqlServerName `
            -AssignIdentity;
    }
    sleep -Seconds 120;
    Write-Host "### Script Succeeded - Create-SqlServerMsi" -ForegroundColor Green;
}
catch
{
    Write-Host "### Script Failed - Create-SqlServerMsi" -ForegroundColor Red;
    throw;
}