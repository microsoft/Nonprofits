targetScope = 'resourceGroup'

@description('Short deployment prefix.')
@maxLength(12)
param deploymentPrefix string

@description('Primary Azure region for the Foundation networking resources.')
param primaryLocation string

@description('Optional common tags applied to Foundation networking resources.')
param tags object = {}

@description('Shared platform Key Vault resource ID used for the optional private endpoint path.')
param keyVaultResourceId string = ''

@description('Enable private DNS and a private endpoint for the shared platform Key Vault.')
param enablePrivateDnsAndEndpoints bool = false

@description('Address space for the Foundation VNet.')
param vnetAddressSpace string = '10.20.0.0/22'

@description('Address prefix for the application subnet in the Foundation VNet.')
param applicationSubnetAddressPrefix string = '10.20.1.0/24'

@description('Address prefix for the private endpoints subnet in the Foundation VNet.')
param privateEndpointsSubnetAddressPrefix string = '10.20.2.0/24'

var foundationVnetName = '${deploymentPrefix}-vnet-001'
var applicationSubnetName = 'application'
var applicationNetworkSecurityGroupName = '${deploymentPrefix}-app-nsg-001'
var privateEndpointsSubnetName = 'private-endpoints'

module tagInheritance '../governance/resource-group-tag-inheritance.bicep' = {
  name: 'rg-tag-inheritance-${uniqueString(resourceGroup().id)}'
  params: {
    deploymentPrefix: deploymentPrefix
    primaryLocation: primaryLocation
  }
}
var keyVaultPrivateDnsZoneName = 'privatelink.vaultcore.azure.net'
var keyVaultPrivateEndpointName = '${deploymentPrefix}-kv-pe-001'
var keyVaultPrivateLinkConnectionName = '${deploymentPrefix}-kv-pls-001'

resource foundationVnet 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: foundationVnetName
  location: primaryLocation
  tags: tags
  properties: {
    addressSpace: {
      addressPrefixes: [
        vnetAddressSpace
      ]
    }
  }
}

resource applicationNetworkSecurityGroup 'Microsoft.Network/networkSecurityGroups@2024-05-01' = {
  name: applicationNetworkSecurityGroupName
  location: primaryLocation
  tags: tags
}

// Keep baseline rules as child resources so their ownership is explicit and the
// parent NSG doesn't declare a complete inline rule collection. Always review
// what-if before rerunning against an NSG with workload-specific rules.
resource denyInternetInboundRule 'Microsoft.Network/networkSecurityGroups/securityRules@2024-05-01' = {
  parent: applicationNetworkSecurityGroup
  name: 'DenyInternetInbound'
  properties: {
    description: 'Blocks unsolicited internet ingress to future Foundation workloads.'
    protocol: '*'
    sourcePortRange: '*'
    destinationPortRange: '*'
    sourceAddressPrefix: 'Internet'
    destinationAddressPrefix: '*'
    access: 'Deny'
    priority: 4095
    direction: 'Inbound'
  }
}

resource denyInternetOutboundRule 'Microsoft.Network/networkSecurityGroups/securityRules@2024-05-01' = {
  parent: applicationNetworkSecurityGroup
  name: 'DenyInternetOutbound'
  properties: {
    description: 'Requires future Foundation workloads to use an explicitly approved outbound design.'
    protocol: '*'
    sourcePortRange: '*'
    destinationPortRange: '*'
    sourceAddressPrefix: '*'
    destinationAddressPrefix: 'Internet'
    access: 'Deny'
    priority: 4096
    direction: 'Outbound'
  }
}

resource applicationSubnet 'Microsoft.Network/virtualNetworks/subnets@2024-05-01' = {
  parent: foundationVnet
  name: applicationSubnetName
  properties: {
    addressPrefix: applicationSubnetAddressPrefix
    defaultOutboundAccess: false
    networkSecurityGroup: {
      id: applicationNetworkSecurityGroup.id
    }
  }
}

resource privateEndpointsSubnet 'Microsoft.Network/virtualNetworks/subnets@2024-05-01' = if (enablePrivateDnsAndEndpoints) {
  parent: foundationVnet
  name: privateEndpointsSubnetName
  properties: {
    addressPrefix: privateEndpointsSubnetAddressPrefix
    defaultOutboundAccess: false
    privateEndpointNetworkPolicies: 'Disabled'
  }
  dependsOn: [
    applicationSubnet
  ]
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
      id: foundationVnet.id
    }
  }
}

resource keyVaultPrivateEndpoint 'Microsoft.Network/privateEndpoints@2024-05-01' = if (enablePrivateDnsAndEndpoints && !empty(keyVaultResourceId)) {
  name: keyVaultPrivateEndpointName
  location: primaryLocation
  tags: tags
  properties: {
    subnet: {
      id: privateEndpointsSubnet.id
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

output vnetResourceId string = foundationVnet.id
output applicationSubnetResourceId string = applicationSubnet.id
output applicationNetworkSecurityGroupResourceId string = applicationNetworkSecurityGroup.id
output privateEndpointsSubnetResourceId string = enablePrivateDnsAndEndpoints ? privateEndpointsSubnet.id : ''
output keyVaultPrivateEndpointResourceId string = enablePrivateDnsAndEndpoints && !empty(keyVaultResourceId) ? keyVaultPrivateEndpoint.id : ''
output keyVaultPrivateDnsZoneResourceId string = enablePrivateDnsAndEndpoints && !empty(keyVaultResourceId) ? keyVaultPrivateDnsZone.id : ''
