targetScope = 'resourceGroup'

@description('Short deployment prefix.')
@maxLength(12)
param deploymentPrefix string

@description('Primary Azure region for the Expanded Platform hub resources.')
param primaryLocation string

@description('Optional common tags applied to Expanded Platform networking resources.')
param tags object = {}

@description('Shared platform Key Vault resource ID used for the optional private endpoint path.')
param keyVaultResourceId string = ''

// NOTE: reserveGatewaySubnet only carves out the GatewaySubnet inside the hub VNet so a
// VPN gateway, ExpressRoute gateway, or Azure Virtual WAN can be added later without
// re-architecting the hub address space. This module deliberately does NOT deploy the
// gateway resource itself, the public IP, or any IPsec/connection objects. Hybrid
// connectivity sizing, SKU choice (VpnGw1/VpnGw1AZ/VWAN), on-premises device
// configuration, and ongoing operations remain separate design decisions.
@description('Reserve the GatewaySubnet in the hub VNet so a VPN gateway, ExpressRoute gateway, or Azure Virtual WAN can be added later. This deployment reserves the subnet only; it does not create the gateway resource, public IP, or connection objects.')
param reserveGatewaySubnet bool = false

@description('Enable private DNS and a private endpoint for the shared platform Key Vault.')
param enablePrivateDnsAndEndpoints bool = false

@description('Address space for the Expanded Platform hub VNet.')
param hubVnetAddressSpace string = '10.30.0.0/16'

@description('Address prefix for the shared services subnet in the hub VNet.')
param sharedServicesSubnetAddressPrefix string = '10.30.1.0/24'

@description('Address prefix for the gateway subnet in the hub VNet.')
param gatewaySubnetAddressPrefix string = '10.30.254.0/27'

var hubVnetName = '${deploymentPrefix}-vnet-001'
var sharedServicesSubnetName = 'shared-services'
var gatewaySubnetName = 'GatewaySubnet'
var keyVaultPrivateDnsZoneName = 'privatelink.vaultcore.azure.net'
var keyVaultPrivateEndpointName = '${deploymentPrefix}-kv-pe-001'
var keyVaultPrivateLinkConnectionName = '${deploymentPrefix}-kv-pls-001'

resource hubVnet 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: hubVnetName
  location: primaryLocation
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        hubVnetAddressSpace
      ]
    }
  }
}

resource sharedServicesSubnet 'Microsoft.Network/virtualNetworks/subnets@2024-05-01' = {
  parent: hubVnet
  name: sharedServicesSubnetName
  properties: {
    addressPrefix: sharedServicesSubnetAddressPrefix
    defaultOutboundAccess: false
    privateEndpointNetworkPolicies: enablePrivateDnsAndEndpoints ? 'Disabled' : 'Enabled'
  }
}

// GatewaySubnet is reserved when reserveGatewaySubnet is true so a VPN gateway,
// ExpressRoute gateway, or Azure Virtual WAN can be added later without renumbering
// the hub. The gateway resource itself is not deployed by this module.
resource gatewaySubnet 'Microsoft.Network/virtualNetworks/subnets@2024-05-01' = if (reserveGatewaySubnet) {
  parent: hubVnet
  name: gatewaySubnetName
  properties: {
    addressPrefix: gatewaySubnetAddressPrefix
    defaultOutboundAccess: false
  }
}

resource keyVaultPrivateDnsZone 'Microsoft.Network/privateDnsZones@2024-06-01' = if (enablePrivateDnsAndEndpoints && !empty(keyVaultResourceId)) {
  name: keyVaultPrivateDnsZoneName
  location: 'global'
  tags: tags
}

resource keyVaultPrivateDnsZoneLink 'Microsoft.Network/privateDnsZones/virtualNetworkLinks@2024-06-01' = if (enablePrivateDnsAndEndpoints && !empty(keyVaultResourceId)) {
  parent: keyVaultPrivateDnsZone
  name: '${deploymentPrefix}-kv-link-001'
  location: 'global'
  properties: {
    registrationEnabled: false
    virtualNetwork: {
      id: hubVnet.id
    }
  }
}

resource keyVaultPrivateEndpoint 'Microsoft.Network/privateEndpoints@2024-05-01' = if (enablePrivateDnsAndEndpoints && !empty(keyVaultResourceId)) {
  name: keyVaultPrivateEndpointName
  location: primaryLocation
  tags: tags
  properties: {
    subnet: {
      id: sharedServicesSubnet.id
    }
    privateLinkServiceConnections: [
      {
        name: keyVaultPrivateLinkConnectionName
        properties: {
          privateLinkServiceId: keyVaultResourceId
          groupIds: [
            'vault'
          ]
          requestMessage: 'Private connectivity for the shared platform Key Vault.'
        }
      }
    ]
  }
}

resource keyVaultPrivateDnsZoneGroup 'Microsoft.Network/privateEndpoints/privateDnsZoneGroups@2024-05-01' = if (enablePrivateDnsAndEndpoints && !empty(keyVaultResourceId)) {
  parent: keyVaultPrivateEndpoint
  name: 'default'
  properties: {
    privateDnsZoneConfigs: [
      {
        name: 'vaultcore'
        properties: {
          privateDnsZoneId: keyVaultPrivateDnsZone.id
        }
      }
    ]
  }
}

output networkResourceGroupName string = resourceGroup().name
output vnetResourceId string = hubVnet.id
output vnetName string = hubVnet.name
output sharedServicesSubnetResourceId string = sharedServicesSubnet.id
output gatewaySubnetResourceId string = reserveGatewaySubnet ? gatewaySubnet.id : ''
output keyVaultPrivateEndpointResourceId string = enablePrivateDnsAndEndpoints && !empty(keyVaultResourceId) ? keyVaultPrivateEndpoint.id : ''
output keyVaultPrivateDnsZoneResourceId string = enablePrivateDnsAndEndpoints && !empty(keyVaultResourceId) ? keyVaultPrivateDnsZone.id : ''
output keyVaultPrivateEndpointImplemented bool = enablePrivateDnsAndEndpoints && !empty(keyVaultResourceId)
