# Migrating Volunteer Management to the open-source build

Both the AppSource and the open-source (OS) Volunteer Management solutions are published by
Microsoft; they are distinguished by **origin** — the AppSource managed solution (installed
from the marketplace) versus the OS build (compiled from the public GitHub repository).

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

## Migration steps

1. **Back up the environment.** The strip stage edits active form/view layers in place and
   deleting the AppSource solution is irreversible without a backup.

2. **Import the OS managed solution side-by-side.**

   ```powershell
   pac solution import --path .\VolunteerManagement\bin\Release\VolunteerManagement_managed.zip
   ```

   (Build it first with `dotnet build VolunteerManagement\VolunteerManagement.cdsproj -c Release`.)

3. **Strip the AppSource PCF references and publish.**

   ```powershell
   .\Migrate-VolunteerManagementToOpenSource.ps1 -EnvironmentUrl https://contoso.crm.dynamics.com -StripReferences
   ```

4. **Delete the AppSource managed solution.**

   ```powershell
   .\Migrate-VolunteerManagementToOpenSource.ps1 -EnvironmentUrl https://contoso.crm.dynamics.com -DeleteAppSourceSolution
   ```

5. **Re-import / upgrade the OS solution** so its own forms restore the PCF controls under OS
   ownership.

   ```powershell
   pac solution import --path .\VolunteerManagement\bin\Release\VolunteerManagement_managed.zip --force-overwrite
   ```

6. **Verify.**

   ```powershell
   .\Migrate-VolunteerManagementToOpenSource.ps1 -EnvironmentUrl https://contoso.crm.dynamics.com -Verify
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
- Always take an environment backup before steps 3–5.

## Parameters

Run `Get-Help .\Migrate-VolunteerManagementToOpenSource.ps1 -Full` for the complete reference.
The control list and the AppSource solution unique name are parameterized
(`-ControlNames`, `-AppSourceSolutionUniqueName`) and default to the Volunteer Management values.
