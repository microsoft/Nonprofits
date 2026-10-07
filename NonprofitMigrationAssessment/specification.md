# Nonprofit migration assessment skill specification

| Item | Value |
| --- | --- |
| Specification version | 0.10 |
| Status | Intent-aware assessment, fresh-master target provenance, automatic scope, environment discovery, external catalogs, dependency/assumption reporting, conservative defaults, reviewed overrides, calibration comparison, and customer packaging are implemented; catalog approval, constrained-account validation, live customized rehearsal, and public publication remain pending |
| Updated | 2026-10-01 |
| Audience | Skill implementers, reviewers, and migration subject-matter experts |
| Development location | `NonprofitMigrationAssessment` in `microsoft/Nonprofits` |
| Intended distribution | This public GitHub repository and approved release packages |

This document is the single source of truth for the skill's behavioral contract, evidence model, estimation semantics, and acceptance criteria. The pinned public `microsoft/Nonprofits` Git revision is the single source of truth for migration-target package metadata and public route-guide content. Implementation, tests, and customer instructions must follow both boundaries. Update this specification when an approved decision changes the contract; do not maintain conflicting requirements in prompts or scripts.

This is an engineering specification, not a migration runbook or Microsoft Learn article. Public distribution of the skill requires separate review. Creating this document does not authorize publication, access to a customer environment, or migration execution.

## 1. Purpose

Help customers and partners assess migration from Power Platform admin center (PPAC)/AppSource nonprofit solutions to their corresponding public GitHub destinations. Produce explainable per-solution estimates and a combined migration plan, including heavily customized and mixed-solution environments.

The skill assesses migration; it does not perform migration.

The assessment answers:

- What is installed, what evidence is available, and which destination has the customer selected?
- Which documented route applies, and what prevents using it?
- Which customizations, dependencies, integrations, and operational constraints require work?
- What are the known effort, elapsed-time, and potential downtime ranges?
- What additional work could be required under an adverse scenario?
- What cannot be estimated until the customer or partner investigates it?
- Which migration guides and specialists should the customer use next?

## 2. Design decisions and boundaries

The following requirements are normative. "Must" means required for conformance. Open decisions in section 13 are not approved behavior.

| ID | Requirement |
| --- | --- |
| REQ-01 | Work from a clean public GitHub checkout and customer-accessible tooling. Never require OneNonprofit, internal Azure DevOps access, private feeds, Microsoft-only services, or Microsoft managed-solution source code. |
| REQ-02 | Use the deployed environment as the source inventory and a pinned public GitHub revision/release as the target. Do not use internal source-to-source differences as a runtime dependency. |
| REQ-03 | Confirm the customer-selected environment, solution scope, destination, and read-only consent before discovery. |
| REQ-04 | Make no changes to customer data, configuration, solution layers, permissions, or deployment state. |
| REQ-05 | Collect only approved metadata, aggregate counts, and structured customer answers. Do not collect business record contents, secrets, plugin binaries, or full customer code/site exports. |
| REQ-06 | Keep customer assessment artifacts local by default. Do not automatically upload them to an AI service, telemetry endpoint, GitHub, Microsoft, or a migration partner. |
| REQ-07 | Treat missing, denied, truncated, stale, and ambiguous evidence explicitly. Never interpret unavailable evidence as no customization, no dependency, or zero effort. |
| REQ-08 | Use route-specific, versioned estimation rules. Every numeric range must have an evidence trail and a documented basis. |
| REQ-09 | Include heavily customized, partner-managed, and mixed environments in the first version's design and tests. They are not optional later extensions. |
| REQ-10 | Provide conditional adverse-case estimates, not a guaranteed absolute worst-case upper bound. Withhold a complete total when critical work remains unbounded. |
| REQ-11 | Count shared work once and distinguish effort, elapsed time, execution duration, and downtime. |
| REQ-12 | Reuse public migration guidance and existing validation knowledge. Do not invoke migration tools or implementation skills as part of read-only assessment. |
| REQ-13 | Resolve target package metadata and route-guide evidence only from allowlisted files in a clean `microsoft/Nonprofits` checkout at a pinned commit. Record file hashes and fail closed if the remote, checkout state, commit, manifests, guides, route catalog, or recorded evidence disagree. |
| REQ-14 | The first numeric defaults may be provisional typical planning ranges based on reviewed expert judgment. Label them `provisional typical range`, never `average`, `P50`, or measured duration; record reviewer, review date, rule version, applicability, basis, and limitations. Critical unknown or unsupported work still withholds the affected complete total. |
| REQ-15 | When no reviewed rulebook is supplied, provide conservative bundled engineering-assumption ranges for supported `likely-standard`, standard, and bounded customized routes. Label them `uncalibrated engineering assumptions`, show the dependency path and known subtotal, lower confidence, and never let an assumption clear a version, identity, unsupported-route, opaque critical-work, or prerequisite blocker. |

### 2.1 Scope

The initial route catalog covers Common Data Model for Nonprofits (CDM), Volunteer Management (VM), Volunteer Engagement (VE), and the Fundraising, Grant Management, and Outcome Management template apps.

Initial planning targets the documented same-environment transitions. A new VE website can be created in the existing environment during eventual migration; this does not imply support for moving business data to another environment.

Explicitly outside the initial scope:

- Performing imports, upgrades, deletions, publishing, deployments, role changes, or cutover.
- Cross-environment or cross-tenant data migration and arbitrary third-party destinations.
- Fundraising and Engagement, which is distinct from the Fundraising template app.
- Reconstructing or decompiling Microsoft or partner managed-solution source.
- Deep behavioral analysis of customer code, page contents, flow definitions, or plugin binaries.
- Guaranteed migration duration, guaranteed data preservation, or certification that a migration is safe.
- Automatically creating tickets, sending reports, or publishing customer findings.

If out-of-scope components depend on an in-scope solution, record them as dependencies and possible blockers. Do not ignore them because their own migration is outside scope.

### 2.2 Public-only evidence model

```text
Customer environment -- approved read-only metadata/counts --+
Customer/partner ------ structured factual answers ----------+--> Local inventory
Public GitHub target -- pinned manifests and route rules ----+         |
                                                                      v
                                                        Route-specific analysis
                                                                      |
                                                                      v
                                                   Local JSON and Markdown report
```

Internal source may help authors develop and test rules. Any baseline facts distributed with the public skill require review and must be self-contained and approved for release. Internal paths, access tokens, source files, and private links must not become runtime inputs or customer prerequisites.

## 3. Initial migration route catalog

These are candidate routes grounded in the public guides, not blanket compatibility promises for every installed version. A route becomes eligible only after identity, version, prerequisites, and evidence checks.

