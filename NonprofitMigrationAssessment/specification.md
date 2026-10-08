# Nonprofit migration assessment specification

| Item | Value |
| --- | --- |
| Specification version | 1.0 |
| Status | Customer-facing behavioral and safety contract |
| Updated | 2026-10-08 |
| Package | `NonprofitMigrationAssessment` |
| Target repository | `microsoft/Nonprofits` |

This specification defines the supported assessment behavior. The skill assesses migration readiness and planning; it does not perform migration.

## 1. Supported products

| Product | Installed source | GitHub destination | Route type |
| --- | --- | --- | --- |
| Common Data Model for Nonprofits | `NonprofitCore` | `NonprofitCore` | Alignment, ownership transition, or newer-release update |
| Fundraising | `SocialImpactFundraising` | Same identity | Alignment, ownership transition, or newer-release update |
| Grant Management | `SocialImpactGrants` | Same identity | Alignment, ownership transition, or newer-release update |
| Outcome Management | `SocialImpactOutcomes` | Same identity | Alignment, ownership transition, or newer-release update |
| Volunteer Management | `VolunteerManagement` | `volunteermanagementos` | Side-by-side replacement migration |
| Volunteer Engagement | Legacy Power Pages site | `Portal-EDM` | Site replacement migration |

Fundraising and Engagement is a different product and isn't covered by this assessment.

## 2. Customer outcomes

For each selected product, the report shows:

- Installed solution name and version
- GitHub target name and version or site
- Required action in simple language
- Customization and dependency risk
- Planning effort range
- Elapsed-time range when available
- Production execution and potential-downtime ranges
- Confidence, assumptions, blockers, and next actions

Possible route results include:

| Result | Meaning |
| --- | --- |
| Already aligned | The installed PPAC release matches an approved GitHub release-equivalence entry. No product or data migration is required for alignment |
| Ownership transition | Same solution identity; optional work is required to leave PPAC servicing and self-manage GitHub builds |
| Newer release update | A newer GitHub same-identity release can be assessed as a managed update |
| Replacement migration | The GitHub destination has a different solution or site identity |
| Release mapping required | The installed and GitHub releases aren't in the approved equivalence catalog |
| Complete range unavailable | A critical route, ownership, access, or behavioral question remains unresolved |

Version equality alone doesn't prove alignment. Alignment requires a matching entry in `catalog/release-equivalence.json`.

## 3. Customer workflow

1. Initialize local assessment files from a clean `microsoft/Nonprofits` checkout.
2. Configure the environment, intent, and read-only consent through the interactive local command.
3. Confirm the exact environment and collect approved read-only evidence.
4. Answer five local planning questions; answer the short VE extension only when VE is selected.
5. Generate the local JSON and Markdown report.
6. Review ranges and blockers with the implementation partner.
7. Rehearse in a representative sandbox and compare observed results with the assessment.

The customer doesn't need to edit JSON manually. JSON files are local machine-readable artifacts used between commands.

## 4. Assessment intent

### CDM and template apps

The customer chooses:

- **Confirm alignment:** Determine whether the installed PPAC release matches an approved GitHub release.
- **Ownership transition:** Assess the work to leave PPAC automatic servicing and self-manage GitHub builds.
- **Apply a newer GitHub release:** Assess a forward same-identity update.

CDM doesn't require migration when it is already aligned and no ownership transition or newer-release update is requested.

Template apps depend on CDM. An already-aligned CDM satisfies that prerequisite.

### Volunteer Management

VM changes solution identity. Version numbers aren't compared across `VolunteerManagement` and `volunteermanagementos`. The assessment considers installation, mappings, PCF and plug-in references, validation, cutover, and retirement of the old solution.

### Volunteer Engagement

VE changes the Power Pages site. The assessment considers source model, CDM/VM prerequisites, authentication-provider count, languages, custom journeys, validation, cutover, and rollback. It doesn't retrieve page content, scripts, credentials, or a full site export.

## 5. Read-only evidence

The customer approves categories before collection.

| Category | Collected evidence |
| --- | --- |
| Environment | Dataverse version |
| Solutions | Identity, version, managed state, publisher, and current publisher prefix |
| Components | Relevant component-type counts and bounded unmanaged overlap |
| Dependencies | Deterministic bounded dependent-component sample |
| Integrations | Counts of workflows, connection references, plug-in assemblies, and steps |
| Data scale | Aggregate counts for bounded relevant tables |
| Sites | Legacy and enhanced Power Pages site counts |

The collector never retrieves:

- Business-record contents
- Credentials, tokens, certificates, or connection values
- Plug-in binaries
- Flow bodies
- Page, snippet, Liquid, JavaScript, or CSS content
- Full solution or site exports

