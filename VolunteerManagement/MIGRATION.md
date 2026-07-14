# Migrate from AppSource Volunteer Management to the open-source build

This guide explains how to move an environment from the **AppSource** Volunteer Management
solution (installed from the marketplace) to the **open-source (OS)** Volunteer Management
build compiled from this repository.

Both solutions are published by Microsoft; they are distinguished by **origin** — the
AppSource managed solution versus the OS build from the public GitHub repository. The
AppSource solution is no longer supported and is being removed from AppSource, so existing
customers and partners should migrate to the OS build.

## Why a migration is needed

The OS build ships under its **own identity** so it can be installed **side-by-side** with
the AppSource solution. Once the OS build is in place, the unsupported AppSource solution can
be removed. The separate identities are:

| Aspect | AppSource (marketplace) | Open-source build |
| --- | --- | --- |
| Solution unique name | `VolunteerManagement` | `volunteermanagementos` |
| Solution display name | `Volunteer Management` | `Volunteer Management (OS)` |
| Plugin assembly | `Plugins` (token `8ad1edaac4bc000c`) | `PluginsOS` (token `703f25cc8a15a472`) |
| PCF controls | shipped & owned | shipped & owned (its own copies) |

Because the identities differ, both solutions can coexist during the migration. Your data
(volunteers, engagement opportunities, participations, etc.) lives on the shared Dataverse
tables and is **not** deleted when the AppSource solution is removed — only the solution
layer and its metadata are.

## Before you start

- **Take a full backup of the environment.** The migration edits active form/view layers in
  place and deleting the AppSource solution is irreversible without a backup.
- Ensure you have **System Administrator** access to the target environment.
- Install the tools used below:
  - [.NET SDK](https://dotnet.microsoft.com/download) (to build the OS solution)
  - [Power Platform CLI (`pac`)](https://learn.microsoft.com/power-platform/developer/cli/introduction)
  - [Azure CLI (`az`)](https://learn.microsoft.com/cli/azure/install-azure-cli) (used by the migration script to acquire a Dataverse token)
- Run all commands from the **repository root**.

## Migration overview

1. Build and import the OS solution side-by-side with the AppSource solution.
2. Strip the AppSource PCF control references that block deletion, then publish.
3. Delete the unsupported AppSource solution.
4. Re-import/upgrade the OS solution so its own forms and controls take over.
5. Verify the result.

Steps 2–4 are automated by
[`Deployment/Migrate-VolunteerManagementToOpenSource.ps1`](Deployment/Migrate-VolunteerManagementToOpenSource.ps1).
See [`Deployment/README.md`](Deployment/README.md) for the full script reference,
parameters, and authentication options.

## Step-by-step

### 1. Build and import the OS solution

```powershell
dotnet build .\VolunteerManagement\VolunteerManagement\VolunteerManagement.cdsproj -c Release
pac solution import --path .\VolunteerManagement\VolunteerManagement\bin\Release\VolunteerManagement_managed.zip
```

The OS solution installs alongside the AppSource one because it uses a separate unique name
(`volunteermanagementos`) and plugin assembly (`PluginsOS`).

### 2. Strip the AppSource PCF references and publish

The AppSource forms and views reference its PCF controls in the **active (merged) layer**.
That `Form -> Control` dependency is *Published* and blocks deletion of the AppSource
solution. This stage rewrites those active layers to substitute the default control, then
runs `PublishAllXml`.

```powershell
.\VolunteerManagement\Deployment\Migrate-VolunteerManagementToOpenSource.ps1 -EnvironmentUrl https://contoso.crm.dynamics.com -StripReferences
```

> Tip: add `-WhatIf` to preview every change without applying it.

### 3. Delete the AppSource solution

```powershell
.\VolunteerManagement\Deployment\Migrate-VolunteerManagementToOpenSource.ps1 -EnvironmentUrl https://contoso.crm.dynamics.com -DeleteAppSourceSolution
```

### 4. Re-import / upgrade the OS solution

Re-importing restores the forms and views so they reference the **OS-owned** PCF controls.

```powershell
pac solution import --path .\VolunteerManagement\VolunteerManagement\bin\Release\VolunteerManagement_managed.zip --force-overwrite
```

### 5. Verify

```powershell
.\VolunteerManagement\Deployment\Migrate-VolunteerManagementToOpenSource.ps1 -EnvironmentUrl https://contoso.crm.dynamics.com -Verify
```

The verification report lists the plugin assemblies, the owning solutions of each PCF
control, and the SDK steps registered on `PluginsOS`. After a successful migration you should
see only the `PluginsOS` assembly and the PCF controls owned by `volunteermanagementos`.

## Authentication

By default the script acquires a Dataverse token with the Azure CLI
(`az account get-access-token`). Sign in first with `az login`, or:

- pass a pre-acquired bearer token with `-AccessToken <token>`, or
- point `-AzCommand` at an alternate/isolated Azure CLI executable for a non-default sign-in.

## Safety and rollback

- Every stage of the script is **opt-in**; running it with no stage switch does nothing.
- The destructive stages support `-WhatIf` and `-Confirm` (the script declares
  `ConfirmImpact = 'High'`), so you can preview each PATCH / publish / delete.
- If a step fails, restore from the backup taken before step 1 and retry.

## Related

- [`Deployment/README.md`](Deployment/README.md) — full migration script reference.
- [`Deployment/Migrate-VolunteerManagementToOpenSource.ps1`](Deployment/Migrate-VolunteerManagementToOpenSource.ps1) — the migration script.
