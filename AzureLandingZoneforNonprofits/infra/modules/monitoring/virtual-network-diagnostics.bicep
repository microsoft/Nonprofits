targetScope = 'resourceGroup'

@description('Virtual network resource name.')
param virtualNetworkName string

@description('Shared Log Analytics workspace resource ID.')
param logAnalyticsWorkspaceResourceId string

@description('Diagnostic setting name.')
param diagnosticSettingName string = 'alz-vnet-diag'

resource virtualNetwork 'Microsoft.Network/virtualNetworks@2024-05-01' existing = {
  name: virtualNetworkName
}

resource virtualNetworkDiagnosticSetting 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: diagnosticSettingName
  scope: virtualNetwork
  properties: {
    workspaceId: logAnalyticsWorkspaceResourceId
    logAnalyticsDestinationType: 'Dedicated'
    logs: [
      {
        categoryGroup: 'allLogs'
        enabled: true
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
      }
    ]
  }
}

output diagnosticSetting object = {
  resourceType: 'Microsoft.Network/virtualNetworks'
  resourceId: virtualNetwork.id
  diagnosticSettingId: virtualNetworkDiagnosticSetting.id
}
