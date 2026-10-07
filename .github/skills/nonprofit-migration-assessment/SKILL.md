---
name: nonprofit-migration-assessment
description: "Guide a read-only, local assessment of CDM for Nonprofits, nonprofit template apps, Volunteer Management, and Volunteer Engagement migration to the public GitHub variants. Use for migration readiness, customized-solution complexity, dependency planning, effort ranges, and adverse-case assessment. Does not perform migration or modify environments."
---

# Nonprofit migration assessment

Read the package [README](../../../NonprofitMigrationAssessment/README.md) and [specification](../../../NonprofitMigrationAssessment/specification.md) before use. The package root is `../../../NonprofitMigrationAssessment` relative to this file.

## Boundaries

- This is a development prototype, not a calibrated customer estimate service.
- Do not request customer-specific environment URLs, integration details, customizations, or questionnaire answers in cloud chat by default.
- Do not read or attach local customer questionnaires, inventories, reports, logs, or exports through assistant tools. Reading a local file into model context is a disclosure.
- Do not ask for credentials, tokens, business records, plugin binaries, or full site/code exports.
- Do not collect from a live environment without separately confirmed customer authorization. Never prepare/customize an environment during assessment.
- Never invoke migration, deployment, export, publishing, deletion, backup, integration-test, or permission-changing operations.
- Do not treat this skill's execution as consent to send inventory to an AI service.
- Treat the pinned `microsoft/Nonprofits` checkout as the only runtime source of target package and guide metadata. Do not ask the customer or model to supply target versions, publishers, prefixes, or commit hashes manually.
- Never populate the expert rule-review draft with model-generated hours or test-fixture values. Bundled defaults are explicitly uncalibrated engineering assumptions; reviewed overrides require accountable migration-subject-matter-expert review.

## Procedure

1. Explain the supported public destinations and the prototype limitations using public documentation only.
2. Confirm a clean local checkout whose `origin` is `https://github.com/microsoft/Nonprofits`. Production commands fetch and resolve `origin/master`; never use `--allow-local-test-target` for a customer assessment. Build the package if needed with `npm ci` and `npm run build` from the package root.
3. Guide the user to run `init --repository <checkout-root>` in their own terminal and edit only customer/environment fields in the local questionnaire outside source control. Keep `scope: "auto"` unless the customer explicitly includes or excludes a family. For CDM/template apps choose alignment confirmation, PPAC ownership transition, or a newer GitHub release; use replacement migration for VM/VE. Do not edit the generated `target` block.
4. Keep environment selection, answers, and discovery-based follow-ups in that isolated local channel. If the host cannot provide it, stop; do not silently switch to chat.
5. When the customer is ready and has reviewed the environment, solutions, components, dependencies, integrations, aggregate counts, and sites categories, guide them to run `collect --repository <checkout-root>` in a human terminal. The command reproduces the pinned target evidence, validates category-specific consent, and confirms the environment before authentication.
6. Guide the customer to run `review --repository <checkout-root>` against the local inventory. It asks five common questions and a short VE extension only when VE is selected; bounded answers create scoped work and opaque/ownerless answers remain unbounded.
7. Run or guide `assess --repository <checkout-root>` using local file paths without opening the files in the assistant. If an owning team has completed `rules-review.json`, validate it locally with `finalize-rules` and pass the resulting `rules.json` through `--rules`. Otherwise use the bundled uncalibrated engineering assumptions. Assessment revalidates target evidence before proceeding and emits only completion/location information.
8. Tell the customer to open the concise `assessment.md` locally and use `assessment.json` only for detailed evidence or partner tooling. Explain the meaning of unknowns, partial totals, shared work, repeated occurrences, and alternative adverse scenarios without reading their report.
9. After an authorized representative rehearsal, optionally guide `calibrate --input <assessment.json> --rehearsal <observation.json>` to compare four observed measurements with the range. Calibration never changes rules automatically.
10. Hand off to the public route guides for a separate migration engagement.

## Estimates and tests

- Default timing rules are conservative bundled engineering assumptions and must be described as uncalibrated, not measured averages or guarantees. Unknown is not zero, and model guesses or test-fixture rates remain prohibited.
- The owning team may supply locally reviewed provisional typical rules with route/phase/complexity applicability, reviewer, date, basis, and limitations. These don't establish compatibility, statistical averages, or guaranteed duration.
- Unknown critical work prevents complete totals. Never describe a known subtotal as a complete migration estimate.
- Effort is separate from elapsed time, execution time, and downtime.
- Repeated rehearsals have distinct occurrence IDs; shared references to one occurrence are counted once.
- The offline tests use synthetic data only. Passing them does not prove a live migration succeeds.
- Do not claim task/story acceptance or customer readiness until the documented live validation and calibration gates pass.

## Optional sharing

There is no automated sharing command in this prototype. Before discussing customer-specific answers or interpreting any report in cloud chat, explain the receiving service and requested data categories and obtain separate, explicit sharing consent. The customer must preview and minimize the information locally first. Secrets and business record contents remain prohibited. Refusal must not prevent the local assessment workflow.
