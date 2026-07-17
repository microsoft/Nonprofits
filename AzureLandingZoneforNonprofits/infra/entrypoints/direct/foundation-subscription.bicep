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

@description('Monthly budget amount for the Foundation subscription, in the target subscription billing currency. Leave at 0 to skip budget creation. Creating a budget requires the deployment principal to hold Cost Management Contributor (or Contributor / Owner) on the target subscription, and the subscription must be at least ~48 hours old; without those prerequisites the deployment will fail on the budget step. Set this to 0 if unsure and create the budget manually after deployment.')
param monthlyBudgetAmount int = 0

@description('Budget notification email addresses. Required when monthlyBudgetAmount > 0; ignored when monthlyBudgetAmount = 0.')
param budgetContactEmails array = []

@description('Monitoring notification email addresses.')
param monitoringNotificationEmails array = []

@description('Defender for Cloud baseline. "recommended" enables paid Defender for Key Vault and Defender for Storage. "none" keeps existing paid Defender plan settings unchanged. The default is "none"; choose "recommended" only when recurring charges for Key Vault and Storage coverage are approved. Defender plans for App Service, SQL, Virtual Machines, and Kubernetes are not enabled by this deployment; enable them separately in Defender for Cloud when those workloads are deployed and recurring charges are approved.')
@allowed([
  'recommended'
  'none'
])
param defenderBaseline string = 'none'

@description('Optional Microsoft Entra group object ID for the organization platform administrators.')
param customerPlatformAdminsGroupObjectId string = ''

@description('Optional Microsoft Entra group object ID for the partner operators.')
param partnerOperatorsGroupObjectId string = ''

@description('Deploy the optional simple Foundation network baseline.')
param enableSimpleNetwork bool = false

@description('Enable private DNS and a private endpoint for the shared platform Key Vault, and disable its public endpoint. In Foundation this requires the simple network baseline. When false, the public endpoint remains enabled but the Key Vault firewall denies all public IP and virtual-network traffic by default.')
param enablePrivateDnsAndEndpoints bool = false

@description('Enable purge protection on the Foundation platform Key Vault. Defaults to false so evaluation deployments stay reversible (purge protection is irrevocable for 7 days once turned on). Enable this once the environment will hold real platform secrets that must survive accidental deletion.')
param enableKeyVaultPurgeProtection bool = false

@description('Optional stable seed for the generated Foundation platform Key Vault name. Leave empty to preserve the default deterministic name; set a custom value only when an evaluation deployment must avoid a soft-deleted Key Vault name in the same resource group.')
param keyVaultNameSeed string = ''

module foundationInputValidation '../../modules/networking/validation/foundation-input-validation.bicep' = {
  name: 'nonprofit-alz-${deploymentPrefix}-foundation-validation'
  scope: subscription()
  params: {
    enablePrivateDnsAndEndpoints: enablePrivateDnsAndEndpoints
    enableSimpleNetwork: enableSimpleNetwork
  }
}

module foundationPlatformBaseline '../../modules/shared/foundation-platform-baseline.bicep' = {
  name: 'nonprofit-alz-${deploymentPrefix}-foundation-platform-baseline'
  scope: subscription()
  dependsOn: [
    foundationInputValidation
  ]
  params: {
    deploymentPrefix: deploymentPrefix
    primaryLocation: primaryLocation
    serviceOwner: serviceOwner
    tags: tags
    enableSimpleNetwork: enableSimpleNetwork
    enablePrivateDnsAndEndpoints: enablePrivateDnsAndEndpoints
    enableKeyVaultPurgeProtection: enableKeyVaultPurgeProtection
    keyVaultNameSeed: keyVaultNameSeed
  }
}

module foundationMonitoring '../../modules/monitoring/subscription-monitoring-baseline.bicep' = {
  name: 'nonprofit-alz-${deploymentPrefix}-foundation-monitoring'
  scope: subscription()
  params: {
    deploymentPrefix: deploymentPrefix
    primaryLocation: primaryLocation
    platformResourceGroupName: foundationPlatformBaseline.outputs.platformResourceGroupName
    logAnalyticsWorkspaceResourceId: foundationPlatformBaseline.outputs.logAnalyticsWorkspaceResourceId
    monitoringNotificationEmails: monitoringNotificationEmails
    keyVaultResourceId: foundationPlatformBaseline.outputs.keyVaultResourceId
    virtualNetworkResourceId: foundationPlatformBaseline.outputs.vnetResourceId
    tags: foundationPlatformBaseline.outputs.effectiveTags
  }
}

