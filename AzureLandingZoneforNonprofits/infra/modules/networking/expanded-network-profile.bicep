targetScope = 'subscription'

@description('Short deployment prefix.')
@maxLength(12)
param deploymentPrefix string

@description('Primary Azure region for the Expanded Platform networking resources.')
param primaryLocation string

@description('Optional common tags applied to Expanded Platform networking resources.')
param tags object = {}

@description('Name of the connectivity resource group that hosts the hub network.')
@maxLength(90)
param networkResourceGroupName string = '${deploymentPrefix}-connectivity-rg'

@description('Shared platform Key Vault resource ID used for the optional private endpoint path.')
param keyVaultResourceId string = ''

@description('Reserve the GatewaySubnet in the hub VNet so a VPN gateway, ExpressRoute gateway, or Azure Virtual WAN can be added later. This deployment reserves the subnet only; it does not create the gateway resource, public IP, or connection objects.')
param reserveGatewaySubnet bool = false

@description('Enable private DNS and a private endpoint for the shared platform Key Vault in the hub network.')
param enablePrivateDnsAndEndpoints bool = false

@description('Address space for the Expanded Platform hub VNet.')
param hubVnetAddressSpace string = '10.30.0.0/16'

@description('Address prefix for the shared services subnet in the hub VNet.')
param sharedServicesSubnetAddressPrefix string = '10.30.1.0/24'

@description('Address prefix for the gateway subnet in the hub VNet.')
param gatewaySubnetAddressPrefix string = '10.30.254.0/27'

var highImpactWarnings = concat(
  enablePrivateDnsAndEndpoints ? [
    'Private connectivity changes the platform access model and may require extra DNS configuration.'
  ] : []
)
var networkingFollowUpActions = concat(
  reserveGatewaySubnet ? [
    'GatewaySubnet was reserved, but no gateway was deployed. Provision the gateway (VPN, ExpressRoute, or Virtual WAN) separately when required.'
  ] : [],
  enablePrivateDnsAndEndpoints ? [
    'Validate private DNS resolution for the shared platform Key Vault from the hub network before relying on private-only access.'
  ] : []
)

module expandedHubNetworkResources 'expanded-hub-network-resources.bicep' = {
  name: 'nonprofit-alz-${deploymentPrefix}-connectivity-network-resources'
  scope: resourceGroup(networkResourceGroupName)
  params: {
    deploymentPrefix: deploymentPrefix
    primaryLocation: primaryLocation
    tags: tags
    keyVaultResourceId: keyVaultResourceId
    reserveGatewaySubnet: reserveGatewaySubnet
    enablePrivateDnsAndEndpoints: enablePrivateDnsAndEndpoints
    hubVnetAddressSpace: hubVnetAddressSpace
    sharedServicesSubnetAddressPrefix: sharedServicesSubnetAddressPrefix
    gatewaySubnetAddressPrefix: gatewaySubnetAddressPrefix
  }
}

output networkResourceGroupName string = networkResourceGroupName
output vnetResourceId string = expandedHubNetworkResources.outputs.vnetResourceId
output sharedServicesSubnetResourceId string = expandedHubNetworkResources.outputs.sharedServicesSubnetResourceId
output gatewaySubnetResourceId string = expandedHubNetworkResources.outputs.gatewaySubnetResourceId
output keyVaultPrivateEndpointResourceId string = expandedHubNetworkResources.outputs.keyVaultPrivateEndpointResourceId
output keyVaultPrivateDnsZoneResourceId string = expandedHubNetworkResources.outputs.keyVaultPrivateDnsZoneResourceId
output keyVaultPrivateEndpointImplemented bool = expandedHubNetworkResources.outputs.keyVaultPrivateEndpointImplemented
output networkingFollowUpActions array = networkingFollowUpActions
output highImpactWarnings array = highImpactWarnings
