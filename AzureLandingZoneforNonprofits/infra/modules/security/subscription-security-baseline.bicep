targetScope = 'subscription'

@description('Shared platform Key Vault resource ID when this subscription has a platform Key Vault.')
param keyVaultResourceId string = ''

@description('Defender for Cloud baseline. "recommended" enables paid Defender plans for Key Vault and Storage. Storage uses the current DefenderForStorageV2 plan with malware scanning and sensitive data discovery disabled by this deployment. "none" keeps existing paid Defender plan settings unchanged so pre-existing tenant or CSP configuration is preserved. Defender plans for App Service, SQL, Virtual Machines, and Kubernetes are not enabled by this deployment; enable them separately in Defender for Cloud after deployment.')
@allowed([
  'recommended'
  'none'
])
param defenderBaseline string = 'none'

@description('Request stronger private Key Vault isolation. The networking profile implements the private endpoint and private DNS path.')
param enablePrivateDnsAndEndpoints bool = false

@description('True when the selected networking profile actually implements the requested private endpoint path for the shared platform Key Vault.')
param keyVaultPrivateEndpointImplemented bool = false

var defenderRecommended = defenderBaseline == 'recommended'
var keyVaultPrivateHardeningStatus = !empty(keyVaultResourceId) ? (enablePrivateDnsAndEndpoints ? (keyVaultPrivateEndpointImplemented ? 'implemented-via-networking-profile' : 'requested-but-not-implemented') : 'not-requested') : 'not-applicable-no-keyvault-in-scope'
var securityFollowUpActions = concat(
  !empty(keyVaultResourceId) && !enablePrivateDnsAndEndpoints ? [
    'Key Vault uses public network access by default. Enable private DNS and the Key Vault private endpoint later only when private-only secret access is required or a compliance review requires it.'
  ] : [],
  !empty(keyVaultResourceId) && enablePrivateDnsAndEndpoints && !keyVaultPrivateEndpointImplemented ? [
    'Key Vault private connectivity was requested, but the selected networking profile did not implement the required private endpoint and private DNS path. Complete the networking prerequisite or disable private-only Key Vault access.'
  ] : [],
  defenderRecommended ? [
    'Defender for Storage uses the current subscription-level DefenderForStorageV2 plan. Malware scanning and sensitive data discovery are not enabled by this deployment; enable those extensions separately in Defender for Cloud when recurring scanning costs are approved.'
  ] : [],
  [
    'This deployment does not enable Defender plans for App Service, SQL Servers, Virtual Machines, or Kubernetes. If those workloads later run in this subscription, enable the matching Defender plans manually in Defender for Cloud after recurring charges are approved.'
    'Document periodic privileged access review expectations, audit and platform log retention, and fundraising or payment-adjacent workload review boundaries in the operations documentation.'
  ]
)

resource keyVaultsPricing 'Microsoft.Security/pricings@2024-01-01' = if (defenderRecommended) {
  name: 'KeyVaults'
  properties: {
    pricingTier: 'Standard'
  }
}

resource storageAccountsPricing 'Microsoft.Security/pricings@2024-01-01' = if (defenderRecommended) {
  name: 'StorageAccounts'
  properties: {
    pricingTier: 'Standard'
    subPlan: 'DefenderForStorageV2'
    extensions: [
      {
        name: 'OnUploadMalwareScanning'
        isEnabled: 'False'
      }
      {
        name: 'SensitiveDataDiscovery'
        isEnabled: 'False'
      }
    ]
  }
}

output keyVaultResourceId string = keyVaultResourceId
output keyVaultPrivateHardeningStatus string = keyVaultPrivateHardeningStatus
output defenderBaseline string = defenderBaseline
output securityFollowUpActions array = securityFollowUpActions
