targetScope = 'tenant'

@description('Short deployment prefix.')
@maxLength(12)
param deploymentPrefix string

@description('Primary Azure region for the deployment.')
param primaryLocation string

@description('Optional additional tags.')
param tags object = {}

@description('Existing management subscription ID (GUID, 36 characters). Must already exist and be accessible to the deployment principal.')
@minLength(36)
@maxLength(36)
param managementSubscriptionId string

@description('Existing connectivity subscription ID (GUID, 36 characters). Must already exist and be accessible to the deployment principal.')
@minLength(36)
@maxLength(36)
param connectivitySubscriptionId string

@description('Service owner used for tags.')
param serviceOwner string

@description('Monthly budget amount for the Expanded Platform management subscription, in the target subscription billing currency. Leave at 0 to skip budget creation. Creating a budget requires the deployment principal to hold Cost Management Contributor (or Contributor / Owner) on the management subscription, and the subscription must be at least ~48 hours old; without those prerequisites the deployment will fail on the budget step. Set this to 0 if unsure and create the budget manually after deployment.')
param monthlyBudgetAmount int = 0

@description('Budget notification email addresses. Required when monthlyBudgetAmount > 0; ignored when monthlyBudgetAmount = 0.')
param budgetContactEmails array = []

@description('Approved regional locations. Defaults to the primary location only.')
param allowedLocations array = [
  primaryLocation
]

@description('Monitoring notification email addresses.')
param monitoringNotificationEmails array = []

@description('Defender for Cloud baseline. "recommended" enables paid Defender for Key Vault and Defender for Storage across the platform subscriptions managed by this deployment. "none" keeps existing paid Defender plan settings unchanged. The default is "none"; choose "recommended" only when recurring charges for Key Vault and Storage coverage are approved. Defender plans for App Service, SQL, Virtual Machines, and Kubernetes are not enabled by this deployment; enable them separately in Defender for Cloud when those workloads are deployed and recurring charges are approved.')
@allowed([
  'recommended'
  'none'
])
param defenderBaseline string = 'none'

@description('Optional Microsoft Entra group object ID for the organization platform administrators.')
param customerPlatformAdminsGroupObjectId string = ''

@description('Optional Microsoft Entra group object ID for the partner operators.')
param partnerOperatorsGroupObjectId string = ''

@description('Optional management group ID for an additional Platform management group governance assignment. Expanded Platform still applies governance directly to the management and connectivity subscriptions.')
param platformManagementGroupId string = ''

@description('Reserve the GatewaySubnet in the hub VNet so a VPN gateway, ExpressRoute gateway, or Azure Virtual WAN can be added later. This deployment reserves the subnet only; it does not create the gateway resource, public IP, or connection objects.')
param reserveGatewaySubnet bool = false

@description('Optional private DNS and Key Vault private endpoints flag.')
param enablePrivateDnsAndEndpoints bool = false

@description('Enable purge protection on the Expanded Platform management Key Vault. Defaults to true for steady-state platform environments; set false for evaluation deployments that need immediate teardown.')
param enableKeyVaultPurgeProtection bool = true

@description('Optional stable seed for the generated Expanded Platform management Key Vault name. Leave empty to preserve the default deterministic name; set a custom value only when an evaluation deployment must avoid a soft-deleted Key Vault name in the same resource group.')
param keyVaultNameSeed string = ''

@description('Address space for the Expanded Platform hub VNet.')
param hubVnetAddressSpace string = '10.30.0.0/16'

@description('Address prefix for the shared services subnet in the Expanded Platform hub VNet.')
param sharedServicesSubnetAddressPrefix string = '10.30.1.0/24'

@description('Address prefix for the gateway subnet in the Expanded Platform hub VNet.')
param gatewaySubnetAddressPrefix string = '10.30.254.0/27'

var usesSinglePlatformSubscription = toLower(managementSubscriptionId) == toLower(connectivitySubscriptionId)

