targetScope = 'subscription'

@description('Short deployment prefix.')
@maxLength(12)
param deploymentPrefix string

@description('Primary Azure region for this slice.')
param primaryLocation string

@description('Service owner value used for tags.')
param serviceOwner string

@description('Environment value used for tags.')
param environment string = 'platform'

@description('Logical slice name such as platform, management, or connectivity.')
@maxLength(27)
param sliceName string = 'platform'

@description('Resource group name for shared slice resources.')
@maxLength(90)
param platformResourceGroupName string

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

@description('Public network access mode for the shared Key Vault.')
param keyVaultPublicNetworkAccess 'Enabled' | 'Disabled' = 'Enabled'

@description('Enable purge protection on the slice Key Vault. Defaults to false in this shared module; Foundation exposes this as an opt-in, while Expanded Platform enables it for the management Key Vault.')
param enableKeyVaultPurgeProtection bool = false

@description('Soft-delete retention window for the slice Key Vault, in days. Allowed range 7 to 90. Foundation uses 7 days for evaluation deployments that may be removed. Expanded Platform uses 90 days for the management slice.')
@minValue(7)
@maxValue(90)
param keyVaultSoftDeleteRetentionInDays int = 7

@description('Optional additional tags.')
param tags object = {}

var commonTags = union(tags, {
  ManagedBy: 'AzureLandingZone'
  DeploymentPrefix: deploymentPrefix
  ServiceOwner: serviceOwner
  Environment: environment
  Slice: sliceName
})

resource platformRg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: platformResourceGroupName
  location: primaryLocation
  tags: commonTags
}

module platformBaseline 'resource-group-baseline.bicep' = {
  name: 'nonprofit-alz-${deploymentPrefix}-${sliceName}-resources'
  scope: platformRg
  params: {
    deploymentPrefix: deploymentPrefix
    primaryLocation: primaryLocation
    tags: commonTags
    createWorkspace: createWorkspace
    logAnalyticsWorkspaceRetentionInDays: logAnalyticsWorkspaceRetentionInDays
    createKeyVault: createKeyVault
    keyVaultNameSeed: keyVaultNameSeed
    keyVaultPublicNetworkAccess: keyVaultPublicNetworkAccess
    enableKeyVaultPurgeProtection: enableKeyVaultPurgeProtection
    keyVaultSoftDeleteRetentionInDays: keyVaultSoftDeleteRetentionInDays
  }
}

output subscriptionId string = subscription().subscriptionId
output platformResourceGroupName string = platformRg.name
output logAnalyticsWorkspaceResourceId string = platformBaseline.outputs.logAnalyticsWorkspaceResourceId
output keyVaultResourceId string = platformBaseline.outputs.keyVaultResourceId
output effectiveTags object = commonTags
output effectiveNamePrefix string = platformBaseline.outputs.effectiveNamePrefix
