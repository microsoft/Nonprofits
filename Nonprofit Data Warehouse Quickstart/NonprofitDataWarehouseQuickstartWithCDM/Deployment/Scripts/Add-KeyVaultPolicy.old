    <#
	
	# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.
	
    .SYNOPSIS
        Scripts Assign KeyVault Access Policies

    .DESCRIPTION
        Scripts Assign KeyVault Access Policies that controls access to KeyVault Secrets.

    .PARAMETER KeyVaultName
        KeyVault name (not URI) e.g. "mstsidhkvweudev"

    .PARAMETER ResourceGroup
        Resource Group Name where KeyVault is deployed e.g. mstsidhrgweudev
    
    .PARAMETER ResourceGroup
        Resource Group Name where KeyVault is deployed e.g. mstsidhrgweudev
  
    .PARAMETER PrincipalPermissionsJson
        Json Array that contains list of permissions obejects
        e.g.
        Array of objects
        '[{"PrincipalName":"mstsidhadfweudev","PrincipalType":"ServicePrincipal","PermisionsToSecrets":["get","list"],"PermissionsToKeys":["list"]},{"PrincipalName":"AAD-GRP-MSTSIDH-DEV-DEVELOPER","PrincipalType":"Group","PermisionsToSecrets":["get","list","set"],"PermissionsToKeys":["list"]},{"PrincipalName":"AAD-GRP-MSTSIDH-DEV-ADMIN","PrincipalType":"Group","PermisionsToSecrets":["get","list","set","delete","recover","backup","restore"],"PermissionsToKeys":["list"]}]'

        Single object
        {"PrincipalName":"mstsidhadfweudev","PrincipalType":"ServicePrincipal","PermisionsToSecrets":["get","list"],"PermissionsToKeys":["list"]}

        Remarks:
        -Parameter is provided with single quotations
        -At least one permissions to Keys need to be populated (use "list" if no permissions required)

    .OUTPUTS
       No objects are outputed

    .EXAMPLE
        ./Add-KeyVaultPolicy -KeyVaultName "mstsidhkvweudev" -ResourceGroup "mstsidhrgweudev" -PrincipalPermissionsJson '[{"PrincipalName":"mstsidhadfweudev","PrincipalType":"ServicePrincipal","PermisionsToSecrets":["get","list"],"PermissionsToKeys":["list"]},{"PrincipalName":"AAD-GRP-MSTSIDH-DEV-DEVELOPER","PrincipalType":"Group","PermisionsToSecrets":["get","list","set"],"PermissionsToKeys":["list"]},{"PrincipalName":"AAD-GRP-MSTSIDH-DEV-ADMIN","PrincipalType":"Group","PermisionsToSecrets":["get","list","set","delete","recover","backup","restore"],"PermissionsToKeys":["list"]}]'

    .NOTES
        -Script requires AzureRM Modules installed on the machine where script is executed (requires administrator rights)
        -Script requires Owner of the subscription/resource group to log in e.g. Login-AzureRmAccount -SubscriptionId '{subscriptionId}' - this need to be executed only once.
        -Check parameter details for instructions
        
    #>

param(
    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $KeyVaultName = "mstsidhkvweudev",

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $ResourceGroup = "mstsidhrgweudev",

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $PrincipalPermissionsJson = '[{"PrincipalName":"mstsidhadfweudev","PrincipalType":"ServicePrincipal","PermisionsToSecrets":["get","list"],"PermissionsToKeys":["list"]},{"PrincipalName":"AAD-GRP-MSTSIDH-DEV-DEVELOPER","PrincipalType":"Group","PermisionsToSecrets":["get","list","set"],"PermissionsToKeys":["list"]},{"PrincipalName":"AAD-GRP-MSTSIDH-DEV-ADMIN","PrincipalType":"Group","PermisionsToSecrets":["get","list","set","delete","recover","backup","restore"],"PermissionsToKeys":["list"]}]'
)

