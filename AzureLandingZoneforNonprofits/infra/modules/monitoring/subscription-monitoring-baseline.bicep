targetScope = 'subscription'

@description('Short deployment prefix.')
@maxLength(12)
param deploymentPrefix string

@description('Primary Azure region for the deployment.')
param primaryLocation string

@description('Platform resource group name for monitoring resources such as the action group and activity log alerts.')
param platformResourceGroupName string

@description('Shared Log Analytics workspace resource ID.')
param logAnalyticsWorkspaceResourceId string

@description('Monitoring notification email addresses.')
param monitoringNotificationEmails array = []

@description('Create subscription Activity Log diagnostic settings. Disable only when another module in the same deployment already owns subscription Activity Log routing for this subscription.')
param enableSubscriptionActivityLogDiagnostics bool = true

@description('Create subscription Activity Log alert resources. Disable only when another module in the same deployment already owns subscription alerting for this subscription.')
param enableActivityLogAlerts bool = true

@description('Optional Key Vault resource ID that should route diagnostics to the shared workspace.')
param keyVaultResourceId string = ''

@description('Optional virtual network resource ID that should route diagnostics to the shared workspace.')
param virtualNetworkResourceId string = ''

@description('Optional common tags applied to monitoring resources that support tags.')
param tags object = {}

var activityLogDiagnosticSettingName = '${deploymentPrefix}-activitylog'
var activityLogCategories = [
  'Administrative'
  'Policy'
  'Security'
  'ServiceHealth'
  'Alert'
  'Recommendation'
]
var workspaceConfigured = !empty(logAnalyticsWorkspaceResourceId)
var subscriptionActivityLogDiagnosticsEnabled = workspaceConfigured && enableSubscriptionActivityLogDiagnostics
var activityLogAlertsEnabled = !empty(monitoringNotificationEmails) && enableActivityLogAlerts
var skippedMonitoringActions = concat(
  !workspaceConfigured ? [
    {
      subscriptionId: subscription().subscriptionId
      action: 'workspace-routing'
      reason: 'log-analytics-workspace-resource-id-not-supplied'
    }
  ] : [],
  workspaceConfigured && !enableSubscriptionActivityLogDiagnostics ? [
    {
      subscriptionId: subscription().subscriptionId
      action: 'subscription-activity-log-diagnostics'
      reason: 'subscription-activity-log-diagnostics-disabled'
    }
  ] : [],
  empty(monitoringNotificationEmails) && enableActivityLogAlerts ? [
    {
      subscriptionId: subscription().subscriptionId
      action: 'activity-log-alerts'
      reason: 'monitoring-notification-emails-not-supplied'
    }
  ] : [],
  !enableActivityLogAlerts ? [
    {
      subscriptionId: subscription().subscriptionId
      action: 'activity-log-alerts'
      reason: 'activity-log-alerts-disabled'
    }
  ] : []
)
var followUpActions = concat(
  !workspaceConfigured ? [
    'Monitoring diagnostics were skipped because logAnalyticsWorkspaceResourceId was not provided. Supply the shared workspace before declaring diagnostic onboarding complete.'
  ] : [],
  empty(monitoringNotificationEmails) && enableActivityLogAlerts ? [
    'Monitoring alerts were skipped because monitoringNotificationEmails was not provided. Add at least one recipient before declaring alert-response readiness.'
  ] : []
)
var diagnosticOnboardingStatus = workspaceConfigured ? 'active-via-monitoring-baseline' : 'not-configured-no-workspace'

resource platformResourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' existing = {
  name: platformResourceGroupName
}