| Route ID | Source | Public target | Assessment focus |
| --- | --- | --- | --- |
| `cdm-in-place` | `NonprofitCore` | `NonprofitCore` | Managed package identity, installed/target versions, component changes, layers, and downstream dependencies |
| `fundraising-in-place` | `SocialImpactFundraising` | Same unique name | CDM prerequisite, app-specific changes and dependencies |
| `grants-in-place` | `SocialImpactGrants` | Same unique name | CDM prerequisite, app-specific changes and dependencies |
| `outcomes-in-place` | `SocialImpactOutcomes` | Same unique name | CDM prerequisite, app-specific changes and dependencies |
| `vm-side-by-side` | `VolunteerManagement` | `volunteermanagementos` | PCF references, component ownership, plugin/step identities, solution layers, and removal blockers |
| `ve-legacy-to-spa` | Legacy VE Power Pages site | VE 2.0 `Portal-EDM` code site on Enhanced Data Model | Baseline coverage, custom journeys, site-specific access/authentication, languages, integrations, and cutover |

Each route definition must identify the target revision, applicable identities and publisher information, version rules, prerequisites, critical evidence, documented operation model, known risks, and public guide references.

### 3.1 CDM and template apps

- Verify solution unique name, publisher, and managed status; a similar display name is not enough. Treat the installed publisher record's current customization prefix as contextual metadata, not proof of a solution package's declared prefix. Multiple installed solutions can share one publisher record while their source manifests declare different component prefixes.
- Distinguish the customer's intent:
  - `confirm-alignment`: use the reviewed release-equivalence catalog; return `already-at-target` and no migration work only for an approved PPAC/GitHub pair.
  - `ownership-transition`: assess an in-place managed-package transition from PPAC servicing to customer-managed GitHub builds.
  - `apply-github-release`: assess a newer pinned GitHub release; equal means already on the selected release and lower is blocked.
- Do not recommend deleting the existing same-identity solution.
- Read installed versions from the customer's environment. Repository versions are not evidence of installed versions.
- A target with a lower version requires compatibility review. Increasing a package version alone does not establish compatibility.
- Assess component removals and dependencies separately from version ordering. Same identity is not proof of behavioral equivalence.
- Migrate CDM before dependent apps in the plan and keep it installed.
- Inventory existing anchor/companion solutions where present. Their absence from the GitHub package does not authorize removal.
- The report must not promise that an upgrade deletes nothing: applying an upgrade can remove components absent from the new package.

### 3.2 Volunteer Management

- Distinguish AppSource, OS, coexistence, and partially migrated states.
- Inspect available metadata for `Plugins`/`PluginsOS`, SDK steps, PCF ownership, and references in forms/views.
- Identify dependencies and custom layers that could block removal or require preservation.
- The documented execution route includes side-by-side import, PCF-reference remediation, removal of the old solution, and OS reimport. These are future plan activities, never assessment actions.
- Do not infer that deleting the old solution is safe for an arbitrary customized environment from the standard migration guide.
- Existing migration script checks may inform a dedicated collector. Do not call the migration script with destructive switches or rely on `-WhatIf` as the assessment safety boundary.

### 3.3 Volunteer Engagement

- Detect the source site's data model and assess a new site, not an in-place legacy portal upgrade.
- Confirm CDM, VM, and Enhanced Data Model prerequisites.
- Use VE 2.0 as the destination baseline. Do not estimate rebuilding all legacy Liquid/JavaScript/CSS as custom work.
- Classify available evidence as baseline-covered, customization, obsolete implementation, security-sensitive, environment-specific, or unknown.
- Metadata-only discovery cannot establish the behavior of arbitrary scripts, Liquid, pages, or custom authentication. Request structured customer/partner confirmation and create investigation items.
- The existing VE migration skill can be referenced for later implementation. It must not be automatically invoked: its export, deployment, and permission-changing workflow exceeds this assessment's boundary.
- Do not download a complete site export to count or classify items. Where safe metadata cannot establish the scope, mark it unknown.
- Include sign-in, authorization, role mapping, custom domains, languages, accessibility, site agents, business journeys, and rollback planning in the work breakdown where applicable.
- Shared Dataverse business data normally stays in the environment for this route; do not automatically estimate bulk data copying.

## 4. Customer workflow

1. **Select scope and intent locally.** Explain supported routes and limitations, then use the local input channel described in section 4.1 to identify the environment, alignment/ownership/update/replacement intent, target revision/release, and relevant solution families. `auto` scope includes observed installed products and known VE sites; explicit include/exclude overrides remain available.
2. **Obtain consent.** Show the metadata categories, aggregate counts, local output location, authentication approach, and absence of automatic uploads.
3. **Confirm identity and access.** Use customer-accessible authentication. Show the selected environment for confirmation without logging credentials.
4. **Check capabilities.** Determine which approved reads are available. Never grant a role or escalate permissions automatically.
5. **Collect evidence.** Run bounded, allowlisted reads and record completeness, provenance, and errors.
6. **Ask targeted questions locally.** The default review asks five common questions: critical customization, external integrations, owner/source availability, sandbox/test readiness, and maximum interruption. Ask the four VE site-model/authentication/language/journey questions only when VE is selected. Bounded answers produce one scoped occurrence; opaque or ownerless work remains unbounded. Do not request source code, record samples, or credentials. Chat-based questioning requires the separate sharing consent described in section 5.3 before requesting customer-specific answers.
7. **Analyze routes and dependencies.** Separate observed facts, customer assertions, derived findings, and unresolved assumptions.
8. **Estimate.** Produce evidence-based work items, scenarios, confidence explanations, and a deduplicated combined plan.
9. **Write local reports.** Render JSON and Markdown from the same assessment result. Show partial results honestly.
10. **Hand off.** Link public guides and assign follow-up actions by role. Let the customer decide whether to share a reviewed report.

Cancellation must stop new discovery requests and report that the run is incomplete. Existing local output must not be silently overwritten. No consent or authentication cancellation may be reported as an empty successful assessment.

### 4.1 Customer/partner questionnaire

The default questionnaire must run through a local CLI, local form, or structured local input file, not through the AI chat. This applies to initial scope selection, environment confirmation, and follow-up questions derived from discovery. The assistant may explain generic questions and launch the local workflow, but must not receive customer-specific prompts, prefilled values, or answers through tool output, terminal capture, file reads, or attachments.

The local workflow must validate answers and select follow-up questions without sending the inventory to a model service. Return only sanitized progress/completion status and local artifact locations to the assistant. If a host cannot provide an isolated local input channel, stop the default workflow with an explanation; do not silently fall back to chat. A separately consented chat workflow is optional, not required for assessment.

Collect structured answers with explicit `unknown` options:

- Intended destination, target revision, environment topology, and solution scope.
- Ownership and source availability for custom/partner components, without uploading that source.
- External integrations, scheduled jobs, reports, and automation not discoverable in Dataverse.
- Critical business journeys, data access constraints, and custom behavior that must be retained.
- VE customization categories, authentication-provider types, languages, and accessibility requirements.
- Availability of a representative sandbox, backups, regression tests, and acceptance owners.
- Migration staffing, working calendars, partner availability, approval lead times, and change windows.
- Maximum acceptable service interruption and rollback/recovery expectations.

