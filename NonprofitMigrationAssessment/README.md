# Nonprofit migration assessment

Use this customer-facing skill to assess a Dataverse environment before moving from Microsoft-serviced nonprofit solutions to the corresponding solutions and site in `microsoft/Nonprofits`.

## Supported products

- Common Data Model for Nonprofits (`NonprofitCore`)
- Fundraising (`SocialImpactFundraising`)
- Grant Management (`SocialImpactGrants`)
- Outcome Management (`SocialImpactOutcomes`)
- Volunteer Management (`VolunteerManagement` to `volunteermanagementos`)
- Volunteer Engagement legacy Power Pages site to `Portal-EDM`

The assessment is read-only. It does not import, upgrade, delete, publish, deploy, change permissions, or retrieve business-record contents.

## Start in GitHub Copilot

Open this repository in VS Code with GitHub Copilot and enter:

> Assess my nonprofit environment for migration to the solutions in this GitHub repository. Guide me through the local read-only workflow and explain the final report.

The skill guides the local commands, explains consent and limitations, and helps interpret the result. Environment-specific inputs and reports remain local by default.

## What you receive

The Markdown report shows:

- Installed supported solutions and versions
- Whether each product needs migration, needs review, or requires no action
- Custom/partner solution candidates, their managed/unmanaged state, and direct overlap with supported products
- Standard product dependencies
- A simple per-product effort rating: None, Low, Medium, High, or Review required
- GitHub migration-guide links
- Detailed per-solution and combined ranges for implementation partners
- Elapsed-time, execution, and potential-downtime ranges when available
- Assumptions, confidence, blockers, missing information, and next actions

Ranges are automatically calculated by deterministic rules. Bundled defaults are uncalibrated engineering assumptions, not guarantees or measured averages. Validate the result with your implementation partner and a representative rehearsal.

## Prerequisites

- Node.js 22
- Git
- Azure CLI, signed in to the tenant that contains the selected environment
- A clean checkout whose `origin` is `https://github.com/microsoft/Nonprofits`
- Customer authorization to read the selected metadata and aggregate-count categories

From `NonprofitMigrationAssessment`, install and build:

```powershell
npm ci
npm run build
```

## Run the assessment

Choose new local output folders outside Git repositories.

### 1. Initialize

```powershell
nonprofit-migration-assessment init `
  --repository "C:\path\to\Nonprofits" `
  --output "$env:LOCALAPPDATA\nonprofit-assessment-input"
```

`init` fetches `origin/master`, pins the target commit, and creates local schemas and configuration files. Local-only target commits are rejected.

### 2. Configure interactively

```powershell
nonprofit-migration-assessment configure `
  --repository "C:\path\to\Nonprofits" `
  --input "$env:LOCALAPPDATA\nonprofit-assessment-input\questionnaire.json" `
  --output "$env:LOCALAPPDATA\nonprofit-assessment-configured"
```

The command asks locally for:

- Assessment and environment names
- Dataverse environment URL
- Environment type and region
- Managed Environment and access restriction
- Whether CDM/template apps should be checked for alignment, PPAC ownership transition, or a newer GitHub release
- Read-only consent

The generated `questionnaire.json` is a local machine-readable input. Customers don't need to edit it manually.

### 3. Collect read-only evidence

```powershell
nonprofit-migration-assessment collect `
  --repository "C:\path\to\Nonprofits" `
  --input "$env:LOCALAPPDATA\nonprofit-assessment-configured\questionnaire.json" `
  --output "$env:LOCALAPPDATA\nonprofit-assessment-inventory"
```

The terminal displays the environment and approved categories and requires typing `ASSESS` before authentication.

The collector uses allowlisted reads for:

- Dataverse version
- Solution identity, version, managed state, and publisher
- Relevant solution-component counts and unmanaged overlap
- A deterministic bounded dependency sample
- Workflow, connection-reference, plug-in assembly, and step counts
- Aggregate counts for relevant tables
- Legacy and enhanced Power Pages site counts

