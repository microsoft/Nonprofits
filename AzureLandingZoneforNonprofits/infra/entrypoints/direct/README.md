# Direct Entry Points

This folder contains the direct Bicep entry points that define the supported deployment contract for implementation.

Current initial scenarios:

- `foundation-subscription.bicep`
- `expanded-platform.bicep`

These entry points are shared deployment logic for CLI, automation, validation, and portal-safe wrappers. They stay under `infra/` because they are not owned solely by the CLI surface; `cli/` owns the installer and CLI example inputs.

Foundation is subscription-only in the supported product contract. Expanded Platform always applies governance directly to its management and connectivity subscriptions, and can add a management-group assignment when an existing Platform management group is supplied through `platformManagementGroupId`.
