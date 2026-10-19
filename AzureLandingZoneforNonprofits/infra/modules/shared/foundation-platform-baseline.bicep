targetScope = 'subscription'

@description('Short deployment prefix.')
@maxLength(12)
param deploymentPrefix string

@description('Primary Azure region for the deployment.')
param primaryLocation string

@description('Optional additional tags.')
param tags object = {}

@description('Service owner used for tags.')
param serviceOwner string

@description('Deploy the optional simple Foundation network baseline.')
param enableSimpleNetwork bool = false

@description('Enable private DNS and a private endpoint for the shared platform Key Vault, and disable its public endpoint. In Foundation this requires the simple network baseline. When false, the Key Vault remains protected by the shared deny-by-default firewall baseline.')
param enablePrivateDnsAndEndpoints bool = false

@description('Address space for the optional Foundation VNet. Default /22 (1024 addresses) sized for a small NGO and to leave room for future peering without /16 collisions.')
param foundationVnetAddressSpace string = '10.20.0.0/22'

@description('Address prefix for the application subnet in the optional Foundation VNet.')
param foundationApplicationSubnetAddressPrefix string = '10.20.1.0/24'

@description('Address prefix for the private endpoints subnet in the optional Foundation VNet.')
param foundationPrivateEndpointsSubnetAddressPrefix string = '10.20.2.0/24'

@description('Enable purge protection on the platform Key Vault. Defaults to false in Foundation so evaluation deployments can be removed without waiting for the 7-day soft-delete retention to expire. Set to true once the environment holds production secrets that must survive accidental deletion.')
param enableKeyVaultPurgeProtection bool = false

@description('Optional stable seed for the generated platform Key Vault name. Leave empty to preserve the default deterministic name; set a custom value only when an evaluation deployment must avoid a soft-deleted Key Vault name in the same resource group.')
param keyVaultNameSeed string = ''

var privateKeyVaultConnectivityEnabled = enableSimpleNetwork && enablePrivateDnsAndEndpoints

module foundationSlice 'subscription-platform-slice.bicep' = {
  name: 'nonprofit-alz-${deploymentPrefix}-foundation-platform-resources'
  scope: subscription()
  params: {
    deploymentPrefix: deploymentPrefix
    primaryLocation: primaryLocation
    serviceOwner: serviceOwner
    tags: tags
    sliceName: 'platform'
    platformResourceGroupName: '${deploymentPrefix}-platform-rg'
    keyVaultPublicNetworkAccess: privateKeyVaultConnectivityEnabled ? 'Disabled' : 'Enabled'
    enableKeyVaultPurgeProtection: enableKeyVaultPurgeProtection
    keyVaultNameSeed: keyVaultNameSeed
    createWorkspace: true
    createKeyVault: true
  }
}

module foundationNetworking './../networking/foundation-network-profile.bicep' = {
  name: 'nonprofit-alz-${deploymentPrefix}-foundation-network-profile'
  scope: subscription()
  params: {
    deploymentPrefix: deploymentPrefix
    primaryLocation: primaryLocation
    tags: foundationSlice.outputs.effectiveTags
    keyVaultResourceId: foundationSlice.outputs.keyVaultResourceId
    enableSimpleNetwork: enableSimpleNetwork
    enablePrivateDnsAndEndpoints: enablePrivateDnsAndEndpoints
    networkResourceGroupName: '${deploymentPrefix}-network-rg'
    vnetAddressSpace: foundationVnetAddressSpace
    applicationSubnetAddressPrefix: foundationApplicationSubnetAddressPrefix
    privateEndpointsSubnetAddressPrefix: foundationPrivateEndpointsSubnetAddressPrefix
  }
}

output primarySubscriptionId string = subscription().subscriptionId
output platformResourceGroupName string = foundationSlice.outputs.platformResourceGroupName
output networkResourceGroupName string = foundationNetworking.outputs.networkResourceGroupName
output logAnalyticsWorkspaceResourceId string = foundationSlice.outputs.logAnalyticsWorkspaceResourceId
output keyVaultResourceId string = foundationSlice.outputs.keyVaultResourceId
output vnetResourceId string = foundationNetworking.outputs.vnetResourceId
output applicationSubnetResourceId string = foundationNetworking.outputs.applicationSubnetResourceId
output applicationNetworkSecurityGroupResourceId string = foundationNetworking.outputs.applicationNetworkSecurityGroupResourceId
output privateEndpointsSubnetResourceId string = foundationNetworking.outputs.privateEndpointsSubnetResourceId
output keyVaultPrivateEndpointResourceId string = foundationNetworking.outputs.keyVaultPrivateEndpointResourceId
output keyVaultPrivateDnsZoneResourceId string = foundationNetworking.outputs.keyVaultPrivateDnsZoneResourceId
output privateKeyVaultConnectivityEnabled bool = foundationNetworking.outputs.privateKeyVaultConnectivityEnabled
output networkingFollowUpActions array = foundationNetworking.outputs.networkingFollowUpActions
output effectiveTags object = foundationSlice.outputs.effectiveTags
output effectiveNamePrefix string = foundationSlice.outputs.effectiveNamePrefix
