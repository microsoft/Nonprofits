# Nonprofit Data Solutions - Installation Scripts

This directory contains PowerShell scripts to automate setup, update, and cleanup tasks for a Microsoft Fabric workspace.

## Prerequisites

1. Install [Python 3.x](https://www.python.org/downloads/) (required for some notebook and data operations)
2. Install [Microsoft Fabric CLI (fab)](https://github.com/microsoft/fabric-cli)
3. Run `fab auth login` to authenticate with your Fabric environment

## Main scripts

### Create-Workspace.ps1

Creates a new Fabric workspace with the specified name.

```powershell
.\Create-Workspace.ps1 -WorkspaceName "MyWorkspace"
```

### Install-IntoWorkspace.ps1

Deploys all workspace assets (lakehouses, notebooks, pipelines, triggers, reports, semantic models) into a Fabric workspace. Handles notebook parameterization and asset metadata setup. **Sample data is imported by default.**

**Full Installation with Sample Data (default):**
```powershell
.\Install-IntoWorkspace.ps1 -WorkspaceName "MyWorkspace" -Prefix "NDS_"
```

**Installation without Sample Data:**
```powershell
.\Install-IntoWorkspace.ps1 -WorkspaceName "MyWorkspace" -Prefix "NDS_" -SkipSampleData
```

**Skip Confirmation Prompts (for automated deployments):**
```powershell
.\Install-IntoWorkspace.ps1 -WorkspaceName "MyWorkspace" -Prefix "NDS_" -SkipConfirmation
```

#### Parameters:
- `-WorkspaceName`: The name of the Fabric workspace to deploy to
- `-Prefix`: Prefix to add to all created resources (e.g., "NDS_")
- `-SkipSampleData`: Skip importing sample data (sample data is imported by default)
- `-SkipConfirmation`: Skip confirmation prompts for automated installations

#### Data source options

The installation supports three data sources. The deployment detects an existing
connection automatically, or falls back to sample data.

- **Sample data** (default): Deploy with the included sample data for a quick start.
  The installation imports sample data automatically unless you pass `-SkipSampleData`.
- **Salesforce NPSP**: Connect your Salesforce Nonprofit Success Pack data before
  running the installation. Create a Salesforce connection in your workspace following the
  [data source management guidelines](https://learn.microsoft.com/fabric/data-factory/connector-salesforce-copy-activity).
  The installation detects and uses this connection automatically.
- **Dynamics 365 Sales Enterprise with Common Data Model for Nonprofits**: Link your
  Dataverse environment to your Fabric workspace. For setup guidance, see
  [Fabric Link for Dataverse](https://learn.microsoft.com/power-apps/maker/data-platform/fabric-link-to-data-platform).
  Ensure the Dataverse-to-Fabric link is configured and the lakehouse is synchronized,
  that all required tables have Change tracking enabled in Dynamics 365, and that you are
  using Common Data Model for Nonprofits version 3.1.3.4 or later. The installation detects
  and uses this connection automatically.

### Clean-Workspace.ps1

Removes all deployable assets from the specified Fabric workspace, including notebooks, lakehouses, pipelines, triggers, reports, and semantic models.

```powershell
.\Clean-Workspace.ps1 -WorkspaceName "MyWorkspace"
```

### Remove-Workspace.ps1

Removes the entire Fabric workspace and all its contents.

```powershell
.\Remove-Workspace.ps1 -WorkspaceName "MyWorkspace"
```

## Contributor helper scripts

### List-NdsWorkspaceItems.ps1

Lists all items of a given type (e.g., Notebook, Lakehouse, DataPipeline) in a workspace, excluding temporary items.

```powershell
.\List-NdsWorkspaceItems.ps1 -WorkspaceName "MyWorkspace" -ItemType "Notebook"
```

### Download-LakehouseData.ps1

Downloads all files from a specified Fabric Lakehouse path to a local directory. Mind the quotation marks, they are important...

```powershell
.\Download-LakehouseData.ps1 -FabricPath "MyWorkspace.Workspace/NDS_Silver.Lakehouse/Files/nds-silver-sampledata" -LocalPath "./Data/nds-silver-sampledata/"
```

### Export-Items.ps1

Export existing items from Fabric workspace to the local repository.
Add ` -Verbose` parameter for verbose logs.

Export all items:
```powershell
.\Export-Items.ps1 -WorkspaceName "MyWorkspace"
```

Export all items from specific workspace:
```powershell
.\Export-Items.ps1 -WorkspaceName "MyWorkspace"
```

Export a single item:
```powershell
.\Export-Items.ps1 -WorkspaceName "MyWorkspace" -ItemName "NDS_Config.Notebook"
```

Export raw workspace items without repository-specific renaming or dynamic variable processing:
```powershell
.\Export-RawItems.ps1 -WorkspaceName "MyWorkspace" -TargetDirectory "./Export"
```

Export raw items by prefix or a single item:
```powershell
.\Export-RawItems.ps1 -WorkspaceName "MyWorkspace" -ItemsPrefix "NDS_"
.\Export-RawItems.ps1 -WorkspaceName "MyWorkspace" -ItemName "NDS_Config.Notebook"
```