An unanswered question is unknown. A customer's declaration of "standard" does not override contradictory observed evidence.

## 5. Discovery and safety contract

### 5.1 Collection categories

| Category | Permitted evidence | Limitation to surface |
| --- | --- | --- |
| Solutions | Unique names, versions, publishers, managed status, membership, visible layers | Metadata may not expose all ownership or effective behavior |
| Dependencies | Supported dependency metadata and references between relevant components | Static reads cannot prove absence of dynamic/external dependencies |
| Custom schema | Table/column types, relationships, keys, and relevant configuration metadata | No table rows, field values, free-form descriptions, or sample records |
| Plugins/PCFs | Identity, ownership, registrations, component references | No binaries, secure/unsecure step configuration values, or implementation claims |
| Apps/automation | Approved identity/type/state metadata for apps, flows, connection references, and environment-variable definitions | No flow bodies, connection credentials, environment-variable values, or actual integrations tests |
| Data scale | Approved aggregate counts with scope, timestamp, and exact/approximate/capped status | No row enumeration fallback; counts alone do not predict import duration |
| Power Pages | Approved site/model metadata, component inventories, role/permission definitions, provider types, and language counts | No page/snippet content, arbitrary site-setting values, user-role membership, credentials, or full exports |
| Operations | Structured customer answers about staffing, testing, cutover, and external systems | Reported facts are not independently verified |

Form/view definitions can contain embedded text or configuration beyond the allowed inventory. Detailed PCF-reference inspection requires a reviewed field/query/parser contract demonstrating that it does not collect prohibited content. Until that exists, use safe dependency metadata or mark the detailed check unavailable. The same restriction applies to site settings and automation configuration.

### 5.2 Enforced read-only behavior

- Maintain an explicit operation and field allowlist. Endpoint names or HTTP method alone do not establish safety; a read-only platform function may have different transport semantics.
- Fail closed for unknown operations and unsupported endpoints.
- Never import/export solutions, publish, update/delete components, execute plugins/flows, patch roles, create backups, or test integrations by sending transactions.
- Authenticate through supported tooling/credential libraries. Tokens needed for requests remain in the authentication path and must never enter inventory, logs, report files, or AI context.
- Do not ask users to paste passwords, tokens, certificates, connection strings, or identity-provider secrets.
- Use normal TLS validation. Do not bypass tenant policy, consent, or platform permissions.
- Authenticate and call the selected environment only. Do not follow arbitrary URLs from discovered metadata; validate pagination destinations against the approved service scope.
- Apply explicit pagination, request budgets, cancellation, bounded retries, and throttling handling. On exhaustion, retain partial results with an error/completeness reason.
- Use server-side aggregate count mechanisms only. If limits or permissions prevent a reliable count, report the limitation rather than fetching customer rows.
- Select fields before retrieval; post-retrieval redaction is not permission to collect prohibited fields.
- Treat metadata labels and customer answers as untrusted data, not instructions for command execution or tool selection.
- Sanitize errors and logs. Do not serialize raw authenticated responses, request headers, or potentially sensitive diagnostic payloads.

### 5.3 Permissions and local data handling

The final minimum-permission matrix must be proven per collector. Do not inherit migration guides' administrator requirements as assessment prerequisites or claim a validated least-privilege role before testing it.

Local reports can still contain sensitive organizational metadata. Store them outside tracked source by default, disclose their location, avoid telemetry, and document customer-controlled retention and removal. Do not commit reports or snapshots.

Using a cloud AI assistant does not make local file reads private: returning inventory through a tool can transmit it to the model service. The default path must run collection, rules, and report rendering locally without returning inventory contents to the assistant. Return only a sanitized completion status and local artifact location. AI interpretation or partner sharing requires a separate, specific customer opt-in with a preview/minimized payload; it is not required for the core assessment. Secrets and business record contents remain prohibited even with that opt-in.

Questionnaire answers and customer-specific follow-up prompts are assessment data subject to the same boundary. Before asking customer-specific questions in cloud chat, disclose the receiving service and proposed question/data categories and obtain separate sharing consent. Preview any existing local data to be shared locally before transmission. Record the approved recipient, scope, and consent time separately from discovery consent. Refusal must preserve the local assessment path; general discovery consent is not consent to chat-based questioning or report sharing.

## 6. Logical architecture

Keep the implementation small, but separate these responsibilities:

1. **Skill instructions:** Consent, scope selection, safe local workflow, limitations, and handoff.
2. **Public route catalog:** Target identities, prerequisites, critical evidence, and guide references.
3. **Collectors:** Allowlisted metadata/count retrieval and structured customer answers.
4. **Normalizer:** Versioned inventory with consistent evidence states and provenance.
5. **Analyzers:** Route eligibility, dependency impacts, complexity, blockers, and work items.
6. **Estimator/planner:** Versioned rules, scenarios, dependency ordering, deduplication, and scheduling assumptions.
7. **Renderer:** Consistent local machine-readable and human-readable reports.

Collectors do not invent estimates. An LLM is not the numeric calculator or the safety control. With identical normalized inputs and rule versions, findings, arithmetic, and plan ordering must be reproducible apart from run metadata.

Do not register an executable migration skill or add deployment/build integration while this specification is the only deliverable.

## 7. Evidence and output contracts

These are logical contracts. Formal JSON Schemas and executable validation are implementation deliverables and must preserve these semantics.

### 7.1 Inventory envelope

| Field | Required content |
| --- | --- |
| `schemaVersion`, `assessmentId`, `collectedAt` | Contract version, run identity, and collection time |
| `toolVersion`, `routeCatalogVersion`, `rulesVersion` | Reproducible implementation and rule versions |
| `target` | Canonical public repository, pinned commit, repository-derived target package metadata, allowlisted manifest/guide paths, and SHA-256 hashes; never customer-entered target values |
| `environment` | Locally scoped identifier/alias and confirmed environment characteristics; minimize identifiers in shared output |
| `consent` | Approved discovery scope/categories and time; separate sharing recipient/scope/time if opted in; no credentials |
| `capabilities` | Each collector's permission/capability result |
| `solutions`, `components`, `dependencies`, `counts`, `sites` | Relevant normalized inventory with evidence references |
| `answers` | Structured customer/partner assertions, their source, and confirmation time |
| `evidence`, `errors` | Provenance, completeness, sanitized failures, and unresolved gaps |

Each evidence item must record an ID, source kind (`observed`, `customer-reported`, `derived`, or `not-collected`), collection time when collection occurred, collector/question ID, scope, and status. Derived evidence must reference its inputs. `not-collected` evidence has a null collection time and must not be presented as observed.

Evidence status is one of:

