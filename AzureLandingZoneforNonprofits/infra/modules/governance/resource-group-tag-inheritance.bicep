targetScope = 'resourceGroup'

@description('Short deployment prefix used to name the policy assignment.')
@maxLength(12)
param deploymentPrefix string

@description('Primary Azure region used for the policy assignment system-assigned identity.')
param primaryLocation string

@description('Name of the tag to inherit from the resource group to resources that are missing it. Defaults to ServiceOwner.')
@maxLength(39)
param tagName string = 'ServiceOwner'

var inheritTagFromRgIfMissingDefinitionId = '/providers/Microsoft.Authorization/policyDefinitions/ea3f2387-9b95-492a-a190-fcdc54f7b070'
var tagContributorRoleDefinitionId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4a9ae827-6dc8-4573-8ac7-8239d42aa03f')
var assignmentName = '${deploymentPrefix}-tag-inherit-${toLower(tagName)}'

resource inheritTagAssignment 'Microsoft.Authorization/policyAssignments@2025-01-01' = {
  name: assignmentName
  location: primaryLocation
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    displayName: '${deploymentPrefix} ${tagName} tag inheritance (resource group scope)'
    description: 'Inherits the ${tagName} tag from this resource group to resources inside it that are missing the tag. Scoped per resource group so existing resource groups outside this deployment are not affected.'
    policyDefinitionId: inheritTagFromRgIfMissingDefinitionId
    enforcementMode: 'Default'
    parameters: {
      tagName: {
        value: tagName
      }
    }
    metadata: {
      assignedBy: 'AzureLandingZone'
      tagInheritanceScope: 'alz-managed-resource-group'
    }
  }
}

resource tagContributorAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(resourceGroup().id, inheritTagAssignment.id, 'TagContributor')
  properties: {
    roleDefinitionId: tagContributorRoleDefinitionId
    principalId: inheritTagAssignment.identity.principalId
    principalType: 'ServicePrincipal'
    description: 'Allows the per-resource-group tag inheritance policy to add the ${tagName} tag to resources inside this resource group.'
  }
}

output assignmentId string = inheritTagAssignment.id
output assignmentScope string = resourceGroup().id
output tagName string = tagName
