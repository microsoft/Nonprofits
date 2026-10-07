# Nonprofit migration assessment prototype

A local Node.js 22/TypeScript assessment package for CDM, the three nonprofit template apps, Volunteer Management, and Volunteer Engagement. The engineering specification and validation evidence live in the source repository; the customer package contains only runtime guidance and public catalogs.

**Status: development prototype, not customer-ready.** The package runs offline assessments and implements bounded read-only environment discovery. Detailed live validation, least-privilege testing, timing calibration, migration rehearsals, and publication approval remain pending. The assessment package itself does not provision or customize environments.

## Implemented scope

- Strict input validation and generated JSON Schemas.
- Local questionnaire files; no cloud-chat questionnaire or automatic AI upload.
- Candidate route selection, publisher/managed/version checks, dependency gates, and partial-state findings.
- Intent-aware same-solution results: alignment confirmation, PPAC ownership transition, newer GitHub release, and replacement migration.
- Automatic scope selection from observed installed solutions/sites, with explicit include/exclude overrides.
- Versioned candidate compatibility decisions and deterministic route complexity classification.
- Occurrence-aware shared-work planning and independent adverse scenarios.
- Complexity-specific reviewed provisional-typical rules with reviewer/date/basis/limitation provenance.
- Per-solution and combined effort accounting, dependency critical-path elapsed ranges, separate production execution/downtime ranges, explicit unknowns, and local JSON/Markdown reports.
- Bounded environment, solution, component-overlap, dependency-reference, integration-registration, aggregate-count, and Power Pages site discovery with injected transport/authentication and offline safety tests.
- A concise customer Markdown report; detailed evidence, hashes, work dependencies, and scenario reasons remain in JSON.
- Target identities, versions, publisher metadata, and guide evidence resolved from a clean, pinned `microsoft/Nonprofits` Git checkout.
- Public npm dependencies only; no internal repository or feed is required.

Discovery provides bounded metadata signals, not behavioral proof. Component overlap doesn't prove a customization is compatible; direct dependency reads can't prove the absence of dynamic or external dependencies; registration counts don't test integrations; aggregate row counts don't predict migration duration; and site counts don't inspect page content or credentials. Customer answers remain distinct from independently observed evidence.

The default rulebook ships conservative, uncalibrated engineering assumptions so supported routes can produce useful initial planning ranges without reviewer input. The report labels their basis and limitations. Reviewed rules can override them. These defaults aren't measured averages, commitments, or certification; critical blockers and unbounded work still withhold complete totals.

## Build and test

From this package directory, use Node.js 22:

```powershell
npm ci
npm run typecheck
npm test
npm run package:check
```

The lockfile and package configuration use the public npm registry. The package has no install scripts. Generated build files stay under `dist`; no monorepo build integration is required.

Tests in the source repository use local synthetic fixtures and mocked HTTP. They do not sign in, call Dataverse, deploy solutions, change permissions, or create customizations.

## Create the local questionnaire

Use a clean local checkout whose `origin` is `https://github.com/microsoft/Nonprofits`. The tool reads allowlisted files from the pinned Git commit, not mutable working-tree files or manually entered package metadata. Git must be installed.

Production target commands fetch `origin/master` anonymously before resolving target evidence. `init` uses the fetched master commit, and later commands require the pinned commit to remain reachable from `origin/master`. Local-only commits are rejected. The `--allow-local-test-target` option exists only for isolated synthetic tests and must not be used for customer assessments.

Run this command in your own terminal, not through a cloud assistant's captured interactive terminal. Choose a new directory under an existing local parent outside all Git checkouts:

```powershell
node .\dist\src\cli.js init `
  --repository "C:\path\to\Nonprofits" `
  --output "$env:LOCALAPPDATA\nonprofit-assessment-input"
```

The command writes:

- `questionnaire.json`: a draft with consent disabled and repository-derived target metadata.
- `questionnaire.schema.json`: the questionnaire structural schema.
- `inventory.schema.json`: the assessment-input structural schema.
- `assessment.schema.json`: the report-output structural schema.
- `rules.schema.json`: the timing-rule structural schema.
- `rules.json`: bundled conservative engineering assumptions for likely-standard, standard, and bounded customized planning.
- `rules-review.schema.json`: the local expert-review draft schema.
- `rules-review.json`: 102 empty route/phase/complexity entries that require expert completion before conversion to a usable rulebook.