- `observed`: Successfully collected within the documented scope.
- `confirmed-absent`: Successful, sufficiently complete discovery confirms absence within that scope.
- `unknown`: Not established.
- `access-denied`: Required read not permitted.
- `partial`: Incomplete, capped, truncated, or interrupted.
- `not-applicable`: A rule explains why it does not apply.
- `error`: Collection failed for another reason.

Freshness and count accuracy are separate attributes. An observed zero count must include its scope and accuracy; it does not imply that inaccessible tables are empty.

### 7.2 Assessment result

Each solution/route result must contain:

- `routeStatus`: `eligible`, `blocked`, `unsupported`, `insufficient-evidence`, `already-at-target`, or `not-installed`.
- Findings with stable IDs, category, impact, evidence IDs, and recommended follow-up.
- Customization origin and classification with confidence; ambiguous origin stays unknown.
- Phase/work-item estimates, assumptions, scenario risks, and missing information.
- Public guide references and customer/partner handoff actions.

`Eligible` means assessable against the documented route, not approved for production migration. `Already-at-target` requires evidence, not only a matching display name.

Each work item must contain its stable ID, phase, environment scope, activity/component scope, `occurrenceId`, affected solutions, dependency IDs, owner role, action, rule ID/version, evidence IDs, assumptions, effort range, execution range where relevant, and uncertainty. Units and working-day length must be explicit.

`occurrenceId` identifies one planned performance of the activity, such as the first sandbox rehearsal, a remediation-driven second rehearsal, or production cutover. Represent repeated work as separate work items with distinct occurrence IDs, not as an implicit multiplier. References from several solutions to the same shared activity must resolve to the same work-item ID and occurrence ID. The same occurrence may appear in several alternative scenario views without becoming additional work within a scenario.

Ranges contain `min`, `max`, and `unit`. Unknown ranges are `null` with a reason, never `0`, an empty string, or a fabricated upper bound. Valid numeric ranges require `0 <= min <= max`. Zero needs an explicit no-work/not-applicable basis.

The combined result must distinguish a complete plan from a partial plan, report shared work once, and list excluded or unbounded work adjacent to any subtotal. Unsupported or unknown routes cannot receive numeric route totals.

## 8. Customization and dependency analysis

Component count is an input, not a complexity score by itself. Assess:

- **Origin:** Product, partner, customer, environment-specific, or unknown.
- **Change:** Retain, reconfigure, adapt, replace, retire, investigate, or unknown.
- **Impact:** Critical business capability, affected dependencies, and potential interruption.
- **Coupling:** Shared components, multiple solution layers, and cross-system dependencies.
- **Maintainability:** Source/owner availability and documentation, based on safe evidence or answers.
- **Validation:** Regression coverage, sandbox representativeness, acceptance ownership, and rollback readiness.

A difference between installed metadata and the GitHub target can be a product version difference, intentional migration change, customization, or configuration. Do not classify all differences as customer customizations or all target omissions as safe removals.

Represent shared prerequisites and migration work as a dependency graph. Resolve CDM before dependent apps and VM before dependent VE readiness. Discover additional customer/partner dependencies; the standard product graph is not exhaustive.

Detect cycles or contradictory ordering and report a planning blocker. Deduplication keys must include environment, phase, activity/component scope, and `occurrenceId`. Merge only references to the same planned performance of the work, not merely activities with matching names or affected components.

For example, three apps can reference one CDM upgrade in the first sandbox rehearsal, and that upgrade is counted once. A second CDM upgrade rehearsal in the same sandbox has a different occurrence ID and is counted separately, with its own effort, validation work, and dependencies. Production execution and re-tests likewise retain their distinct occurrences. An additional occurrence introduced by an adverse risk is included only in scenarios where that risk applies; do not duplicate the original occurrence when copying the assessed plan into an adverse scenario.

## 9. Estimation contract

### 9.1 Phases and units

Estimate preparation separately from execution and cutover:

1. Missing-information investigation and partner review.
2. Backup/recovery planning and sandbox preparation.
3. Target package preparation and sandbox migration execution.
4. Customization remediation.
5. Integration remediation.
6. Functional, authorization, accessibility, and regression testing as applicable.
7. Customer acceptance, approvals, and rehearsal.
8. Production execution and cutover.
9. Post-cutover validation, monitoring, and rollback readiness.

Use explicit person-hours for effort, elapsed hours/days for schedule, and minutes/hours for interruption. Person-day display conversions require a declared working-day length.

Elapsed time depends on task dependencies, role capacity, calendars, external lead times, and deployment windows. Do not divide total effort by team size and call it a schedule. If those inputs are missing, report effort where possible and leave elapsed duration unknown.

Execution time and potential downtime are separate from labor. Do not equate a week of customization work to a week of outage or promise zero downtime because sites coexist. If interruption cannot be bounded, report the unknown and the rehearsal needed to resolve it.

### 9.2 Baseline, assessed, and adverse scenarios

Every report must distinguish:

| View | Meaning |
| --- | --- |
| Baseline | Product-route preparation, execution, and validation under stated standard assumptions |
| Assessed range | Baseline plus work justified by discovered/customer-reported customization and operational evidence |
| Adverse-case planning range | Assessed work plus explicit, plausible risk events and their consequences |
| Unbounded/blocking work | Work that cannot receive a defensible range until investigation is complete |

The adverse case is conditional, not an absolute maximum, guaranteed deadline, or statistical percentile. Do not label it P90/P95 without a validated probabilistic basis.

Build estimates from unique work items:

```text
Scenario effort range = sum of min/max effort for unique included work-item occurrences
Assessed scenario = shared baseline work + evidenced remediation and validation
Adverse scenario = assessed scenario + applicable risk-specific additional work
```

Do not add the displayed baseline total to an assessed total that already includes it. Each occurrence of shared risk-related work has one work item, not one per affected solution. Distinct repeat attempts remain separate occurrences even when they address the same risk in the same environment. Mutually exclusive scenarios must remain separate rather than being summed into an impossible worst case. Any bounded contingency must identify its risk and rationale; no hidden blanket multiplier.

### 9.3 Heavy-customization risk scenarios

| Scenario | Required treatment |
| --- | --- |
| Partner plugin has no available source or owner | Partner investigation gate; replacement work remains unbounded until scope is established |
| Several layers affect VM forms/PCFs | Identify affected components and preservation/remapping work; include targeted regression and rehearsal |
| Custom functionality depends on removed components | Dependency remediation or redesign, owner review, and business-journey validation |
| VE has critical custom Liquid/scripts | Classify known capability gaps; create specialist scope review rather than claiming metadata proves a rewrite size |
| Multiple identity providers and site-specific roles | Reconfiguration and sign-in/authorization test work, with unknown provider compatibility explicit |
| External integration behavior is undocumented | Integration-owner investigation and contract/regression test planning |
| No representative sandbox or tests | Environment/test preparation work and reduced confidence; do not omit validation to reduce the estimate |
| Tight cutover window or high availability requirement | Additional rehearsal, scheduling, recovery planning, and possible route feasibility blocker |
| Large volumes or platform count limits | Record scale uncertainty and performance/rehearsal needs, not an invented per-record migration duration |
| Partially completed prior migration | Identify actual state and recovery/continuation prerequisites before applying a standard plan |

