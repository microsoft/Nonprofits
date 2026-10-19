# Deploy Workload to Fabric - Comprehensive Guide

## Process

This guide provides step-by-step instructions for AI tools on how to deploy a Microsoft Fabric workload to production. The deployment process involves building a release package and publishing both the frontend application to Azure Static Web App and the workload manifest to Fabric.

### Deployment Architecture Overview

A Fabric workload deployment consists of two main components:

1. **Frontend Application**: React/TypeScript app hosted on Azure Static Web App
2. **Workload Manifest**: NuGet package registered with Microsoft Fabric

### Prerequisites for Production Deployment

#### Azure Requirements

- **Azure Subscription**: Active subscription with appropriate permissions
- **Resource Group**: Dedicated resource group for the workload
- **Azure Static Web Apps**: Service enabled in the subscription
- **Azure CLI**: Installed and authenticated (`az login`)

#### Fabric Requirements

- **Production Workload Name**: Registered organization name (not "Org")
- **Production Entra App**: Azure AD application configured for production
- **Fabric Workspace**: Production workspace for workload registration
- **Fabric Partner Program**: Enrollment if publishing to Fabric Hub

#### Development Prerequisites

- **Completed Development**: Workload tested and validated in development environment
- **Configuration Updated**: Production settings configured in manifest and environment files
- **Dependencies Installed**: All npm packages installed in Workload directory

## Step 1: Prepare Production Configuration

### 1.1: Update Workload Name for Production

Replace development organization "Org" with your registered organization name:

```powershell
# Example transformation:
# Development: Org.MyWorkloadSample
# Production:  ContosoInc.MyWorkloadSample

$ProductionWorkloadName = "YourOrganization.YourWorkloadName"
```

**Files requiring updates:**

- `config/Manifest/WorkloadManifest.xml`
- All `config/Manifest/*Item.xml` files
- `Workload/.env.prod`

### 1.2: Configure Production Entra Application

Create and configure a production Azure AD application:

```powershell
# Create new Entra App for production (if needed)
az ad app create --display-name "Your Workload Production App" --sign-in-audience "AzureADMyOrg"

# Note the Application ID for use in build process
$ProductionAADAppId = "your-production-app-id-here"
```

**Required Entra App Configuration:**

- **Redirect URIs**: Add your Azure Static Web App URL
- **API Permissions**: Fabric API permissions
- **Authentication**: Single-page application type
- **Certificates & Secrets**: If using client secrets

### 1.3: Prepare Production Environment Variables

Update `.env.prod` with production values:

```bash
# Production workload name
WORKLOAD_NAME=YourOrganization.YourWorkloadName

# Default item name
DEFAULT_ITEM_NAME=YourDefaultItem
```

## Step 2: Build Release Package

### 2.1: Run Build Release Script

Execute the build script with production parameters:

```powershell
# Navigate to project root
cd FabricWorkload

# Build release with production configuration
.\scripts\Build\BuildRelease.ps1 `
  -WorkloadName "YourOrganization.YourWorkloadName" `
  -AADFrontendAppId "your-production-aad-app-id" `
  -WorkloadVersion "1.0.0"
```

### 2.2: Build Process Overview

The `BuildRelease.ps1` script performs the following operations:

1. **Clean Release Directory**: Removes existing release folder and creates new one
2. **Process Manifest Templates**: Replaces placeholders with production values
3. **Build Manifest Package**: Creates NuGet package for Fabric registration
4. **Build Frontend Application**: Compiles React app for production
5. **Generate Release Artifacts**: Creates deployable packages

### 2.3: Verify Build Output

Check the `release/` directory for these artifacts:

```
release/
├── ManifestPackage.[version].nupkg  # Fabric workload manifest
└── app/                             # Frontend application files
    ├── index.html                   # Main HTML file
    ├── bundle.[hash].js             # Compiled JavaScript
    ├── bundle.[hash].js.map         # Source maps
    ├── assets/                      # Static assets
    └── web.config                   # IIS configuration
```

**Key Files:**

- **ManifestPackage.nupkg**: Contains workload definition and item configurations
- **app/**: Complete frontend application ready for web hosting
- **web.config**: Configured for proper routing and security headers

## Step 3: Deploy Frontend to Azure Static Web App

### 3.1: Create Azure Static Web App

#### Option A: Using Azure CLI

```powershell
# Create resource group (if needed)
az group create --name "rg-your-workload" --location "eastus"

# Create static web app
az staticwebapp create `
  --name "swa-your-workload" `
  --resource-group "rg-your-workload" `
  --location "eastus" `
  --source "./release/app" `
  --branch "main" `
  --app-location "/" `
  --output-location "/"
```

