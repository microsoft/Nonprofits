param (
    # The name of the Azure Web App to create
    [Parameter(Mandatory = $true)]
    [string]$WebAppName,
    
    # The name of the resource group (will be created if it doesn't exist)
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName,
    
    # The Azure region/location for the resources
    [string]$Location = "Australia East",
    
    # The App Service Plan name (will be created if it doesn't exist)
    [string]$AppServicePlanName = "$WebAppName-plan",
    
    # The App Service Plan pricing tier
    [ValidateSet("F1", "B1", "B2", "B3", "S1", "S2", "S3", "P1", "P2", "P3")]
    [string]$PricingTier = "B1",
    
    # Force flag to overwrite existing resources without prompting
    [boolean]$Force = $false,

    # Enable Application Insights
    [boolean]$EnableAppInsights = $true,
    
    # Custom domain name (optional)
    [string]$CustomDomain
)

<#
.SYNOPSIS
    Creates and configures an Azure Web App for hosting a Microsoft Fabric Workload.

.DESCRIPTION
    This script creates an Azure Web App with the necessary configuration for hosting
    a Microsoft Fabric Workload frontend application. It includes:
    - Resource Group creation
    - App Service Plan creation
    - Web App creation with proper configuration
    - Application settings configuration for Fabric integration
    - Optional Application Insights setup
    - Optional custom domain configuration

.PARAMETER WebAppName
    The name of the Azure Web App to create. Must be globally unique.

.PARAMETER ResourceGroupName
    The name of the resource group to create or use.

.PARAMETER Location
    The Azure region where resources will be created. Default is "East US".

.PARAMETER AppServicePlanName
    The name of the App Service Plan to create. Default is "{WebAppName}-plan".

.PARAMETER PricingTier
    The pricing tier for the App Service Plan. Default is "B1".

.PARAMETER Force
    Skip confirmation prompts and overwrite existing resources.

.PARAMETER EnableAppInsights
    Enable Application Insights for monitoring. Default is true.

.PARAMETER CustomDomain
    Optional custom domain name to configure.

.EXAMPLE
    .\SetupAzureWebApp.ps1 -WebAppName "my-fabric-workload" -ResourceGroupName "fabric-workload-rg"

.EXAMPLE
    .\SetupAzureWebApp.ps1 -WebAppName "my-fabric-workload" -ResourceGroupName "fabric-workload-rg" -Location "West US 2" -PricingTier "S1"

.NOTES
    Requires Azure CLI to be installed and authenticated.
    The user must have appropriate permissions to create resources in the Azure subscription.
#>

# Function to print formatted information
function Write-Info {
    param (
        [string]$Message,
        [string]$Color = "Green"
    )
    Write-Host $Message -ForegroundColor $Color
}

# Function to print formatted warnings
function Write-Warning-Custom {
    param (
        [string]$Message
    )
    Write-Host $Message -ForegroundColor Yellow
}

# Function to print formatted errors
function Write-Error-Custom {
    param (
        [string]$Message
    )
    Write-Host $Message -ForegroundColor Red
}

