# Standard baseline live test: 2026-09-30

## Scope and outcome

**Completed for implemented standard-baseline scope: sandbox and packages ready, ground truth frozen, collector and offline assessment executed. Detailed discovery, least-privilege, VE-site, customization, and rehearsal tests remain pending.**

This record separates browser-assisted test setup from the read-only assessment. Provisioning and application installation are setup actions, not capabilities of the assessment skill. Existing environments must remain unchanged.

This is sanitized engineering test evidence, not a customer migration estimate or proof of production readiness. Tenant IDs, environment URLs, account details, raw inventories, and reports belong in local private evidence outside Git.

## Approved setup

The operator approved a new United Kingdom sandbox with Dataverse, restricted access through an existing development security group, and Dynamics 365 apps enabled at creation. Azure pay-as-you-go and Managed Environments were not enabled. No application was selected for automatic deployment.

Security-group membership was not changed. This test does not establish least-privilege collector access.

At 07:19 UTC, PPAC displayed a successful-creation notification and the new sandbox as **Ready**, with Dataverse **Yes**, Managed **No**, and region **United Kingdom**. Application installation and Dataverse API readiness require separate verification.

The environment details page subsequently confirmed the selected security group and Dataverse version `9.2.26091.152`. No group membership or existing environment was changed by this setup.

## Target reference

- Public repository: <https://github.com/microsoft/Nonprofits>
- Local checkout revision observed before testing: `8dfaa4ce824d6a0e8ed4dd5f0a9ddbcb131e7bad`.
- This revision is target reference information, not evidence of installed Microsoft package versions or validated package compatibility.
- Source baseline must use the Microsoft packages available through PPAC. Do not substitute GitHub packages if Microsoft packages are unavailable.

## Expected results and execution log

| ID | Check | Expected result | Actual result | Status |
| --- | --- | --- | --- | --- |
| S01 | Sandbox provisioning | New restricted-access sandbox, Dataverse enabled, approved region; no changes to existing environments | PPAC reports Ready, Dataverse enabled, approved region and selected security group | Pass (setup only) |
| S02 | PPAC package availability | Identify Microsoft CDM, VM, and template app packages; record unavailable products explicitly | All five apps available with Microsoft publisher in installation review; see package table below | Pass (availability only) |
| S03 | Baseline installation | Record actual installed identities, versions, publishers, and managed status; no synthetic customizations | All five PPAC applications report Installed; five expected managed source identities observed in Dataverse | Pass (setup only) |
| S04 | Baseline ground truth | Freeze setup manifest before assessment; do not supply setup findings as collector observations | Private setup manifest frozen before skill collection | Pass |
| S05 | Human-terminal discovery | Explicit local consent, exact environment confirmation, bounded GET-only solution collection | Interactive Azure CLI collection completed after exact-environment `ASSESS` confirmation; second run produced complete solution evidence | Pass |
| S06 | Identity and route comparison | Match observed identities against frozen manifest; correct candidate routes and prerequisites | All five source identities matched. CDM and VM are insufficient pending review; templates blocked because public targets are lower; VE site state remains unknown | Pass with product blockers |
| S07 | Honest uncertainty | Missing detailed discovery and uncalibrated timings remain unknown; installed-product reports remain partial | Dependencies/layers/integrations/counts/sites unknown; all effort totals and timing fields null; report partial | Pass |
| S08 | Local report safety | JSON/Markdown written locally; no automatic disclosure to chat; no raw auth/server errors | Local JSON/Markdown written; report reduced to selected route identities after defect correction; scoped disclosure explicitly authorized | Pass |
| S09 | Read-only verification | Assessment causes no environment changes; compare before/after evidence separately from setup operations | Five source identities and versions matched frozen setup before and after collection/assessment; OS VM target remained absent | Pass for collected metadata |
| S10 | Restricted permissions | Explicitly authorized constrained account; denied reads reported without false absence or elevated-role workaround | Account and permission scope not agreed | Blocked |
| S11 | VE baseline | Separate legacy site provisioning and source-state verification, if available and authorized | No site provisioned | Pending |
| S12 | Repository-authoritative rerun | Fresh questionnaire, tenant collection, and assessment reproduce the pinned public target evidence and baseline result | Fresh run verified nine pinned files, five manifest-derived targets, five expected source identities, and the same route outcomes | Pass |