module managementSlice '../../modules/shared/subscription-platform-slice.bicep' = {
  name: 'nonprofit-alz-${deploymentPrefix}-management-platform'
  scope: subscription(managementSubscriptionId)
  params: {
    deploymentPrefix: deploymentPrefix
    primaryLocation: primaryLocation
    serviceOwner: serviceOwner
    tags: tags
    sliceName: 'management'
    platformResourceGroupName: '${deploymentPrefix}-management-rg'
    createWorkspace: true
    createKeyVault: true
    keyVaultNameSeed: keyVaultNameSeed
    keyVaultPublicNetworkAccess: enablePrivateDnsAndEndpoints ? 'Disabled' : 'Enabled'
    enableKeyVaultPurgeProtection: enableKeyVaultPurgeProtection
    keyVaultSoftDeleteRetentionInDays: enableKeyVaultPurgeProtection ? 90 : 7
  }
}

module connectivitySlice '../../modules/shared/subscription-platform-slice.bicep' = {
  name: 'nonprofit-alz-${deploymentPrefix}-connectivity-platform'
  scope: subscription(connectivitySubscriptionId)
  params: {
    deploymentPrefix: deploymentPrefix
    primaryLocation: primaryLocation
    serviceOwner: serviceOwner
    tags: tags
    sliceName: 'connectivity'
    platformResourceGroupName: '${deploymentPrefix}-connectivity-rg'
    createWorkspace: false
    createKeyVault: false
  }
}

module expandedNetworking './../../modules/networking/expanded-network-profile.bicep' = {
  name: 'nonprofit-alz-${deploymentPrefix}-connectivity-network'
  scope: subscription(connectivitySubscriptionId)
  params: {
    deploymentPrefix: deploymentPrefix
    primaryLocation: primaryLocation
    tags: connectivitySlice.outputs.effectiveTags
    networkResourceGroupName: connectivitySlice.outputs.platformResourceGroupName
    keyVaultResourceId: managementSlice.outputs.keyVaultResourceId
    reserveGatewaySubnet: reserveGatewaySubnet
    enablePrivateDnsAndEndpoints: enablePrivateDnsAndEndpoints
    hubVnetAddressSpace: hubVnetAddressSpace
    sharedServicesSubnetAddressPrefix: sharedServicesSubnetAddressPrefix
    gatewaySubnetAddressPrefix: gatewaySubnetAddressPrefix
  }
}

module managementMonitoring '../../modules/monitoring/subscription-monitoring-baseline.bicep' = {
  name: 'nonprofit-alz-${deploymentPrefix}-management-monitoring'
  scope: subscription(managementSubscriptionId)
  params: {
    deploymentPrefix: deploymentPrefix
    primaryLocation: primaryLocation
    platformResourceGroupName: managementSlice.outputs.platformResourceGroupName
    logAnalyticsWorkspaceResourceId: managementSlice.outputs.logAnalyticsWorkspaceResourceId
    monitoringNotificationEmails: monitoringNotificationEmails
    keyVaultResourceId: managementSlice.outputs.keyVaultResourceId
    tags: managementSlice.outputs.effectiveTags
  }
}

module managementSecurity '../../modules/security/subscription-security-baseline.bicep' = {
  name: 'nonprofit-alz-${deploymentPrefix}-management-security'
  scope: subscription(managementSubscriptionId)
  params: {
    keyVaultResourceId: managementSlice.outputs.keyVaultResourceId
    defenderBaseline: defenderBaseline
    enablePrivateDnsAndEndpoints: enablePrivateDnsAndEndpoints
    keyVaultPrivateEndpointImplemented: expandedNetworking.outputs.keyVaultPrivateEndpointImplemented
  }
}

module connectivityMonitoring '../../modules/monitoring/subscription-monitoring-baseline.bicep' = {
  name: 'nonprofit-alz-${deploymentPrefix}-connectivity-monitoring'
  scope: subscription(connectivitySubscriptionId)
  params: {
    deploymentPrefix: deploymentPrefix
    primaryLocation: primaryLocation
    platformResourceGroupName: connectivitySlice.outputs.platformResourceGroupName
    logAnalyticsWorkspaceResourceId: managementSlice.outputs.logAnalyticsWorkspaceResourceId
    monitoringNotificationEmails: monitoringNotificationEmails
    enableSubscriptionActivityLogDiagnostics: !usesSinglePlatformSubscription
    enableActivityLogAlerts: !usesSinglePlatformSubscription
    virtualNetworkResourceId: expandedNetworking.outputs.vnetResourceId
    tags: connectivitySlice.outputs.effectiveTags
  }
}

