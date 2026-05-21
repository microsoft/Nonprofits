targetScope = 'resourceGroup'

@description('Key Vault resource name.')
param keyVaultName string

@description('Shared Log Analytics workspace resource ID.')
param logAnalyticsWorkspaceResourceId string

@description('Diagnostic setting name.')
param diagnosticSettingName string = 'alz-kv-diag'

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' existing = {
  name: keyVaultName
}

resource keyVaultDiagnosticSetting 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: diagnosticSettingName
  scope: keyVault
  properties: {
    workspaceId: logAnalyticsWorkspaceResourceId
    logAnalyticsDestinationType: 'Dedicated'
    logs: [
      {
        category: 'AuditEvent'
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
  resourceType: 'Microsoft.KeyVault/vaults'
  resourceId: keyVault.id
  diagnosticSettingId: keyVaultDiagnosticSetting.id
}