Include adverse-case results for assessable heavily customized environments. If critical work is unbounded, show the known subtotal and risk scenarios but withhold the complete migration total and finish date.

### 9.4 Confidence and calibration

Confidence is an explained evidence judgment, not an arbitrary percentage:

- **High:** Critical evidence is complete/current, applicable rules are calibrated, and no material unresolved assumptions remain.
- **Medium:** Critical route facts are established, but bounded assumptions or noncritical gaps remain.
- **Low:** Provisional rules, material customer assertions, or incomplete scope limit reliability.
- **Not estimable:** Critical route/remediation evidence is missing or the route is unsupported.

Report confidence per route and phase. Do not average a critical unknown away in the combined result. Evidence completeness alone does not make provisional timing rules high-confidence.

Initial coefficients and thresholds must be marked provisional. Do not invent fixed hour bands in this specification. Each numeric rule must later record its unit, applicability, basis (reviewed expert judgment or measured rehearsal), sample limitations, version, and review status.

Time-boxed investigation can have its own reviewed effort allowance, but reaching that time limit does not mean the unknown migration work is solved. Validation must compare predicted ranges with observed outcomes, document misses, and revise rules. Public readiness requires reviewed calibration evidence and disclosed limitations.

### 9.5 Provisional typical planning ranges

The initial customer-useful estimate is a **typical planning range based on reviewed expert judgment**, not a statistical average. Use it while measured migration samples are insufficient, provided every shipped rule meets REQ-14.

Each provisional rule must contain:

- Stable rule ID and semantic version.
- Applicable route, family, phase, environment occurrence, and scenario.
- Applicability predicates and disqualifying conditions.
- Person-effort range and, only when separately supportable, execution-duration or downtime range.
- Evidence drivers used to select the rule, such as customization classification, relevant component/dependency signals, integration scope, data-scale band, site/authentication scope, and validation readiness.
- Written expert basis, accountable reviewer, review date, known sample limitations, and confidence ceiling.
- Supersession history so the same inventory and rule version remain reproducible.

Rules must be route- and phase-specific. Do not apply one universal per-component rate or a hidden percentage contingency. Counts can select a reviewed complexity band but cannot independently prove effort. Shared preparation, CDM prerequisites, and repeated rehearsals remain occurrence-aware work items.

The report labels these results:

```text
Provisional typical planning range — reviewed expert judgment, not measured average or guarantee
```

The report may show a complete provisional typical range when:

1. The selected route/version combination is supported by the reviewed compatibility matrix.
2. Required discovery categories are observed or accepted as explicitly bounded by the applicable rule.
3. Customer/partner review resolves ownership, external integrations, validation scope, and critical opaque behavior.
4. Every included work item has an applicable reviewed rule.
5. No critical unbounded remediation, unsupported destination, invalid dependency plan, or unresolved prerequisite remains.

Otherwise show the known subtotal, missing work, and required investigation while keeping the complete range null. A standard-environment default must not overwrite contradictory customization evidence. Statistical labels become available only after a separately approved measured dataset and statistical methodology exist.

### 9.6 Bundled engineering assumptions

The public skill must remain useful before expert review is complete. Its default rulebook therefore provides conservative, uncalibrated engineering assumptions. These are owned product defaults, not reviewer assertions, measured averages, commitments, or certification.

The initial likely-standard baseline is:

| Route | Effort including shared preparation | Dependency-path elapsed hours | Production execution hours | Potential downtime hours |
| --- | --- | --- | --- | --- |
| CDM | 46-92 person-hours | 68-168 | 2-4 | 0-2 |
| Each template app | 38-76 person-hours | 68-168 | 2-4 | 0-2 |
| Volunteer Management | 96-192 person-hours | 104-320 | 4-8 | 0-4 |
| Volunteer Engagement | 104-208 person-hours | 120-360 | 4-8 | 0-4 |

Each per-route value includes the shared 8-16 person-hour preparation occurrence for readability. Do not add displayed route totals together; the combined planner counts shared preparation once and honors CDM → dependent apps/VM → VE ordering.

The initial bounded remediation allowances per declared occurrence are:

| Work | Moderate | Heavy |
| --- | --- | --- |
| Customization | 16-40 person-hours; 24-120 elapsed hours | 40-120 person-hours; 80-320 elapsed hours |
| Integration | 12-32 person-hours; 24-120 elapsed hours | 32-96 person-hours; 80-320 elapsed hours |
| Named bounded risk | 8-24 person-hours; 16-80 elapsed hours | Same per explicitly named occurrence |

Assumptions apply only when route identity/version gates permit assessment and the complexity classifier returns `likely-standard`, standard, moderate, or heavy. `likely-standard` requires observed component evidence, zero unmanaged overlap with selected solution components, and no declared remediation, while explicitly acknowledging external/dynamic dependency risk. Unknown VE site state, unbounded work, unsupported destinations, invalid plans, and unresolved critical prerequisites remain incomplete.

The report must show:

- The applied default rulebook version.
- `Bundled uncalibrated engineering assumptions` as the estimate basis.
- Per-route dependency prerequisites.
- Known planning subtotals even when another route prevents a complete combined total.
- Separate complete effort, elapsed, execution, and downtime ranges.
- A warning to validate assumptions with a migration partner and representative rehearsal.

Reviewed rulebooks override matching default assumptions and use the stronger REQ-14 provenance label.

## 10. Report contract and handoff

Produce local JSON and Markdown from one result. The JSON retains detailed evidence, hashes, work-item dependencies, and scenario reasons. The Markdown is a concise decision report and must not repeat every work item or scenario reason. It contains:

1. A decision summary that states whether the migration is estimable.
2. A short environment summary covering declared topology and observed Dataverse, customization, dependency, integration, data-scale, and Power Pages signals.
3. One source-to-target readiness row per solution family, including installed and target versions.
4. Prioritized root blockers, derived prerequisite blockers, and required next actions.
5. Evidence coverage that distinguishes observed, derived, denied, partial, and not-collected categories.
6. Compact combined scenario and phase summaries with unknown work shown as not quantified, never `0-0`.
7. Applicable public migration guidance, assumptions, sharing precautions, and partner handoff.

The Markdown should normally remain under 200 lines for the initial six-family assessment. Detailed inventory and repeated work-item information belong in JSON unless a future user-selected appendix is approved.

Include this meaning prominently: estimates are planning ranges, not guarantees; the assessment performs no migration and does not establish production safety.

