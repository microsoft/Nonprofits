# Update Workload Name

## Overview

This document provides comprehensive guidance for AI tools on how to update a Microsoft Fabric workload name in the Workload Development Kit (WDK v2). Understanding the workload naming structure and the files that need to be updated is crucial for maintaining consistency across the entire workload configuration.

## Workload Naming Structure

### Naming Convention

The workload name follows the pattern: `[Organization].[WorkloadId]`

**Components:**

- **Organization**: Identifies the organization or entity that owns the workload
- **WorkloadId**: Unique identifier for the specific workload

### Organization Guidelines

#### Development and Internal Use

- **Organization**: Always use `"Org"` for development and internal scenarios
- **Example**: `Org.MyCustomWorkload`, `Org.DataProcessingSample`

#### Production and Fabric Hub Publishing

- **Organization**: Must be replaced with your actual organization name
- **Requirements**: Organization name must be registered with Microsoft for Fabric Hub publishing
- **Example**: `Contoso.DataAnalytics`, `Fabrikam.MLPipeline`

### Complete Examples

```
Development:    Org.MyFERemoteWorkloadSample
Production:     ContosoInc.MyFERemoteWorkloadSample

Development:    Org.DataProcessingWorkload
Production:     Fabrikam.DataProcessingWorkload
```

## Automated Setup Process

The setup scripts handle workload name configuration automatically, but they rely on template files for proper replacement.

### Setup Script Flow

1. **Template Processing**: Scripts read from `config/templates/` directory
2. **Token Replacement**: Replace `{{WORKLOAD_NAME}}` tokens with actual values
3. **File Generation**: Create actual configuration files in `config/Manifest/`
4. **Environment Configuration**: Update `.env` files in `Workload/` directory

### Key Setup Scripts

- **`scripts/Setup/Setup.ps1`**: Main setup script that orchestrates the entire process
- **`scripts/Setup/SetupWorkload.ps1`**: Handles workload-specific configuration and template processing

## Files Requiring Updates

When updating a workload name, the following files must be updated consistently:

### 1. Manifest Configuration Files (`config/Manifest/`)

#### `WorkloadManifest.xml`

```xml
<Workload WorkloadName="[Organization].[WorkloadId]" HostingType="FERemote">
```

#### Item Manifest Files (`*Item.xml`)

**All item XML files must be updated:**

- `HelloWorldItem.xml`
- `[ItemName].xml`
- Any custom item XML files

```xml
<Item TypeName="[Organization].[WorkloadId].[ItemName]" Category="Data">
  <Workload WorkloadName="[Organization].[WorkloadId]" />
</Item>
```

### 2. Environment Configuration Files (`Workload/`)

#### `.env.dev`

```bash
WORKLOAD_NAME=[Organization].[WorkloadId]
```

#### `.env.prod`

```bash
WORKLOAD_NAME=[Organization].[WorkloadId]
```

#### `.env.test`

```bash
WORKLOAD_NAME=[Organization].[WorkloadId]
```

### 3. Template Files (`config/templates/Manifest/`)

Templates use placeholder tokens that get replaced during setup:

#### `WorkloadManifest.xml`

```xml
<Workload WorkloadName="{{WORKLOAD_NAME}}" HostingType="FERemote">
```

#### Item Template Files

```xml
<Item TypeName="{{WORKLOAD_NAME}}.[ItemName]" Category="Data">
  <Workload WorkloadName="{{WORKLOAD_NAME}}" />
</Item>
```

## Step-by-Step Update Process

### Method 1: Using Setup Scripts (Recommended)

1. **Prepare Parameters**:

   ```powershell
   $WorkloadName = "YourOrg.YourWorkloadId"
   $WorkloadDisplayName = "Your Workload Display Name"
   ```

2. **Run Setup Script**:

   ```powershell
   .\scripts\Setup\Setup.ps1 -WorkloadName $WorkloadName -WorkloadDisplayName $WorkloadDisplayName -Force $true
   ```

3. **Verify Updates**: Check that all files have been updated with the new workload name

### Method 2: Manual Update Process

#### Step 1: Update Template Files

Update all template files in `config/templates/Manifest/` to ensure future setup runs use correct values.

#### Step 2: Update Manifest Files

1. **Update `config/Manifest/WorkloadManifest.xml`**:

   ```xml
   <Workload WorkloadName="NewOrg.NewWorkloadId" HostingType="FERemote">
   ```

