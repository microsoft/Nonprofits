# Azure Landing Zone CLI Installer

Use this package to deploy Azure Landing Zone Foundation or Expanded Platform scenarios from a command line. The package is self-contained; keep the folder structure intact when copying or extracting it.

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

## Validate A Deployment

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
