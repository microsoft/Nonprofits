# Package Installer Item

A comprehensive solution for deploying and managing packages of Fabric items across workspaces.

## Overview

The Package Installer Item provides a unified interface for package selection, deployment configuration, and deployment monitoring. It supports multiple deployment strategies and flexible content handling for both text and binary files.

## Key Features

- **Multi-Strategy Deployment**: UX, Spark Livy, and Spark Notebook deployment options
- **Flexible Package Definition**: Support for Asset, Link, and Inline Base64 payload types
- **Workspace Management**: Create new workspaces or deploy to existing ones
- **Real-time Monitoring**: Track deployment progress and status
- **Item Availability Checking**: Validate items before deployment
- **Binary File Support**: Automatic handling of text and binary content

## Architecture

```text
PackageInstallerItem/
├── components/          # UI Components and Helpers
├── deployment/          # Deployment Strategies and Models  
├── package/            # Package Management and Registry
├── PackageInstallerItemEditor.tsx        # Main Editor UI
├── PackageInstallerItemModel.ts          # Type Definitions
├── DeploymentDetailView.tsx              # Deployment Details UI
└── PackageSelectionView.tsx              # Package Selection UI
```

## Deployment Strategies

### UX Deployment Strategy
Direct deployment using Fabric Platform APIs for immediate item creation.

- Real-time workspace and folder creation
- Direct item creation and definition updates
- Item availability validation
- Best for: Interactive deployments, small to medium packages

### Spark Livy Deployment Strategy
Background deployment using Spark batch jobs for scalable processing.

- Asynchronous processing
- Large package support
- Job status monitoring
- Best for: Large packages, automated pipelines

### Spark Notebook Deployment Strategy
Deployment through Spark notebook execution with custom logic.

- Custom deployment scripts
- Advanced deployment logic
- Integration with Spark ecosystem
- Best for: Complex scenarios, custom processing

## Package Definition

Packages are defined using JSON configuration files:

```json
{
  "id": "sample-package",
  "displayName": "Sample Analytics Package",
  "description": "A collection of analytics items",
  "deploymentConfig": {
    "type": "UX",
    "location": "NewWorkspace",
    "suffixItemNames": true
  },
  "items": [
    {
      "type": "notebook",
      "displayName": "Data Analysis Notebook",
      "description": "Comprehensive data analysis",
      "definition": {
        "format": "ipynb",
        "parts": [
          {
            "payloadType": "Asset",
            "payload": "/assets/notebooks/analysis.ipynb",
            "path": "notebook-content.json"
          }
        ]
      }
    }
  ]
}
```

## Adding Packages to the Registry

### Step 1: Create Package Definition File

Create a new JSON file in the assets directory following the package structure:

```json
{
  "id": "my-custom-package",
  "displayName": "My Custom Package",
  "description": "Description of your package",
  "deploymentConfig": {
    "type": "UX",
    "location": "NewWorkspace",
    "suffixItemNames": true,
    "ignoreItemDefinitions": false
  },
  "items": [
    {
      "type": "notebook",
      "displayName": "My Notebook",
      "description": "Custom notebook description",
      "definition": {
        "format": "ipynb",
        "parts": [
          {
            "payloadType": "Asset",
            "payload": "/assets/notebooks/my-notebook.ipynb",
            "path": "notebook-content.json"
          }
        ]
      }
    }
  ]
}
```

### Step 2: Register Package in PackageRegistry

Add your package import to `package/PackageRegistry.ts`:

```typescript
const configModules: (() => Promise<any>)[] = [
  // Existing packages
  () => import('../../../../assets/samples/items/PackageInstallerItem/Planning/package.json'),
  () => import('../../../../assets/samples/items/PackageInstallerItem/Sales/package.json'),
  // Add your new package
  () => import('../../../../assets/samples/items/PackageInstallerItem/MyCustomPackage/package.json'),
];
```

### Step 3: Asset Organization

Organize your assets in the following structure:

```text
assets/samples/items/PackageInstallerItem/MyCustomPackage/
├── package.json          # Package definition
├── notebooks/
│   └── my-notebook.ipynb
├── reports/
│   └── my-report.pbix
```

