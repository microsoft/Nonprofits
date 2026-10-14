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

- A direct executive recommendation and evidence date
- Installed supported products and versions only; products not detected are omitted from customer tables
- Total solution inventory breadth
- Whether each product needs migration, needs review, or requires no action
- An evidence-derived next-action checklist; no extra customer questionnaire is required
- Custom/partner solution candidates, their managed/unmanaged state, component-type summary, direct overlap, and why they need review
- Named direct-overlap components, per-component dependency-reference counts, and bounded individual dependency edges in partner JSON
- Product-attributed snapshot counts for the largest related non-empty tables
- A visual product migration order plus bounded environment dependency signals and their collection limits
- Prioritized direct and dependency blockers with the action needed to clear each one
- A clear product decision with separate decision confidence, provisional effort, and effort confidence
- A recommended sequence, integration/count signals, site applicability, and readable cautions
- GitHub migration-guide links
- Blockers, missing information, and next actions

The first sections are customer-focused. Dependency samples, scoped integration signals, metric definitions, and limitations are grouped in a technical appendix. Workflow, connection-reference, plug-in assembly, and plug-in-step counts are derived from installed nonprofit solutions and directly overlapping custom solutions rather than environment-wide entity counts. Machine evidence remains in the optional partner JSON.

Effort is a relative rating, not an hour, cost, or downtime estimate. Validate the result with your implementation partner and a representative sandbox rehearsal.

## Prerequisites

- Node.js 22
- Git
- Azure CLI, signed in to the tenant that contains the selected environment
- A clean checkout whose `origin` is `https://github.com/microsoft/Nonprofits`
- Customer authorization to read the selected metadata and aggregate-count categories

From `NonprofitMigrationAssessment`, install dependencies once:

```powershell
npm ci
```

`npm start` compiles the TypeScript sources and runs the assessment.

## Run the assessment

Use the single customer command from a human terminal:

```powershell
npm start -- run --repository "C:\path\to\Nonprofits"
```

The command:

1. Asks only for the Dataverse environment URL.
2. Shows the approved read-only categories and requires exact `ASSESS` confirmation.
3. Derives bounded customization and integration scope from the collected solution evidence.
4. Keeps intermediate files in one private operating-system temporary folder.
5. Deletes the temporary folder when the command completes or fails.
6. Writes `nonprofit-assessment-<environment>-<date>.md` to the user's Documents folder.
7. Prints the final report path so Copilot can open it in the editor.

Use `--output "C:\visible\folder"` to choose another existing or creatable folder. Add `--partner-json` to preserve the detailed JSON next to the Markdown report. If the filename already exists, the command adds a numeric suffix rather than overwriting it. The automatic run leaves owner and sandbox/test readiness unknown rather than asking the customer to make technical planning choices.

## Advanced staged workflow

The low-level commands below remain available for partner automation, troubleshooting, and reviewed-rule workflows. Each output must use a new local folder outside Git repositories.

### 1. Initialize

```powershell
npm start -- init `
  --repository "C:\path\to\Nonprofits" `
  --output "$env:LOCALAPPDATA\nonprofit-assessment-input"
```

`init` fetches `origin/master`, pins the target commit, and creates local schemas and configuration files. Local-only target commits are rejected.

### 2. Configure interactively

```powershell
npm start -- configure `
  --repository "C:\path\to\Nonprofits" `
  --input "$env:LOCALAPPDATA\nonprofit-assessment-input\questionnaire.json" `
  --output "$env:LOCALAPPDATA\nonprofit-assessment-configured"
```

The command asks only for the Dataverse environment URL. It derives the local assessment ID and environment alias, uses automatic product scope, and defaults CDM/template apps to alignment checking. Typing `ASSESS` in the next step records read-only consent.

The generated `questionnaire.json` is a local machine-readable input. Customers don't need to edit it manually.

### 3. Collect read-only evidence

```powershell
npm start -- collect `
  --repository "C:\path\to\Nonprofits" `
  --input "$env:LOCALAPPDATA\nonprofit-assessment-configured\questionnaire.json" `
  --output "$env:LOCALAPPDATA\nonprofit-assessment-inventory"
```

The terminal displays the environment and approved categories and requires typing `ASSESS` before authentication.

The collector uses allowlisted reads for:

