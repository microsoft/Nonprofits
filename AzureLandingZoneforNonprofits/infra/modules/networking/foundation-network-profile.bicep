targetScope = 'subscription'

@description('Short deployment prefix.')
@maxLength(12)
param deploymentPrefix string

@description('Primary Azure region for the Foundation networking resources.')
param primaryLocation string

@description('Optional common tags applied to Foundation networking resources.')
param tags object = {}

@description('Shared platform Key Vault resource ID used for the optional private endpoint path.')
param keyVaultResourceId string = ''

@description('Deploy the optional simple Foundation network baseline.')
param enableSimpleNetwork bool = false

@description('Enable private DNS and a private endpoint for the shared platform Key Vault. In Foundation this requires the simple network baseline.')
param enablePrivateDnsAndEndpoints bool = false

@description('Name of the Foundation networking resource group.')
@maxLength(90)
param networkResourceGroupName string = '${deploymentPrefix}-network-rg'

@description('Address space for the Foundation VNet.')
param vnetAddressSpace string = '10.20.0.0/22'

@description('Address prefix for the application subnet in the Foundation VNet.')
param applicationSubnetAddressPrefix string = '10.20.1.0/24'

@description('Address prefix for the private endpoints subnet in the Foundation VNet.')
param privateEndpointsSubnetAddressPrefix string = '10.20.2.0/24'

var privateKeyVaultConnectivityEnabled = enableSimpleNetwork && enablePrivateDnsAndEndpoints && !empty(keyVaultResourceId)
var networkingFollowUpActions = enablePrivateDnsAndEndpoints && !enableSimpleNetwork ? [
  'Foundation private Key Vault connectivity requires the simple network baseline. Enable simple networking or disable private connectivity for Key Vault.'
] : []

resource foundationNetworkResourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = if (enableSimpleNetwork) {
  name: networkResourceGroupName
  location: primaryLocation
  tags: tags
}

module foundationNetworkResources 'foundation-network-resources.bicep' = if (enableSimpleNetwork) {
  name: 'nonprofit-alz-${deploymentPrefix}-foundation-network-resources'
  scope: foundationNetworkResourceGroup
  params: {
    deploymentPrefix: deploymentPrefix
    primaryLocation: primaryLocation
    tags: tags
    keyVaultResourceId: keyVaultResourceId
    enablePrivateDnsAndEndpoints: enablePrivateDnsAndEndpoints
    vnetAddressSpace: vnetAddressSpace
    applicationSubnetAddressPrefix: applicationSubnetAddressPrefix
    privateEndpointsSubnetAddressPrefix: privateEndpointsSubnetAddressPrefix
  }
}

output networkResourceGroupName string = enableSimpleNetwork ? foundationNetworkResourceGroup.name : ''
output vnetResourceId string = enableSimpleNetwork ? foundationNetworkResources!.outputs.vnetResourceId : ''
output applicationSubnetResourceId string = enableSimpleNetwork ? foundationNetworkResources!.outputs.applicationSubnetResourceId : ''
output privateEndpointsSubnetResourceId string = privateKeyVaultConnectivityEnabled ? foundationNetworkResources!.outputs.privateEndpointsSubnetResourceId : ''
output keyVaultPrivateEndpointResourceId string = privateKeyVaultConnectivityEnabled ? foundationNetworkResources!.outputs.keyVaultPrivateEndpointResourceId : ''
output keyVaultPrivateDnsZoneResourceId string = privateKeyVaultConnectivityEnabled ? foundationNetworkResources!.outputs.keyVaultPrivateDnsZoneResourceId : ''
output privateKeyVaultConnectivityEnabled bool = privateKeyVaultConnectivityEnabled
output networkingFollowUpActions array = networkingFollowUpActions