#### Option B: Using Azure Portal

1. Navigate to Azure Portal → Create Resource → Static Web Apps
2. **Basics**:
   - Subscription: Select your subscription
   - Resource Group: Create or select existing
   - Name: `swa-your-workload`
   - Plan Type: Free or Standard
   - Region: Choose appropriate region

3. **Deployment**:
   - Source: Other (for manual deployment)
   - Or connect to GitHub repository

### 3.2: Deploy Application Files

#### Manual Deployment via Azure CLI

```powershell
# Deploy the built application
az staticwebapp environment set `
  --name "swa-your-workload" `
  --resource-group "rg-your-workload" `
  --source "./release/app"
```

#### Deployment via GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure Static Web Apps

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: |
          cd Workload
          npm install

      - name: Build release
        run: |
          pwsh ./scripts/Build/BuildRelease.ps1 `
            -WorkloadName "${{ secrets.WORKLOAD_NAME }}" `
            -AADFrontendAppId "${{ secrets.AAD_FRONTEND_APP_ID }}" `
            -WorkloadVersion "1.0.0"

      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "/release/app"
          output_location: "/"
```

### 3.3: Configure Static Web App Settings

#### Add Configuration File

Create `staticwebapp.config.json` in the release/app directory:

```json
{
  "routes": [
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "responseOverrides": {
    "401": {
      "redirect": "/"
    },
    "403": {
      "redirect": "/"
    },
    "404": {
      "redirect": "/"
    }
  },
  "globalHeaders": {
    "content-security-policy": "frame-ancestors 'self' https://*.analysis.windows-int.net https://*.analysis-df.windows.net https://*.powerbi.com https://teams.microsoft.com https://*.fabric.microsoft.com"
  }
}
```

#### Environment Variables

Configure environment variables in Azure Static Web Apps:

```powershell
# Set environment variables via Azure CLI
az staticwebapp appsettings set `
  --name "swa-your-workload" `
  --resource-group "rg-your-workload" `
  --setting-names "WORKLOAD_NAME=YourOrganization.YourWorkloadName"
```

### 3.4: Update Workload Manifest with Production URL

Update the workload manifest to point to your Azure Static Web App:

```xml
<!-- In WorkloadManifest.xml -->
<ServiceEndpoint>
  <Name>Frontend</Name>
  <Url>https://your-static-web-app.azurestaticapps.net/</Url>
  <IsEndpointResolutionService>false</IsEndpointResolutionService>
</ServiceEndpoint>
```

Rebuild the manifest package:

```powershell
.\scripts\Build\BuildManifestPackage.ps1
```

## Step 4: Publish Workload Manifest to Fabric

### 4.1: Fabric Admin Portal Deployment

#### Access Fabric Admin Portal

1. Navigate to [Fabric Admin Portal](https://admin.fabric.microsoft.com)
2. Sign in with Fabric administrator credentials
3. Navigate to **Workload Management** section

#### Upload Manifest Package

1. **Upload Package**:
   - Click "Upload Workload Package"
   - Select `release/ManifestPackage.[version].nupkg`
   - Confirm upload

2. **Configure Workload**:
   - Workload Name: Verify correct production name
   - Display Name: Set user-friendly name
   - Description: Add workload description
   - Icon: Upload workload icon if needed

3. **Set Permissions**:
   - Workspace Access: Configure which workspaces can use the workload
   - User Permissions: Set user-level permissions
   - Tenant Settings: Configure tenant-wide settings

### 4.2: Programmatic Deployment (Advanced)

#### Using Fabric REST APIs

```powershell
# Get access token for Fabric APIs
$accessToken = az account get-access-token --scope https://analysis.windows.net/powerbi/api/.default --query accessToken -o tsv

# Upload manifest package (example - API may vary)
$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/octet-stream"
}

# Note: Actual API endpoints may differ based on Fabric's implementation
Invoke-RestMethod -Uri "https://api.fabric.microsoft.com/v1/workloads" `
  -Method POST `
  -Headers $headers `
  -InFile "release/ManifestPackage.1.0.0.nupkg"
```

### 4.3: Validate Workload Registration

After deployment, verify the workload is properly registered:

1. **Admin Portal Verification**:
   - Check workload appears in active workloads list
   - Verify status shows as "Active" or "Deployed"
   - Confirm endpoint URLs are correct

2. **End-User Testing**:
   - Access a Fabric workspace
   - Verify workload appears in the experience switcher
   - Test creating new items of your workload types
   - Confirm item editors load and function properly

## Step 5: Production Monitoring and Maintenance

### 5.1: Configure Monitoring

#### Azure Static Web Apps Monitoring

```powershell
# Enable Application Insights
az staticwebapp appsettings set `
  --name "swa-your-workload" `
  --resource-group "rg-your-workload" `
  --setting-names "APPINSIGHTS_INSTRUMENTATIONKEY=your-app-insights-key"
```

#### Fabric Workload Monitoring

- Monitor workload usage through Fabric Admin Portal
- Set up alerts for workload errors or performance issues
- Track user adoption and usage patterns

### 5.2: Update Process

#### Frontend Updates

1. Build new release with updated version
2. Deploy to Azure Static Web Apps
3. Test in production environment

#### Manifest Updates

1. Update manifest files with new version
2. Build new manifest package
3. Upload through Fabric Admin Portal
4. Coordinate with frontend deployment if needed

## Usage

### Quick Deployment Checklist for AI Tools

#### Pre-Deployment Verification

- [ ] Development workload tested and validated
- [ ] Production workload name registered and configured
- [ ] Production Entra application created and configured
- [ ] Azure subscription and resources ready
- [ ] All environment variables updated for production

#### Build Process

- [ ] Run `BuildRelease.ps1` with production parameters
- [ ] Verify release artifacts in `release/` directory
- [ ] Check manifest package contains correct workload name
- [ ] Validate frontend build completed without errors

#### Azure Static Web App Deployment

- [ ] Create Azure Static Web App resource
- [ ] Deploy frontend application files
- [ ] Configure routing and security headers
- [ ] Set environment variables in Azure
- [ ] Test application accessibility

#### Fabric Manifest Deployment

- [ ] Access Fabric Admin Portal
- [ ] Upload manifest package
- [ ] Configure workload settings and permissions
- [ ] Verify workload registration status
- [ ] Test workload functionality in Fabric workspace

#### Post-Deployment Validation

- [ ] Frontend application loads correctly
- [ ] Workload appears in Fabric experience switcher
- [ ] Item creation and editing functions properly
- [ ] Authentication flows work end-to-end
- [ ] No console errors or runtime issues

### Production Environment Commands

#### Build for Production

```powershell
# Complete production build
.\scripts\Build\BuildRelease.ps1 `
  -WorkloadName "YourOrg.YourWorkload" `
  -AADFrontendAppId "prod-app-id" `
  -WorkloadVersion "1.0.0"
```

#### Deploy to Azure Static Web Apps

```powershell
# Create and deploy in one command
az staticwebapp create `
  --name "swa-your-workload" `
  --resource-group "rg-workloads" `
  --location "eastus" `
  --source "./release/app"
```

#### Update Production Deployment

```powershell
# Redeploy after changes
az staticwebapp environment set `
  --name "swa-your-workload" `
  --resource-group "rg-workloads" `
  --source "./release/app"
```

### Troubleshooting Production Deployment

#### Issue: Build Fails with Missing Dependencies

**Symptoms**: BuildRelease.ps1 fails with npm errors
**Solutions**:

- Ensure `npm install` completed successfully in Workload directory
- Check Node.js version compatibility
- Clear npm cache: `npm cache clean --force`

#### Issue: Static Web App Shows 404 Errors

**Symptoms**: Application routes return 404 errors
**Solutions**:

- Verify `staticwebapp.config.json` routing configuration
- Check `web.config` rewrite rules are properly configured
- Ensure all required files are in the deployment package

#### Issue: Workload Not Appearing in Fabric

**Symptoms**: Workload not visible in Fabric workspace
**Solutions**:

- Verify manifest package uploaded successfully
- Check workload name matches between manifest and configuration
- Confirm workspace has permissions to access the workload
- Validate Entra application configuration

#### Issue: Authentication Failures

**Symptoms**: Users can't authenticate with the workload
**Solutions**:

- Verify production Entra application redirect URIs include Static Web App URL
- Check API permissions are granted and admin consented
- Confirm workload manifest references correct AAD application ID

#### Issue: CORS or CSP Errors

**Symptoms**: Browser security errors prevent workload loading
**Solutions**:

- Update Content Security Policy headers in `web.config`
- Add proper CORS configuration for Fabric domains
- Verify `staticwebapp.config.json` global headers

### CI/CD Integration Best Practices

#### GitHub Actions Workflow

- Use environment-specific secrets for production values
- Implement approval gates for production deployments
- Include automated testing before deployment
- Set up notification channels for deployment status

#### Azure DevOps Pipeline

- Configure service connections for Azure and Fabric
- Use variable groups for environment configuration
- Implement infrastructure as code for Azure resources
- Include security scanning in pipeline

This comprehensive deployment guide ensures successful production deployment of Microsoft Fabric workloads with proper configuration, monitoring, and maintenance procedures.