module connectivitySecurity '../../modules/security/subscription-security-baseline.bicep' = if (!usesSinglePlatformSubscription) {
  name: 'nonprofit-alz-${deploymentPrefix}-connectivity-security'
  scope: subscription(connectivitySubscriptionId)
  params: {
    defenderBaseline: defenderBaseline
    enablePrivateDnsAndEndpoints: false
  }
}

var aggregatedMonitoringDiagnosticOnboardingStatuses = [
  managementMonitoring.outputs.diagnosticOnboardingStatus
  connectivityMonitoring.outputs.diagnosticOnboardingStatus
]
var governanceDiagnosticOnboardingStatus = contains(aggregatedMonitoringDiagnosticOnboardingStatuses, 'active-with-skipped-resource-types') ? 'active-with-skipped-resource-types' : contains(aggregatedMonitoringDiagnosticOnboardingStatuses, 'not-configured-no-workspace') ? 'not-configured-no-workspace' : 'active-via-monitoring-baseline'

module platformManagementGroupGovernance '../../modules/governance/management-group-governance-baseline.bicep' = if (!empty(platformManagementGroupId)) {
  name: 'nonprofit-alz-${deploymentPrefix}-platform-mg-governance'
  scope: managementGroup(platformManagementGroupId)
  params: {
    deploymentPrefix: deploymentPrefix
    allowedLocations: allowedLocations
    serviceOwner: serviceOwner
    primaryLocation: primaryLocation
    logAnalyticsWorkspaceResourceId: managementSlice.outputs.logAnalyticsWorkspaceResourceId
    diagnosticOnboardingStatus: governanceDiagnosticOnboardingStatus
  }
}

module managementSubscriptionGovernance '../../modules/governance/subscription-governance-baseline.bicep' = {
  name: 'nonprofit-alz-${deploymentPrefix}-management-governance'
  scope: subscription(managementSubscriptionId)
  params: {
    deploymentPrefix: deploymentPrefix
    allowedLocations: allowedLocations
    serviceOwner: serviceOwner
    primaryLocation: primaryLocation
    logAnalyticsWorkspaceResourceId: managementSlice.outputs.logAnalyticsWorkspaceResourceId
    diagnosticOnboardingStatus: managementMonitoring.outputs.diagnosticOnboardingStatus
  }
}

module connectivitySubscriptionGovernance '../../modules/governance/subscription-governance-baseline.bicep' = if (!usesSinglePlatformSubscription) {
  name: 'nonprofit-alz-${deploymentPrefix}-connectivity-governance'
  scope: subscription(connectivitySubscriptionId)
  params: {
    deploymentPrefix: deploymentPrefix
    allowedLocations: allowedLocations
    serviceOwner: serviceOwner
    primaryLocation: primaryLocation
    logAnalyticsWorkspaceResourceId: managementSlice.outputs.logAnalyticsWorkspaceResourceId
    diagnosticOnboardingStatus: connectivityMonitoring.outputs.diagnosticOnboardingStatus
  }
}

module managementBudget '../../modules/governance/foundation-budget.bicep' = {
  name: 'nonprofit-alz-${deploymentPrefix}-management-budget'
  scope: subscription(managementSubscriptionId)
  params: {
    deploymentPrefix: deploymentPrefix
    monthlyBudgetAmount: monthlyBudgetAmount
    budgetContactEmails: budgetContactEmails
    budgetNameSuffix: 'management'
    budgetScopeLabel: 'Expanded Platform management subscription'
  }
}

