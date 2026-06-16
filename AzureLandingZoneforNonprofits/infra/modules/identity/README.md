# Identity Modules

This folder contains the Azure Landing Zone V2 identity, access, and partner-operations baseline.

Current modules:

- `subscription-access-baseline.bicep`: assigns the supported built-in roles at subscription, resource-group, and shared Log Analytics workspace scope for one platform subscription

Implementation notes:

- Role assignments target Microsoft Entra groups only.
- The implementation uses built-in roles only: `Owner`, `Contributor`, `Reader`, and `Log Analytics Contributor`.
- Partner access stays scoped and removable. The baseline does not assign partner `Owner`, tenant-wide roles, or management-group write roles by default.
- Workload administrators remain out of shared platform scopes by default and receive only the supported Foundation network-reader assignment when that scope exists.