### Package Configuration Options

#### Deployment Types
- `"UX"`: Direct UI deployment (recommended for most cases)
- `"SparkLivy"`: Background Spark job deployment
- `"SparkNotebook"`: Custom Spark notebook deployment

#### Deployment Locations
- `"NewWorkspace"`: Create a new workspace for the package
- `"ExistingWorkspace"`: Deploy to user-selected existing workspace
- `"NewFolder"`: Create a new folder in existing workspace

#### Optional Settings
- `suffixItemNames: true`: Adds deployment ID to item names
- `ignoreItemDefinitions: false`: Include item content definitions
- `deploymentFile`: Reference to custom deployment script

### Item Types Supported

Common Fabric item types you can include:
- `notebook`: Jupyter notebooks
- `report`: Power BI reports
- `semanticmodel`: Semantic models/datasets
- `lakehouse`: Lakehouse items
- `warehouse`: Data warehouse items
- `kqldatabase`: KQL databases
- `datapipeline`: Data pipelines
- `dataflow`: Dataflow Gen2
- `mlmodel`: Machine learning models
- `environment`: Spark environments

### Best Practices

1. **Use descriptive IDs**: Make package IDs unique and descriptive
2. **Organize assets**: Keep related files together in package folders
3. **Test payloads**: Verify all asset paths are correct
4. **Document items**: Provide clear descriptions for all items
5. **Icon consistency**: Use consistent icon sizing and format

## Payload Types

### Asset Payload
Local files from the workload assets:
```typescript
{
  payloadType: "Asset",
  payload: "/assets/notebooks/sample.ipynb",
  path: "notebook-content.json"
}
```

### Link Payload
External URLs with CORS handling:
```typescript
{
  payloadType: "Link", 
  payload: "https://example.com/file.json",
  path: "configuration.json"
}
```

### Inline Base64 Payload
Direct embedded content:
```typescript
{
  payloadType: "InlineBase64",
  payload: "ewogICJjZWxscyI6IFtdCn0=",
  path: "notebook-content.json"
}
```

## UI Components

### Main Editor
- Package selection and configuration
- Deployment history management
- Real-time monitoring

### Component Library
- `WorkspaceDropdown`: Workspace selection with F-SKU filtering
- `CapacityDropdown`: Capacity selection for Fabric
- `DeploymentDialog`: Deployment configuration interface
- `DeploymentDetailView`: Detailed deployment status
- `UIHelper`: Icon mapping and navigation utilities

## Content Handling

The system automatically handles both text and binary files using a unified approach:

```typescript
protected async getAssetContentAsBase64(path: string): Promise<string> {
  const response = await fetch(path);
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  let binaryString = '';
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binaryString);
}
```

**Supported File Types**: JSON, notebooks, images, PDFs, Excel files, and more.

## Deployment Workflow

1. **Package Selection**: Choose from available packages
2. **Configuration**: Set workspace, folder, and deployment options
3. **Validation**: Check item compatibility and workspace access
4. **Execution**: Deploy using selected strategy
5. **Monitoring**: Track progress and view results

## Error Handling

- Automatic binary/text file detection
- CORS error handling for external links
- Graceful fallbacks for network issues
- Detailed error logging and user feedback

## Integration

### Fabric Platform APIs
- Workspace and folder management
- Item creation and updates
- Capacity assignment

### Spark Integration
- Livy sessions for interactive processing
- Batch jobs for background deployment
- Notebook execution for custom logic

## Troubleshooting

### Common Issues

**CORS Errors**: Use asset files instead of external links when possible

**Binary File Errors**: The system automatically handles binary content encoding

**Permission Issues**: Verify user permissions and capacity assignments

**Format Errors**: Validate JSON structure and required fields

## Extension Points

### Custom Deployment Strategies
Implement the `DeploymentStrategy` abstract class for custom deployment logic.

### Custom UI Components
Extend the component library for specialized use cases.

### Package Sources
Extend `PackageRegistry` to support external repositories and version management.