# Package Creation Strategy

This document describes the BasePackageStrategy class and the package creation process.

## Overview

The `BasePackageStrategy` class handles the creation of package JSON files from selected Fabric items. It downloads all definition parts (except default/empty ones) and stores them in a structured folder hierarchy in OneLake.

## Package Structure

When a package is created, the following folder structure is generated in OneLake:

```
packages/
└── {packageId}/
    ├── package.json                 # Main package configuration
    └── definitions/
        ├── {item1-name}/
        │   ├── definition-part-0.json
        │   ├── notebook-content.ipynb
        │   └── ...
        ├── {item2-name}/
        │   ├── dataset-definition.json
        │   └── ...
        └── {item3-name}/
            └── ...
```

## Package JSON Structure

The generated package.json follows this structure:

```json
{
  "id": "custom-package-2025-07-31T10-30-00",
  "displayName": "Custom Package 7/31/2025",
  "description": "Package created from 3 selected items",
  "items": [
    {
      "type": "Notebook",
      "displayName": "My Notebook",
      "description": "Packaged Notebook",
      "definition": {
        "format": "ipynb",
        "parts": [
          {
            "payloadType": "AssetLink",
            "payload": "onelake://path/to/content.ipynb",
            "path": "/notebook/"
          }
        ],
        "creationMode": "WithDefinition"
      }
    }
  ],
  "deploymentConfig": {
    "suffixItemNames": true
  }
}
```

## Features

### 1. Automatic Item Processing
- Downloads all definition parts from Fabric items
- Excludes default/empty parts automatically
- Handles different payload types (Base64, JSON)

### 2. File Organization
- Creates sanitized folder names for each item
- Generates meaningful filenames for definition parts
- Maintains original path references for deployment

### 3. Package Management
- Generates unique package IDs with timestamps
- Adds packages to the PackageRegistry automatically
- Updates the PackageInstaller item definition

### 4. Validation
- Validates selected items before processing
- Checks for duplicate item names
- Provides detailed error messages

## Usage

```typescript
// Create a package strategy
const packageStrategy = PackageStrategyFactory.createStrategy(
  PackageStrategyType.Standard,
  context,
  editorItem
);

// Validate and create package
await packageStrategy.validateItemsForPackaging(selectedItems);
const packageJsonPath = await packageStrategy.createPackageFromItems(
  selectedItems,
  packageId,
  packageDisplayName,
  packageDescription
);
```

## File Naming Conventions

### Package ID
- Format: `custom-package-{timestamp}`
- Example: `custom-package-2025-07-31T10-30-00-123Z`

### Item Folders
- Sanitized item display names
- Invalid characters replaced with underscores
- Converted to lowercase

### Definition Files
- Extracted from original paths when possible
- Type-specific defaults (notebook-content.ipynb, dataset-definition.json)
- Fallback to indexed names (definition-part-0.json)

## Default Part Exclusion

The strategy automatically excludes:
- Empty payloads
- Parts with only whitespace
- Empty JSON objects (`{}`)
- Other default structures (expandable)

## Future Enhancements

The factory pattern allows for additional strategy types:
- **MinimalPackageStrategy**: Include only essential parts
- **AdvancedPackageStrategy**: Additional processing and optimization
- **TypeSpecificStrategy**: Specialized handling per item type

## Error Handling

The strategy provides comprehensive error handling:
- Item processing failures don't stop the entire operation
- Detailed error messages for debugging
- Graceful handling of API failures
- Rollback capabilities for partial failures
