# Migrate Nonprofit solutions from AppSource/PPAC to the GitHub build

This guide explains how to move Common Data Model for Nonprofits and the Fundraising, Grant
Management, and Outcome Management solutions from the managed AppSource/PPAC versions to the
equivalent build in this repository.

## Solutions in scope

| Solution | Unique name | Publisher | Prefix |
| --- | --- | --- | --- |
| Common Data Model for Nonprofits | `NonprofitCore` | `microsoftdynamics365nonprofitaccelerator` | `msnfp` (84406) |
| Fundraising | `SocialImpactFundraising` | `microsofttechforsocialimpact` | `sifund` (86385) |
| Grant Management | `SocialImpactGrants` | `microsofttechforsocialimpact` | `signt` (67719) |
| Outcome Management | `SocialImpactOutcomes` | `microsofttechforsocialimpact` | `sioutc` (86386) |

The three template apps depend on the base data model **`NonprofitCore`**, so migrate it
first and keep it installed.

## How the migration works

The GitHub build and the AppSource/PPAC build are the same solution. They share an identical unique name and publisher. As a result:

- Importing the GitHub build is an in-place managed upgrade, not a second installation.
- Don't delete the existing managed solution. Deleting it drops its tables and all customer data. The migration deletes nothing.
- After you import your own build, the environment leaves the AppSource automatic update channel, and you own future updates.

## Requirements and constraints

- **Build a managed solution.** AppSource installs a managed solution, and Dataverse blocks importing an unmanaged solution over a managed one. Build the **Release** configuration, because `dotnet build` on its own produces an unmanaged solution, which Dataverse rejects.
- **Use a version that's the same or higher.** The template-app source is `1.0.3.1`, and the Common Data Model source is `3.1.3.4`. Increase the version if the installed version is higher.
- **Migrate `NonprofitCore` first.** Keep it installed and compatible before you migrate the apps that depend on it.
- **Preserve the exact identity.** Keep the unique name, publisher, and prefix. Renaming creates duplicate tables and orphans data.
- **Plan for removed components.** Applying an upgrade removes components that were deleted between versions. Rehearse in a sandbox and back up first.
- **There are no Anchor companion solutions.** Each product ships one managed solution.

## Set the version

There are no versioning scripts in this repository. Edit the `<Version>` element directly, and set it to the same as or higher than the installed version. To check the installed version, go to Power Apps (make.powerapps.com) > **Solutions**.

- `CommonDataModelforNonprofits/Solution/Other/Solution.xml`
- `Fundraising/Solution/Other/Solution.xml`
- `GrantManagement/Solution/Other/Solution.xml`
- `OutcomeManagement/Solution/Other/Solution.xml`

## Migration flow

Migrate Common Data Model for Nonprofits first, then each app, and repeat the flow in each environment.

1. **Back up and rehearse** in a sandbox first.
2. **Migrate `NonprofitCore`** by using the build and import steps that follow, before the apps that depend on it.
3. **Build the managed solution:**
   ```sh
   cd CommonDataModelforNonprofits   # then Fundraising / GrantManagement / OutcomeManagement
   dotnet restore
   dotnet build --configuration Release
   ```
   Output: `bin/Release/<SolutionName>_managed.zip`.
4. **Authenticate:**
   ```sh
   pac auth create --environment https://YOUR_ENVIRONMENT_URL
   ```
5. **Import as a staged upgrade (delete nothing):**
   ```sh
   pac solution import --path bin/Release/SocialImpactFundraising_managed.zip --stage-and-upgrade
   ```
   Two-step equivalent: `pac solution import --path ... --import-as-holding` then
   `pac solution upgrade --solution-name SocialImpactFundraising`.
6. **Validate.** Confirm that the version incremented, the status is Managed, and the apps, tables, and sample records are intact.
7. **Repeat** for the next product, and promote from sandbox to production after you validate the results.

## Roll back

If sandbox validation fails, restore from the backup. A production upgrade isn't easily reversible, which is why the rehearsal and backup are required.