# Function to check if Azure CLI is installed and user is logged in
function Test-AzureCLI {
    try {
        $null = az --version
        Write-Info "Azure CLI is installed."
    }
    catch {
        Write-Error-Custom "Azure CLI is not installed. Please install Azure CLI first."
        Write-Info "Download from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    }

    try {
        $account = az account show 2>$null | ConvertFrom-Json
        if ($null -eq $account) {
            Write-Warning-Custom "Not logged in to Azure CLI. Attempting to login..."
            az login
        }
        else {
            Write-Info "Logged in to Azure as: $($account.user.name)"
            Write-Info "Subscription: $($account.name) ($($account.id))"
        }
    }
    catch {
        Write-Error-Custom "Failed to authenticate with Azure CLI."
        exit 1
    }
}

# Function to create or verify resource group
function New-ResourceGroup {
    param (
        [string]$Name,
        [string]$Location
    )
    
    Write-Info "Checking if resource group '$Name' exists..."
    $rg = az group show --name $Name 2>$null | ConvertFrom-Json
    
    if ($null -eq $rg) {
        Write-Info "Creating resource group '$Name' in '$Location'..."
        az group create --name $Name --location $Location
        if ($LASTEXITCODE -ne 0) {
            Write-Error-Custom "Failed to create resource group."
            exit 1
        }
    }
    else {
        Write-Info "Resource group '$Name' already exists."
    }
}

# Function to create App Service Plan
function New-AppServicePlan {
    param (
        [string]$Name,
        [string]$ResourceGroup,
        [string]$Location,
        [string]$Sku
    )
    
    Write-Info "Checking if App Service Plan '$Name' exists..."
    $plan = az appservice plan show --name $Name --resource-group $ResourceGroup 2>$null | ConvertFrom-Json
    
    if ($null -eq $plan) {
        Write-Info "Creating App Service Plan '$Name' with SKU '$Sku'..."
        az appservice plan create --name $Name --resource-group $ResourceGroup --location $Location --sku $Sku
        if ($LASTEXITCODE -ne 0) {
            Write-Error-Custom "Failed to create App Service Plan."
            exit 1
        }
    }
    else {
        Write-Info "App Service Plan '$Name' already exists."
    }
}

# Function to create Web App
function New-WebApp {
    param (
        [string]$Name,
        [string]$ResourceGroup,
        [string]$PlanName
    )
    
    Write-Info "Checking if Web App '$Name' exists..."
    $webapp = az webapp show --name $Name --resource-group $ResourceGroup 2>$null | ConvertFrom-Json
    
    if ($null -eq $webapp) {
        Write-Info "Creating Web App '$Name'..."
        az webapp create --name $Name --resource-group $ResourceGroup --plan $PlanName --runtime 'NODE:20lts'
        if ($LASTEXITCODE -ne 0) {
            Write-Error-Custom "Failed to create Web App."
            exit 1
        }
    }
    else {
        if (-not $Force) {
            $confirmation = Read-Host "Web App '$Name' already exists. Do you want to continue with configuration? (y/n)"
            if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
                Write-Info "Operation cancelled."
                exit 0
            }
        }
        Write-Info "Web App '$Name' already exists. Continuing with configuration..."
    }
}

# Function to configure Web App settings
function Set-WebAppConfiguration {
    param (
        [string]$WebAppName,
        [string]$ResourceGroup
    )
    
    Write-Info "Configuring Web App settings..."
    
    # Set application settings
    $settings = @(
        "NODE_ENV=production"
        "WEBSITE_NODE_DEFAULT_VERSION=~18"
        "SCM_DO_BUILD_DURING_DEPLOYMENT=true"
    )
    
    
    # Convert settings array to space-separated string
    $settingsString = ($settings -join " ")
    
    az webapp config appsettings set --name $WebAppName --resource-group $ResourceGroup --settings $settingsString
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Custom "Failed to configure Web App settings."
        exit 1
    }
    
    # Configure general settings
    Write-Info "Configuring Web App general settings..."
    az webapp config set --name $WebAppName --resource-group $ResourceGroup --always-on true --http20-enabled true
    if ($LASTEXITCODE -ne 0) {
        Write-Warning-Custom "Failed to configure some Web App general settings, but continuing..."
    }
}

# Function to enable Application Insights
function Enable-ApplicationInsights {
    param (
        [string]$WebAppName,
        [string]$ResourceGroup,
        [string]$Location
    )
    
    Write-Info "Enabling Application Insights..."
    
    # Create Application Insights resource
    $appInsightsName = "$WebAppName-insights"
    az monitor app-insights component create --app $appInsightsName --location $Location --resource-group $ResourceGroup --kind web
    if ($LASTEXITCODE -ne 0) {
        Write-Warning-Custom "Failed to create Application Insights resource, but continuing..."
        return
    }
    
    # Get Application Insights instrumentation key
    $instrumentationKey = az monitor app-insights component show --app $appInsightsName --resource-group $ResourceGroup --query "instrumentationKey" --output tsv
    
    if (-not [string]::IsNullOrWhiteSpace($instrumentationKey)) {
        # Configure Web App to use Application Insights
        az webapp config appsettings set --name $WebAppName --resource-group $ResourceGroup --settings "APPINSIGHTS_INSTRUMENTATIONKEY=$instrumentationKey"
        Write-Info "Application Insights configured successfully."
    }
}

