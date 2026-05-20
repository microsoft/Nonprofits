targetScope = 'resourceGroup'

@description('Log Analytics workspace name.')
param workspaceName string

@description('Microsoft Entra group object ID that receives the role assignment.')
param principalObjectId string

@description('Logical principal group label used in outputs.')
param principalGroup string

@description('Built-in Azure role definition GUID.')
param roleDefinitionIdGuid string

@description('Built-in Azure role display name used in outputs.')
param roleName string

var roleDefinitionId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleDefinitionIdGuid)

resource sharedWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' existing = {
  name: workspaceName
}

resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(sharedWorkspace.id, principalObjectId, roleDefinitionIdGuid)
  scope: sharedWorkspace
  properties: {
    roleDefinitionId: roleDefinitionId
    principalId: principalObjectId
    principalType: 'Group'
  }
}

output roleAssignment object = {
  subscriptionId: subscription().subscriptionId
  principalGroup: principalGroup
  roleName: roleName
  roleDefinitionId: roleDefinitionId
  scopeKind: 'workspace'
  scopeId: sharedWorkspace.id
}
