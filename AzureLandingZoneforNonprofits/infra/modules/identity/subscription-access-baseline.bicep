targetScope = 'subscription'

@description('Short deployment prefix.')
@maxLength(12)
param deploymentPrefix string

@description('Optional Microsoft Entra group object ID for the organization platform administrators.')
param customerPlatformAdminsGroupObjectId string = ''

@description('Optional Microsoft Entra group object ID for the partner operators.')
param partnerOperatorsGroupObjectId string = ''

@description('Resource group names where partner operators should receive Contributor.')
param partnerContributorResourceGroupNames array = []

@description('Optional Log Analytics workspace resource ID where partner operators may receive Log Analytics Contributor.')
param logAnalyticsWorkspaceResourceId string = ''

var ownerRoleDefinitionId = '8e3af657-a8ff-443c-a75c-2fe8c4bcb635'
var contributorRoleDefinitionId = 'b24988ac-6180-42a0-ab88-20f7382dd24c'
var logAnalyticsContributorRoleDefinitionId = '92aaf0da-9dab-42b6-94a3-d43ce8d16293'
var partnerContributorScopeNames = union(partnerContributorResourceGroupNames, [])
var workspaceResourceGroupName = !empty(logAnalyticsWorkspaceResourceId) ? split(logAnalyticsWorkspaceResourceId, '/')[4] : ''
var workspaceName = !empty(logAnalyticsWorkspaceResourceId) ? split(logAnalyticsWorkspaceResourceId, '/')[8] : ''

resource customerPlatformAdminsOwnerAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (!empty(customerPlatformAdminsGroupObjectId)) {
  name: guid(subscription().id, customerPlatformAdminsGroupObjectId, ownerRoleDefinitionId)
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', ownerRoleDefinitionId)
    principalId: customerPlatformAdminsGroupObjectId
    principalType: 'Group'
  }
}

module partnerContributorAssignments './resource-group-role-assignment.bicep' = [for resourceGroupName in partnerContributorScopeNames: if (!empty(partnerOperatorsGroupObjectId)) {
  name: '${deploymentPrefix}-partner-contributor-${uniqueString(subscription().id, resourceGroupName)}'
  scope: resourceGroup(resourceGroupName)
  params: {
    principalObjectId: partnerOperatorsGroupObjectId
    principalGroup: 'partnerOperators'
    roleDefinitionIdGuid: contributorRoleDefinitionId
    roleName: 'Contributor'
  }
}]

module partnerWorkspaceAssignment './workspace-role-assignment.bicep' = if (!empty(partnerOperatorsGroupObjectId) && !empty(logAnalyticsWorkspaceResourceId)) {
  name: '${deploymentPrefix}-partner-workspace-${uniqueString(subscription().id, logAnalyticsWorkspaceResourceId)}'
  scope: resourceGroup(workspaceResourceGroupName)
  params: {
    workspaceName: workspaceName
    principalObjectId: partnerOperatorsGroupObjectId
    principalGroup: 'partnerOperators'
    roleDefinitionIdGuid: logAnalyticsContributorRoleDefinitionId
    roleName: 'Log Analytics Contributor'
  }
}

var identityFollowUpActions = concat(
  empty(customerPlatformAdminsGroupObjectId) ? [
    'Organization platform administrators group was not supplied. Owner role assignment on the subscription was skipped; configure organization admin access before relying on this environment for operations.'
  ] : [],
  empty(partnerOperatorsGroupObjectId) && !empty(partnerContributorScopeNames) ? [
    'Partner operators group was not supplied. Contributor role assignments on the platform resource groups were skipped; assign them only when delegated partner operations are required.'
  ] : []
)

output customerOwnedAccessConfigured bool = !empty(customerPlatformAdminsGroupObjectId)
output identityFollowUpActions array = identityFollowUpActions
