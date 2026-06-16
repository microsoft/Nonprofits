targetScope = 'subscription'

@description('True when private DNS and the Key Vault private endpoint were requested in the deployment inputs.')
param enablePrivateDnsAndEndpoints bool = false

@description('True when the simple Foundation network baseline was requested in the deployment inputs.')
param enableSimpleNetwork bool = false

// Hard-fail asserts: refuse to deploy with combinations that would otherwise silently fall back to a
// configuration that was not selected. The deployment inputs must be adjusted explicitly.
assert keyVaultPrivateEndpointRequiresSimpleNetwork = !enablePrivateDnsAndEndpoints || enableSimpleNetwork

output validationState object = {
  enablePrivateDnsAndEndpoints: enablePrivateDnsAndEndpoints
  enableSimpleNetwork: enableSimpleNetwork
  validationStatus: 'passed'
}