## PPAC package observations

| Application | Package shown in installation review | Package version | Execution |
| --- | --- | --- | --- |
| Common Data Model for Nonprofits | Common Data Model for Nonprofits Base | 3.1.3.4 | Installed |
| Volunteer Management | Volunteer Management Anchor | 1.2.3.3 | Installed |
| Fundraising App | Fundraising Anchor | 1.0.3.3 | Installed |
| Grants Management | Grant Management Anchor | 1.0.3.3 | Installed |
| Outcomes App | Outcome Management Anchor | 1.0.3.3 | Installed |

The operator explicitly authorized accepting the displayed installation terms for CDM and VM, and authorized terms acceptance/installation for the three Microsoft template apps. The dependent package operations were submitted while CDM remained in progress; PPAC is expected to orchestrate dependencies. This does not count as successful installation until each package reports Installed and actual Dataverse solution identities are recorded.

The catalog exposed four VM entries; reviewing each showed the same Microsoft Anchor package/version. It also exposed two Fundraising App entries; only the first was reviewed. Do not install duplicate copies. Grants Management is the Microsoft offering, not the separately listed CRMJetty application. Fundraising and Engagement is not the Fundraising template and is outside this test.

Volunteer Engagement appeared in the catalog, but its package review and website setup have not been performed.

Package/Anchor versions are not proof of underlying installed solution versions. Freeze actual solution identity/version/publisher/managed metadata after installation. The CDM offered version matches the public source manifest version; this baseline must not be described as an older-version upgrade test. The public source manifests use `Managed=2` packaging mode, not proof that an actual selected release artifact is managed.

The independent setup query observed these managed source identities: `NonprofitCore` 3.1.3.4, `VolunteerManagement` 1.2.3.3, and `SocialImpactFundraising`, `SocialImpactGrants`, and `SocialImpactOutcomes` 1.0.3.3. The open-source VM target `volunteermanagementos` was absent, as expected before migration.

## Live assessment result

- Report status: **partial**, as required for the prototype.
- CDM: `insufficient-evidence`; installed and public target versions are both 3.1.3.4, but equality isn't treated as proof that migration is complete or unnecessary.
- Fundraising, Grants, Outcomes: `blocked`; PPAC installed 1.0.3.3 while the pinned public source manifests are 1.0.3.1. The assessment correctly refuses a lower target.
- VM: `insufficient-evidence`; the 1.2.3.3 Microsoft source is present and `volunteermanagementos` is absent, which is the expected pre-migration state, but compatibility/customization evidence isn't collected.
- VE: `insufficient-evidence`; no legacy site was provisioned or reviewed and solution identity alone can't establish website state.
- Every route/scenario and combined complete effort total is `null`.
- Elapsed time, execution duration, and downtime are all `null`.
- The second inventory's solution evidence is `observed`; dependency, layer, integration, count, and site evidence remains `unknown`.

The lower template target versions are a product/release readiness blocker, not an estimation result. Do not recommend applying the pinned GitHub packages over these installed versions without a newer public target or an explicitly validated continuation path.

## Defects found and corrected

### Publisher prefix was treated as per-solution identity

The setup query showed that all four source solutions using publisher `microsofttechforsocialimpact` expose the same current publisher customization prefix, `sioutc`. A publisher prefix is publisher-record metadata and can't prove each installed package's original declared prefix.

The prototype previously treated this value as per-solution source identity evidence, which would have falsely blocked a clean baseline. The contracts now name it `publisherPrefix`, reports label it **Current publisher prefix**, and source identity validation uses managed status plus publisher identity without comparing this contextual prefix. Target package prefix remains a separate local assertion. A regression test covers this baseline.

### Valid platform solution rows made the inventory partial

The first live collector run found the expected solutions but marked evidence `partial`. Dataverse included legitimate platform rows with two-part or five-part versions, trailing version whitespace, and empty current publisher prefixes. The installed-solution contract incorrectly required target-package-style four-part versions and nonempty prefixes for every row.