- Dataverse version
- Solution identity, version, managed state, and publisher
- Relevant solution-component counts and unmanaged overlap
- Dependency lookups for component IDs directly shared by selected nonprofit products and custom/partner solutions, capped at 100
- Workflow, connection-reference, plug-in assembly, and step counts scoped through selected and overlapping solution components
- Aggregate counts for relevant tables
- Legacy and enhanced Power Pages site counts

It doesn't retrieve record contents, connection values, plug-in binaries, page content, credentials, or full exports.

The default detailed-discovery budget is five minutes. The operation remains bounded and can be canceled.

### 4. Optionally answer four partner review questions

```powershell
npm start -- review `
  --repository "C:\path\to\Nonprofits" `
  --input "$env:LOCALAPPDATA\nonprofit-assessment-inventory\inventory.json" `
  --output "$env:LOCALAPPDATA\nonprofit-assessment-reviewed"
```

Use this optional staged command when an implementation partner wants to refine the automatic rating. The review asks:

1. Whether critical custom plug-ins, flows, or components exist
2. Whether external integrations affect selected products
3. Whether an accountable owner or source is available
4. Whether a representative sandbox and critical tests are ready

When Volunteer Engagement is selected, it also asks for site model, authentication-provider count, language count, and critical custom journeys.

### 5. Generate the report

```powershell
npm start -- assess `
  --repository "C:\path\to\Nonprofits" `
  --input "$env:LOCALAPPDATA\nonprofit-assessment-reviewed\inventory.json" `
  --output "$env:LOCALAPPDATA\nonprofit-assessment-report"
```

Open:

- `assessment-<environment-name>.md` for the concise customer report
- `assessment-<environment-name>.json` for detailed evidence and partner tooling

## How alignment is determined

Alignment applies only to same-identity releases listed in `catalog/release-equivalence.json`.

- CDM and template apps can be reported as already aligned when the installed PPAC version matches an approved GitHub release-equivalence entry.
- Volunteer Management isn't in that catalog because it migrates to a different solution identity.
- Volunteer Engagement isn't in that catalog because it migrates a website rather than a same-identity solution release.

Leaving PPAC automatic servicing and self-managing GitHub builds is an ownership transition even when the product is already functionally aligned.

## Effort

The customer report uses `None`, `Low`, `Medium`, `High`, or `Review required`. These are relative, rule-based ratings; the assessment doesn't produce hour, cost, or downtime numbers. Unknown critical work is shown as `Review required`, never as `None`.

## What the assessment reads

| Category | Read-only metadata |
| --- | --- |
| Environment | Dataverse version and environment name |
| Solutions | Name, version, managed state, and publisher |
| Components | Component types of nonprofit solutions and related custom solutions |
| Dependencies | Dataverse dependency records for customized nonprofit components |
| Integrations | Workflows, connection references, and plug-ins inside related solutions |
| Data scale | Record counts for related tables |
| Sites | Legacy and enhanced Power Pages site counts |

The assessment never reads:

- Business-record contents
- Credentials, tokens, certificates, or connection values
- Plug-in binaries or flow definitions
- Page, Liquid, JavaScript, or CSS content
- Full solution or site exports

## Safety

- Only HTTPS GET requests to the selected commercial Dataverse URL are made.
- Redirects are rejected; requests, pages, bytes, retries, and total time are bounded.
- Tokens stay in the request path and are never written to files or logs.
- Errors never include server response bodies or customer values.
- Denied or unavailable evidence is reported as unavailable, never as absent.
- Nothing in the environment is changed.

## Privacy and local files

- Assessment inputs and outputs stay local by default.
- The CLI emits only completion status and local output paths.
- Don't commit questionnaires, inventories, reports, or logs.
- Don't paste credentials, tokens, connection strings, certificates, or business-record contents into Copilot or local input files.
- Review and minimize any report before optional sharing.

Detailed target hashes remain in local JSON for reproducibility and tamper detection. They aren't shown in the concise customer report.

## Limitations

- Commercial Dataverse URLs are supported; sovereign clouds and on-premises endpoints aren't currently supported.
- Metadata can't prove arbitrary custom-code behavior or the absence of dynamic/external dependencies.
- Direct customization-overlap dependency discovery is capped at 100 components; table discovery also uses a documented deterministic cap.
- Environment-wide automation counts can include registrations unrelated to selected products.
- A representative sandbox rehearsal remains the best validation of migration effort and cutover timing.

## Contributor validation

Run the unit tests locally before submitting changes:

```powershell
npm test
```
