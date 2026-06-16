# Shared Module Contracts

This folder contains cross-cutting module contracts used across deployment scenarios.

Current contracts:

- `subscription-platform-slice.bicep`: shared subscription-scope slice for platform resource groups, naming inputs, tag merging, and standard slice outputs
- `foundation-platform-baseline.bicep`: shared Foundation subscription baseline that reuses the slice contract without embedding governance behavior
- `resource-group-baseline.bicep`: shared resource-group baseline for core platform resources and consistent resource naming

Contract rules:

- `deploymentPrefix` is the source of the supported naming pattern.
- `tags` are merged with the required baseline tags rather than replacing them.
- outputs must be stable and scenario-safe so later workstreams can depend on them.
