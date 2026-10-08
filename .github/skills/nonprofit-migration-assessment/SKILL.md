---
name: nonprofit-migration-assessment
description: "Assess a Dataverse environment for migration from Microsoft nonprofit solutions to microsoft/Nonprofits. Use for CDM, Fundraising, Grant Management, Outcome Management, Volunteer Management, Volunteer Engagement, PPAC alignment, migration effort, dependencies, customization risk, and downtime planning. Read-only; does not perform migration."
---

# Nonprofit migration assessment

## Customer start prompt

Customers can start with:

> Assess my nonprofit environment for migration to the solutions in this GitHub repository. Guide me through the local read-only workflow and explain the final report.

Supported products are CDM for Nonprofits, Fundraising, Grant Management, Outcome Management, Volunteer Management, and Volunteer Engagement.

Read the package [README](../../../NonprofitMigrationAssessment/README.md) for commands and expected results. The package root is `../../../NonprofitMigrationAssessment`.

## Customer experience

1. Explain that the assessment is read-only and produces a local report with installed versions, required migration action, effort, elapsed time, execution, downtime, assumptions, and blockers.
2. Confirm a clean checkout of `https://github.com/microsoft/Nonprofits` and Node.js 22.
3. Guide `init`, then `configure`. Configuration is interactive; don't ask the customer to edit JSON.
4. Explain the approved metadata/count categories and obtain authorization before `collect`.
5. Collection requires a human terminal and exact `ASSESS` confirmation for the selected environment.
6. Guide the five-question local `review`; ask the short VE extension only when VE is selected.
7. Guide `assess` and tell the customer to open `assessment.md`.
8. Explain:
   - `already-at-target`: no product or data migration is required for alignment.
   - `ownership-transition`: optional work to leave PPAC servicing and self-manage GitHub builds.
   - `candidate-supported`: planning route found; validate assumptions with the implementation partner.
   - `complete range unavailable`: critical information or route validation is still required.
9. Optionally guide `calibrate` after a representative rehearsal.
10. Hand off to the linked public migration guide for implementation.

## Safety boundaries

- Never perform migration, import, upgrade, export, deletion, publishing, deployment, backup, role changes, or integration tests.
- Never ask for credentials, tokens, certificates, connection strings, business records, plug-in binaries, or full site/code exports.
- Keep environment URLs, questionnaire answers, inventories, and reports in the local CLI workflow by default.
- Don't read or attach customer local artifacts in chat without separate, explicit sharing consent and a minimized preview.
- Use the clean `microsoft/Nonprofits` `origin/master` target. Local-only commits are rejected.
- Treat target hashes as machine evidence; don't burden customers with them unless troubleshooting provenance.

## Estimates

- Ranges are generated deterministically from `catalog/assumptions.json`; they aren't AI-generated, measured averages, or guarantees.
- Describe bundled ranges as uncalibrated engineering assumptions.
- Tell the customer to validate ranges with their implementation partner and a representative sandbox rehearsal.
- Keep unknown critical work out of complete totals; show a known subtotal and the action needed to complete the range.
- Count shared work once and keep effort, elapsed time, execution, and downtime separate.

## Optional sharing

There is no automatic upload or sharing command. If the customer wants help interpreting a customer-specific report in chat, explain what would be sent, obtain explicit consent, and use only the minimized reviewed content. Secrets and business-record contents remain prohibited.