JSON Schema describes structural constraints. Runtime validation additionally checks cross-field rules such as duplicate IDs, work scope, and valid range ordering.

Open the questionnaire locally. Do not attach it to chat or commit it. Set:

1. A local assessment ID, environment alias, exact environment HTTPS origin, environment type/region, Managed Environment state, and access restriction.
2. Solution scope and intent. `scope: "auto"` includes observed installed products and known VE sites; use `include` or `exclude` only for an explicit override. For CDM/template apps select `confirm-alignment`, `ownership-transition`, or `apply-github-release`. VM/VE use `replace-with-github`. Include CDM when explicitly assessing its dependent apps, and VM when explicitly assessing VE. Leave unanswered facts `unknown`.
3. Any reviewed customization/integration work and explicitly named adverse scenarios. For VE, record the source model, authentication-provider count category, language count, and custom-journey presence.
4. Read-only consent and its timestamp only after reviewing the scope.

Do not edit `target`. It contains the canonical repository URL, resolved commit, manifest-derived solution metadata, and SHA-256 hashes for the allowlisted manifests and guides. `collect` and `assess` reproduce and compare this evidence from the same checkout before proceeding.

Compatibility equivalence and engineering assumptions are stored in validated files under `catalog/`. Their current status is candidate/assumed; an owning-team review is still required before customer release.