// API version note (applies to every Microsoft.Insights/diagnosticSettings resource in this
// solution: this module plus keyvault-diagnostics and virtual-network-diagnostics):
// 2021-05-01-preview is intentionally used. The only non-preview diagnosticSettings API versions
// (2015-07-01 and 2016-09-01) do not support logAnalyticsDestinationType: 'Dedicated' and use an
// older logs/metrics shape. 2021-05-01-preview is the de facto production version used by
// Azure Verified Modules, the CAF/ALZ accelerator, and current Microsoft Learn quickstarts, so
// we keep it across all diagnosticSettings resources here.
resource activityLogDiagnosticSetting 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (subscriptionActivityLogDiagnosticsEnabled) {
  name: activityLogDiagnosticSettingName
  properties: {
    workspaceId: logAnalyticsWorkspaceResourceId
    logAnalyticsDestinationType: 'Dedicated'
    logs: [for category in activityLogCategories: {
      category: category
      enabled: true
    }]
  }
}

module activityLogAlerts './activity-log-alerts.bicep' = if (activityLogAlertsEnabled) {
  name: '${deploymentPrefix}-activity-alerts'
  scope: platformResourceGroup
  params: {
    deploymentPrefix: deploymentPrefix
    monitoringNotificationEmails: monitoringNotificationEmails
    tags: union(tags, {
      PrimaryLocation: primaryLocation
    })
  }
}

module keyVaultDiagnostics './keyvault-diagnostics.bicep' = if (workspaceConfigured && !empty(keyVaultResourceId)) {
  name: '${deploymentPrefix}-keyvault-monitoring-${uniqueString(keyVaultResourceId)}'
  scope: resourceGroup(split(keyVaultResourceId, '/')[4])
  params: {
    keyVaultName: split(keyVaultResourceId, '/')[8]
    logAnalyticsWorkspaceResourceId: logAnalyticsWorkspaceResourceId
    diagnosticSettingName: '${deploymentPrefix}-kv-diag'
  }
}

module virtualNetworkDiagnostics './virtual-network-diagnostics.bicep' = if (workspaceConfigured && !empty(virtualNetworkResourceId)) {
  name: '${deploymentPrefix}-vnet-monitoring-${uniqueString(virtualNetworkResourceId)}'
  scope: resourceGroup(split(virtualNetworkResourceId, '/')[4])
  params: {
    virtualNetworkName: split(virtualNetworkResourceId, '/')[8]
    logAnalyticsWorkspaceResourceId: logAnalyticsWorkspaceResourceId
    diagnosticSettingName: '${deploymentPrefix}-vnet-diag'
  }
}

output sharedLogAnalyticsWorkspaceResourceId string = logAnalyticsWorkspaceResourceId
output diagnosticOnboardingStatus string = diagnosticOnboardingStatus
output alertResponseReady bool = activityLogAlertsEnabled
output activityLogDiagnosticSettings array = subscriptionActivityLogDiagnosticsEnabled ? [
  {
    subscriptionId: subscription().subscriptionId
    diagnosticSettingId: activityLogDiagnosticSetting.id
  }
] : []
output alertResources array = activityLogAlertsEnabled ? activityLogAlerts!.outputs.alertResources : []
output resourceDiagnosticSettings array = concat(
  workspaceConfigured && !empty(keyVaultResourceId) ? [
    {
      subscriptionId: subscription().subscriptionId
      resourceType: keyVaultDiagnostics!.outputs.diagnosticSetting.resourceType
      resourceId: keyVaultDiagnostics!.outputs.diagnosticSetting.resourceId
      diagnosticSettingId: keyVaultDiagnostics!.outputs.diagnosticSetting.diagnosticSettingId
    }
  ] : [],
  workspaceConfigured && !empty(virtualNetworkResourceId) ? [
    {
      subscriptionId: subscription().subscriptionId
      resourceType: virtualNetworkDiagnostics!.outputs.diagnosticSetting.resourceType
      resourceId: virtualNetworkDiagnostics!.outputs.diagnosticSetting.resourceId
      diagnosticSettingId: virtualNetworkDiagnostics!.outputs.diagnosticSetting.diagnosticSettingId
    }
  ] : []
)
output skippedMonitoringActions array = skippedMonitoringActions
output followUpActions array = followUpActions
