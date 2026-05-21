targetScope = 'resourceGroup'

@description('Short deployment prefix.')
@maxLength(12)
param deploymentPrefix string

@description('Monitoring notification email addresses.')
param monitoringNotificationEmails array

@description('Optional common tags applied to monitoring resources that support tags.')
param tags object = {}

var actionGroupName = '${deploymentPrefix}-mon-ag-001'
var actionGroupShortNameSeed = replace('${deploymentPrefix}ops', '-', '')
var actionGroupShortName = empty(actionGroupShortNameSeed) ? 'alzops' : take(actionGroupShortNameSeed, 12)
var serviceHealthAlertName = '${deploymentPrefix}-servicehealth-001'
var plannedMaintenanceAlertName = '${deploymentPrefix}-plannedmaint-001'

resource monitoringActionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: actionGroupName
  location: 'global'
  tags: tags
  properties: {
    enabled: true
    groupShortName: actionGroupShortName
    emailReceivers: [for (emailAddress, index) in monitoringNotificationEmails: {
      name: 'email${index + 1}'
      emailAddress: emailAddress
      useCommonAlertSchema: true
    }]
  }
}

resource serviceHealthAlert 'Microsoft.Insights/activityLogAlerts@2023-01-01-preview' = {
  name: serviceHealthAlertName
  location: 'global'
  tags: tags
  properties: {
    enabled: true
    scopes: [
      subscription().id
    ]
    condition: {
      allOf: [
        {
          field: 'category'
          equals: 'ServiceHealth'
        }
        {
          field: 'properties.incidentType'
          equals: 'Incident'
        }
      ]
    }
    actions: {
      actionGroups: [
        {
          actionGroupId: monitoringActionGroup.id
        }
      ]
    }
  }
}

resource plannedMaintenanceAlert 'Microsoft.Insights/activityLogAlerts@2023-01-01-preview' = {
  name: plannedMaintenanceAlertName
  location: 'global'
  tags: tags
  properties: {
    enabled: true
    scopes: [
      subscription().id
    ]
    condition: {
      allOf: [
        {
          field: 'category'
          equals: 'ServiceHealth'
        }
        {
          field: 'properties.incidentType'
          equals: 'PlannedMaintenance'
        }
      ]
    }
    actions: {
      actionGroups: [
        {
          actionGroupId: monitoringActionGroup.id
        }
      ]
    }
  }
}

output actionGroupResourceId string = monitoringActionGroup.id
output alertResources array = [
  {
    subscriptionId: subscription().subscriptionId
    alertType: 'serviceHealth'
    resourceId: serviceHealthAlert.id
  }
  {
    subscriptionId: subscription().subscriptionId
    alertType: 'plannedMaintenance'
    resourceId: plannedMaintenanceAlert.id
  }
]
