<#

# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.

.SYNOPSIS
    Main Deployment Orchestrator for the Nonprofit Data Warehouse QuickStart with CDM Solution

.DESCRIPTION
    Execute PowerShell Scripts to setup Azure Resources Configuration.
    1. Creating ADLS folder structure and applying security
    2. Adding Security Policies to KeyVault
    3. Assigning IAM permissions on the resources
    4. Adding KeyVault Secrets

.PARAMETER subscriptionId
   Specifies the Azure Portal SubscriptionId (GUID) Where resources will be deployed. 
   This value should be obtained from the Azure Portal 
   e.g. 3ad22x8c-5636-4sa2-d32c-a77760f5xe2

.PARAMETER OrganisationPublicIPAddress
    Specifies Organisation external IP Address that is required to setup of the SQL Server Firewall rules.
    It had to be provided in the IP v4 format e.g. 144.92.0.128

.PARAMETER Project
    Specifies Project sufix for all the resources name - this is what differentiate your organisation resources for this solution from other organisations.
    That should be unique for your organisation
    e.g."QUICKSTARTCDM"

.PARAMETER Location
    Specifies location suffix for all the resources name. This is only description of the resources and has no impact on where resources are deployed. 
    This value should conform with ResourceGroupLocation parameter
    e.g."weu" fore "West Europe", "suk" for Uk South,

.PARAMETER Environment
    Specifies envrionment suffix for all the resources name
    e.g dev

.PARAMETER ResourceGroupName
    Specifies Resource Group where resources need to be deployed. If not provided during execution ResourceGroupName will be generated automaticaly by the script,

.PARAMETER ResourceGroupLocation="uksouth",
    Specify data center location for all resources

.PARAMETER Environment="dev",

.PARAMETER Tags
    Defines Tags that will be assigned to all resources deployed. This parameter need to be provided in form of PowerShell object
    e.g.
    Tags = @{Environment = "Dev"; Project = "NonprofiDataWarehouseQuickStartCDM"},

.PARAMETER DeveloperGroupName
    Defines Developer AAD Groups Name that will be assigned for all resources so they can be accessed by developers. 
    Group need to be provided. Group will not be created as a part of this script and need to be precreated.
    e.g.
    "AAD-GRP-QUICKSTARTCDM-DEV-DEVELOPER",

.PARAMETER AdminGroupName
    Defines Admin AAD Groups Name that will be assigned for all resources so they can be accessed by developers.
    Group need to be provided. Group will not be created as a part of this script and need to be precreated.
    e.g.
    "AAD-GRP-QUICKSTARTCDM-DEV-ADMIN"

.OUTPUTS
   No objects are outputed

.EXAMPLE
    ./DeployAzureConfiguration -SubscriptionId "" -OrganisationPublicIPAddress "" -Project "QUICKSTARTCDM"

.NOTES
    -Script requires AzureRM Modules installed on the machine where script is executed (requires administrator rights)
    -Script requires Owner of the subscription/resource group to log in e.g. Login-AzureRmAccount -SubscriptionId '{subscriptionId}' - this need to be executed only once.
    -Check parameter details for instructions
    
#>

param(
    ### Mandatory Parameters
    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $SubscriptionId = "",

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $OrganisationPublicIPAddress = "255.255.255.0",

    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $Project="",

    ### Optional Parameters
    [Parameter(Mandatory=$false)]
    [ValidateNotNullOrEmpty()]
    [string] $Location="suk",

    [Parameter(Mandatory=$false)]
    [string] $ResourceGroupName = "",

    [Parameter(Mandatory=$false)]
    [ValidateNotNullOrEmpty()]
    [string] $ResourceGroupLocation="uksouth",

    [Parameter(Mandatory=$false)]
    [ValidateNotNullOrEmpty()]
    [string] $Environment="dev",

    [Parameter(Mandatory=$false)]
    [ValidateNotNullOrEmpty()]
    [object] $Tags = @{Environment = "Dev"; Project = "NonprofitDataWarehouseQuickStartCDM"},

    [Parameter(Mandatory=$false)]
    [ValidateNotNullOrEmpty()]
    [string] $DeveloperGroupName = "AAD-GRP-QUICKSTARTCDM-DEV-DEVELOPER",

    [Parameter(Mandatory=$false)]
    [ValidateNotNullOrEmpty()]
    [string] $AdminGroupName = "AAD-GRP-QUICKSTARTCDM-DEV-ADMIN"
)

