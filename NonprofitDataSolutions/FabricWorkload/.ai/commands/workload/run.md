# Run Workload - Step-by-Step Guide

## Process

This guide provides comprehensive instructions for AI tools on how to start and run a Microsoft Fabric workload using the scripts available in the `scripts/Run/` directory. The workload consists of two main components that work together: the Development Gateway and the Development Server.

### Prerequisites Check

Before starting the workload, ensure the following prerequisites are met:

1. **Project Setup Complete**: The workload must be properly configured using the setup scripts
2. **Dependencies Installed**: Node.js dependencies must be installed in the `Workload/` directory
3. **Azure Login**: User must be authenticated with Azure CLI for Fabric API access
4. **Development Workspace**: A valid Fabric workspace must be configured for development

### Architecture Overview

The workload runs using two components:

- **Development Gateway** (`DevGateway`): Bridges between Fabric and your workload, handles authentication
- **Development Server** (`DevServer`): Hosts the frontend React application and serves the workload UI

### Step 1: Prepare the Environment

#### 1.1: Navigate to the Workload Root

```powershell
# From the NonprofitDataSolutionsOS folder
cd FabricWorkload
```

#### 1.2: Install Dependencies (if not already done)

```powershell
cd Workload
npm install
cd ..
```

#### 1.3: Verify Configuration

Check that the development configuration file exists and is properly configured:

```powershell
# Verify DevGateway configuration exists
Test-Path "config\DevGateway\workload-dev-mode.json"

# Check workspace configuration
Get-Content "config\DevGateway\workload-dev-mode.json"
```

**Expected Configuration Structure:**

```json
{
  "WorkspaceGuid": "your-workspace-id-here",
  "ManifestPackageFilePath": "path-to-manifest-package.nupkg",
  "WorkloadEndpointURL": "http://127.0.0.1:5000/workload"
}
```

### Step 2: Start the Development Gateway

The Development Gateway must be started first as it handles the connection to Fabric.

#### 2.1: Run the StartDevGateway Script

```powershell
.\scripts\Run\StartDevGateway.ps1
```

**What this script does:**

1. **Builds Manifest Package**: Automatically runs `BuildManifestPackage.ps1` to ensure the latest configuration
2. **Authenticates with Azure**: Handles Azure login for Fabric API access
3. **Starts DevGateway**: Launches the Development Gateway process
4. **Registers Workload**: Registers your workload with the development workspace

#### 2.2: Authentication Process

**Interactive Login (Default):**

- The script will open a browser window for Azure authentication
- Sign in with your Fabric-enabled Azure account
- Grant necessary permissions for workload development

**Non-Interactive Login (Codespaces/CI):**
If running in GitHub Codespaces or automated environments:

- The script will prompt for your Fabric tenant ID
- Use device code authentication when browser login isn't available

#### 2.3: Verify Gateway Started Successfully

Look for these indicators in the console output:

- ✅ "Manifest package built successfully"
- ✅ "Authentication completed"
- ✅ "DevGateway started on port [port]"
- ✅ "Workload registered with workspace [workspace-id]"

**Common Port**: The DevGateway typically runs on port `60006` (configurable)

### Step 3: Start the Development Server

Once the Development Gateway is running, start the frontend development server.

#### 3.1: Open a New Terminal/PowerShell Window

Keep the DevGateway terminal open and start a new session for the DevServer.

#### 3.2: Run the StartDevServer Script

```powershell
# Navigate to project root in new terminal
cd FabricWorkload

# Start the development server
.\scripts\Run\StartDevServer.ps1
```

**What this script does:**

1. **Changes to DevServer Directory**: Navigates to `Workload/devServer`
2. **Detects Environment**: Automatically handles Codespaces vs. local development
3. **Starts Webpack Dev Server**: Launches the React development server with hot reload
4. **Opens Browser**: Automatically opens the workload in your default browser

#### 3.3: Environment-Specific Behavior

**Local Development:**

- Uses `npm start` command
- Full memory allocation for optimal performance
- Hot module replacement enabled

**GitHub Codespaces:**

- Uses `npm run start:codespace` command
- Reduced memory allocation to prevent OOM errors
- Hot reload disabled for stability

#### 3.4: Verify Development Server Started

Look for these indicators:

- ✅ "webpack compiled successfully"
- ✅ "DevServer started on http://localhost:[port]"
- ✅ Browser opens automatically to the workload interface
- ✅ No compilation errors in the terminal

**Default Port**: The DevServer typically runs on port `5000` or `3000`

### Step 4: Access and Test the Workload

#### 4.1: Browser Access

The workload should automatically open in your browser. If not, navigate to:

```
http://localhost:[dev-server-port]
```

#### 4.2: Fabric Integration Access

Access your workload through the Fabric portal:

1. Navigate to your Fabric workspace
2. Look for your workload in the experience switcher
3. Create new items using your custom workload types

#### 4.3: Test Basic Functionality

1. **Create New Item**: Test creating items from your workload
2. **Editor Loading**: Verify item editors load correctly
3. **Save/Load**: Test saving and loading item data
4. **Navigation**: Check routing between different views

