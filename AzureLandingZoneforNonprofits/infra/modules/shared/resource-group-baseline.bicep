targetScope = 'resourceGroup'

@description('Short deployment prefix.')
@maxLength(12)
param deploymentPrefix string

@description('Primary Azure region for the baseline resources.')
param primaryLocation string

@description('Optional common tags.')
param tags object = {}

@description('Create the shared Log Analytics workspace for this slice.')
param createWorkspace bool = true

@description('Log Analytics workspace retention in days. Defaults to 90 days to stay cost-conscious with the PerGB2018 included retention tier; increase only when governed security requirements justify the added retention cost.')
@minValue(30)
@maxValue(730)
param logAnalyticsWorkspaceRetentionInDays int = 90

@description('Create the shared Key Vault for this slice.')
param createKeyVault bool = true

@description('Optional stable seed for the generated Key Vault name. Leave empty to preserve the default deterministic name; set a custom value only when an evaluation deployment must avoid a soft-deleted Key Vault name in the same resource group.')
param keyVaultNameSeed string = ''

@description('Public endpoint mode for the shared Key Vault. The Key Vault firewall remains deny-by-default with no public IP or virtual-network allow rules; private endpoint deployments set this to Disabled.')
param keyVaultPublicNetworkAccess 'Enabled' | 'Disabled' = 'Enabled'

@description('Enable purge protection on the shared Key Vault. Once enabled, deleted Key Vault contents cannot be permanently removed for 7 days and the setting cannot be turned off retroactively. Recommended for production. This shared module defaults to false; Foundation exposes it as an opt-in, while Expanded Platform enables it for the management Key Vault.')
param enableKeyVaultPurgeProtection bool = false

@description('Soft-delete retention window for the shared Key Vault, in days. Allowed range 7 to 90. Foundation uses 7 days for evaluation deployments that may be removed. Expanded Platform uses 90 days for the management Key Vault because it is intended to hold platform secrets and runs with purge protection on.')
@minValue(7)
@maxValue(90)
param keyVaultSoftDeleteRetentionInDays int = 7

@description('Apply the ServiceOwner tag inheritance policy at this resource-group scope. Defaults to true so resource groups created by this deployment inherit ServiceOwner without affecting existing resource groups outside this deployment.')
param enableTagInheritance bool = true

var normalizedPrefix = toLower(replace(deploymentPrefix, '-', ''))
var safeBase = empty(normalizedPrefix) ? 'alz' : normalizedPrefix
var prefixLength = length(safeBase) > 12 ? 12 : length(safeBase)
var keyVaultNameSuffix = empty(keyVaultNameSeed) ? substring(uniqueString(resourceGroup().id), 0, 8) : substring(uniqueString(resourceGroup().id, keyVaultNameSeed), 0, 8)
var keyVaultName = '${substring(safeBase, 0, prefixLength)}kv${keyVaultNameSuffix}'
var workspaceName = '${deploymentPrefix}-law-001'
var mergedTags = union(tags, {
  ManagedBy: 'AzureLandingZone'
  DeploymentPrefix: deploymentPrefix
})

resource workspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = if (createWorkspace) {
  name: workspaceName
  location: primaryLocation
  tags: mergedTags
  properties: {
    retentionInDays: logAnalyticsWorkspaceRetentionInDays
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    sku: {
      name: 'PerGB2018'
    }
  }
}

resource keyVault 'Microsoft.KeyVault/vaults@2026-02-01' = if (createKeyVault) {
  name: keyVaultName
  location: primaryLocation
  tags: mergedTags
  properties: {
    enableRbacAuthorization: true
    enablePurgeProtection: enableKeyVaultPurgeProtection ? true : null
    enableSoftDelete: true
    publicNetworkAccess: keyVaultPublicNetworkAccess
    // The empty allowlists are intentional and deployment-owned: the default
    // data plane stays sealed. Redeployment removes manually added allow rules;
    // use the supported private endpoint path for durable network access.
    networkAcls: {
      bypass: 'None'
      defaultAction: 'Deny'
      ipRules: []
      virtualNetworkRules: []
    }
    sku: {
      family: 'A'
      name: 'standard'
    }
    softDeleteRetentionInDays: keyVaultSoftDeleteRetentionInDays
    tenantId: subscription().tenantId
    accessPolicies: []
  }
}

module tagInheritance '../governance/resource-group-tag-inheritance.bicep' = if (enableTagInheritance) {
  name: 'rg-tag-inheritance-${uniqueString(resourceGroup().id)}'
  params: {
    deploymentPrefix: deploymentPrefix
    primaryLocation: primaryLocation
  }
}

output logAnalyticsWorkspaceResourceId string = createWorkspace ? workspace.id : ''
output workspaceName string = createWorkspace ? workspace.name : ''
output keyVaultResourceId string = createKeyVault ? keyVault.id : ''
output keyVaultName string = createKeyVault ? keyVault.name : ''
output effectiveNamePrefix string = deploymentPrefix
output effectiveTags object = mergedTags
