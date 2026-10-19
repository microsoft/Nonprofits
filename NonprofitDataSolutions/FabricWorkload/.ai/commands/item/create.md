# Create New Workload Item

## Process

This guide provides step-by-step instructions for AI tools to create a new item in the Microsoft Fabric workload. Each item requires implementation files, manifest configuration, routing setup, and asset management.

### Step 1: Create Item Implementation Structure

1. **Create item directory**:

   ```
   Workload/app/items/[ItemName]Item/
   ```

2. **Create the four required implementation files**:
   - `[ItemName]ItemModel.ts` - Data model and interface definitions
   - `[ItemName]ItemEditor.tsx` - Main editor component
   - `[ItemName]ItemEditorEmpty.tsx` - Empty state component (shown when item is first created)
   - `[ItemName]ItemEditorRibbon.tsx` - Ribbon/toolbar component

### Step 2: Implement the Model (`[ItemName]ItemModel.ts`)

The model defines the data structure that will be stored in Fabric:

```typescript
export interface [ItemName]ItemDefinition {
  // Add your item-specific properties here
  // Example properties:
  // title?: string;
  // description?: string;
  // configuration?: any;
}
```

**Key Points**:

- Define the interface that represents your item's state
- This data will be persisted in Fabric's storage
- Keep it serializable (JSON-compatible types only)

### Step 3: Implement the Editor (`[ItemName]ItemEditor.tsx`)

The main editor component handles the item's primary interface:

```typescript
import React, { useEffect, useState, useCallback } from "react";
import { ContextProps, PageProps } from "../../../App";
import { [ItemName]ItemEditorRibbon } from "./[ItemName]ItemEditorRibbon";
import { getWorkloadItem, saveItemDefinition } from "../../controller/ItemCRUDController";
import { WorkloadItem } from "../../models/ItemCRUDModel";
import { useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { [ItemName]ItemDefinition } from "./[ItemName]ItemModel";
import { [ItemName]ItemEmpty } from "./[ItemName]ItemEditorEmpty";

export function [ItemName]ItemEditor(props: PageProps) {
  const pageContext = useParams<ContextProps>();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { workloadClient } = props;

  // Add your editor state management here
  // Follow the pattern from HelloWorldItemEditor.tsx
}
```

**Key Features**:

- State management for the item definition
- Loading and saving logic using ItemCRUDController
- Integration with the ribbon component
- Empty state handling

### Step 4: Implement the Empty State (`[ItemName]ItemEditorEmpty.tsx`)

The empty state is shown when users first create the item:

```typescript
import React, { useState } from "react";
import { [ItemName]ItemDefinition } from "./[ItemName]ItemModel";

interface [ItemName]ItemEmptyStateProps {
  workloadClient: WorkloadClientAPI,
  item: GenericItem;
  itemDefinition: [ItemName]ItemDefinition,
  onFinishEmpty: (data: [ItemName]ItemDefinition) => void;
}

export const [ItemName]ItemEmpty: React.FC<[ItemName]ItemEmptyStateProps> = ({
  workloadClient,
  item,
  itemDefinition,
  onFinishEmpty
}) => {
  // Add initialization UI here
  // Call onFinishEmpty when user completes setup
};
```

**Purpose**:

- Provide initial setup/configuration interface
- Guide users through first-time item creation
- Can be skipped if item doesn't need initial setup

### Step 5: Implement the Ribbon (`[ItemName]ItemEditorRibbon.tsx`)

The ribbon provides toolbar actions and navigation tabs:

```typescript
import { Tab, TabList } from '@fluentui/react-tabs';
import { ToolbarButton, Tooltip } from '@fluentui/react-components';
import { Save24Regular } from "@fluentui/react-icons";

export interface [ItemName]ItemEditorRibbonProps extends PageProps {
  saveItemCallback: () => Promise<void>;
  isSaveButtonEnabled?: boolean;
  onTabChange: (tabValue: TabValue) => void;
  selectedTab: TabValue;
}

export function [ItemName]ItemEditorRibbon(props: [ItemName]ItemEditorRibbonProps) {
  // Add toolbar buttons and tabs here
  // Include Save button and any custom actions
}
```

**Common Features**:

- Save button with save callback
- Tab navigation if item has multiple views
- Custom action buttons specific to the item type

### Step 6: Create Manifest Configuration

#### 6.1: Create XML Manifest (`config/Manifest/[ItemName]Item.xml`)

```xml
<?xml version='1.0' encoding='utf-8'?>
<ItemManifestConfiguration SchemaVersion="2.0.0">
  <Item TypeName="[WorkloadName].[ItemName]" Category="Data">
    <Workload WorkloadName="[WorkloadName]" />
  </Item>
</ItemManifestConfiguration>
```

**Key Elements**:

- `TypeName`: Unique identifier for the item type
- `Category`: Fabric category (Data, Analytics, etc.)
- `WorkloadName`: Must match your workload's name

#### 6.2: Create JSON Manifest (`config/Manifest/[ItemName]Item.json`)