### Step 5: Monitor and Debug

#### 5.1: Monitor Both Terminals

Keep both terminal windows visible to monitor:

**DevGateway Terminal:**

- Fabric API communication
- Authentication status
- Workload registration events
- Error messages from Fabric integration

**DevServer Terminal:**

- Webpack compilation status
- Hot reload events
- JavaScript errors and warnings
- Network requests from the frontend

#### 5.2: Common Success Indicators

- Both services show "running" status
- No error messages in either terminal
- Browser loads workload interface without errors
- Items can be created and edited successfully

#### 5.3: Log Locations

- **DevGateway Logs**: Console output in DevGateway terminal
- **DevServer Logs**: Console output in DevServer terminal
- **Browser Logs**: Browser Developer Tools Console
- **Network Activity**: Browser Developer Tools Network tab

### Alternative: Combined Startup Using npm Scripts

For simplified development, you can also use the npm scripts directly from the Workload directory:

#### Option A: Start Both Services Separately

```powershell
# Terminal 1: Start DevGateway
cd Workload
npm run start:devGateway

# Terminal 2: Start DevServer
cd Workload
npm run start:devServer
```

#### Option B: Start DevServer Only (if DevGateway already running)

```powershell
cd Workload
npm start
```

## Usage

### Quick Start Checklist for AI Tools

When starting a workload, follow this checklist:

**Prerequisites:**

- [ ] Project setup completed (`scripts/Setup/Setup.ps1` has been run)
- [ ] Node.js dependencies installed (`npm install` in Workload directory)
- [ ] Azure CLI installed and available
- [ ] Development workspace configured in `config/DevGateway/workload-dev-mode.json`

**Startup Sequence:**

- [ ] Open first terminal/PowerShell window
- [ ] Run `.\scripts\Run\StartDevGateway.ps1`
- [ ] Wait for successful authentication and gateway startup
- [ ] Open second terminal/PowerShell window
- [ ] Run `.\scripts\Run\StartDevServer.ps1`
- [ ] Verify both services are running without errors
- [ ] Test workload functionality in browser

**Verification Steps:**

- [ ] DevGateway shows "started successfully" message
- [ ] DevServer shows "webpack compiled successfully"
- [ ] Browser opens workload interface automatically
- [ ] No errors in either terminal window
- [ ] Workload appears in Fabric workspace

### Environment-Specific Commands

#### Local Development Environment

```powershell
# Start DevGateway with interactive login
.\scripts\Run\StartDevGateway.ps1

# Start DevServer with full performance
.\scripts\Run\StartDevServer.ps1
```

#### GitHub Codespaces Environment

```powershell
# Start DevGateway with device code auth
.\scripts\Run\StartDevGateway.ps1 -InteractiveLogin $false

# DevServer will automatically use codespace configuration
.\scripts\Run\StartDevServer.ps1
```

#### Automated/CI Environment

```powershell
# Non-interactive DevGateway startup
.\scripts\Run\StartDevGateway.ps1 -InteractiveLogin $false
```

### Troubleshooting Common Issues

#### Issue: DevGateway Authentication Fails

**Symptoms:** Authentication errors, unable to connect to Fabric
**Solutions:**

- Ensure you're logged into Azure CLI: `az login`
- Check your account has Fabric permissions
- Verify tenant ID is correct for Fabric workspace

#### Issue: DevServer Port Conflicts

**Symptoms:** "Port already in use" errors
**Solutions:**

- Kill existing Node.js processes: `taskkill /f /im node.exe` (Windows)
- Change port in webpack configuration
- Use different port: `npm start -- --port 3001`

#### Issue: Manifest Package Not Found

**Symptoms:** DevGateway can't find manifest package
**Solutions:**

- Run `.\scripts\Build\BuildManifestPackage.ps1` manually
- Check `config/DevGateway/workload-dev-mode.json` path is correct
- Verify manifest files exist in `config/Manifest/`

#### Issue: Workload Not Appearing in Fabric

**Symptoms:** Workload not visible in Fabric workspace
**Solutions:**

- Verify workspace ID in configuration matches your Fabric workspace
- Check DevGateway is running and registered successfully
- Refresh Fabric workspace in browser
- Verify workload manifest is correctly configured

#### Issue: Hot Reload Not Working

**Symptoms:** Changes not reflected in browser automatically
**Solutions:**

- Restart DevServer if hot reload stops working
- Clear browser cache and refresh
- Check for TypeScript/JavaScript errors that block compilation

### Development Workflow Tips

1. **Keep Both Terminals Open**: Monitor both DevGateway and DevServer outputs
2. **DevGateway First**: Always start DevGateway before DevServer
3. **Check Authentication**: Ensure Azure authentication is valid throughout development
4. **Monitor Compilation**: Watch for webpack compilation errors in DevServer terminal
5. **Test Incrementally**: Test changes frequently to catch issues early
6. **Use Browser DevTools**: Monitor console and network tabs for runtime issues

This comprehensive startup process ensures your Microsoft Fabric workload runs correctly with all necessary services properly configured and connected.
