targetScope = 'subscription'

@description('Short deployment prefix.')
@maxLength(12)
param deploymentPrefix string

@description('Approved Azure regions for the landing zone baseline.')
param allowedLocations array

@description('Required ServiceOwner tag value. Applied to platform resource groups and inherited to resources by policy if missing.')
param serviceOwner string

@description('Primary Azure region used for the policy assignment system-assigned identity.')
param primaryLocation string

@description('Optional Log Analytics workspace resource ID used by later diagnostic onboarding work.')
param logAnalyticsWorkspaceResourceId string = ''

@description('Diagnostic onboarding state reported by the monitoring baseline.')
param diagnosticOnboardingStatus string = empty(logAnalyticsWorkspaceResourceId) ? 'not-configured-no-workspace' : 'active-via-monitoring-baseline'

var initiativeName = '${deploymentPrefix}-foundation-governance'
var initiativeDisplayName = '${deploymentPrefix} Foundation governance'
var allowedLocationsResourcesDefinitionId = '/providers/Microsoft.Authorization/policyDefinitions/e56962a6-4747-49cd-b67b-bf8b01975c4c'
var allowedLocationsResourceGroupsDefinitionId = '/providers/Microsoft.Authorization/policyDefinitions/e765b5de-1225-4ba3-bd56-1ac6695af988'

resource governanceInitiative 'Microsoft.Authorization/policySetDefinitions@2025-01-01' = {
  name: initiativeName
  properties: {
    policyType: 'Custom'
    displayName: initiativeDisplayName
    description: 'Minimal Azure Landing Zone governance baseline at subscription scope: allowed locations only. ServiceOwner tag inheritance is assigned separately to resource groups created by this deployment so existing resource groups outside this deployment are not affected.'
    metadata: {
      category: 'Governance'
      version: '2.1.0'
      source: 'AzureLandingZone'
    }
    parameters: {
      allowedLocations: {
        type: 'Array'
        metadata: {
          displayName: 'Allowed locations'
          description: 'Approved Azure regions for the landing zone baseline.'
          strongType: 'location'
        }
        defaultValue: allowedLocations
      }
    }
    policyDefinitions: [
      {
        policyDefinitionReferenceId: 'allowedLocationsResources'
        policyDefinitionId: allowedLocationsResourcesDefinitionId
        parameters: {
          listOfAllowedLocations: {
            value: '[parameters(\'allowedLocations\')]'
          }
        }
      }
      {
        policyDefinitionReferenceId: 'allowedLocationsResourceGroups'
        policyDefinitionId: allowedLocationsResourceGroupsDefinitionId
        parameters: {
          listOfAllowedLocations: {
            value: '[parameters(\'allowedLocations\')]'
          }
          effect: {
            value: 'Deny'
          }
        }
      }
    ]
  }
}

resource governanceAssignment 'Microsoft.Authorization/policyAssignments@2025-01-01' = {
  name: initiativeName
  location: primaryLocation
  properties: {
    displayName: '${initiativeDisplayName} assignment'
    description: 'Assigns the Azure Landing Zone governance baseline at subscription scope. Tag inheritance is assigned separately to resource groups created by this deployment.'
    policyDefinitionId: governanceInitiative.id
    enforcementMode: 'Default'
    parameters: {
      allowedLocations: {
        value: allowedLocations
      }
    }
    metadata: {
      assignedBy: 'AzureLandingZone'
      diagnosticOnboardingStatus: diagnosticOnboardingStatus
      logAnalyticsWorkspaceResourceId: empty(logAnalyticsWorkspaceResourceId) ? 'not-configured' : logAnalyticsWorkspaceResourceId
      serviceOwnerRgTag: serviceOwner
    }
    nonComplianceMessages: [
      {
        policyDefinitionReferenceId: 'allowedLocationsResources'
        message: 'Deploy Azure Landing Zone baseline resources only to approved Azure regions.'
      }
    ]
  }
}

output assignmentScopes array = [
  subscription().id
]
output initiativeAssignmentIds array = [
  governanceAssignment.id
]
output initiativeDefinitionIds array = [
  governanceInitiative.id
]
output policyDefinitionIds array = [
  allowedLocationsResourcesDefinitionId
  allowedLocationsResourceGroupsDefinitionId
]
output diagnosticOnboardingStatuses array = [
  diagnosticOnboardingStatus
]