```json
{
  "name": "[ItemName]",
  "version": "1.100",
  "displayName": "[ItemName]Item_DisplayName",
  "displayNamePlural": "[ItemName]Item_DisplayName_Plural",
  "editor": {
    "path": "/[ItemName]Item-editor"
  },
  "icon": {
    "name": "assets/images/[ItemName]Item-icon.png"
  },
  "activeIcon": {
    "name": "assets/images/[ItemName]Item-icon.png"
  },
  "supportedInMonitoringHub": true,
  "supportedInDatahubL1": true,
  "editorTab": {
    "onDeactivate": "item.tab.onDeactivate",
    "canDeactivate": "item.tab.canDeactivate",
    "canDestroy": "item.tab.canDestroy",
    "onDestroy": "item.tab.onDestroy",
    "onDelete": "item.tab.onDelete"
  },
  "createItemDialogConfig": {
    "onCreationFailure": { "action": "item.onCreationFailure" },
    "onCreationSuccess": { "action": "item.onCreationSuccess" }
  }
}
```

**Key Properties**:

- `name`: Internal item name
- `displayName`/`displayNamePlural`: Localization keys
- `editor.path`: Route path for the editor
- `icon`: Path to item icon in assets
- Hub support flags for where item appears in Fabric UI

### Step 7: Add Routing Configuration

Update `Workload/app/App.tsx` to add the route for your new item:

```typescript
// Add import for your editor
import { [ItemName]ItemEditor } from "./items/[ItemName]Item/[ItemName]ItemEditor";

// Add route in the Switch statement
<Route path="/[ItemName]Item-editor/:itemObjectId">
  <[ItemName]ItemEditor {...pageProps} />
</Route>
```

**Route Pattern**:

- Path must match the `editor.path` in the JSON manifest
- Include `:itemObjectId` parameter for item identification
- Route name should follow the pattern: `/[ItemName]Item-editor`

### Step 8: Create Asset Files

#### 8.1: Add Item Icon

Create an icon file: `config/Manifest/assets/images/[ItemName]Item-icon.png`

- **Size**: 24x24 pixels recommended
- **Format**: PNG with transparency
- **Style**: Follow Fabric design guidelines

#### 8.2: Add Localization Strings

Update `config/Manifest/assets/locales/en-US/translations.json`:

```json
{
  // Add these entries to the existing translations
  "[ItemName]Item_DisplayName": "Your Item Display Name",
  "[ItemName]Item_DisplayName_Plural": "Your Item Display Names",
  "[ItemName]Item_Description": "Description of what this item does"
}
```

**For Additional Locales**:

- Add corresponding entries in other locale files (e.g., `es/translations.json`)
- Maintain the same keys with translated values

#### 8.3: Update Product.json (if needed)

If your item requires specific workload-level configuration, update `config/Manifest/Product.json` to include references to your new item type.

### Step 9: Testing and Validation

1. **Build the project**:

   ```powershell
   cd Workload
   npm run build:test
   ```

2. **Start development server**:

   ```powershell
   npm run start
   ```

3. **Test item creation**:
   - Navigate to Fabric workspace
   - Create new item of your type
   - Verify editor loads correctly
   - Test save/load functionality

### Step 10: Build and Deploy

1. **Build manifest package**:

   ```powershell
   .\scripts\Build\BuildManifestPackage.ps1
   ```

2. **Build release**:
   ```powershell
   .\scripts\Build\BuildRelease.ps1
   ```

## Usage

### Quick Checklist for AI Tools

When creating a new item, ensure all these components are created:

**Implementation Files** (in `Workload/app/items/[ItemName]Item/`):

- [ ] `[ItemName]ItemModel.ts` - Data model interface
- [ ] `[ItemName]ItemEditor.tsx` - Main editor component
- [ ] `[ItemName]ItemEditorEmpty.tsx` - Empty state component
- [ ] `[ItemName]ItemEditorRibbon.tsx` - Ribbon/toolbar component

**Manifest Files** (in `config/Manifest/`):

- [ ] `[ItemName]Item.xml` - XML manifest configuration
- [ ] `[ItemName]Item.json` - JSON manifest with editor path and metadata
- [ ] `Product.json` - Product JSON manifest that containst the configuration for all Items. Need to include a createExperience for the newly created item.

**Asset Files**:

- [ ] `config/Manifest/assets/images/[ItemName]Item-icon.png` - Item icon
- [ ] Localization entries in `config/Manifest/assets/locales/*/translations.json`

**Code Integration**:

- [ ] Route added to `Workload/app/App.tsx`
- [ ] Import statement for editor component
- [ ] Route path matches manifest `editor.path`

### Common Patterns

1. **Item Naming**: Use PascalCase for ItemName (e.g., `MyCustomItem`)
2. **File Naming**: Follow pattern `[ItemName]Item[Component].tsx`
3. **Route Naming**: Use kebab-case `/[item-name]-editor/:itemObjectId`
4. **TypeName**: Use dot notation `Org.WorkloadName.ItemName`
5. **Localization Keys**: Use underscore notation `[ItemName]Item_DisplayName`

### Troubleshooting

**Common Issues**:

- **Route not found**: Ensure route path matches manifest `editor.path`
- **Icon not loading**: Verify icon file exists in assets/images/
- **Localization missing**: Check translation keys in all locale files
- **Save not working**: Verify model interface is properly defined
- **Empty state not showing**: Check onFinishEmpty callback implementation
