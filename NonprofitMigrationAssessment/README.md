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

> Assess my nonprofit environment for migration to the solutions in this GitHub repository. Help me pick the environment, then run the read-only assessment and explain the final report.

The skill lists the environments you can access, asks you to pick one, explains what it reads, and runs the assessment after you approve in chat. Environment-specific inventories and reports remain local by default.

## What you receive

The Markdown report shows:

- A direct executive recommendation and the assessment date
- Installed supported products and versions only; products that aren't installed are left out of the customer tables
- The total number of solutions found in the environment
- Whether each product needs migration, needs review, or requires no action
- A next-action checklist built from what was found; no extra customer questionnaire is required
- Named customizations for each installed Microsoft nonprofit solution: added or changed columns, relationships, views, charts, forms, plug-in steps, processes, and cloud flows, whether each change was made directly in the environment or comes from a managed partner solution, and which solution contains it
- Custom and partner solutions, whether they're managed or unmanaged, what they contain, which nonprofit products they change, and why to review them
- The exact number of other components, such as forms or views, that use each listed customization; the optional detailed JSON lists each dependency
- Record counts for the largest tables that nonprofit solutions create, by product
- A diagram of the product migration order and a summary of the dependencies found
- What blocks each product and the action that clears it
- A clear product decision with separate decision confidence, expected effort, and effort confidence
- A recommended sequence, automation and record counts, site applicability, and cautions
- GitHub migration-guide links
- Blockers, missing information, and next actions

The first sections are for customers. Dependency details, automation counts, metric definitions, and limitations are grouped in a technical appendix. Workflow, connection-reference, plug-in assembly, and plug-in step counts include only the installed nonprofit solutions and the custom or partner solutions that change them, not the whole environment. Implementation partners can get the full technical detail in the optional JSON file.

Effort is a relative rating, not an hour, cost, or downtime estimate. Validate the result with your implementation partner and a representative sandbox rehearsal.

## Prerequisites

- Node.js 22 or later
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

In GitHub Copilot, the skill runs these steps for you and asks for your choices in chat. The same commands work in a terminal.

1. List the Dataverse environments you can access:

   ```powershell
   npm.cmd start -- environments
   ```

   The list comes from the Power Platform global discovery service and shows each environment's name, URL, region, and whether you're a System Administrator. Only commercial Dataverse environments are listed.

2. Pick an environment and approve the read-only assessment. Copilot explains what will be read and asks you to confirm in chat, then runs:

   ```powershell
   npm.cmd start -- run --repository "C:\path\to\Nonprofits" --environment "https://contoso.crm.dynamics.com" --confirm-read-only
   ```

   `--confirm-read-only` records that the customer approved the read-only scope; pass it only after that approval. Without `--environment` and `--confirm-read-only`, the command asks for the environment URL and a yes/no confirmation in the terminal instead.

> [!NOTE]
> In PowerShell, use `npm.cmd` rather than `npm` so that the `--` separator reaches the assessment. In bash, zsh, or Command Prompt, `npm start -- …` works.

The command:

1. Reads only the approved metadata and record-count categories listed in [What the assessment reads](#what-the-assessment-reads).
2. Derives bounded customization and integration scope from the collected solution evidence.
3. Keeps intermediate files in one private operating-system temporary folder.
4. Deletes the temporary folder when the command completes or fails.
5. Writes `nonprofit-assessment-<environment>-<date>.md` to the user's Documents folder.
6. Prints the final report path so Copilot can open it in the editor.
Use `--output "C:\visible\folder"` to choose another existing or creatable folder. Add `--partner-json` to preserve the detailed JSON next to the Markdown report. If the filename already exists, the command adds a numeric suffix rather than overwriting it. The automatic run leaves owner and sandbox/test readiness unknown rather than asking the customer to make technical planning choices.

## Advanced staged workflow

The low-level commands below remain available for partner automation, troubleshooting, and reviewed-rule workflows. Each output must use a new local folder outside Git repositories.

### 1. Initialize

```powershell
npm.cmd start -- init `
  --repository "C:\path\to\Nonprofits" `
  --output "$env:LOCALAPPDATA\nonprofit-assessment-input"
```

`init` fetches `origin/master`, pins the target commit, and creates local schemas and configuration files. Local-only target commits are rejected.

### 2. Configure the environment

```powershell
npm.cmd start -- configure `
  --repository "C:\path\to\Nonprofits" `
  --input "$env:LOCALAPPDATA\nonprofit-assessment-input\questionnaire.json" `
  --output "$env:LOCALAPPDATA\nonprofit-assessment-configured"
```

Add `--environment "https://contoso.crm.dynamics.com"` to skip the prompt; otherwise the command asks for the Dataverse environment URL. It derives the local assessment ID and environment alias, uses automatic product scope, and defaults CDM/template apps to alignment checking. Confirming the next step records read-only consent.

The generated `questionnaire.json` is a local machine-readable input. Customers don't need to edit it manually.

### 3. Collect read-only evidence

```powershell
npm.cmd start -- collect `
  --repository "C:\path\to\Nonprofits" `
  --input "$env:LOCALAPPDATA\nonprofit-assessment-configured\questionnaire.json" `
  --output "$env:LOCALAPPDATA\nonprofit-assessment-inventory"
```

The terminal displays the environment and approved categories and asks for a yes/no confirmation before authentication. Add `--environment "<url>" --confirm-read-only` instead when the customer already approved the read-only scope for that environment, for example in Copilot chat; the command refuses to run if the URL doesn't match the configured environment.

The collector uses allowlisted reads for:

- Dataverse version
- Solution identity, version, managed state, and publisher
- Relevant solution-component counts and unmanaged overlap
- Solution component summaries for each nonprofit table, to list unmanaged (Active layer) changes and components added or changed by custom or partner solutions
- Solution layer stacks for changed components, to tell whether a change adds a new component or changes a Microsoft component (form stacks larger than the response cap are skipped)
- Plug-in step and process registrations (name, table, message, stage, state, and owning solution) on nonprofit tables, and the tables that non-Microsoft cloud flows require; flow definitions and plug-in code aren't read
- Dependency lookups for each listed customization, capped at 150
- Workflow, connection-reference, plug-in assembly, and step counts scoped through selected and overlapping solution components
- Aggregate record counts for the tables that nonprofit solutions create (shared tables such as User or Contact aren't counted)
- Legacy and enhanced Power Pages site counts

It doesn't retrieve record contents, connection values, plug-in binaries, page content, credentials, or full exports.

The default detailed-discovery budget is five minutes. The operation remains bounded and can be canceled.

### 4. Optionally answer four partner review questions

```powershell
npm.cmd start -- review `
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
npm.cmd start -- assess `
  --repository "C:\path\to\Nonprofits" `
  --input "$env:LOCALAPPDATA\nonprofit-assessment-reviewed\inventory.json" `
  --output "$env:LOCALAPPDATA\nonprofit-assessment-report"
```

Open:

- `assessment-<environment-name>.md` for the concise customer report
- `assessment-<environment-name>.json` for detailed evidence and partner tooling

The staged `assess` command uses these `assessment-<environment-name>` names. The single `run` command instead writes `nonprofit-assessment-<environment>-<date>.md` (and `.json` with `--partner-json`).

## How alignment is determined

Alignment applies only to same-identity releases listed in `catalog/release-equivalence.json`.

- CDM and template apps can be reported as already aligned ("No migration required") when the installed PPAC version matches a GitHub release-equivalence entry **and** the catalog's `status` is `approved`.
- While the catalog is a `candidate`, a matching release is shown as **Review required** with a caution that the release mapping isn't approved yet. The tool never states "No migration required" from an unapproved mapping.
- Volunteer Management isn't in that catalog because it migrates to a different solution identity.
- Volunteer Engagement isn't in that catalog because it migrates a website rather than a same-identity solution release.

Leaving PPAC automatic servicing and self-managing GitHub builds is an ownership transition even when the product is already functionally aligned.

## Effort

The customer report uses `None`, `Low`, `Medium`, `High`, or `Review required`. These are relative, rule-based ratings; the assessment doesn't produce hour, cost, or downtime numbers. Unknown critical work is shown as `Review required`, never as `None`.

Each product is rated from its own named customizations: changes in the per-product customization table, plus plug-in steps, processes, and cloud flows that run on its tables. The rules are:

| Customization level | Rule | CDM, Fundraising, Grant Management, Outcome Management | Volunteer Management, Volunteer Engagement |
| --- | --- | --- | --- |
| Heavy | More than 10 named customizations, changes from 2 or more partner or custom solutions, or (for replacements) custom relationships or automation on tables that the migration replaces | High | High |
| Moderate | At least one named customization and no heavy rule applies | Medium | High |
| Standard | No customizations found on the product's components | Low | Medium |
| Unknown or opaque | Customization scope can't be established, or its owner is unknown | Review required | Review required |

Products already aligned with their GitHub release show `None`; the same reasons tell you which customizations to regression-test. The report's "Why these effort ratings?" table states the rule that applied and up to four concrete reasons, such as "4 forms changed directly in this environment on Award, Contact, Participation".

## What the assessment reads

| Category | Read-only metadata |
| --- | --- |
| Environment | Dataverse version and environment name |
| Solutions | Name, version, managed state, and publisher |
| Components | Component types of nonprofit solutions and related custom solutions |
| Customizations | Solution component summaries and solution layers for nonprofit tables: names, types, managed state, and which solution layer changed them |
| Dependencies | Dataverse dependency records for customized nonprofit components |
| Integrations | Workflows, connection references, and plug-ins inside related solutions; plug-in step, process, and cloud flow registrations on nonprofit tables |
| Data scale | Record counts for tables that nonprofit solutions create |
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
- The CLI emits only the environment list (for `environments`), a progress line with the selected environment URL, completion status, and local output paths.
- Don't commit questionnaires, inventories, reports, or logs.
- Don't paste credentials, tokens, connection strings, certificates, or business-record contents into Copilot or local input files.
- Review and minimize any report before optional sharing.

Detailed target hashes remain in local JSON for reproducibility and tamper detection. They aren't shown in the concise customer report.

## Limitations

- Commercial Dataverse URLs are supported; sovereign clouds and on-premises endpoints aren't currently supported.
- Metadata can't prove arbitrary custom-code behavior or the absence of dynamic/external dependencies.
- Dependency lookups cover up to 150 listed customizations. Record counts cover up to 200 nonprofit tables.
- Customization discovery checks up to 200 nonprofit tables and 60 partner-extended tables. On shared Dataverse tables such as Account and Contact, only changes to components that a nonprofit solution brings are listed; changes to those tables' own definitions aren't. When a form's layer stack is too large to read, the change is shown as "Added or changed".
- Plug-in steps, processes, and cloud flows are listed for tables that nonprofit solutions create, not for shared tables such as Contact. Up to 50 non-Microsoft cloud flows are checked, and a flow is listed only when its required components include a nonprofit table.
- A representative sandbox rehearsal remains the best validation of migration effort and cutover timing.

## Contributor validation

Run the unit tests locally before submitting changes:

```powershell
npm test
```