2. **Update all Item XML files** in `config/Manifest/`:
   - Find all `*Item.xml` files
   - Update `TypeName` and `WorkloadName` attributes:
   ```xml
   <Item TypeName="NewOrg.NewWorkloadId.ItemName" Category="Data">
     <Workload WorkloadName="NewOrg.NewWorkloadId" />
   </Item>
   ```

#### Step 3: Update Environment Files

Update all three environment files in `Workload/`:

1. **`.env.dev`**:

   ```bash
   WORKLOAD_NAME=NewOrg.NewWorkloadId
   ```

2. **`.env.prod`**:

   ```bash
   WORKLOAD_NAME=NewOrg.NewWorkloadId
   ```

3. **`.env.test`**:
   ```bash
   WORKLOAD_NAME=NewOrg.NewWorkloadId
   ```

#### Step 4: Rebuild and Test

1. **Build manifest package**:

   ```powershell
   .\scripts\Build\BuildManifestPackage.ps1
   ```

2. **Build application**:

   ```powershell
   cd Workload
   npm run build:test
   ```

3. **Test the workload**:
   ```powershell
   npm run start
   ```

## Validation Checklist

After updating the workload name, verify these items:

### Configuration Consistency

- [ ] `WorkloadManifest.xml` contains the new workload name
- [ ] All `*Item.xml` files use the new workload name in both `TypeName` and `WorkloadName`
- [ ] All three `.env` files contain the updated `WORKLOAD_NAME`
- [ ] Template files use `{{WORKLOAD_NAME}}` placeholders correctly

### Build Validation

- [ ] Manifest package builds successfully
- [ ] Frontend application builds without errors
- [ ] No references to old workload name in generated files

### Runtime Validation

- [ ] Workload appears with correct name in Fabric
- [ ] Items can be created and edited successfully
- [ ] No console errors related to workload identification

## Common Issues and Troubleshooting

### Issue: Workload Not Recognized

**Symptoms**: Workload doesn't appear in Fabric or shows as unregistered
**Solutions**:

- Verify `WorkloadManifest.xml` has correct `WorkloadName`
- Ensure environment variables are updated
- Rebuild manifest package
- Restart dev gateway

### Issue: Items Not Loading

**Symptoms**: Items show errors or don't load in editor
**Solutions**:

- Check that all `*Item.xml` files have matching `WorkloadName`
- Verify `TypeName` follows correct pattern: `[Organization].[WorkloadId].[ItemName]`
- Ensure frontend routes match item configurations

### Issue: Template Replacement Failures

**Symptoms**: Setup script fails or generates files with placeholder tokens
**Solutions**:

- Verify template files contain correct `{{WORKLOAD_NAME}}` tokens
- Check that `SetupWorkload.ps1` replacement dictionary includes all required tokens
- Run setup script with `-Force $true` to overwrite existing files

### Issue: Environment Mismatch

**Symptoms**: Different behavior between development and production
**Solutions**:

- Ensure all three `.env` files have the same `WORKLOAD_NAME` value
- Verify the workload name matches between manifest and environment files
- Check that the correct environment file is being used for each build

## Best Practices

### Development Workflow

1. **Always use "Org" organization** for development and testing
2. **Test thoroughly** before changing to production organization name
3. **Use setup scripts** rather than manual updates when possible
4. **Version control** all configuration changes

### Production Deployment

1. **Register organization name** with Microsoft before production deployment
2. **Update organization name** only when ready for production
3. **Test in staging environment** with production organization name
4. **Document organization name** requirements for future developers

### Naming Conventions

1. **Organization names** should be meaningful and registered
2. **WorkloadId** should be descriptive and unique within organization
3. **Avoid special characters** in workload names (use letters, numbers, periods only)
4. **Use PascalCase** for WorkloadId portion

## Integration with CI/CD

### Environment Variables

Configure build pipelines to use environment-specific workload names:

```yaml
variables:
  - name: WORKLOAD_NAME_DEV
    value: "Org.MyWorkload"
  - name: WORKLOAD_NAME_PROD
    value: "ContosoInc.MyWorkload"
```

### Automated Deployment

Use setup scripts in deployment pipelines:

```yaml
- task: PowerShell@2
  inputs:
    filePath: "scripts/Setup/Setup.ps1"
    arguments: '-WorkloadName $(WORKLOAD_NAME) -WorkloadDisplayName "$(WORKLOAD_DISPLAY_NAME)" -Force $true'
```

This comprehensive approach ensures that workload name updates are applied consistently across all required files and configurations, maintaining the integrity of the Fabric workload throughout the development and deployment lifecycle.