Observed solution versions now accept bounded platform metadata and are trimmed; empty current publisher prefixes are retained. Route-relevant migration source versions still require four parts before comparison. The corrected second collection reported complete `observed` solution evidence and matched the frozen baseline.

### Report included the full platform inventory

The first report listed all 831 observed platform solutions. Although local, this was unnecessary disclosure and obscured migration-relevant evidence. The report now includes only selected route source/target identities, while the local inventory retains the bounded response for repeatability.

After all corrections, strict type-check and all 69 offline tests pass.

### Public repository became authoritative after the baseline

The original live report used target values manually prepared from the local public checkout. A subsequent implementation correction made the clean, pinned `microsoft/Nonprofits` checkout authoritative:

- `init` derives target solution metadata from five public `Solution.xml` manifests.
- Nine allowlisted manifests/guides are read from the pinned Git object, hashed, and recorded as target evidence.
- `collect` and `assess` require the checkout and reproduce the evidence before proceeding.
- Wrong remotes, dirty checkouts, missing files, route/manifest disagreement, changed hashes, and manually altered target values fail closed.

The existing live discovery was revalidated without another tenant read. The superseding v3 report records commit `8dfaa4ce824d6a0e8ed4dd5f0a9ddbcb131e7bad`, nine repository evidence files, the same five installed source identities, the same route outcomes, and all complete effort/timing totals as unknown.

## Repository-authoritative end-to-end rerun

A second end-to-end run generated a fresh questionnaire from the clean public checkout, performed a new human-confirmed read-only Dataverse collection, and produced a new offline assessment. The rerun verified:

- Target source `pinned-public-git-checkout` at commit `8dfaa4ce824d6a0e8ed4dd5f0a9ddbcb131e7bad`.
- Nine pinned target evidence files and five manifest-derived target solutions.
- Complete `observed` solution evidence.
- Exact matches for the five frozen source identities, versions, managed states, publishers, and current publisher prefixes.
- Continued absence of `volunteermanagementos`.
- A customer-facing inventory limited to the five route-relevant installed identities.
- The same route outcomes: CDM, VM, and VE `insufficient-evidence`; Fundraising, Grants, and Outcomes `blocked`.
- `null` for every effort total, elapsed duration, execution duration, and downtime field.

The fresh collected metadata and generated report both matched the frozen five-source baseline. No assessment-caused change was observed in the collected scope. The CLI returned its expected partial-result exit code after writing the JSON and Markdown reports.

## Detailed environment assessment rerun: 2026-10-01

Version 0.2 expanded the consented read-only scope and replaced the repetitive report with a concise decision report. A fresh run against the same standard sandbox produced:

- Observed Dataverse version `9.2.26091.152` and all 831 valid solution identity rows.
- 933 relevant solution components across five installed source solutions.
- Two unmanaged solutions analyzed with zero overlapping relevant component identities. This is a bounded metadata signal, not proof that no customization or dynamic dependency exists.
- 1,091 dependent references from the approved 25-component inspection cap; dependency evidence is correctly `partial`.
- Environment-wide registration counts for workflows, connection references, plug-in assemblies, and plug-in steps. The plug-in step count reached the Dataverse 5,000-row OData ceiling, so integration evidence is correctly `partial`.
- Snapshot counts for 50 relevant table components. Table selection reached the approved cap, so data-scale evidence is correctly `partial`; no business rows were enumerated.
- No enhanced-model Power Pages sites. The legacy site table wasn't available, and no legacy VE site was claimed.
- A 114-line Markdown report with an environment summary, installed-versus-target route table, five grouped blockers/actions, seven-category evidence coverage, compact scenario/phase summaries, and public guides.

Live validation found and corrected two detailed-collector defects before the successful rerun:

1. Dataverse object IDs can use GUID-shaped values that don't carry RFC UUID version bits. The contract now validates the general Dataverse GUID shape rather than rejecting those component identities.
2. Dataverse rejects `$top=0` for the tested count queries. Count requests now use `$top=1`, retain only `@odata.count`, and mark a 5,000 result as capped/partial.