The candidate public migration routes are documented in the [specification's route catalog](specification.md#3-initial-migration-route-catalog). Installed versions come from the selected environment; target versions come from the pinned public checkout, not this README or internal source.

`confirm-alignment` can return `already-at-target` only for a pair in the versioned equivalence catalog. That result means no product or data migration is required. It is distinct from `ownership-transition`, where the customer leaves PPAC automatic servicing and assumes responsibility for GitHub-built updates.

## Describe customization and adverse work

Each `work` entry has an ID, selected families, kind, phase, environment scope, occurrence, activity/component scope, rule ID, scenario, prerequisites, impact, and a short local basis.

- `kind`: `customization`, `integration`, or `risk`.
- `impact`: `bounded` or `unbounded`. Unbounded assessed work prevents a complete affected-route estimate.
- Customization/integration work belongs to `scenario: "assessed"`.
- Risk work belongs to a named adverse scenario, such as `extra-rehearsal`. Risks that occur together use the same scenario name. Mutually exclusive alternatives use different names and are never added together.
- `occurrenceId` distinguishes a second rehearsal/re-test from the original occurrence. Shared references use the same environment, phase, activity, component, and occurrence.
- `dependsOn` contains work IDs, not executable commands or component URLs.
- A shared customization lists every affected family. Include additional indirect impact discovered by the partner; static metadata cannot prove absence of dynamic dependencies.

Reviewed timing rules have a unique rate ID, work ID, applicable routes/families/complexities, person-hour range, elapsed range, optional execution/downtime ranges, documented basis and limitations, reviewer, review date, and `reviewed: true`. The review record is accountable expert judgment, not a Microsoft certification or statistical average. Missing applicable rates remain unknown.

The package labels default values as bundled uncalibrated engineering assumptions and reviewed overrides as provisional typical planning ranges. It calculates a dependency critical-path elapsed range and sums production execution/downtime ranges. It doesn't yet schedule against role capacity, working calendars, approval lead times, or change-window placement; local scheduling review and rehearsal remain required. Seven days is a provisional inventory freshness limit, not a platform guarantee.

Even with all effort rules supplied, an assessment of installed products remains `partial` while these prototype limitations are unresolved. Baseline effort uses standard assumptions; assessed/adverse plans add remediation gates before acceptance and production. Do not use the baseline alone as a customized-environment execution plan.

## Optionally review and override typical ranges

The bundled defaults work without reviewer input. To replace them with accountable provisional typical ranges, open `rules-review.json` locally and have migration subject-matter experts complete every rate that will be published. Each completed entry requires effort, elapsed time, basis, limitations, reviewer, and review date. Production entries also require execution and downtime ranges. Values must be route-, phase-, and complexity-specific; do not use hidden multipliers or test-fixture values.

Convert a fully completed review draft into a strict rulebook:

```powershell
node .\dist\src\cli.js finalize-rules `
  --input "$env:LOCALAPPDATA\nonprofit-assessment-input\rules-review.json" `
  --output "$env:LOCALAPPDATA\nonprofit-assessment-reviewed-rules"
```

The command fails if any required review field is missing. Use the resulting `rules.json` with `assess --rules`. Numeric defaults must not be copied from tests.

## Collect the environment assessment

**Do not run this until an authorized environment has been selected for testing.** This step does not prepare an environment or grant permissions.

Prerequisites:

- Azure CLI installed and signed in by the customer to the correct tenant/account.
- Customer authorization for each selected read-only category: environment, solutions, components, dependencies, integrations, counts, and sites.
- An isolated human terminal with interactive input/output, not an AI-captured terminal.
- A locally completed questionnaire with read-only consent enabled.
- The same clean `microsoft/Nonprofits` checkout used to initialize the questionnaire.

```powershell
node .\dist\src\cli.js collect `
  --repository "C:\path\to\Nonprofits" `
  --input "$env:LOCALAPPDATA\nonprofit-assessment-input\questionnaire.json" `
  --output "$env:LOCALAPPDATA\nonprofit-assessment-inventory"
```

The command shows the destination locally and requires typing `ASSESS` before obtaining a token. It uses `AzureCliCredential`; never paste tokens into JSON, command arguments, or chat. SDK debug logging must be disabled. Non-TTY collection is refused.

The collector supports commercial Dataverse origins only, not sovereign clouds or on-premises endpoints. It uses allowlisted GET operations and fields to collect:

- Dataverse version.
- Solution identity, version, managed state, publisher, and current publisher prefix.
- Relevant solution-component type counts and overlap with bounded unmanaged-solution membership.
- Direct dependent-component reference counts for a bounded component sample.
- Environment-wide counts of workflows, connection references, plug-in assemblies, and plug-in steps.
- Snapshot record counts for bounded relevant table components through `RetrieveTotalRecordCount`; no rows are enumerated.
- Legacy and enhanced Power Pages site counts; no page, snippet, setting, membership, or credential content is read.

Every category records its own observed, partial, denied, unavailable, or not-collected status. Caps and unavailable capabilities remain explicit. Observed platform solution versions can use non-four-part forms and a publisher prefix can be empty; a migration source must still have a comparable four-part version. The current publisher prefix is contextual publisher metadata, not original package-prefix proof. Reports include only route-relevant solution identities and aggregate environment signals. The collector rejects redirects, bounds requests/time/response sizes, and never serializes tokens or raw failed response bodies.

The minimum role required for these reads has not been validated in a real environment. Do not grant System Administrator merely because a read fails. Review access with the environment owner.

The collector separates capabilities so a denied category remains unknown instead of becoming false absence:

| Category | Required read capability | If unavailable |
| --- | --- | --- |
| Environment | Run `RetrieveVersion` | Dataverse version unknown |
| Solutions | Read solution and publisher identity metadata | Installed-product scope is incomplete |
| Components | Read relevant solution-component membership | Customization overlap remains unknown |
| Dependencies | Run dependent-component metadata functions | Dependency risk remains partial/unknown |
| Integrations | Count workflow, connection-reference, plug-in assembly, and step registrations | Integration scope remains unknown |
| Counts | Read table metadata and run aggregate record counts | Data scale remains unknown |
| Sites | Count legacy/enhanced website records | VE site scope remains unknown |

This is a capability matrix, not a validated Dataverse security-role prescription. Prove the minimum role with a constrained account before customer release.

## Complete the short local review

After collection, run the local review in your own terminal:

```powershell
node .\dist\src\cli.js review `
  --repository "C:\path\to\Nonprofits" `
  --input "$env:LOCALAPPDATA\nonprofit-assessment-inventory\inventory.json" `
  --output "$env:LOCALAPPDATA\nonprofit-assessment-reviewed-inventory"
```

The review asks five common questions:

1. Critical custom plug-ins, flows, or components.
2. External integrations.
3. Owner/source availability.
4. Representative sandbox and test readiness.
5. Maximum acceptable interruption.

When VE is selected, it also asks for source model, authentication-provider count category, language count category, and critical custom journeys. Answers remain local. `bounded` customization/integration answers create one scoped remediation occurrence; `opaque` or ownerless work stays unbounded. The output contains a reviewed `inventory.json` for `assess`.

## Run the offline assessment

After obtaining a local inventory, or when developing with synthetic fixtures:

```powershell
node .\dist\src\cli.js assess `
  --repository "C:\path\to\Nonprofits" `
  --input "$env:LOCALAPPDATA\nonprofit-assessment-reviewed-inventory\inventory.json" `
  --output "$env:LOCALAPPDATA\nonprofit-assessment-report"
```

To apply a locally reviewed rulebook, add:

```powershell
--rules "$env:LOCALAPPDATA\nonprofit-assessment-input\rules.json"
```

Reports are `assessment.json` and `assessment.md`. The Markdown is the short customer decision report; JSON contains the detailed evidence and planning graph. Open them locally. Standard output contains only completion status and the output directory, never the inventory or answers.

## Compare an estimate with a rehearsal

After a representative rehearsal, create a small local observation file:

```json
{
  "assessmentId": "<assessment-id>",
  "scenario": "assessed",
  "observedAt": "2026-10-07T12:00:00.000Z",
  "effort": { "value": 120, "unit": "person-hours" },
  "elapsed": { "value": 180, "unit": "hours" },
  "execution": { "value": 6, "unit": "hours" },
  "downtime": { "value": 2, "unit": "hours" },
  "notes": "Representative sandbox rehearsal."
}
```

Run:

```powershell
node .\dist\src\cli.js calibrate `
  --input "$env:LOCALAPPDATA\nonprofit-assessment-report\assessment.json" `
  --rehearsal "$env:LOCALAPPDATA\nonprofit-assessment-rehearsal.json" `
  --output "$env:LOCALAPPDATA\nonprofit-assessment-calibration"
```

The output reports each observed value as within, below, above, not observed, or not comparable with the assessed range. It doesn't change the rulebook automatically.

| Exit code | Meaning |
| --- | --- |
| `0` | Initialization/collection completed, or a complete inventory found no relevant solutions; inspect evidence and limitations |
| `1` | Invalid input, refusal, or command failure; report completion is not claimed |
| `2` | Explicit partial inventory/assessment was written; unresolved evidence or timing remains |

Existing directories are never overwritten. Output inside a Git checkout is refused. Bundles are written to a restricted sibling temporary directory and renamed into place only after all files close successfully. Review Windows inherited ACLs and avoid shared or cloud-synchronized directories; the tool can't detect every sync client. Remove local artifacts when no longer needed using your organization's retention policy.

Errors sent to a host are sanitized rather than echoing input values. For validation failures, check the local schemas, required fields, cross-field rules above, and consent. Do not paste full local inputs or authentication errors into chat to troubleshoot.

## Skill integration

Open the repository as the workspace root to expose the [assessment skill](../.github/skills/nonprofit-migration-assessment/SKILL.md). The deterministic package remains in this folder. The skill explains the local workflow and refuses to collect customer answers through cloud chat by default.

The skill does not invoke the VM migration script, the VE deployment skill, `pac solution import`, exports, role patches, or any environment customization tooling. Environment preparation and synthetic customizations belong to a later, separately approved test activity.

## Before customer release

- Validate the detailed collector field/query coverage against an authorized standard, customized, and mixed environment.
- Validate least-privilege permissions and authentication in a representative test tenant.
- Complete a reviewed supported version and compatibility matrix; pinned target-package identity verification is implemented.
- Add live standard, heavily customized, and mixed-environment rehearsal evidence.
- Calibrate actual effort, execution, scheduling, and downtime models.
- Verify local input isolation in each supported host and implement any separately consented sharing UX.
- Complete public packaging and publication review.
