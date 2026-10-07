# Nonprofit migration assessment release checklist

Use this checklist before presenting the skill as customer-ready. Merging the implementation does not by itself approve the catalogs, permissions, estimates, or customer release.

## Pull request merge gates

- [ ] PR #58 is merged, or template-app equivalence mappings remain disabled until GitHub manifests are `1.0.3.3`.
- [ ] CODEOWNERS approves the route semantics, safety boundaries, and customer workflow.
- [ ] Ubuntu and Windows validation pass.
- [ ] CodeQL and repository policy checks pass.
- [ ] Public package contents contain no internal paths, customer artifacts, test runners, or generated build/dependency folders.

## Owning-team product decisions

### Compatibility catalog

- [ ] Approve the intent model: alignment confirmation, PPAC ownership transition, newer GitHub release, and replacement migration.
- [ ] Approve each entry in `catalog/compatibility.json`.
- [ ] Confirm CDM equivalence `3.1.3.4` to `3.1.3.4`.
- [ ] Confirm Fundraising, Grants, and Outcomes equivalence only when PPAC and GitHub are both `1.0.3.3`.
- [ ] Assign a compatibility-catalog owner and review cadence.
- [ ] Change catalog status from `candidate` to `approved` only after these decisions are recorded.

Approver: ____________________

Approval date: ____________________

### Estimation catalog

- [ ] Review each route/phase effort range.
- [ ] Review elapsed, execution, and downtime ranges.
- [ ] Decide whether uncalibrated engineering assumptions can be shown to customers before measured rehearsal evidence exists.
- [ ] Approve the low-confidence labeling and limitations.
- [ ] Assign an estimation-catalog owner and update cadence.
- [ ] Replace or explicitly approve the assumed catalog before a customer-ready release.

Approver: ____________________

Approval date: ____________________

## Platform and privacy validation

- [ ] Run all collector categories with a constrained assessment account.
- [ ] Document the minimum required Dataverse privileges; do not require System Administrator without evidence.
- [ ] Verify denied access remains unknown/access-denied and never becomes false absence.
- [ ] Confirm collected fields contain no record contents, secrets, connection values, plug-in binaries, or full site exports.
- [ ] Confirm local retention, deletion, and optional-sharing guidance with privacy/security reviewers.

Permission reviewer: ____________________

Privacy/security reviewer: ____________________

Approval date: ____________________

## Representative validation

- [ ] Standard alignment plus VM replacement scenario completed.
- [ ] Bounded customized/mixed scenario completed.
- [ ] Opaque ownerless critical dependency scenario completed.
- [ ] VE authentication/language/custom-journey scenario completed.
- [ ] At least one representative rehearsal compared with the assessed ranges.
- [ ] Estimate misses and resulting catalog changes are recorded.
- [ ] Before/after reads confirm the assessment changed no environment data or configuration.

Validation owner: ____________________

Approval date: ____________________

## Customer release

- [ ] Public location, versioning, support owner, and issue triage process are assigned.
- [ ] Customer instructions and sanitized example reports are approved.
- [ ] Known limitations and prototype language match the approved release status.
- [ ] Release artifact is produced from a reviewed commit with passing required checks.
- [ ] Product owner gives final customer-release approval.

Product owner: ____________________

Release version/date: ____________________
