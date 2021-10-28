    <#
	
	# Copyright (c) Microsoft Corporation.
# Licensed under the MIT License.
	
    .SYNOPSIS
        Deploy Sql Server Code

    .DESCRIPTION
        Connects to SqlDataWarehouse and deploy SQL Server code

    .PARAMETER ConnectionString
        Connection string to SQL Server where code should be deployed

    .PARAMETER DeploymentDirectories
        Defines deployment oreder for directories in the Visual Studio Database Project. All scripts in each folder that are *.sql will be deployed. To exclude file - change its extension to non sql
        e.g.
        $DeploymentDirectories = @( `
            "$($databaseProjectRoot)\Security\Master Key", `
            "$($databaseProjectRoot)\Security\Database Scoped Credential", `
            "$($databaseProjectRoot)\Security\Schema", `
            "$($databaseProjectRoot)\External Resources\External File Formats", `
            "$($databaseProjectRoot)\External Resources\External Data Sources", `
            "$($databaseProjectRoot)\External\Tables", `
            "$($databaseProjectRoot)\Audit", `
            "$($databaseProjectRoot)\Control\Tables", `
            "$($databaseProjectRoot)\Control\Stored Procedures", `
            "$($databaseProjectRoot)\Persisted\Tables", `
            "$($databaseProjectRoot)\Persisted\Stored Procedures", `
            "$($databaseProjectRoot)\Presentation\View" `
        ),
    
    .PARAMETER CommandParameters
        Defines commang parameters and values to be replaced in sql files. Must be unique accross all files

        SearchString -defines name of the variable in file
        ReplaceValue - defines value to be replaced

        e.g.
        $CommandParameters = @(
            @{SearchString="%MASTER_KEY%"; ReplaceValue="b34mi8v87&^£kjhdsab"},
            @{SearchString="%STORAGE_ROOT_URI%"; ReplaceValue="abfss://datahub@ppsmstsidhadlsweudev.dfs.core.windows.net"}
        )
  
    .PARAMETER OutputScriptPath
        Directory path for sql summary file - all sql concatinated together. This is usefull during deubging with IsDeploymentMode = False;
        e.g. C:/temp/
    
    .PARAMETER IsDeploymentMode
        Boolean flage True/False that determins if during the execution deploy queries to the server. 
        True -deploy to the server
        False - do not deploy to the server (we can use manual execution of the script to the server)

    .OUTPUTS
       No objects are outputed

    .EXAMPLE

        #define variables
        $databaseProjectRoot = "$($solutionRoot)\Warehouse\Warehouse"
        $synapsAnalyticsSqlConnectionString = "Server=tcp:$($sqlServer).database.windows.net,1433;Initial Catalog=$($synapsAnalytics);Persist Security Info=False;User ID=$($synapsAnalyticsAdminLogin);Password=$($synapsAnalyticsAdminPassword);MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;";  
    
        #Execution
            .\SqlServerCode\Execute-DeploySqlServerCode.ps1 `
                -ConnectionString $synapsAnalyticsSqlConnectionString `
                -OutputScriptPath $databaseProjectRoot `
                -IsDeploymentMode $true `
                -DeploymentDirectories @( `
                    "$($databaseProjectRoot)\Security\Master Key", `
                    "$($databaseProjectRoot)\Security\Database Scoped Credential", `
                    "$($databaseProjectRoot)\Security\Schema", `
                    "$($databaseProjectRoot)\External Resources\External File Formats", `
                    "$($databaseProjectRoot)\External Resources\External Data Sources", `
                    "$($databaseProjectRoot)\External\Tables", `
                    "$($databaseProjectRoot)\Audit", `
                    "$($databaseProjectRoot)\Control\Tables", `
                    "$($databaseProjectRoot)\Control\Stored Procedures", `
                    "$($databaseProjectRoot)\Persisted\Tables", `
                    "$($databaseProjectRoot)\Persisted\Stored Procedures", `
                    "$($databaseProjectRoot)\Presentation\View" `
                ) `
                -CommandParameters @(
                    @{SearchString="%MASTER_KEY%"; ReplaceValue=$synapsAnalyticsMasterKey},
                    @{SearchString="%STORAGE_ROOT_URI%"; ReplaceValue="abfss://datahub@$($dataLakeStore).dfs.core.windows.net"}
                ) `
                -ErrorAction Stop;

    .NOTES
        -Script requires AzureRM Modules installed on the machine where script is executed (requires administrator rights)
        -Script requires Owner of the subscription/resource group to log in e.g. Login-AzureRmAccount -SubscriptionId '{subscriptionId}' - this need to be executed only once.
        -Check parameter details for instructions
        
    #>

