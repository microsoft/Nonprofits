    <#
	
	# Copyright (c) Microsoft Corporation.
	# Licensed under the MIT License.
	
    .SYNOPSIS
        Set IAM permissions on Azure Resources

    .DESCRIPTION
        Set IAM permissions on Azure Resources based on the Json configuration provided

    .PARAMETER ResourceGroupName
        Name of the resource group resources are deployed to e.g. "mstsidhrgweudev"

    .PARAMETER IamPermissionConfigurationJson
        This parameter is JSON array that specifies IAM configuration
        [{"ResourceName":"mstsidhadlsweudev","PrincipalName":"mstsidhadfweudev","PrincipalType":"ServicePrincipal","IamRole":"Contributor"}]

        Each Json object requires 3 parameters
        ResourceName - defines resource name we want to assigne IAM permissions to
        PrincipalName - defines name of the principal that should be assigned to IAM
        PrincipalType - type of the principal (allowed values User, Group, ServicePrincipal)
        IamRole - Role type to be assigned - need to match with role names available in Azure e.g. Contributor, Owner etc.

    .OUTPUTS
       No objects are outputed

    .EXAMPLE
        ./Set-IamPermissions -ResourceGroupName "mstsidhrgweudev" -IamPermissionConfigurationJson '[{"ResourceName":"mstsidhadlsweudev","PrincipalName":"mstsidhadfweudev","PrincipalType":"ServicePrincipal","IamRole":"Contributor"}]'

    .NOTES
        -Script requires AzureRM Modules installed on the machine where script is executed (requires administrator rights)
        -Script requires Owner of the subscription/resource group to log in e.g. Login-AzureRmAccount -SubscriptionId '{subscriptionId}' - this need to be executed only once.
        -Check parameter details for instructions
        
        ### Setup - install modules (requires admin rights)
        Install-Module AzureRm    
    #>

Param(

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $ResourceGroupName = "mstsidhrgweudev",

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $IamPermissionConfigurationJson = '[{"ResourceName":"mstsidhadlsweudev","PrincipalName":"mstsidhadfweudev","PrincipalType":"ServicePrincipal","IamRole":"Contributor"}]'
)

### Clear Screen
# Uncomment below line to clear screen
#cls;

### Login
# Uncomment below line to login
# Login-AzureRmAccount -SubscriptionId '{subscriptionId}'

### Defines function to deserialize json array
Function ConvertFrom-JsonArray
{
	Param(
		[Parameter(Mandatory = $true)]
		[ValidateNotNullOrEmpty()]
		[string] $Json
    )

    $jsonWraper= "{""Array"":" + $Json + "}";
    $array = ConvertFrom-Json -InputObject $jsonWraper; 
    return [array]$array.Array;
}

### Execution of the Script

Write-Host "### Script Started";

try
{

    $permissionConfiguration = ConvertFrom-JsonArray -Json $IamPermissionConfigurationJson;

    foreach($configuration in $permissionConfiguration)
    {
        # Obtain principal based on type
	    $Principal = switch($configuration.PrincipalType)
        {
		    "Group" { 
                (Get-AzureRmADGroup -SearchString $configuration.PrincipalName)
            }
		    "User" { 
                (Get-AzureRmADUser -UserPrincipalName $configuration.PrincipalName)
            }
		    "ServicePrincipal" { 
                (Get-AzureRmADServicePrincipal -DisplayName $configuration.PrincipalName)
            }
	    }

        if ($Principal -eq $null)
        {
            throw "Can not obtain id for $PrincipalName from AAD";    
        }

        # Obtain resource type
        $resource = Get-AzureRmResource -ResourceGroupName $ResourceGroupName -Name $configuration.ResourceName;
        $existingRoleAssignment = Get-AzureRmRoleAssignment `
            -ObjectId $Principal.Id `
            -RoleDefinitionName $configuration.IamRole `
            -Scope $resource.ResourceId;

        if($null -eq $existingRoleAssignment)
        {
            # Assign permissions
            New-AzureRMRoleAssignment `
                -RoleDefinitionName $configuration.IamRole `
                -ObjectId $Principal.Id `
                -Scope $resource.ResourceId;

            Write-Host "Assigned permission." -ForegroundColor Green;
        }
        else
        { 
            Write-Host "Role already exists." -ForegroundColor Yellow;
        }
        Write-Host "--------------------";
    }

    Write-Host "### Script Succeded" -ForegroundColor Green;
}
catch
{
    Write-Host "### Script Failed" -ForegroundColor Red;
}