### Clear Screen
cls;

###---------------------------


### Login
Login-AzureRmAccount -SubscriptionId $SubscriptionId
###---------------------------


### Resolving path to Solution Root
$solutionRoot = Resolve-Path "..\";
Write-Host "Solution Path: $($solutionRoot)"
###---------------------------


### Generating Passwrod dynamically
[string] $synapseAnalyticsAdminPassword = -join ((48..57) + (65..90) + (97..122) + (33,62,94,95,33) | Get-Random -Count 25 | % {[char]$_})+"!"
[string] $synapseAnalyticsMasterKey = -join ((48..57) + (65..90) + (97..122) + (33,62,94,95,33) | Get-Random -Count 25 | % {[char]$_})+"!";
###---------------------------


### Naming configuration setup

if($ResourceGroupName -eq "")
{
    # generate resource group name if not provided
    $resourceGroup = "$($Project)rg$($Location)$($Environment)";
}
else
{
    # use resource group name if provided inthe script
    $resourceGroup = $ResourceGroupName;
}

# resources names
$synapseAnalytics = "QuickStartCDM";
$synapseAnalyticsAdminLogin = "quickstartcdmadmin";
$keyVault = "$($Project)kv$($Location)$($Environment)";
$dataLakeStore = "$($Project)adls$($Location)$($Environment)";
$dataFactory = "$($Project)adf$($Location)$($Environment)";
$storageAccount = "$($Project)sa$($Location)$($Environment)";
$sqlServer = "$($Project)sql$($Location)$($Environment)";
$fileSystemName = "powerbi"
###---------------------------