### Clear Screen
# Uncomment below line to clear screen
#cls;

### Login
# Uncomment below line to login
# Login-AzureRmAccount -SubscriptionId '{subscriptionId}'

### Definition onf the function to assign Policies on the KeyVault
Function Set-SecretsAccessPolicy
{
	Param(
		[Parameter(Mandatory = $true)]
		[ValidateNotNullOrEmpty()]
		[string] $ResourceGroupName,

		[Parameter(Mandatory = $true)]
		[ValidateNotNullOrEmpty()]
		[string] $VaultName,

		[Parameter(Mandatory = $true)]
		[ValidateNotNullOrEmpty()]
		[string] $PrincipalType,

		[Parameter(Mandatory = $true)]
		[ValidateNotNullOrEmpty()]
		[string] $PrincipalName,

		[Parameter(Mandatory = $true)]
		[ValidateNotNullOrEmpty()]
		[string[]] $PermissionsToSecrets,

		[Parameter(Mandatory = $true)]
		[ValidateNotNullOrEmpty()]
		[string[]] $PermissionsToKeys
	)

    # Obtain principal based on type
	$Principals = switch($PrincipalType)
    {
		"Group" { 
            (Get-AzureRmADGroup -SearchString $PrincipalName)
        }
		"User" { 
            (Get-AzureRmADUser -UserPrincipalName $PrincipalName)
        }
		"ServicePrincipal" { 
            (Get-AzureRmADServicePrincipal -DisplayName "$PrincipalName")
        }
	}

    if ($Principals -eq $null)
    {
        throw "Can not obtain id for $PrincipalName from AAD";    
    }

	try 
    {
        # print permissions
        Write-Host "Resource Group Name: $VaultName";
        Write-Host "KeyVault Name: $VaultName";
        Write-Host "Permissions to Keys Count: $($PermissionsToKeys.Count)"; 
        Write-Host "Permissions to Keys: $($PermissionsToKeys)";
        Write-Host "Permissions To Secrets Count: $($PermissionsToSecrets)";
        Write-Host "Permissions to Secrets: $($PermissionsToSecrets)";

        foreach ($principal in $Principals)
        {
		    Set-AzureRmKeyVaultAccessPolicy `
                -VaultName $VaultName `
			    -ResourceGroupName $ResourceGroupName `
			    -ObjectId $principal.Id `
                -PermissionsToKeys $PermissionsToKeys `
                -PermissionsToSecrets $PermissionsToSecrets;
            Write-Host "Assigned Policy for $($principal.DisplayName) principal for applicationId:$($principal.Id))" -foreground Green
        }
	}
	catch
    {
		Write-Error $_.Exception|format-list -force
	}
}

### Function that converts json array into PowerShell Object
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

### Execution

Write-Host "KeyVault Name: $($keyVaultName)";
Write-Host "Resource Group: $($resourceGroup)";

# Deserialise Permissions object
if($PrincipalPermissionsJson -ne $null)
{
    $PrincipalPermissionsConfiguration = [array](ConvertFrom-JsonArray -Json $PrincipalPermissionsJson)
}
else
{
    throw "Provide permissions Service Principal permissions json";
}

Write-Host "";
Write-Host "Principals Count: $($PrincipalPermissionsConfiguration.Count)";
Write-Host $Principals;
Write-Host "";

# iterate over array of permissions 
foreach($principal in $PrincipalPermissionsConfiguration)
{

	Write-Host "PrincipalName: $($principal.PrincipalName)";

    # Set policy for principal
	Set-SecretsAccessPolicy `
		-ResourceGroupName $resourceGroup `
        -VaultName $keyVaultName `
		-PrincipalType $principal.PrincipalType `
		-PrincipalName $principal.PrincipalName `
		-PermissionsToSecrets $principal.PermisionsToSecrets `
        -PermissionsToKeys $principal.PermissionsToKeys;

	Write-Host "-----------------------------------------";
	Write-Host "";
}
