# Migrating Social Impact solutions from AppSource/PPAC to the GitHub build

Guidance for moving the Fundraising, Grant Management, and Outcome Management solutions
off the retired AppSource/PPAC (managed) versions onto the equivalent build from this repo.

## Solutions in scope

| Product | Unique name | Publisher | Prefix |
| --- | --- | --- | --- |
| Fundraising | `SocialImpactFundraising` | `microsofttechforsocialimpact` | `sifund` (86385) |
| Grant Management | `SocialImpactGrants` | `microsofttechforsocialimpact` | `signt` (67719) |
| Outcome Management | `SocialImpactOutcomes` | `microsofttechforsocialimpact` | `sioutc` (86386) |

All three depend on the base data model **`NonprofitCore`** (publisher `microsoftdynamics365nonprofitaccelerator`, prefix `msnfp`), which must remain installed.

## Key fact
The GitHub build and the AppSource/PPAC build are the **same solution** (identical unique name + publisher). So:

- Importing the GitHub build is an **in-place managed upgrade**, not a second install.
- **Never delete the existing managed solution** — that drops its tables and **all customer data**. Migration deletes nothing.
- After importing your own build, the environment leaves the AppSource auto-update channel; you own future updates.

## Blockers
1. **Must be managed.** AppSource installs managed; Dataverse blocks unmanaged-over-managed. Build **Release** (`dotnet build` alone = unmanaged, rejected).
2. **Version must be ≥ installed.** Source is `1.0.3.1`; bump if the installed version is higher.
3. **Keep `NonprofitCore` installed and compatible**, before the dependent solutions.
4. **Preserve exact identity** (unique name / publisher / prefix). Renaming = duplicate tables + orphaned data.
5. **"Apply upgrade" removes deleted components** — rehearse in a sandbox and back up first.
6. There are **no "Anchor" companion solutions** — one managed solution per product.

## Set the version (no scripts in this repo)
Edit `<Version>` directly to a value ≥ the installed version (check via make.powerapps.com → Solutions):

- `Fundraising/Solution/Other/Solution.xml`
- `GrantManagement/Solution/Other/Solution.xml`
- `OutcomeManagement/Solution/Other/Solution.xml`

## Migration flow (repeat per product, per environment)

1. **Back up / rehearse** in a sandbox first.
2. **Confirm `NonprofitCore`** is installed and compatible (source `3.1.3.4`).
3. **Build managed:**
   ```sh
   cd Fundraising          # or GrantManagement / OutcomeManagement
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
6. **Validate** — version incremented, status Managed, apps/tables/sample records intact.
7. **Repeat** for the next product; promote sandbox → production once validated.

## Rollback
If sandbox validation fails, restore from backup. A production upgrade is not trivially
reversible — hence the mandatory rehearsal + backup.