param(
    [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $ConnectionString = "Server=tcp:ppsmstsidhsqlweudev.database.windows.net,1433;Initial Catalog=DataHub;Persist Security Info=False;User ID=datahubadmin;Password=L1/`\N[E<8tR+Gg-)@sQU7fd>c;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;",

    #[Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string[]] $DeploymentDirectories = @( `
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
        ),

   # [Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [object[]] $CommandParameters = @(
            @{SearchString="%MASTER_KEY%"; ReplaceValue="b34mi8v87&^£kjhdsab"},
            @{SearchString="%STORAGE_ROOT_URI%"; ReplaceValue="abfss://datahub@ppsmstsidhadlsweudev.dfs.core.windows.net"}
    ),

    #[Parameter(Mandatory=$false)]
    [ValidateNotNullOrEmpty()]
    [string] $OutputScriptPath = "c:\temp",

    #[Parameter(Mandatory=$true)]
    [ValidateNotNullOrEmpty()]
    [string] $IsDeploymentMode = "False"
)


### Clear Screen
# cls;

### Login
# Login-AzureRmAccount -SubscriptionId $subscriptionId

Write-Host "### Script Started - Execute-DeployeSqlServerCode";

try
{
    # create date for deployment code
    $now = Get-Date -Format "yyyyMMdd_hhmmssfff";

    # If deployment mode on create connection to database
    if($IsDeploymentMode -eq $true)
    {
        $SqlClient = New-Object System.Data.SqlClient.SqlConnection;
        $SqlClient.ConnectionString = $ConnectionString;
        $SqlClient.Open();
    }

    # Iterate over folder
    Foreach($directory in $DeploymentDirectories)
    {
        Write-Host "DirectoryPath: $($directory)";

        # Fix folders with white spaces
        $directory = $directory -replace " ", "` ";

        # Check if folder exists
        $directoryExists = Test-Path $directory;
        if($directoryExists)
        {
            # Obtain folder child and grand child sql script files
            $sqlScripts = Get-ChildItem -Path $directory -Filter *.sql -Recurse -File;

            $sqlScriptContent = "";
            
            # Iterate over sql scripts files
            foreach ($sqlScript in $sqlScripts)
            {
                Write-Host "Deploying $($sqlScript.FullName)";
                $tempContent = "";

                # Obtain file conent
                $tempContent = Get-Content -Path $sqlScript.FullName -Raw;

                # Replace command line 
                foreach($commandParameter in $CommandParameters)
                {
                   # Replace command parameter with replacement value
                    $tempContent = $tempContent -replace $commandParameter.SearchString, $commandParameter.ReplaceValue;
                }
                
                # if path provided output current script to deployment summary file
                if($null -ne $OutputScriptPath)
                {
                    $appendContent = "/*** $($sqlScript.FullName) ***/`r`n`r`n"  + $tempContent + "`r`n`r`n/***------------------------------------------------ ***/`r`n`r`n`r`n";
                    $appendContent | Out-File "$($OutputScriptPath)\Deployment_$($now).txt" -Append;
                }
                #$sqlScriptContent = $sqlScriptContent + $tempContent;

                if($IsDeploymentMode -eq $true)
                {
                    # Create a command to retrieve our errors
                    $SqlCommand = New-Object System.Data.SqlClient.SqlCommand;
                    $SqlCommand.Connection = $SqlClient;
                    $SqlCommand.CommandType = [System.Data.CommandType]::Text;
                    $SqlCommand.CommandText = $tempContent;
            

                    # Execute command     
                    $result = $SqlCommand.ExecuteNonQuery();

                    if ($result -ne -1)
                    {
                        throw "SqlExecuted with errors.";
                    }
                }
            }


            Write-Host "# Deployed $($directory) folder." -ForegroundColor Green;
        }
        else
        {
            Write-Host "# Folder does not exists - Check configuration" -ForegroundColor yellow;
        }
        Write-Host "# ---------------------------------------------------------------------------";
    }

    # Check if script runs in deployment mode
    if($IsDeploymentMode -eq $true)
    {
        # Close our SQL connection
        Write-Output ("Closing connection.");
        $SqlClient.Close() | Out-Null;
    }

    Write-Host "### Script Executed Successfully" -ForegroundColor Green;
}
catch
{
    Write-Host "### Script Failed." -ForegroundColor Red;
    throw;
}