module managementIdentity './../../modules/identity/subscription-access-baseline.bicep' = {
  name: 'nonprofit-alz-${deploymentPrefix}-management-access'
  scope: subscription(managementSubscriptionId)
  params: {
    deploymentPrefix: deploymentPrefix
    customerPlatformAdminsGroupObjectId: customerPlatformAdminsGroupObjectId
    partnerOperatorsGroupObjectId: partnerOperatorsGroupObjectId
    partnerContributorResourceGroupNames: usesSinglePlatformSubscription ? [
      managementSlice.outputs.platformResourceGroupName
      connectivitySlice.outputs.platformResourceGroupName
    ] : [
      managementSlice.outputs.platformResourceGroupName
    ]
    logAnalyticsWorkspaceResourceId: managementSlice.outputs.logAnalyticsWorkspaceResourceId
  }
}

module connectivityIdentity './../../modules/identity/subscription-access-baseline.bicep' = if (!usesSinglePlatformSubscription) {
  name: 'nonprofit-alz-${deploymentPrefix}-connectivity-access'
  scope: subscription(connectivitySubscriptionId)
  params: {
    deploymentPrefix: deploymentPrefix
    customerPlatformAdminsGroupObjectId: customerPlatformAdminsGroupObjectId
    partnerOperatorsGroupObjectId: partnerOperatorsGroupObjectId
    partnerContributorResourceGroupNames: [
      connectivitySlice.outputs.platformResourceGroupName
    ]
    logAnalyticsWorkspaceResourceId: ''
  }
}

var networkingHighImpactWarnings = expandedNetworking.outputs.highImpactWarnings
var aggregatedSecurityFollowUpActions = union(
  managementSecurity.outputs.securityFollowUpActions,
  usesSinglePlatformSubscription ? [] : connectivitySecurity!.outputs.securityFollowUpActions
)
var identityFollowUpActions = concat(
  empty(customerPlatformAdminsGroupObjectId) ? [
    'Provide the organization platform administrators group and verify Owner access on the platform subscriptions.'
  ] : [],
  empty(partnerOperatorsGroupObjectId) ? [
    'Provide the partner operators group before enabling delegated partner operations.'
  ] : []
)

var followUpActions = concat(
  identityFollowUpActions,
  empty(monitoringNotificationEmails) ? [
    'Configure monitoring notification routing before relying on alert response.'
  ] : [],
  !empty(managementBudget.outputs.budgetFollowUpAction) ? [
    managementBudget.outputs.budgetFollowUpAction
  ] : [],
  !enableKeyVaultPurgeProtection ? [
    'Expanded Platform management Key Vault was deployed with purge protection disabled so evaluation deployments can be removed promptly. Enable purge protection before storing platform secrets that must survive accidental deletion.'
  ] : [],
  length(allowedLocations) == 0 ? [
    'Provide at least one allowed location so governance policies can be assigned consistently.'
  ] : [],
  aggregatedSecurityFollowUpActions,
  managementMonitoring.outputs.followUpActions,
  connectivityMonitoring.outputs.followUpActions,
  expandedNetworking.outputs.networkingFollowUpActions
)

output deploymentMode string = 'expanded-platform'
output createdManagementGroupIds array = []
output platformResourceGroupName string = managementSlice.outputs.platformResourceGroupName
output networkResourceGroupName string = expandedNetworking.outputs.networkResourceGroupName
output logAnalyticsWorkspaceResourceId string = managementSlice.outputs.logAnalyticsWorkspaceResourceId
output keyVaultResourceId string = managementSlice.outputs.keyVaultResourceId
output vnetResourceId string = expandedNetworking.outputs.vnetResourceId
output keyVaultPrivateEndpointResourceId string = expandedNetworking.outputs.keyVaultPrivateEndpointResourceId
output networkingHighImpactWarnings array = networkingHighImpactWarnings
output securityKeyVaultPrivateHardeningStatus string = managementSecurity.outputs.keyVaultPrivateHardeningStatus
output governanceBudgetStatus string = managementBudget.outputs.budgetStatus
output handoverReady bool = managementIdentity.outputs.customerOwnedAccessConfigured
output alertResponseReady bool = managementMonitoring.outputs.alertResponseReady && (usesSinglePlatformSubscription || connectivityMonitoring.outputs.alertResponseReady)
output followUpActions array = followUpActions