For mixed environments, supported solutions may receive partial estimates even when another route is unsupported. The headline must state that the overall migration is not fully estimated. "No relevant solutions installed" is distinct from "could not inspect solutions."

Example required behavior: if CDM is assessable but a business-critical VM partner plugin cannot be scoped, report the CDM estimate and known shared work, flag the VM investigation, and leave the complete combined effort/duration unknown. Do not report the CDM subtotal as the full migration cost.

## 11. Validation and acceptance

Validation uses synthetic/sanitized fixtures and separately authorized test environments. No customer environment access is authorized by this specification.

| Test ID | Scenario and required outcome | Requirements |
| --- | --- | --- |
| T01 | Clean public-only checkout works without internal access, feeds, source code, or developer-machine paths | REQ-01, REQ-02 |
| T02 | Standard CDM and each template app select the correct identity-preserving route and CDM prerequisite | REQ-02, REQ-08 |
| T03 | All template apps share CDM/preparation work once in the combined total | REQ-11 |
| T04 | Standard VM identifies its distinct target identity and relevant PCF/plugin dependency checks without invoking migration | REQ-04, REQ-12 |
| T05 | Heavily customized VM with partner layers and opaque plugin behavior yields risks, investigations, and appropriately partial estimates | REQ-07, REQ-09, REQ-10 |
| T06 | Standard VE does not count all legacy templates as customer rewrites; new-site/CDM/VM prerequisites are present | REQ-08, REQ-11 |
| T07 | Customized VE with multiple auth providers, languages, custom journeys, and unknown code behavior yields bounded and unbounded work explicitly | REQ-05, REQ-09, REQ-10 |
| T08 | Mixed CDM, VM, VE, and template apps produce a coherent graph; per-solution views reconcile with shared combined accounting | REQ-09, REQ-11 |
| T09 | Access denial, omitted permissions, count caps, pagination failure, throttling exhaustion, cancellation, and stale inputs do not become zero effort | REQ-03, REQ-07 |
| T10 | Unknown destination, unsupported version combination, identity mismatch, and cross-environment request receive no fabricated route total | REQ-02, REQ-07, REQ-10 |
| T11 | No installed products, already-at-target, coexistence, and partially migrated states are distinguished using evidence | REQ-07, REQ-08 |
| T12 | Request/command tracing shows no mutating operations; unknown operations fail closed; test environment state remains unchanged | REQ-04 |
| T13 | Synthetic secret/content canaries in disallowed fields are not requested or emitted; logs/artifacts contain no prohibited data | REQ-05 |
| T14 | Network/tool-output inspection shows no default customer payload upload, including initial scope answers, local questionnaire values, discovery-derived follow-up prompts/answers, and reports. Refusing separate sharing consent preserves local operation; cloud questioning cannot begin before that consent. A host without an isolated input channel stops rather than silently falling back to chat | REQ-03, REQ-06 |
| T15 | Same inventory/rules reproduce estimates; JSON/Markdown agree; numeric ranges validate; unknowns remain null with reasons | REQ-07, REQ-08 |
| T16 | Known subtotals are not labeled complete totals; unbounded partner work prevents a complete estimate; risk scenarios are not double-counted | REQ-10, REQ-11 |
| T17 | Component-count similarity does not hide critical dependency differences; cyclic dependencies cause a planning blocker | REQ-09, REQ-11 |
| T18 | Staffing/calendar changes alter elapsed planning without changing intrinsic task effort; downtime is never substituted for total effort | REQ-11 |
| T19 | Malicious instructions/URLs in metadata and answers cannot trigger arbitrary commands, reads, uploads, or environment changes | REQ-04, REQ-05, REQ-06 |
| T20 | Representative migration rehearsals review assessed/adverse ranges, timing misses, confidence, and limitations before public readiness | REQ-08, REQ-09, REQ-10 |
| T21 | Three apps referencing one CDM upgrade occurrence count its effort once. Adding a second rehearsal in the same sandbox adds a distinct occurrence's effort and dependencies. Copying the assessed plan into an adverse scenario does not duplicate the original occurrence. Re-tests and production activities retain their own occurrences | REQ-08, REQ-10, REQ-11 |
| T22 | Heavily customized CDM includes partner-managed dependencies, unmanaged overrides, target component removals, and a dependent custom plugin/integration. Bounded impact produces evidenced remediation, regression, and adverse-case work; an opaque critical dependency withholds the complete affected route and combined totals | REQ-07, REQ-08, REQ-09, REQ-10 |
| T23 | Run separate heavily customized cases for Fundraising, Grant Management, and Outcome Management, each covering partner-managed dependencies, unmanaged overrides, target component removals, and a dependent custom plugin/integration. Assert bounded assessed/adverse work and withheld complete route/combined totals for unbounded critical impact, not only correct route selection | REQ-07, REQ-08, REQ-09, REQ-10 |
| T24 | Mixed customized CDM/template apps share a customization or integration dependency. Bounded remediation is counted once per occurrence while app-specific regression remains separate; unbounded shared impact marks every affected route incomplete and prevents a complete combined total | REQ-07, REQ-09, REQ-10, REQ-11 |

Each test must have reproducible inputs, expected findings/statuses, estimate-accounting assertions where applicable, observed results, and known limitations. Built ZIPs without reproducible fixture sources or recorded outcomes do not constitute sufficient validation evidence.

T22 and each solution case in T23 require both a bounded-impact variant and an unbounded critical-impact variant. Test evidence must identify coverage per solution; one representative template app does not satisfy all three. T24 must assert dependency-impact propagation and shared-work accounting together.

## 12. Delivery sequence and release gates

1. **Contract review:** Approve this specification's scope, route catalog, evidence boundaries, report semantics, and privacy model.
2. **Discovery feasibility:** Validate public read APIs, field allowlists, minimum permissions, count behavior, and safe PCF/portal checks. Resolve gaps before promising complete discovery.
3. **Inventory and fixtures:** Implement schemas, collectors, structured questionnaire, safe logging, and synthetic standard/heavy/mixed fixtures.
4. **Analysis and estimation:** Implement route rules, dependency planning, reviewed provisional coefficients, conditional adverse scenarios, and report rendering.
5. **Validation and calibration:** Execute the acceptance matrix, public-only installation test, safety checks, and representative rehearsals. Record known limitations.
6. **Packaging review:** Prepare public skill instructions, prerequisites, safe authentication, example reports, troubleshooting, and partner handoff. Obtain publication approval.

Develop the package in this folder first. Keep paths relative and public dependencies portable so the eventual package can move to the GitHub repository without internal assumptions. Do not create a second specification when moving it: transfer the authoritative document and update references. Final repository layout and runtime remain open decisions.

A customer-ready release requires all normative requirements to pass, critical open decisions to be resolved, and validation/calibration evidence and example reports to be linked. A draft prototype must not be presented as meeting the story's acceptance criteria.

