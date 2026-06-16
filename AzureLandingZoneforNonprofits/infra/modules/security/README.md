# Security Modules

This folder contains the Azure Landing Zone V2 security and minimal data-trust baseline.

Current module:

- `subscription-security-baseline.bicep`: applies the Defender for Cloud Key Vault and Storage option at subscription scope and emits security-state outputs for the shared platform Key Vault, workload coverage boundaries, and data-trust action guidance

Defender baseline (`defenderBaseline` parameter):

- `recommended`: enables Defender for Key Vault and the current Defender for Storage plan in the target subscription. Storage malware scanning and sensitive data discovery extensions are left disabled by this deployment.
- `none`: writes no `Microsoft.Security/pricings` resources, preserving any pre-existing tenant or CSP Defender configuration.

Defender plans for App Service, SQL Servers, Virtual Machines, and Kubernetes are not enabled by this deployment. Enable them manually in Defender for Cloud after deployment when those workloads exist and recurring charges are approved.

Implementation notes:

- The shared platform Key Vault remains part of the existing platform baseline and is not redeployed here.
- Key Vault diagnostics stay integrated through the monitoring baseline.
- Private Key Vault connectivity is reported as an action state until the networking profile implements the private endpoint and private DNS path.