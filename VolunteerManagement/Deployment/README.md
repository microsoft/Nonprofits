# Migrate-VolunteerManagementToOpenSource.ps1

Reference for the migration script that moves an environment from the AppSource Volunteer
Management solution to the open-source (OS) build.

> **Looking for the step-by-step migration walkthrough?** See the
> [migration guide](../MIGRATION.md). This document only covers the script itself — its
> stages, parameters, authentication, and safety switches.

The OS build installs **side-by-side** with its own identity so it never collides with the
AppSource solution:

| Aspect | AppSource (marketplace) | Open-source build |
| --- | --- | --- |
| Solution unique name | `VolunteerManagement` | `volunteermanagementos` |
| Plugin assembly | `Plugins` (token `8ad1edaac4bc000c`) | `PluginsOS` (token `703f25cc8a15a472`) |
| PCF controls | shipped & owned | shipped & owned (own copies) |

Because the two solutions have **separate identities**, the OS build can be imported while
the AppSource one is still present. The OS build carries its own copies of the four PCF
controls, its own plugin assembly, and its own SDK steps.

## Why a strip step is required

The AppSource managed solution contributes forms and views whose **active (merged) layer**
references its PCF controls. That `Form -> Control` dependency is *Published* and lives in
the active layer regardless of solution ownership, so it blocks deletion of the AppSource
solution. Granting the OS solution ownership of those components (e.g. `AddSolutionComponent`)
does **not** clear the dependency — this was verified empirically.

The `Migrate-VolunteerManagementToOpenSource.ps1` script removes the blocker by rewriting the
active form/view layers so they substitute the default control for the AppSource PCF control,
then publishing. After that the AppSource solution deletes cleanly.

## Stages

Each stage is **opt-in** via a switch; nothing runs unless requested. Run the script from the
**repository root**. For the full end-to-end migration order (build, import, re-import),
see the [migration guide](../MIGRATION.md).

| Switch | What it does |
| --- | --- |
| `-StripReferences` | Rewrites forms + saved queries to drop the AppSource PCF references (substituting the default control), then runs `PublishAllXml`. |
| `-DeleteAppSourceSolution` | Deletes the AppSource managed solution identified by `-AppSourceSolutionUniqueName`. |
| `-Verify` | Reports the plugin assemblies, PCF control ownership, and SDK steps registered on `PluginsOS`. |

```powershell
# Strip AppSource PCF references and publish
.\VolunteerManagement\Deployment\Migrate-VolunteerManagementToOpenSource.ps1 -EnvironmentUrl https://contoso.crm.dynamics.com -StripReferences

# Delete the AppSource managed solution
.\VolunteerManagement\Deployment\Migrate-VolunteerManagementToOpenSource.ps1 -EnvironmentUrl https://contoso.crm.dynamics.com -DeleteAppSourceSolution

# Verify the result
.\VolunteerManagement\Deployment\Migrate-VolunteerManagementToOpenSource.ps1 -EnvironmentUrl https://contoso.crm.dynamics.com -Verify
```

## Authentication

By default the script acquires a Dataverse token with the Azure CLI (`az account get-access-token`).
Sign in first with `az login`, or:

- pass a pre-acquired bearer token with `-AccessToken <token>`, or
- point `-AzCommand` at an alternate/isolated Azure CLI executable for a non-default sign-in.

## Safety

- Every stage is **opt-in**; running the script with no stage switch does nothing.
- The destructive stages support `-WhatIf` and `-Confirm` (the script declares
  `ConfirmImpact = 'High'`), so you can preview each PATCH / publish / delete.
- Always take an environment backup before running the destructive stages.

## Parameters

Run `Get-Help .\Migrate-VolunteerManagementToOpenSource.ps1 -Full` for the complete reference.
The control list and the AppSource solution unique name are parameterized
(`-ControlNames`, `-AppSourceSolutionUniqueName`) and default to the Volunteer Management values.