### 12.1 Initial implementation profile

The selected runtime is Node.js 22 with TypeScript. Version 0.5 is a self-contained public-npm-compatible package in this folder; see [setup and usage](README.md), [test coverage](tests/README.md), and the [standard live-test record](tests/standard-baseline-2026-09-30.md).

The default input channel is a local structured JSON questionnaire. Live collection requires a separately confirmed human terminal and customer-managed Azure CLI authentication. Core collection, analysis, arithmetic, and JSON/Markdown rendering run locally without an LLM. There is no automated sharing command.

Implemented behavior:

- Clean pinned `microsoft/Nonprofits` target resolution from five manifests and four public guides, with commit/path/hash verification during initialization, collection, and assessment.
- Strict versioned contracts, local-only storage protections, route selection, prerequisite propagation, occurrence-aware shared-work planning, unknown/unbounded handling, and reproducible scenario arithmetic.
- Consent-scoped discovery for environment version, solution identities, relevant solution-component summaries, unmanaged overlap signals, bounded dependent-component references, environment-wide integration registration counts, relevant table snapshot counts, and legacy/enhanced Power Pages site counts.
- Independent evidence status per category, including observed, partial, denied, unavailable, and not-collected behavior.
- Versioned candidate compatibility decisions and deterministic standard/moderate/heavy/unbounded/unknown complexity classification with reasons.
- Intent-aware CDM/template alignment, ownership transition, newer-release update, and VM/VE replacement decisions; reviewed equivalent releases produce `already-at-target` with no migration work.
- Automatic scope selection from observed solution/site evidence, with explicit include/exclude overrides.
- Evidence-based `likely-standard` classification when observed component metadata shows zero unmanaged overlap and no remediation is declared.
- A generated 102-entry route/phase/complexity expert-review template and a local `finalize-rules` command that rejects incomplete reviews and emits only strict reviewed rulebooks.
- Complexity-specific provisional typical rule selection, reviewer/date/limitation provenance, occurrence-aware effort arithmetic, dependency critical-path elapsed time, and separate production execution/downtime ranges.
- Bundled `engineering-assumptions-0.2` catalog defaults, dependency-path reporting, per-route ranges, and known combined subtotals when other routes remain blocked.
- A concise customer Markdown report (114 lines in the latest six-family live run) plus detailed local JSON.
- One hundred five passing offline tests, a reproducible package/install/CLI validation, and successful seven-category standard-sandbox assessments. The package contains 22 public-safe files, installs through its executable entry point, and reports zero installed dependency vulnerabilities. The latest live run observed 933 relevant components across five solutions; dependency, integration, and count evidence remained explicitly partial because of approved caps and the Dataverse 5,000-row OData count ceiling.
- Production target commands fetch `origin/master`; pinned commits must be reachable from the fetched branch. Local-only commits require an explicit test-only override.
- Compatibility and assumption values are validated external catalogs instead of embedded logic.
- A four-measurement calibration command compares rehearsal effort, elapsed time, execution, and downtime with the assessed scenario without mutating rules.
- A small representative scenario suite covers standard alignment/VM, bounded mixed work, opaque ownerless work, VE auth/language/journey scope, and denied access.

Current constraints:

- Environment type, region, Managed Environment status, access restriction, external systems, and business/operational scope are customer assertions unless a supported collector marks them observed.
- Component overlap and registration counts are signals, not solution-specific behavioral attribution. Winning layers, PCF/form references, plugin/step ownership, flow-to-connection relationships, and target component changes aren't yet classified.
- Dependency inspection samples 25 relevant components; relevant table discovery is capped at 50; integration counts are environment-wide and can include platform registrations.
- Power Pages discovery counts legacy/enhanced sites but doesn't yet classify authentication providers, languages, custom journeys, permissions, or relevant safe component inventories.
- The route catalog remains a candidate catalog, not an approved compatibility matrix. Matching or higher target versions don't establish compatibility.
- The default rulebook contains transparent conservative engineering assumptions. They provide initial ranges but remain uncalibrated; reviewed expert values and rehearsal measurements can replace them.
- Elapsed arithmetic is a reviewed-duration dependency critical path. Role capacities, working calendars, approval lead times, and change-window placement remain open and must not be implied by the current elapsed field.
- Least-privilege access, heavily customized live scenarios, mixed-solution live scenarios, measured migration rehearsals, catalog approval, and public publication remain release gates. Customer package build/install validation is implemented.

The local inventory can retain bounded technical evidence for repeatability. Customer-facing Markdown minimizes identifiers and lists only route-relevant solutions and aggregate signals. Seven days remains a provisional freshness gate for inventory and customer-review assertions.

### 12.2 Status against the user-story tasks

| Task | Current state | Remaining completion work |
| --- | --- | --- |
| 571052: Scope and workflow | Route catalog, intent-aware scope, five-question guided local review, consent, target provenance, and concise report contract implemented | Approve source/target compatibility matrix, supported version policy, and final public location |
| 571053: Read-only discovery | Seven categories implemented and live-tested in a standard sandbox | Add solution-specific attribution, safe layer/PCF/plugin/flow/site detail, observed PPAC topology where feasible, least-privilege matrix, and customized/mixed validation |
| 571054: Explainable estimates | Candidate compatibility, likely-standard/complexity classification, bundled conservative defaults, dependency reporting, known subtotals, reviewed overrides, scenario deduplication, critical-path elapsed, execution/downtime arithmetic, and concise provenance are implemented | Calibrate/approve values; add role/calendar/change-window scheduling and reviewed confidence thresholds |
| 571055: Validation | 105 offline tests, representative synthetic scenarios, calibration comparison, package/install checks, and standard live read-only assessments | Run constrained-account and live bounded/unbounded customized/mixed/VE cases with measured rehearsals |
| 571056: Packaging | Public-safe 22-file package, executable CLI, MIT license, external catalogs, README, skill instructions, schemas, and packed-install validation implemented | Publish in the approved public repository, add approved example reports, validate supported hosts, and complete privacy/security/release review |

### 12.3 Dependency-ordered completion plan