# Function to configure custom domain
function Set-CustomDomain {
    param (
        [string]$WebAppName,
        [string]$ResourceGroup,
        [string]$DomainName
    )
    
    Write-Info "Configuring custom domain '$DomainName'..."
    Write-Warning-Custom "Custom domain configuration requires DNS verification."
    Write-Info "Please ensure you have access to configure DNS records for '$DomainName'."
    
    # Add custom domain
    az webapp config hostname add --webapp-name $WebAppName --resource-group $ResourceGroup --hostname $DomainName
    if ($LASTEXITCODE -eq 0) {
        Write-Info "Custom domain added. Please configure DNS as instructed by Azure."
    }
    else {
        Write-Warning-Custom "Failed to add custom domain. You can configure this manually in the Azure portal."
    }
}

# Main execution
Write-Info "=== Azure Web App Setup for Microsoft Fabric Workload ===" "Cyan"
Write-Info ""

# Validate parameters
if ([string]::IsNullOrWhiteSpace($WebAppName)) {
    Write-Error-Custom "WebAppName parameter is required."
    exit 1
}

if ([string]::IsNullOrWhiteSpace($ResourceGroupName)) {
    Write-Error-Custom "ResourceGroupName parameter is required."
    exit 1
}

# Check prerequisites
Write-Info "Checking prerequisites..."
Test-AzureCLI

# Display configuration
Write-Info "Configuration:" "Yellow"
Write-Info "  Web App Name: $WebAppName"
Write-Info "  Resource Group: $ResourceGroupName"
Write-Info "  Location: $Location"
Write-Info "  App Service Plan: $AppServicePlanName"
Write-Info "  Pricing Tier: $PricingTier"
Write-Info ""

# Confirm execution unless Force is specified
if (-not $Force) {
    $confirmation = Read-Host "Do you want to proceed with the above configuration? (y/n)"
    if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
        Write-Info "Operation cancelled."
        exit 0
    }
}

try {
    # Create resources
    New-ResourceGroup -Name $ResourceGroupName -Location $Location
    New-AppServicePlan -Name $AppServicePlanName -ResourceGroup $ResourceGroupName -Location $Location -Sku $PricingTier
    New-WebApp -Name $WebAppName -ResourceGroup $ResourceGroupName -PlanName $AppServicePlanName
    
    # Configure Web App
    Set-WebAppConfiguration -WebAppName $WebAppName -ResourceGroup $ResourceGroupName
    
    # Enable Application Insights if requested
    if ($EnableAppInsights) {
        Enable-ApplicationInsights -WebAppName $WebAppName -ResourceGroup $ResourceGroupName -Location $Location
    }
    
    # Configure custom domain if specified
    if (-not [string]::IsNullOrWhiteSpace($CustomDomain)) {
        Set-CustomDomain -WebAppName $WebAppName -ResourceGroup $ResourceGroupName -DomainName $CustomDomain
    }
    
    # Output final information
    Write-Info ""
    Write-Info "=== Setup Complete ===" "Green"
    Write-Info "Web App URL: https://$WebAppName.azurewebsites.net" "Green"
    Write-Info "Resource Group: $ResourceGroupName" "Green"
    
    if ($EnableAppInsights) {
        Write-Info "Application Insights: $WebAppName-insights" "Green"
    }
    
    Write-Info ""
    Write-Info "Next steps:" "Yellow"
    Write-Info "1. Verify the Web App is running at https://$WebAppName.azurewebsites.net"
    Write-Info "2. Configure your DNS if using a custom domain"
    Write-Info "3. Deploy the workload using the ..\Deploy\DeployToAzureWebApp.ps1"

}
catch {
    Write-Error-Custom "An error occurred during setup: $($_.Exception.Message)"
    exit 1
}