The report remains `partial` and all timing totals remain unknown because product compatibility rules and migration timings aren't calibrated, the public template targets are lower than the installed versions, and local review answers remain unresolved. Detailed discovery improves the decision evidence; it doesn't turn incomplete compatibility or rehearsal evidence into an estimate.

## Assumption-based assessment rerun: 2026-10-02

Version 0.4 reran all seven discovery categories and applied the transparent `engineering-assumptions-0.1` default rulebook. The route dependency graph and genuine blockers remained unchanged, while the report now provides useful initial planning ranges:

- CDM classified `likely-standard` and `eligible`: 46-92 person-hours, 68-168 dependency-path elapsed hours, 2-4 production execution hours, and 0-2 potential downtime hours.
- Volunteer Management classified `likely-standard` and `eligible`: 96-192 person-hours, 104-320 dependency-path elapsed hours, 4-8 production execution hours, and 0-4 potential downtime hours.
- Fundraising, Grants, and Outcomes each retain a 38-76 person-hour known planning subtotal, but their complete ranges remain withheld because the pinned GitHub target versions are lower than installed.
- Volunteer Engagement retains only the shared 8-16 person-hour preparation subtotal; its source site state remains unknown.
- The dependency-ordered combined plan has a 224-448 person-hour known subtotal. The complete combined effort, elapsed, execution, and downtime remain incomplete because blocked template routes and unresolved VE are still included.

The report explicitly labels these numbers `Bundled uncalibrated engineering assumptions`, shows CDM prerequisites for template apps/VM and VM prerequisites for VE, counts shared preparation once in the combined plan, and preserves blockers. No reviewer is required for this initial result; reviewed rulebooks can override the defaults.

## Intent-aware alignment rerun: 2026-10-07

Version 0.5 distinguished alignment confirmation from PPAC ownership transition, newer-release updates, and replacement migrations. With the aligned local public manifests and automatic scope:

- CDM, Fundraising, Grants, and Outcomes returned `already-at-target`; no product or data migration work was generated.
- Volunteer Management remained an eligible side-by-side replacement at 96-192 person-hours, 104-320 dependency-path elapsed hours, 4-8 production execution hours, and 0-4 potential downtime hours.
- Volunteer Engagement was automatically excluded because no legacy/enhanced site was observed and no explicit include override was supplied.
- An `already-at-target` CDM prerequisite satisfied VM rather than blocking it.
- The generated report contained five selected families, zero blocking findings, and no double-counted CDM/template work.

## Evidence boundaries

- The 105 passing offline tests and package/install checks are not live-platform evidence.
- Seven bounded discovery categories are implemented. Dependency, integration, and relevant-table results are partial by design in the latest run, and environment-wide counts aren't solution-specific behavioral attribution.
- Effective layer ownership, safe PCF/form references, plugin/step ownership, flow/connection relationships, and detailed Power Pages authentication/language/journey scope remain unimplemented.
- No customizations or migration rehearsals are part of this initial standard baseline.
- No measured effort, downtime, or calendar estimates are available.
- The operator explicitly permitted disclosure of this new sandbox's collected solution metadata and generated assessment reports to this AI conversation. That permission excludes credentials and business-record contents, does not apply to other environments, and does not remove human-terminal confirmation or the product's local-only default.
- The fresh questionnaire and raw inventory remain outside Git. The latest detailed run enabled explicit read-only consent for environment, solutions, components, dependencies, integrations, aggregate counts, and sites, while all compatibility/operational review answers remain unknown.
- Target metadata is reproducible repository evidence from the pinned public Git object. It isn't proof of release-package compatibility or a validated continuation path from a higher installed PPAC version.
- Azure CLI tenant selection was verified without printing account details or retrieving a token. Both collector runs required exact human confirmation of the environment.

## Continuation

1. Approve the supported source/target compatibility matrix and provisional typical-range governance.
1. Add solution-specific component/dependency/integration attribution and remaining safe VE/environment detail.
1. Prove least-privilege access per collector category.
1. Create authorized bounded and unbounded customized/mixed fixtures and compare discovery with ground truth.
1. Define reviewed provisional route/phase rules and run migration rehearsals to validate them.
1. Publish only after the public package, example reports, privacy/security review, and owning-team approval are complete.