It doesn't retrieve record contents, connection values, plug-in binaries, page content, credentials, or full exports.

The default detailed-discovery budget is five minutes. The operation remains bounded and can be canceled.

### 4. Answer five local review questions

```powershell
nonprofit-migration-assessment review `
  --repository "C:\path\to\Nonprofits" `
  --input "$env:LOCALAPPDATA\nonprofit-assessment-inventory\inventory.json" `
  --output "$env:LOCALAPPDATA\nonprofit-assessment-reviewed"
```

The review asks:

1. Whether critical custom plug-ins, flows, or components exist
2. Whether external integrations affect selected products
3. Whether an accountable owner or source is available
4. Whether a representative sandbox and critical tests are ready
5. The maximum acceptable interruption

When Volunteer Engagement is selected, it also asks for site model, authentication-provider count, language count, and critical custom journeys.

### 5. Generate the report

```powershell
nonprofit-migration-assessment assess `
  --repository "C:\path\to\Nonprofits" `
  --input "$env:LOCALAPPDATA\nonprofit-assessment-reviewed\inventory.json" `
  --output "$env:LOCALAPPDATA\nonprofit-assessment-report"
```

Open:

- `assessment.md` for the concise customer report
- `assessment.json` for detailed evidence and partner tooling

## How alignment is determined

Alignment applies only to same-identity releases listed in `catalog/release-equivalence.json`.

- CDM and template apps can be reported as already aligned when the installed PPAC version matches an approved GitHub release-equivalence entry.
- Volunteer Management isn't in that catalog because it migrates to a different solution identity.
- Volunteer Engagement isn't in that catalog because it migrates a website rather than a same-identity solution release.

Leaving PPAC automatic servicing and self-managing GitHub builds is an ownership transition even when the product is already functionally aligned.

## Estimates and confidence

The skill separates:

- Person-effort
- Dependency-path elapsed time
- Production execution time
- Potential downtime

Unknown critical work isn't treated as zero. When a complete range can't be supported, the report shows the known planning subtotal and the action needed to complete the range.

Default ranges are stored in `catalog/assumptions.json`. A reviewed rulebook can override them with `assess --rules`.

## Compare with a rehearsal

After a representative rehearsal:

```powershell
nonprofit-migration-assessment calibrate `
  --input "$env:LOCALAPPDATA\nonprofit-assessment-report\assessment.json" `
  --rehearsal "$env:LOCALAPPDATA\nonprofit-assessment-rehearsal.json" `
  --output "$env:LOCALAPPDATA\nonprofit-assessment-calibration"
```

Calibration compares observed effort, elapsed time, execution, and downtime with the assessed ranges. It doesn't change estimation rules automatically.

## Privacy and local files

- Assessment inputs and outputs stay local by default.
- The CLI emits only completion status and local output paths.
- Don't commit questionnaires, inventories, reports, logs, or rehearsal observations.
- Don't paste credentials, tokens, connection strings, certificates, or business-record contents into Copilot or local input files.
- Review and minimize any report before optional sharing.

Detailed target hashes remain in local JSON for reproducibility and tamper detection. They aren't shown in the concise customer report.

## Limitations

- Commercial Dataverse URLs are supported; sovereign clouds and on-premises endpoints aren't currently supported.
- Metadata can't prove arbitrary custom-code behavior or the absence of dynamic/external dependencies.
- Dependency and table discovery use documented deterministic caps.
- Environment-wide automation counts can include registrations unrelated to selected products.
- Scheduling ranges don't place tasks into individual calendars or approval windows.
- A representative sandbox rehearsal remains the best validation of timing and downtime.

## Contributor validation

Source tests remain in the repository for CI and maintenance. They aren't included in the distributed package.

```powershell
npm run typecheck
npm test
npm run package:check
```

The path-scoped GitHub Actions workflow validates the package on Ubuntu and Windows for pull requests and changes to `master`.
