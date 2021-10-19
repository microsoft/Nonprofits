    <#
	# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.
	
    .SYNOPSIS
        Scripts Creates/Updates Secrets in KeyVault

    .DESCRIPTION
        Scripts Creates/Updates Secrets in KeyVault based on specified json object

    .PARAMETER KeyVaultName
        KeyVault name (not URI) e.g. "mstsidhkvweudev"

    .PARAMETER SecretConfiguration
        This parameter is JSON array that specifies Secrets to be created in Key Vault
        [{"SecretName":"SqlDatawarehouse-ConnectionString","SecretValue":"Server=tcp:mstsidhsqlweudev.database.windows.net,1433;Initial Catalog=mstsidhsqldwweudev;Persist Security Info=False;User ID={login};Password={password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;"}]

    .OUTPUTS
       No objects are outputed

    .EXAMPLE
        ./Set-KeyVaultSecret -KeyVaultName "mstsidhkvweudev" -SecretConfiguration '[{"SecretName":"SqlDatawarehouse-ConnectionString","SecretValue":"Server=tcp:mstsidhsqlweudev.database.windows.net,1433;Initial Catalog=mstsidhsqldwweudev;Persist Security Info=False;User ID={login};Password={password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;"}]'

    .NOTES
        -Script requires AzureRM Modules installed on the machine where script is executed (requires administrator rights)
        -Script requires Owner of the subscription/resource group to log in e.g. Login-AzureRmAccount -SubscriptionId '{subscriptionId}' - this need to be executed only once.
        -Check parameter details for instructions
        
        ### Setup - install modules (requires admin rights)
        Install-Module AzureRm    
    #>

param(
    [Parameter(Mandatory=$false)]
    [ValidateNotNullOrEmpty()]
    [string] $KeyVault="mstsidhkvweudev",

    [Parameter(Mandatory=$false)]
    [ValidateNotNullOrEmpty()]
    [object] $SecretConfiguration = '[{"SecretName":"SqlDatawarehouse-ConnectionString","SecretValue":"Server=tcp:mstsidhsqlweudev.database.windows.net,1433;Initial Catalog=mstsidhsqldwweudev;Persist Security Info=False;User ID=mstsidhadmin;Password=2G8zLXt22mKUMyz7;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;"}]'
)

### Clear Screen
# Uncomment below line to clear screen
#cls;

### Login
# Uncomment below line to login
# Login-AzureRmAccount -SubscriptionId '{subscriptionId}'

### Defines function to deserialize JSON Array
Function ConvertFrom-JsonArray
{
	Param(
		[Parameter(Mandatory = $true)]
		[ValidateNotNullOrEmpty()]
		[string] $Json
    )

    $jsonWraper= '{"Array":' + $Json + '}';
    $array = ConvertFrom-Json -InputObject $jsonWraper; 
    return [array]$array.Array;
}


### Script execution
Write-Host "### Start Script."
try
{

    # Configuration can be loaded from CSV files if required
    $SecretConfiguration = [array](ConvertFrom-JsonArray -Json $SecretConfiguration)

    # Iterate over secrets and deploy them into KeyVault
    foreach($configuration in $SecretConfiguration)
    {
        Write-host "# Secret: $($configuration.SecretName)";
        
        try
        {
            #Setting up secret
            $secretValue = ConvertTo-SecureString $configuration.SecretValue -AsPlainText -Force;
            $secretResult = Set-AzKeyVaultSecret -VaultName $keyVault -Name $configuration.SecretName -SecretValue $secretvalue;
            Write-Host "# Created Secret Succesfully" -ForegroundColor Green;
        }
        catch
        {
            Write-Host "# Failed to add secret." -ForegroundColor Red;
            throw;
        }
        Write-Host "# --------------------------------";

    }
    Write-Host "### Script Executed Successfully." -ForegroundColor Green;
}
catch
{
    # Error handling
    Write-Host "### Script Executed with Errors." -ForegroundColor Red;
    throw;
}



