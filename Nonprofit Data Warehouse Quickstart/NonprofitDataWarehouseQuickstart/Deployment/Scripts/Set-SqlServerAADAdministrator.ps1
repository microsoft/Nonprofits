    <#
	
	# Copyright (c) Microsoft Corporation.
    # Licensed under the MIT License.
	
    .SYNOPSIS
        Script Assign AAD Admin for Azure sql database server

    .DESCRIPTION
        Script Assign Active Directory Admin for Azure sql database server. That enables AAD admins to loging to to the server using AAD Accounts and configure AAD Security for the rest of the users.

    .PARAMETER ResourceGroupName
        Name of the resource group where solution SqlServer is deployed e.g. "mstsidhrgweudev"

    .PARAMETER SqlServerName
        Name of the Azure Sql Server e.g. "mstsidhsqlweudev"
    
    .PARAMETER SqlServerAdmin
        Name of the Group/User that is going to be assigned as SQL Server AAD Administgrator e.g. "AAD-GRP-MSTSIDH-DEV-ADMIN"
  
    .OUTPUTS
       No objects are outputed

    .EXAMPLE
        ./Set-SqlServerAADAdministrator -ResourceGroupName "mstsidhrgweudev" -SqlServerName "mstsidhsqlweudev" -SqlServerAdmin "AAD-GRP-MSTSIDH-DEV-ADMIN";

    .NOTES
        -Script requires AzureRM Modules installed on the machine where script is executed (requires administrator rights)
        -Script requires Owner of the subscription/resource group to log in e.g. Login-AzureRmAccount -SubscriptionId '{subscriptionId}' - this need to be executed only once.
        -Check parameter details for instructions 
        
        ### Setup - install modules (requires admin rights)
        Install-Module AzureRm             
    #>

param
(
    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $ResourceGroupName = "mstsidhrgweudev",

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $SqlServerName = "mstsidhsqlweudev",

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $SqlServerAdmin = "AAD-GRP-MSTSIDH-DEV-ADMIN"
)

### Clear Screen
# Uncomment below line to clear screen
#cls;

### Login
# Uncomment below line to login
# Login-AzureRmAccount -SubscriptionId '{subscriptionId}'
 
### Execution
Write-Host "### Script Starting - Set Azure SQL Server AAD Administrator";
try
{
    ## Set SQL Server AAD Administrator
    Write-Host "Assigning AAD Sql Server Administrator..."
    Set-AzSqlServerActiveDirectoryAdministrator `
        -ResourceGroupName $ResourceGroupName `
        -ServerName $SqlServerName `
        -DisplayName $SqlServerAdmin;

    Write-Host "### Script Executed Successfully" -ForegroundColor Green;
}
catch
{
    Write-Host "### Script Failed" -ForegroundColor Red;
    throw;
}

