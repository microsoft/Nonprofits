# Publish Workload to Fabric - Comprehensive Guide

## Overview

This guide provides step-by-step instructions for AI tools on how to publish a Microsoft Fabric workload to the Fabric Workload Hub. Publishing is a manual process that involves uploading manifest packages through the Fabric Admin Portal and follows a structured workflow from testing to general availability.

Based on the official Microsoft documentation: [Publish a workload to the Fabric Workload Hub](https://learn.microsoft.com/en-us/fabric/workload-development-kit/publish-workload-flow)

### Publishing Architecture

The Fabric Workload Hub is where users browse, explore, and manage workloads within Fabric. Workloads are categorized into:

- **Core Fabric workloads**: Microsoft-developed workloads
- **Partner workloads**: Third-party developed workloads

### Publishing Stages

Publishing follows a structured four-stage process:

1. **Testing** - Internal validation and testing
2. **Preview Audience** - Limited tenant testing (up to 10 tenants)
3. **Preview** - Public preview for all Fabric users
4. **General Availability** - Full production release

## Prerequisites

### Administrative Requirements

- **Fabric Admin Account**: Account with admin permissions in the target tenant
- **Publishing Tenant**: Production Fabric tenant for workload lifecycle management
- **Workload Registration**: Completed registration form with Microsoft

### Technical Requirements

- **NuGet Package**: Built manifest package (.nupkg file)
- **Workload ID**: Registered unique identifier in format `[Publisher].[Workload]`
- **Production Configuration**: Workload configured for production environment
- **Testing Complete**: Workload validated in development environment

### Registration Requirements

Before publishing outside your organization, you must:

1. **Complete Workload Registration Form**: [Submit form](https://aka.ms/fabric_workload_registration)
2. **Define Publisher Name**: Meaningful company name or abbreviation
3. **Define Workload Name**: Align with product name or offering
4. **Await Microsoft Approval**: Fabric team enables publishing capability

## Stage 1: Testing

### Internal Testing Process

Testing is the initial stage where you validate your workload internally before exposing it to external users.

#### 1.1: Prepare Production Manifest

Ensure your workload manifest uses the registered Workload ID:

```xml
<!-- WorkloadManifest.xml -->
<Workload WorkloadName="YourPublisher.YourWorkload" HostingType="FERemote">
    <Version>1.0.0</Version>
    <!-- Additional configuration -->
</Workload>
```

#### 1.2: Build Production Package

Use the build script to create the manifest package:

```powershell
.\scripts\Build\BuildManifestPackage.ps1 -ValidateFiles $true
```

**Verify Package Contents:**

- Workload manifest with correct ID
- Item definitions properly configured
- All required assets included
- Version information accurate

#### 1.3: Upload to Test Tenant

1. **Access Fabric Admin Portal**:
   - Sign in to [Fabric](https://powerbi.com/) with admin account
   - Navigate to Settings → Admin portal

2. **Upload Workload Package**:
   - Go to Workloads section
   - Select "Upload workload"
   - Browse to your .nupkg file
   - Select "Open"

3. **Activate Workload**:
   - Select the uploaded workload
   - Choose the version to activate
   - Select "Add"
   - Status should show "Active in tenant"

#### 1.4: Internal Validation

**Test Scenarios:**

- Workload appears in experience switcher
- Item creation functions correctly
- Editor loading and functionality
- Data persistence and retrieval
- Authentication flows
- All supported browsers and devices

## Stage 2: Preview Audience

### Limited Tenant Testing

Preview Audience allows testing with up to 10 additional tenants before public release.

#### 2.1: Request Preview Audience Access

After your publisher tenant is enabled, you can add test tenants:

1. **Contact Microsoft**: Through your registration contact
2. **Provide Tenant IDs**: List of up to 10 tenant IDs for testing
3. **Specify Test Duration**: Expected testing timeline

#### 2.2: Enable in Target Tenants

For each test tenant, the administrator must:

1. **Access Tenant Settings**:
   - Navigate to Fabric Admin Portal
   - Go to Tenant settings

2. **Enable Preview Feature**:
   - Locate your workload in preview features
   - Enable the setting
   - Changes take immediate effect

3. **Notify Users**:
   - Inform tenant users about preview availability
   - Provide testing guidelines and feedback channels

#### 2.3: Preview Audience Characteristics

**User Experience:**

- Workload shows clear preview indication
- Available to all users in enabled tenants
- Publishing requirements not yet validated
- Limited to specified test tenants only

**Testing Focus:**

- Multi-tenant compatibility
- Different organizational configurations
- User experience validation
- Performance under varied loads

## Stage 3: Preview

### Public Preview Release

Preview stage makes your workload available to all Fabric users through the Workload Hub.

#### 3.1: Submit Publishing Request

To move to Preview stage:

1. **Complete Publishing Request Form**: [Submit form](https://aka.ms/fabric_workload_publishing)
2. **Specify Preview Request**: Indicate this is for Preview stage
3. **Provide Required Information**:
   - Workload details and capabilities
   - Technical specifications
   - Support and documentation links
   - Contact information

#### 3.2: Microsoft Validation Process

**Validation Steps:**

1. **Technical Review**: Workload functionality and integration
2. **Security Assessment**: Security controls and compliance
3. **Documentation Review**: User guides and technical documentation
4. **Requirements Check**: Against [Publishing Requirements](https://learn.microsoft.com/en-us/fabric/workload-development-kit/publish-workload-requirements)

**Communication:**

- Microsoft provides feedback on validation results
- Partners receive status updates through provided contact details
- Additional information may be requested during review

#### 3.3: Preview Activation

Upon successful validation:

- Workload appears in Workload Hub for all Fabric users
- Clear preview indication shown to users
- Available across all Fabric tenants
- User feedback collection begins

#### 3.4: Preview Management

**Monitor and Collect:**

- User adoption metrics
- Feedback and support requests
- Performance and reliability data
- Feature usage patterns

**Iterate Based on Feedback:**

- Address identified issues
- Implement requested enhancements
- Update documentation
- Prepare for GA requirements

## Stage 4: General Availability

### Production Release

General Availability removes preview limitations and makes your workload fully production-ready.

#### 4.1: Submit GA Publishing Request

When ready for GA:

1. **Complete Publishing Request Form**: [Submit form](https://aka.ms/fabric_workload_publishing)
2. **Specify GA Request**: Indicate this is for General Availability
3. **Demonstrate GA Readiness**:
   - Address all preview feedback
   - Meet all GA requirements
   - Provide production support plans

#### 4.2: GA Validation Requirements

**Enhanced Validation:**

- **Stability Metrics**: Demonstrated reliability and performance
- **Support Infrastructure**: 24/7 support capabilities where required
- **Documentation Completeness**: Full user and admin documentation
- **Security Compliance**: Enhanced security validation
- **Monetization Plans**: If applicable, billing integration

#### 4.3: GA Activation

Upon successful GA validation:

- Preview indication removed from workload
- Full production status across all Fabric tenants
- Enhanced discoverability in Workload Hub
- Official Microsoft support for integration

## Manual Upload Process - Step by Step

### Detailed Admin Portal Workflow

#### Step 1: Access Fabric Admin Portal

1. **Sign In**:

   ```
   Navigate to: https://powerbi.com/
   Sign in with Fabric admin account
   ```

2. **Navigate to Admin Portal**:
   - Click Settings (gear icon)
   - Select "Admin portal"

3. **Access Workloads Section**:
   - In the left navigation, click "Workloads"

#### Step 2: Upload Manifest Package

1. **Initiate Upload**:
   - Click "Upload workload" button
   - File browser dialog opens

2. **Select Package File**:
   - Navigate to your built .nupkg file
   - Select the manifest package
   - Click "Open"

3. **Upload Confirmation**:
   - Package uploads and is processed
   - Workload appears in the workloads list

#### Step 3: Activate Workload

1. **Select Workload**:
   - Click on the uploaded workload name
   - View available versions

2. **Choose Version**:
   - Select the version to activate
   - Review version details

3. **Activate**:
   - Click "Add" to activate
   - Confirm activation
   - Status changes to "Active in tenant"

#### Step 4: Verify Activation

1. **Check Status**:
   - Verify status shows "Active in tenant"
   - Note the active version number

2. **Test Functionality**:
   - Navigate to a Fabric workspace
   - Confirm workload appears in experience switcher
   - Test item creation and functionality

### Managing Published Workloads

#### Update Workload Version

To activate a different version:

1. **Access Workload Management**:
   - In Admin portal, go to Workloads
   - Select the workload to update

2. **Edit Active Version**:
   - On the "Add" tab, click "Edit"
   - Select the new version to activate
   - Click "Add" to confirm

3. **Confirm Change**:
   - Click "Add" again to confirm
   - New version becomes active

#### Deactivate Workload

To deactivate a workload:

1. **Select Workload**:
   - In Workloads section, select workload
2. **Deactivate**:
   - On the "Add" tab, click "Deactivate"
   - Confirm deactivation

#### Delete Workload Version

To delete a workload version:

1. **Access Uploads Tab**:
   - Select workload
   - Go to "Uploads" tab

2. **Delete Version**:
   - Click delete icon next to version
   - Cannot delete active version (deactivate first)

## Best Practices for Publishing

### Pre-Publishing Checklist

**Technical Validation:**

- [ ] Manifest package builds without errors
- [ ] All item types function correctly
- [ ] Authentication flows work properly
- [ ] Performance meets requirements
- [ ] Security controls implemented

**Documentation Preparation:**

- [ ] User documentation complete
- [ ] Admin documentation available
- [ ] API documentation (if applicable)
- [ ] Support contact information
- [ ] Troubleshooting guides

**Business Readiness:**

- [ ] Support processes established
- [ ] Pricing model defined (if applicable)
- [ ] Marketing materials prepared
- [ ] Legal compliance verified
- [ ] Partner agreements in place

### Testing Strategy

#### Internal Testing Phase

- Test in isolated development environment
- Validate all functionality thoroughly
- Performance testing under load
- Security penetration testing
- Cross-browser compatibility

#### Preview Audience Testing

- Select diverse test organizations
- Provide clear testing guidelines
- Establish feedback collection methods
- Regular check-ins with test users
- Document and address issues promptly

#### Preview Testing

- Monitor usage analytics
- Collect user feedback systematically
- Address compatibility issues
- Performance monitoring
- Support request analysis

### Support and Maintenance

#### Support Infrastructure

- **Contact Methods**: Email, portal, documentation
- **Response Times**: Define SLAs for different issue types
- **Escalation Procedures**: Clear paths for critical issues
- **Knowledge Base**: Comprehensive troubleshooting guides

#### Ongoing Maintenance

- **Regular Updates**: Bug fixes and enhancements
- **Security Patches**: Timely security updates
- **Compatibility**: Maintain compatibility with Fabric updates
- **Performance Monitoring**: Continuous performance analysis

## Troubleshooting Publishing Issues

### Common Upload Issues

#### Issue: Package Upload Fails

**Symptoms**: Error during package upload process
**Solutions**:

- Verify .nupkg file is not corrupted
- Check manifest syntax and validation
- Ensure all required files are included
- Verify package size limits not exceeded

#### Issue: Workload Not Appearing

**Symptoms**: Uploaded workload doesn't appear in list
**Solutions**:

- Refresh admin portal page
- Check workload ID matches registration
- Verify upload completed successfully
- Contact Microsoft support if issue persists

#### Issue: Activation Fails

**Symptoms**: Cannot activate uploaded workload
**Solutions**:

- Verify manifest syntax is correct
- Check all dependencies are satisfied
- Ensure no conflicting workloads
- Review error messages for specific issues

### Preview Stage Issues

#### Issue: Preview Audience Not Seeing Workload

**Symptoms**: Test tenants cannot access workload
**Solutions**:

- Verify tenant IDs are correct
- Check tenant settings are enabled
- Confirm workload is in preview audience list
- Allow time for propagation (up to 24 hours)

#### Issue: Publishing Request Rejected

**Symptoms**: Microsoft rejects publishing request
**Solutions**:

- Review feedback provided by Microsoft
- Address all identified requirements gaps
- Update documentation as needed
- Resubmit after addressing issues

### General Availability Issues

#### Issue: GA Request Denied

**Symptoms**: Request for GA status rejected
**Solutions**:

- Review enhanced GA requirements
- Demonstrate improved stability metrics
- Enhance support infrastructure
- Address all preview feedback items

This comprehensive publishing guide provides AI tools with complete instructions for navigating the Microsoft Fabric workload publishing process, from initial testing through general availability, with detailed manual upload procedures and troubleshooting guidance.