| Phase | Deliverables | Depends on | Exit criteria |
| --- | --- | --- | --- |
| A. Compatibility and estimate governance | Reviewed source/target compatibility matrix; supported version/partial-state policy; named expert reviewers; provisional-rule template and review process | Current route catalog and public guides | Each route has approved supported/blocked predicates. Reviewers approve the meaning of `provisional typical planning range` and rule metadata required by REQ-14 |
| B. Discovery attribution | Component-to-family attribution; effective layer/ownership signals; relevant plugin/step, PCF, automation, connection-reference, table, and site/authentication summaries; full pagination or explicit caps; PPAC topology feasibility; least-privilege draft | Phase A defines critical evidence per route | Standard and synthetic customized fixtures identify the correct affected family, origin, completeness, and follow-up without prohibited content |
| C. Guided local scope and complexity classification | Local guided questionnaire; external-system/owner/source/test/rollback inputs; VE authentication/language/journey scope; reviewed standard/moderate/heavy/unbounded classification with reasons | Phase B evidence schema | Same inputs reproduce the classification. Contradictory evidence prevents `standard`; unanswered critical facts stay unknown |
| D. Provisional estimator and scheduler | Versioned route/phase typical effort rules; explicit investigation rules; complexity-band selection; assessed/adverse work generation; role capacity/calendar/change-window scheduler; separate execution and downtime fields; concise typical-range report | Phases A-C | A supported reviewed standard fixture produces per-route and combined provisional typical ranges. Shared work is counted once. Unsupported or critical unknown work still has null complete totals |
| E. Validation and calibration | Standard, bounded customized, unbounded customized, mixed, denied-access, coexistence, and partial-migration runs; at least one rehearsal per distinct route pattern; estimate-versus-observed review log | Phase D | T01-T24 pass with linked evidence. Expert reviewers accept initial ranges and documented misses/limitations. Least-privilege and before/after read-only checks pass |
| F. Public packaging and release | Public repository package, prerequisites, guided workflow, sample concise reports, detailed JSON schema, troubleshooting, retention/sharing guidance, versioning/ownership, release checklist | Phase E | Fresh customer-accessible installation succeeds without internal dependencies; publication, privacy, security, docs, and owning-team approvals are recorded |

Phases A and B can proceed in parallel only after each route's critical evidence questions are named. Phase D must not start by inventing numbers: it consumes reviewed outputs from Phase A and classification inputs from Phases B-C. Phase F can't claim user-story completion before Phase E.

### 12.4 Final report outcome

After the completion plan, a supported environment with sufficient evidence should receive this short overview:

| Report area | Required result |
| --- | --- |
| Environment | Observed and declared topology, relevant products, customization/dependency/integration/data/site scope, and evidence completeness |
| Per solution | Installed-to-target route, readiness, complexity classification, provisional typical effort range, elapsed range when schedulable, execution/downtime range when supportable, confidence, and primary blocker/action |
| Combined plan | Dependency-ordered phases, shared work counted once, role/capacity assumptions, provisional typical total, elapsed schedule, cutover window, and explicit excluded/unbounded work |
| Adverse planning | Named plausible risks with separate conditional ranges; never a fabricated absolute maximum |
| Evidence | Source/status/caps/freshness and rule IDs/versions/review basis, with detailed technical evidence retained in local JSON |

The user-story goal is complete when a representative standard environment produces this overview with reviewed provisional typical ranges, customized or opaque critical work correctly withholds unsupported totals, and all release gates in section 12 and acceptance tests in section 11 are satisfied.

### 12.5 Engineering work packages

| ID | Work package | Status | Remaining acceptance work |
| --- | --- | --- | --- |
| I01 | Compatibility catalog | Candidate catalog implemented externally | Owning-team approval, more release mappings, companion/partial-state policy |
| I02 | Discovery attribution | Partial | Solution-specific layers, PCF/plugin/flow/integration attribution and constrained-account validation |
| I03 | Guided local review | Implemented | Supported-host usability validation |
| I04 | Typical rulebook v1 | Rule schema, review workflow, and assumed catalog implemented | Accountable reviewer approval and calibrated values |
| I05 | Complexity classifier | Implemented with bounded evidence caveats | Validate against live customized/mixed ground truth |
| I06 | Effort and schedule engine | DAG effort, elapsed, execution, and downtime implemented | Role capacity, calendars, approval lead times, and change-window placement |
| I07 | Final concise report | Implemented | Final docs/product review and localization decision |
| I08 | Validation and calibration | 105 offline tests, synthetic scenarios, standard live run, and calibration command implemented | Live constrained/customized/mixed/VE rehearsals and estimate-versus-observed evidence |
| I09 | Public package and release | Package/install/executable validation implemented | Source-control publication, CI, approved examples, ownership, and release approvals |

Recommended implementation order is I01 → I02, with I03 and I04 proceeding in parallel after their inputs stabilize; then I05 → I06 → I07 → I08 → I09. Do not couple detailed discovery completion to invented default rates, and do not block safe discovery work while experts review rule values.

## 13. Open decisions

| ID | Decision or investigation | Blocks |
| --- | --- | --- |
| O01 | Runtime selected: Node.js 22 with TypeScript. Final public folder/skill discovery location and supported host/OS validation remain open | Public packaging and portability claims |
| O02 | Exact supported source/target version matrix and evidence for existing companion solutions and partial migrations | Route eligibility claims |
| O03 | Seven collector categories and their current field allowlists are implemented and standard-sandbox tested. Solution-specific attribution, expanded safe fields, pagination/cap policy, PPAC topology feasibility, and the least-privilege matrix remain open | Complete discovery and least-privilege claims |
| O04 | Safe inspection of form/view PCF references and Power Pages configuration without retrieving prohibited embedded content | Detailed VM/VE discovery coverage |
| O05 | Provisional typical planning ranges based on reviewed expert judgment are selected. Actual route/phase coefficients, complexity thresholds, accountable reviewers, review process, calibration scenarios, and acceptable miss criteria remain open | Default numeric estimates and customer readiness |
| O06 | Local JSON questionnaire selected for the prototype. Verify isolation in each supported host, local-only orchestration/output isolation, and any separate opt-in sharing UX; local-by-default input is required, not an open policy choice | Privacy acceptance and packaging |
| O07 | Owners and test environments/fixtures for heavy partner customizations, mixed solutions, and migration timing | Calibration and release |
| O08 | Role-capacity inputs, working-day convention, calendar/lead-time scheduler, execution-duration rules, and downtime rules | Elapsed-time and cutover overview |

Do not resolve these by silently assuming administrator access, full site export, unrestricted code inspection, or universal fixed-hour estimates.

## 14. Public references

These guides define migration context, not permission to execute their commands during assessment. Pin the relevant public revision in each released route catalog; branch links below are navigation references.

- [Microsoft Nonprofits repository](https://github.com/microsoft/Nonprofits)
- [CDM and template-app migration guide](https://github.com/microsoft/Nonprofits/blob/master/Documents/ppac-to-github-migration.md)
- [Volunteer Management migration guide](https://github.com/microsoft/Nonprofits/blob/master/VolunteerManagement/MIGRATION.md)
- [Volunteer Management migration script reference](https://github.com/microsoft/Nonprofits/blob/master/VolunteerManagement/Deployment/README.md)
- [Volunteer Engagement migration guide](https://github.com/microsoft/Nonprofits/blob/master/VolunteerEngagement/MIGRATION.md)
- [Existing VE migration skill](https://github.com/microsoft/Nonprofits/blob/master/VolunteerEngagement/.github/skills/ve-legacy-to-spa-migration/SKILL.md)
