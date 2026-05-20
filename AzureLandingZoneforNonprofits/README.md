# Azure Landing Zone for Nonprofits

Azure Landing Zone for Nonprofits helps nonprofit organizations set up a secure Azure foundation for cloud workloads. It provides an Azure-native baseline for management, identity and access, governance, security, monitoring, cost controls, and networking.

Azure landing zones are the recommended Azure foundation described by the Microsoft Cloud Adoption Framework. This nonprofit package applies those concepts to practical, cost-conscious deployment choices for smaller organizations. It helps teams prepare a governed Azure environment for current workloads and future workloads, including AI-enabled workloads. It doesn't deploy application workloads.

Azure Landing Zone for Nonprofits supports two deployment paths:

- Foundation: a compact baseline in one existing subscription, with fewer upfront decisions and optional simple networking.
- Expanded Platform: a platform baseline for existing management and connectivity subscriptions, with stronger separation of duties and a dedicated hub network.

## Documentation

Review the Microsoft Learn documentation before you run this installer:

- [Azure Landing Zone for Nonprofits overview](https://learn.microsoft.com/industry/nonprofit/azure-landing-zone-overview)
- [Plan and prepare to deploy Azure Landing Zone for Nonprofits](https://learn.microsoft.com/industry/nonprofit/azure-landing-zone-prerequisites)
- [Deploy Azure Landing Zone for Nonprofits with the Azure CLI](https://learn.microsoft.com/industry/nonprofit/azure-landing-zone-cli)
- [Post-deployment tasks for Azure Landing Zone for Nonprofits](https://learn.microsoft.com/industry/nonprofit/azure-landing-zone-post-deployment)
- [What is an Azure landing zone?](https://learn.microsoft.com/azure/cloud-adoption-framework/ready/landing-zone/)

## CLI Installer Package

Use this package to deploy Azure Landing Zone for Nonprofits Foundation or Expanded Platform scenarios from a command line. This package is intended for experienced Azure operators, automation owners, and delivery partners who need repeatable CLI deployment. The package is self-contained; keep the folder structure intact when copying or extracting it.

## What's Included

- `Install-AzureLandingZone.ps1`: PowerShell installer that runs Azure CLI deployment commands.
- `examples/commands/`: starter configuration files for each supported scenario.
- `examples/parameters/`: example deployment parameter files referenced by the starter configs.
- `infra/`: deployment templates used by the installer.
- `scenarios.json`: supported scenario catalog used by the installer.

## Prerequisites

- PowerShell 7 or later.
- Azure CLI 2.76.0 or later.
- Azure CLI Bicep support (`az bicep version` must work).
- An authenticated Azure CLI session with access to the target tenant and subscriptions.
- Sufficient Azure permissions for the selected scenario and deployment scope.

## Validate a Deployment

Run the following command from the package root:

```powershell
pwsh ./Install-AzureLandingZone.ps1 `
  -ConfigFile ./examples/commands/foundation.install-config.json `
  -Action validate
```

## Deployment Flow

1. Copy one of the starter config files from `examples/commands/`.
2. Fill in the target subscription IDs, deployment prefix, locations, notification values, and scenario-specific settings.
3. Run `validate` to check the configuration and prerequisites.
4. Run `what-if` to preview the Azure changes.
5. Run `create` when the preview is acceptable.

Generated logs and deployment outputs are written under the `outputFolder` configured in the selected install config.
