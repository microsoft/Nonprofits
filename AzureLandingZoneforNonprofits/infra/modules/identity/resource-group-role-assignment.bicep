targetScope = 'resourceGroup'

@description('Microsoft Entra group object ID that receives the role assignment.')
param principalObjectId string

@description('Logical principal group label used in outputs.')
param principalGroup string

@description('Built-in Azure role definition GUID.')
param roleDefinitionIdGuid string

@description('Built-in Azure role display name used in outputs.')
param roleName string

var roleDefinitionId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', roleDefinitionIdGuid)

resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, principalObjectId, roleDefinitionIdGuid)
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
  scopeKind: 'resourceGroup'
  scopeId: resourceGroup().id
}
