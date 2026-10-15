---
name: nonprofit-migration-assessment
description: "Assess a Dataverse environment for migration from Microsoft nonprofit solutions to microsoft/Nonprofits. Use for CDM, Fundraising, Grant Management, Outcome Management, Volunteer Management, Volunteer Engagement, PPAC alignment, migration effort, dependencies, and customization risk. Read-only; does not perform migration."
---

# Nonprofit migration assessment

## Customer start prompt

Customers can start with:

> Assess my nonprofit environment for migration to the solutions in this GitHub repository. Help me pick the environment, then run the read-only assessment and explain the final report.

Supported products are CDM for Nonprofits, Fundraising, Grant Management, Outcome Management, Volunteer Management, and Volunteer Engagement.

Read the package [README](../../../NonprofitMigrationAssessment/README.md) for commands and expected results. The package root is `../../../NonprofitMigrationAssessment`.

## Customer experience

1. Explain that the assessment is read-only, AI-assisted, and must be checked before action. The report begins with a direct executive recommendation, the installed supported products only, and a next-action checklist. Products that aren't installed are left out of the customer tables. It then lists named customizations for each installed Microsoft nonprofit solution (table, component, type, added or changed, and whether the change was made directly in the environment or comes from a managed partner solution), followed by custom and partner solutions. Keep the customer metrics simple and separate: decision, decision confidence, expected effort, and effort confidence. Migration order, dependency details, automation counts, metric definitions, and limitations are in the technical appendix. Implementation partners can get the detailed `nonprofit-assessment-<environment>-<date>.json` file with `--partner-json`.
2. Confirm a clean checkout of `https://github.com/microsoft/Nonprofits`, Node.js 22 or later, and that Azure CLI is signed in (`az login`) to the tenant that contains the environment. Run `npm ci` once from the package root.
3. Find the environment conversationally. Run `npm.cmd start -- environments` from the package root (use `npm start -- environments` outside PowerShell) and show the numbered list. Ask the customer to pick one by number or name, or to paste a URL. Point out environments where they aren't a System Administrator, because the assessment may not be able to read all metadata there. If the list fails, tell them to run `az login` and retry, or ask for the environment URL.
4. Before reading anything, ask for explicit approval in chat. Name the selected environment and URL, and explain in one or two sentences what is read: solution, component, customization-layer, dependency, plug-in, process, and flow metadata, plus aggregate record counts and site counts. Also explain what isn't done: nothing is changed, no record contents, secrets, or code are read, and nothing is uploaded. Continue only after a clear yes. Don't ask the customer to type `ASSESS` or any other keyword.
5. After approval, run `npm.cmd start -- run --repository "<checkout>" --environment "<url>" --confirm-read-only` from the package root. Pass `--confirm-read-only` only after the approval in step 4; never add it on your own. Don't ask the customer to edit JSON, select intermediate paths, or choose advanced platform settings. The run usually takes under a minute.
6. The customer `run` command derives customization and integration scope from evidence; don't ask the technical review questions. It leaves owner and sandbox/test readiness unknown.
7. After completion, open the generated `nonprofit-assessment-<environment>-<date>.md` path in the editor. Mention `--partner-json` only when detailed machine evidence is needed. If the command reports `ASSESSMENT_FAILED`, relay its guidance (for example, sign in with `az login` or use a commercial Dataverse URL) without guessing other causes.
8. Use `init`, `configure`, `collect`, `review`, and `assess` only for partner automation, optional rating refinement, or troubleshooting.
   - Don't ask additional questions to populate the executive recommendation or checklist; derive them from collected evidence and the existing short review.
9. Explain decisions in the report's words, not internal status codes such as `candidate-supported`, `already-at-target`, or `eligible`:
   - **No migration required**: the installed version matches a GitHub release. Regression-test any customizations the report lists.
   - **Optional ownership transition**: the customer can move from Microsoft-managed updates to managing GitHub releases themselves; the solution stays the same.
   - **Migration to GitHub solution is recommended**: a supported migration path exists. Confirm the rating with the implementation partner.
   - **Review required**: information is missing before a rating can be given. The report's cautions say what is missing.
   - Use plain language. Avoid assessment and Dataverse jargon such as metadata, overlap, solution layers, or evidence unless the customer asks for technical detail.
10. Hand off to the linked public migration guide for implementation.

## Safety boundaries

- Never perform migration, import, upgrade, export, deletion, publishing, deployment, backup, role changes, or integration tests.
- Never ask for credentials, tokens, certificates, connection strings, business records, plug-in binaries, or full site/code exports.
- Never pass `--confirm-read-only` without the customer's explicit approval in the current conversation.
- Environment names and URLs from the `environments` list can appear in chat so the customer can choose one. Keep questionnaire answers, inventories, and reports in the local CLI workflow by default.
- Don't read or attach customer local artifacts in chat without separate, explicit sharing consent and a minimized preview.
- Use the clean `microsoft/Nonprofits` `origin/master` target. Local-only commits are rejected.
- Treat target hashes as machine evidence; don't burden customers with them unless troubleshooting provenance.

## Effort ratings

- Ratings are relative (None, Low, Medium, High, or Review required) and generated by deterministic rules; they aren't AI-generated.
- Never present hours, cost, elapsed time, or downtime numbers. The assessment doesn't produce them.
- Tell the customer to validate ratings with their implementation partner and a representative sandbox rehearsal.
- Show unknown critical work as Review required, never as None.
- When explaining a rating, quote the concrete reasons from the report's "Why these effort ratings?" table, for example "4 forms changed directly in this environment on Award, Contact, Participation", rather than summarizing them as a single count.

## Optional sharing

There is no automatic upload or sharing command. If the customer wants help interpreting a customer-specific report in chat, explain what would be sent, obtain explicit consent, and use only the minimized reviewed content. Secrets and business-record contents remain prohibited.