module foundationSecurity '../../modules/security/subscription-security-baseline.bicep' = {
  name: 'nonprofit-alz-${deploymentPrefix}-foundation-security'
  scope: subscription()
  params: {
    keyVaultResourceId: foundationPlatformBaseline.outputs.keyVaultResourceId
    defenderBaseline: defenderBaseline
    enablePrivateDnsAndEndpoints: enablePrivateDnsAndEndpoints
    keyVaultPrivateEndpointImplemented: foundationPlatformBaseline.outputs.privateKeyVaultConnectivityEnabled
  }
}

module foundationBudget '../../modules/governance/foundation-budget.bicep' = {
  name: 'nonprofit-alz-${deploymentPrefix}-foundation-budget'
  scope: subscription()
  params: {
    deploymentPrefix: deploymentPrefix
    monthlyBudgetAmount: monthlyBudgetAmount
    budgetContactEmails: budgetContactEmails
  }
}

module foundationIdentity './../../modules/identity/subscription-access-baseline.bicep' = {
  name: 'nonprofit-alz-${deploymentPrefix}-foundation-access'
  scope: subscription()
  params: {
    deploymentPrefix: deploymentPrefix
    customerPlatformAdminsGroupObjectId: customerPlatformAdminsGroupObjectId
    partnerOperatorsGroupObjectId: partnerOperatorsGroupObjectId
    partnerContributorResourceGroupNames: concat(
      [
        foundationPlatformBaseline.outputs.platformResourceGroupName
      ],
      !empty(foundationPlatformBaseline.outputs.networkResourceGroupName) ? [
        foundationPlatformBaseline.outputs.networkResourceGroupName
      ] : []
    )
    logAnalyticsWorkspaceResourceId: foundationPlatformBaseline.outputs.logAnalyticsWorkspaceResourceId
  }
}

var identityFollowUpActions = concat(
  empty(customerPlatformAdminsGroupObjectId) ? [
    'Provide the organization platform administrators group and verify Owner access on the subscription.'
  ] : [],
  empty(partnerOperatorsGroupObjectId) ? [
    'Provide the partner operators group before enabling delegated partner operations.'
  ] : []
)

var followUpActions = concat(
  identityFollowUpActions,
  foundationPlatformBaseline.outputs.networkingFollowUpActions,
  empty(monitoringNotificationEmails) ? [
    'Configure monitoring notification routing before relying on alert response.'
  ] : [],
  !enableKeyVaultPurgeProtection ? [
    'Platform Key Vault was deployed with purge protection disabled so evaluation deployments can be removed promptly. Before storing secrets that must survive accidental deletion, set enableKeyVaultPurgeProtection to true and re-deploy. Note that once turned on it cannot be turned off for the 7-day soft-delete retention window.'
  ] : [],
  foundationSecurity.outputs.securityFollowUpActions,
  foundationMonitoring.outputs.followUpActions,
  !empty(foundationBudget.outputs.budgetFollowUpAction) ? [
    foundationBudget.outputs.budgetFollowUpAction
  ] : []
)

output deploymentMode string = 'foundation-subscription'
output createdManagementGroupIds array = []
output platformResourceGroupName string = foundationPlatformBaseline.outputs.platformResourceGroupName
output networkResourceGroupName string = foundationPlatformBaseline.outputs.networkResourceGroupName
output logAnalyticsWorkspaceResourceId string = foundationPlatformBaseline.outputs.logAnalyticsWorkspaceResourceId
output keyVaultResourceId string = foundationPlatformBaseline.outputs.keyVaultResourceId
output vnetResourceId string = foundationPlatformBaseline.outputs.vnetResourceId
output applicationSubnetResourceId string = foundationPlatformBaseline.outputs.applicationSubnetResourceId
output applicationNetworkSecurityGroupResourceId string = foundationPlatformBaseline.outputs.applicationNetworkSecurityGroupResourceId
output keyVaultPrivateEndpointResourceId string = foundationPlatformBaseline.outputs.keyVaultPrivateEndpointResourceId
output securityKeyVaultPrivateHardeningStatus string = foundationSecurity.outputs.keyVaultPrivateHardeningStatus
output governanceBudgetStatus string = foundationBudget.outputs.budgetStatus
output upgradeStatus string = 'not-applicable'
output hubToExistingFoundationPeeringIds array = []
output handoverReady bool = foundationIdentity.outputs.customerOwnedAccessConfigured
output alertResponseReady bool = foundationMonitoring.outputs.alertResponseReady
output followUpActions array = followUpActions
