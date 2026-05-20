# Monitoring Modules

This folder contains the Azure Landing Zone V2 monitoring and operations baseline.

Current modules:

- `subscription-monitoring-baseline.bicep`: configures subscription Activity Log routing, resource diagnostics for currently supported landing-zone resources, and the minimal alert set for a single platform subscription
- `activity-log-alerts.bicep`: creates the action group plus Service Health and Planned Maintenance activity log alerts in the platform resource group
- `keyvault-diagnostics.bicep`: configures Key Vault diagnostics to the shared workspace
- `virtual-network-diagnostics.bicep`: configures Virtual Network diagnostics to the shared workspace

The current monitoring orchestrator accepts explicit resource IDs for the resource types that are supported today. Direct entry points already know these IDs, so extending coverage later does not require changing the top-level deployment experience.

Current supported diagnostic resource types:

- `Microsoft.KeyVault/vaults`
- `Microsoft.Network/virtualNetworks`

DDoS telemetry remains an advanced extension path in this version. The default monitoring baseline must not claim full DDoS diagnostic onboarding.