### Script Execution
Write-Host "### Start Script - DeployOrchestrator"
try
{
    ### Deploy Azure Resources
    .\ARM\Deploy-AzureResourceGroup.ps1 `
        -ResourceGroupLocation $ResourceGroupLocation `
        -ResourceGroupName $resourceGroup `
        -keyVaultName $keyVault `
        -blobStorageAccountName $storageAccount `
        -dataLakeStoreName $dataLakeStore `
        -sqlServerName $sqlServer `
        -sqlDataWarehouseName $synapseAnalytics `
        -dataFactoryName $dataFactory `
        -tags $Tags `
        -sqlServerAdminLogin $synapseAnalyticsAdminLogin `
        -sqlServerAdminPassword $synapseAnalyticsAdminPassword `
        -ErrorAction Stop;
    ###---------------------------


    ### Deploy Firewall rule on sql server
    $firewallRule = "OfficeAccess";
    try
    {
        $existingFirewallRule = Get-AzureRmSqlServerFirewallRule `
            -ResourceGroupName $resourceGroup `
            -ServerName $sqlServer | Where {$_.FirewallRuleName -eq $firewallRule};
    }
    catch
    {
    }

    if($null -ne $existingFirewallRule)
    {
        Write-Host "Removing existing Firewall Rule" -ForegroundColor Yellow;
        Remove-AzureRmSqlServerFirewallRule `
            -ResourceGroupName $resourceGroup `
            -ServerName $sqlServer `
            -FirewallRuleName $firewallRule 
    }

    Write-Host "Creating new Firewall Rule";

    New-AzureRmSqlServerFirewallRule `
        -ResourceGroupName $resourceGroup `
        -ServerName $sqlServer `
        -FirewallRuleName "OfficeAccess" `
        -StartIpAddress $OrganisationPublicIPAddress `
        -EndIpAddress $OrganisationPublicIPAddress;

    Write-Host "Created $($firewallRule) rule" -ForegroundColor Green;
    ###---------------------------


    ### Deploy Azure Data Factory Code
    .\DataFactoryCode\Deploy-AzureDataFactoryCode.ps1 `
        -ResourceGroupName $resourceGroup `
        -ResourceGroupLocation $ResourceGroupLocation `
        -dataFactoryName $dataFactory `
        -dataLakeStoreName $dataLakeStore `
        -blobStorageAccountName $storageAccount `
        -keyVaultName $keyVault `
        -ErrorAction Stop;
    ###---------------------------



    ### Assign SQL Server AAD Admin
    # Configure AAD Administrator
    .\Scripts\Set-SqlServerAADAdministrator.ps1 `
        -ResourceGroupName $resourceGroup `
        -SqlServerName $sqlServer `
        -SqlServerAdmin $AdminGroupName;

    ### Create Msi for Sql Server
    .\Scripts\Create-SqlServerMsi.ps1 `
        -ResourceGroupName $resourceGroup `
        -SqlServerName $sqlServer `
        -ErrorAction Stop;

    ###---------------------------



    ### Deploy Resource Group IAM Permissions
    # Create Configuration
    $resourceGroupIamJsonConfiguration = @(
        @{
            PrincipalName=$dataFactory;
            PrincipalType="ServicePrincipal";
            IamRole="SQL DB Contributor";
         },
        @{
            PrincipalName=$AdminGroupName;
            PrincipalType="Group";
            IamRole="Owner";
         },
        @{
            PrincipalName=$DeveloperGroupName;
            PrincipalType="Group";
            IamRole="Contributor";
         }
    );

    # Convert configuration to Json
    $resourceGroupIamJsonConfigurationJson = $resourceGroupIamJsonConfiguration | ConvertTo-Json -Compress;

    # Execute script to assign Resource Group IAM Permissions 
    .\Scripts\Set-ResourceGroupIamPermissions.ps1 `
        -ResourceGroupName $resourceGroup `
        -IamPermissionConfigurationJson $resourceGroupIamJsonConfigurationJson `
        -ErrorAction Stop;   
    ###---------------------------



    ### Deploy IAM Permissions
    # Create Configuration
    $iamJsonConfiguration = @(
        #ADF MSI
        @{
            ResourceName=$dataLakeStore;
            PrincipalName=$dataFactory;
            PrincipalType="ServicePrincipal";
            IamRole="Contributor";
         },
        @{
            ResourceName=$dataLakeStore;
            PrincipalName=$dataFactory;
            PrincipalType="ServicePrincipal";
            IamRole="Storage Blob Data Reader";
         },
        @{
            ResourceName=$storageAccount;
            PrincipalName=$dataFactory;
            PrincipalType="ServicePrincipal";
            IamRole="Contributor";
         },
        @{
            ResourceName=$storageAccount;
            PrincipalName=$dataFactory;
            PrincipalType="ServicePrincipal";
            IamRole="Storage Blob Data Reader";
         },
        @{
            ResourceName=$keyVault;
            PrincipalName=$dataFactory;
            PrincipalType="ServicePrincipal";
            IamRole="Contributor";
         },
         #ADMIN GROUP
        @{
            ResourceName=$dataFactory;
            PrincipalName=$AdminGroupName;
            PrincipalType="Group";
            IamRole="Owner";
         },
        @{
            ResourceName=$dataLakeStore;
            PrincipalName=$AdminGroupName;
            PrincipalType="Group";
            IamRole="Owner";
         },
        @{
            ResourceName=$dataLakeStore;
            PrincipalName=$AdminGroupName;
            PrincipalType="Group";
            IamRole="Storage Blob Data Owner";
         },
        @{
            ResourceName=$storageAccount;
            PrincipalName=$AdminGroupName;
            PrincipalType="Group";
            IamRole="Owner";
         },
        @{
            ResourceName=$storageAccount;
            PrincipalName=$AdminGroupName;
            PrincipalType="Group";
            IamRole="Storage Blob Data Owner";
         },
        @{
            ResourceName=$keyVault;
            PrincipalName=$AdminGroupName;
            PrincipalType="Group";
            IamRole="Owner";
         },
        @{
            ResourceName=$sqlServer;
            PrincipalName=$AdminGroupName;
            PrincipalType="Group";
            IamRole="Owner";
         },
         #DEVELOPER GROUP
        @{
            ResourceName=$dataFactory;
            PrincipalName=$AdminGroupName;
            PrincipalType="Group";
            IamRole="Contributor";
         },
        @{
            ResourceName=$dataLakeStore;
            PrincipalName=$AdminGroupName;
            PrincipalType="Group";
            IamRole="Contributor";
         },
        @{
            ResourceName=$dataLakeStore;
            PrincipalName=$AdminGroupName;
            PrincipalType="Group";
            IamRole="Storage Blob Data Contributor";
         },
        @{
            ResourceName=$storageAccount;
            PrincipalName=$AdminGroupName;
            PrincipalType="Group";
            IamRole="Contributor";
         },
        @{
            ResourceName=$storageAccount;
            PrincipalName=$AdminGroupName;
            PrincipalType="Group";
            IamRole="Storage Blob Data Contributor";
         },
        @{
            ResourceName=$keyVault;
            PrincipalName=$AdminGroupName;
            PrincipalType="Group";
            IamRole="Contributor";
         },
        @{
            ResourceName=$sqlServer;
            PrincipalName=$AdminGroupName;
            PrincipalType="Group";
            IamRole="Contributor";
         },
         #SQL SERVER MSI
        @{
            ResourceName=$dataLakeStore;
            PrincipalName=$sqlServer;
            PrincipalType="ServicePrincipal";
            IamRole="Storage Blob Data Contributor";
         }

    );
    # Convert configuration to Json
    $iamJsonConfigurationJson = $iamJsonConfiguration | ConvertTo-Json -Compress;

    # Execute script to assign 
    .\Scripts\Set-IamPermissions.ps1 `
        -ResourceGroupName $resourceGroup `
        -IamPermissionConfigurationJson $iamJsonConfigurationJson `
        -ErrorAction Stop;   
    ###---------------------------



    ### Adding Key Vault Policies
    $principalPermissions = @(
        @{
            PrincipalName=$dataFactory;
            PrincipalType="ServicePrincipal";
            PermisionsToSecrets= @("get","list");
            PermissionsToKeys=@("list")
         }
        @{
            PrincipalName=$DeveloperGroupName;
            PrincipalType="Group";
            PermisionsToSecrets=@("get","list","set");
            PermissionsToKeys=@("list");
         }
        @{
            PrincipalName=$AdminGroupName;
            PrincipalType="Group";
            PermisionsToSecrets=@("get","list","set","delete","recover","backup","restore");
            PermissionsToKeys=@("list");
         }
    );

    # Convert configuration to json
    $principalPermissionsJson = $principalPermissions | ConvertTo-Json -Compress;

    # Execute script to deploy keyVault Policy
    .\Scripts\Add-KeyVaultPolicy.ps1 `
        -ResourceGroup $resourceGroup `
        -KeyVaultName $keyVault `
        -PrincipalPermissionsJson $principalPermissionsJson `
        -ErrorAction Stop;
    ###---------------------------



    ### Deploy Key Vault Secrets
    # Defining KeyVault Secrets
    $synapseAnalyticsSqlConnectionString = "Server=tcp:$($sqlServer).database.windows.net,1433;Initial Catalog=$($synapseAnalytics);Persist Security Info=False;User ID=$($synapseAnalyticsAdminLogin);Password=$($synapseAnalyticsAdminPassword);MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;";  
    
    ### This Connection String can be used when MSI used for authentication
    #$synapseAnalyticsSqlConnectionString="Server=tcp:$($sqlServer).database.windows.net,1433;Database=$($synapseAnalytics);"; 
    
    $secretConfiguration = @(
        @{
            SecretName="SynapseAnalytics-ConnectionString";
            SecretValue=$synapseAnalyticsSqlConnectionString
         },
        @{
            SecretName="Subscription-Id";
            SecretValue=$SubscriptionId;
         },
        @{
            SecretName="ResourceGroup-Name";
            SecretValue=$resourceGroup;
         },
        @{
            SecretName="SqlServer-Name";
            SecretValue=$sqlServer;
         },
        @{
            SecretName="SynapseAnalytics-Name";
            SecretValue=$synapseAnalytics;
         },
        @{
            SecretName="SynapseAnalytics-AdminPassword";
            SecretValue=$synapseAnalyticsAdminPassword;
         },
        @{
            SecretName="SynapseAnalytics-AdminLogin";
            SecretValue=$synapseAnalyticsAdminLogin;
         },
        @{
            SecretName="SynapseAnalytics-DatabaseMasterKey";
            SecretValue=$synapseAnalyticsMasterKey;          
         }
    );

    # Defining KeyVault Secrets
    $secretConfigurationJson = $secretConfiguration | ConvertTo-Json -Compress;

    # Execute script to add KeyVault Secrets
    .\Scripts\Set-KeyVaultSecret.ps1 `
        -KeyVault $keyVault `
        -SecretConfiguration $secretConfigurationJson `
        -ErrorAction Stop;  
    ###---------------------------



    ### Deploy Azure Data Lake Store
    # Defining ADLS configuration
    $defaultPermissionConfiguration = @(
            @{
                Type="sp";
                Principal=$dataFactory;
                Access="rwx";
             },
            @{
                Type="default:sp";
                Principal=$dataFactory;
                Access="rwx"
             },
            @{
                Type="sp";
                Principal=$sqlServer;
                Access="r-x";
             },
            @{
                Type="default:sp";
                Principal=$sqlServer;
                Access="r-x"
             },
            @{
                Type="g";
                Principal=$DeveloperGroupName;
                Access="rwx"
             },
            @{
                Type="default:g";
                Principal=$DeveloperGroupName;
                Access="rwx"
             },
            @{
                Type="g"
                Principal=$AdminGroupName
                Access="rwx"
             },
            @{
                Type="default:g"
                Principal=$AdminGroupName
                Access="rwx"
             }
        );

    $adlsConfiguration = @(
        @{
            Folder="/"
            Permissions=@(
                @{
                    Type="sp";
                    Principal=$dataFactory;
                    Access="rwx"
                 },
                @{
                    Type="sp";
                    Principal=$sqlServer;
                    Access="r-x"
                 },
                @{
                    Type="g"
                    Principal=$DeveloperGroupName
                    Access="rwx"
                 },
                @{
                    Type="g";
                    Principal=$AdminGroupName;
                    Access="rwx"
                 }
            )
        },
       @{
            Folder="NonprofitAccelerator";
            Permissions=$defaultPermissionConfiguration
        },
       @{
            Folder="NonprofitAccelerator/Account";
            Permissions=$defaultPermissionConfiguration
        },
       @{
            Folder="NonprofitAccelerator/Campaign";
            Permissions=$defaultPermissionConfiguration
        },
       @{
            Folder="NonprofitAccelerator/msnfp_PaymentMethod";
            Permissions=$defaultPermissionConfiguration
        },
       @{
            Folder="NonprofitAccelerator/msnfp_PaymentSchedule";
            Permissions=$defaultPermissionConfiguration
        },
       @{
            Folder="NonprofitAccelerator/msnfp_Transaction";
            Permissions=$defaultPermissionConfiguration
        }
    );

    # Defining KeyVault Secrets
    $adlsConfigurationJson = $adlsConfiguration | ConvertTo-Json -Compress -Depth 10;

    # Execute Script to Assign Data Lake Store Permissions and folder configuration
    .\Scripts\Set-AzureDataLakeStorePermissions.ps1 `
        -ResourceGroupName $resourceGroup `
        -StorageAccountName $dataLakeStore `
        -FilesystemName $fileSystemName `
        -PermissionsConfigurationJson $adlsConfigurationJson `
        -ErrorAction Stop;
    ###---------------------------

    
    
    ### Deploy Azure Sql DataWarehouse Code
    $databaseProjectRoot = "$($solutionRoot)\Warehouse\Warehouse"
    $deploySynapsAnalyticsSqlConnectionString = "Server=tcp:$($sqlServer).database.windows.net,1433;Initial Catalog=$($synapseAnalytics);Persist Security Info=False;User ID=$($synapseAnalyticsAdminLogin);Password=$($synapseAnalyticsAdminPassword);MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;";  
    .\SqlServerCode\Execute-DeploySqlServerCode.ps1 `
        -ConnectionString $deploySynapsAnalyticsSqlConnectionString `
        -OutputScriptPath $databaseProjectRoot `
        -IsDeploymentMode $true `
        -DeploymentDirectories @( `
            "$($databaseProjectRoot)\Security\Master Key", `
            "$($databaseProjectRoot)\Security\Database Scoped Credential", `
            "$($databaseProjectRoot)\Security\Schema", `
            "$($databaseProjectRoot)\External Resources\External File Formats", `
            "$($databaseProjectRoot)\External Resources\External Data Sources", `
            "$($databaseProjectRoot)\External\Tables", `
            "$($databaseProjectRoot)\Control\Tables", `
            "$($databaseProjectRoot)\Control\Stored Procedures", `
            "$($databaseProjectRoot)\Audit", `
            "$($databaseProjectRoot)\Persisted\Tables", `
            "$($databaseProjectRoot)\Persisted\Stored Procedures", `
            "$($databaseProjectRoot)\Presentation\View" `
        ) `
        -CommandParameters @(
            @{SearchString="%MASTER_KEY%"; ReplaceValue=$synapseAnalyticsMasterKey},
            @{SearchString="%STORAGE_ROOT_URI%"; ReplaceValue="abfss://$($fileSystemName)@$($dataLakeStore).dfs.core.windows.net"}
        ) `
        -ErrorAction Stop; 
    ###---------------------------  



    ### Upload Data to blob storage
    .\Scripts\Upload-StorageAccountBlobFiles.ps1 `
        -ResourceGroupName $resourceGroup `
        -StorageAccountName $storageAccount `
        -StorageAccountContainerName "datasources" `
        -SearchDirectory "$($solutionRoot)\SampleSourceFiles" `
        -Filter "*.csv" `
        -ShouldLowercaseFolder "True" `
        -ErrorAction Stop;
    ###---------------------------



    ### Upload Data to ADLS
    .\Scripts\Upload-StorageAccountBlobFiles.ps1 `
        -ResourceGroupName $resourceGroup `
        -StorageAccountName $dataLakeStore `
        -StorageAccountContainerName "powerbi" `
        -SearchDirectory "$($solutionRoot)\SampleSourceFiles" `
        -Filter "model.json" `
        -ShouldLowercaseFolder "False" `
        -ErrorAction Stop;
    ###---------------------------
    

    Write-Host "### Script Executed Successfully - DeployOrchestrator." -ForegroundColor Green;
}
catch
{
    # Error handling
    Write-Host "### Script Executed with Errors - DeployOrchestrator" -ForegroundColor Red;
    throw;
}