Evidence records its source, status, collection time, scope, and limitation. Denied, unavailable, partial, stale, and unknown evidence never becomes false absence or zero effort.

## 6. Target evidence

Production commands:

1. Require a clean checkout whose origin is `https://github.com/microsoft/Nonprofits`.
2. Fetch `origin/master`.
3. Pin the target commit.
4. Read allowlisted manifests and migration guides from that Git commit.
5. Verify solution identity, publisher, prefix, version, and machine evidence.
6. Require later assessment steps to reproduce the same target.

Local-only and unpublished target commits are rejected.

Detailed file hashes remain in local JSON for reproducibility and tamper detection. The concise customer report shows only the repository and pinned commit.

## 7. Local planning questions

The default review asks:

1. Are there critical custom plug-ins, flows, or components?
2. Are there external integrations affecting selected products?
3. Is an accountable owner or source available?
4. Is a representative sandbox and critical test coverage ready?
5. What is the maximum acceptable interruption?

VE additionally asks:

- Legacy or Enhanced source model
- Authentication-provider count category
- Language count category
- Presence of critical custom journeys

Answers are classified as none, bounded, opaque, or unknown. Bounded answers add one scoped work occurrence. Opaque or ownerless critical work prevents a complete affected range.

## 8. Complexity and dependencies

The deterministic classifier uses observed evidence and local answers to identify:

- Likely standard
- Standard
- Moderate
- Heavy
- Unbounded
- Unknown

No unmanaged overlap doesn't prove the absence of custom plug-ins, flows, external systems, or dynamic dependencies. The report states this assumption.

Standard route ordering is:

```text
CDM
 ├─ Fundraising
 ├─ Grant Management
 ├─ Outcome Management
 └─ Volunteer Management
      └─ Volunteer Engagement
```

Shared work is counted once. Repeated rehearsals or retries are distinct occurrences.

## 9. Estimates

The tool calculates ranges deterministically. It doesn't ask an AI model to invent numbers.

The report separates:

- Person-effort
- Dependency-path elapsed time
- Production execution time
- Potential downtime

Bundled values in `catalog/assumptions.json` are uncalibrated engineering assumptions. They aren't measured averages, commitments, or guarantees. Validate them with the implementation partner and a representative rehearsal.

Reviewed rules can replace bundled assumptions. Every reviewed rate includes applicability, range, basis, limitations, reviewer, date, and version.

When critical work remains unresolved, the report shows the known planning subtotal and the action required to complete the range.

## 10. Report

The concise Markdown report contains:

1. Decision summary
2. Environment summary
3. Installed solution and target-version table
4. Simple required action per product
5. Priority blockers and next actions
6. Evidence coverage
7. Dependencies and assumptions
8. Combined scenario and phase ranges
9. Public migration-guide links
10. Limitations

The detailed JSON contains machine evidence, file hashes, work dependencies, rule provenance, and scenario reasons.

Assessment artifacts remain local by default. Optional sharing requires customer review and consent. Secrets and business-record contents must never be shared.

## 11. Safety and failure behavior

- Unknown commands and unsupported endpoints fail closed.
- Redirects are rejected.
- Pagination destinations and fields are allowlisted.
- Requests, pages, bytes, retries, and total time are bounded.
- Collection can be canceled.
- Authentication tokens remain in the request path and aren't serialized.
- Errors don't include server response bodies, credentials, or customer input values.
- Output is written atomically outside Git repositories and existing directories aren't overwritten.
- The assessment doesn't change customer data, configuration, permissions, or deployment state.

## 12. Supported environment and limitations

- Node.js 22 is required.
- Commercial Dataverse URLs are supported.
- Sovereign clouds and on-premises endpoints aren't currently supported.
- Metadata can't establish arbitrary custom-code behavior.
- Dependency and table discovery use documented deterministic caps.
- Environment-wide automation counts can include unrelated platform registrations.
- Scheduling ranges don't place work into individual calendars, approval lead times, or change windows.
- A representative sandbox rehearsal remains the best validation of execution time and downtime.

## 13. Public references

- [Microsoft Nonprofits repository](https://github.com/microsoft/Nonprofits)
- [CDM and template-app migration guide](https://github.com/microsoft/Nonprofits/blob/master/Documents/ppac-to-github-migration.md)
- [Volunteer Management migration guide](https://github.com/microsoft/Nonprofits/blob/master/VolunteerManagement/MIGRATION.md)
- [Volunteer Engagement migration guide](https://github.com/microsoft/Nonprofits/blob/master/VolunteerEngagement/MIGRATION.md)
