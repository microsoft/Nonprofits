# Source validation tests

These tests support repository CI and maintainers. They aren't included in the distributed customer package.

Run `npm test` from the package root. The tests use Node's built-in test runner and synthetic fixtures. They do not connect to a tenant or create customizations.

Timing values in [fixtures.ts](fixtures.ts) and [planner.test.ts](planner.test.ts) are deliberately artificial arithmetic inputs, not migration estimates.

| Specification cases | Offline evidence | Still requires live or additional work |
| --- | --- | --- |
| T01 | Public dependency manifest/lockfile and CLI tests; packed install and executable startup; [target.test.ts](target.test.ts) verifies fresh-master reachability, pinned manifests/guides, hashes, origin, cleanliness, historical commits, local-only revision rejection, and tamper rejection | Public-repository publication and supported-host validation |
| T02-T03 | Candidate identity/version checks and shared preparation in [engine.test.ts](engine.test.ts) | Supported version matrix and actual package compatibility |
| T04-T05 | VM route/coexistence/unknown-remediation tests | PCF/plugin/layer collection and customized VM rehearsal |
| T06-T07 | VE prerequisite and opaque-customization tests | Real website/model/authentication inspection and SPA rehearsal |
| T08 | Mixed-family graph and combined totals | Real mixed-environment dependency discovery |
| T09 | Denial, budgets, throttling, cancellation, malformed/partial responses in [discovery.test.ts](discovery.test.ts); environment/component/dependency/integration/count/site summaries in [assessment-discovery.test.ts](assessment-discovery.test.ts); denied-access reporting in [story-scenarios.test.ts](story-scenarios.test.ts) | Actual constrained-account role validation |
| T10-T11 | Unsupported destinations, lower versions, wrong identity, absence versus denial, coexistence, reviewed same-release equivalence, and automatic scope selection | Broader approved release-equivalence catalog and partial-migration continuation routes |
| T12-T13 | Exact allowlisted GET request shape, redirect/pagination controls, field projection, and canary/error sanitization | Authorized tenant audit and before/after state comparison |
| T14 | [cli.test.ts](cli.test.ts) checks collection/review non-TTY refusal, no answer/report echo, and local-only offline processing; [review.test.ts](review.test.ts) covers short-review mapping | Human-terminal isolation and separately consented chat UX in each host |
| T15-T17 | Strict schemas, repeatability, unknown totals, cycle/conflict detection, Markdown escaping, dependency propagation, source-to-target rendering, and a concise-report line budget | Wider fixture coverage for dynamic dependencies |
| T18 | Reviewed synthetic rules calculate dependency critical-path elapsed ranges and separate production execution/downtime ranges; missing inputs remain null | Role capacity, calendars, approval lead times, change-window placement, and real timing calibration |
| T19 | Strict structured inputs, no metadata-triggered execution, unsafe URL rejection, and HTML/Markdown escaping | End-to-end host prompt-injection validation |
| T20 | [rule-review.test.ts](rule-review.test.ts) verifies reviewed rules; [calibration.test.ts](calibration.test.ts) and CLI tests compare four rehearsal measurements with assessed ranges; synthetic/default arithmetic is not calibration | Accountable expert review and representative measured migrations |
| T21 | [planner.test.ts](planner.test.ts): one shared occurrence versus a second rehearsal, independent adverse scenarios | Representative repeated rehearsal measurements |
| T22-T23 | Separate CDM/Fundraising/Grants/Outcomes bounded and unbounded scoped-work fixtures; guided review maps bounded and ownerless/opaque answers to deterministic work | These are declared scope inputs, not a simulation of live component-layer detection |
| T24 | Shared custom-work accounting and unbounded impact propagation; [story-scenarios.test.ts](story-scenarios.test.ts) groups standard, bounded mixed, opaque, VE, and denied-access fixtures | Live partner-managed shared dependency scenario |

## Later environment test sequence

Execution records: [standard baseline live test, 2026-09-30](standard-baseline-2026-09-30.md). Provisioning success does not imply that discovery or migration has been tested.

This is a test plan, not authorization to execute it.

1. Confirm the exact nonproduction environment, tenant, permitted actions, owners, and recovery plan.
2. Install the agreed baseline solutions and record versions.
3. Run the read-only collector with a constrained account and review request/field coverage.
4. Create approved synthetic customizations in a separate setup activity: partner-managed dependencies, unmanaged overrides, forms/PCF references, integration stubs, and VE custom journeys as applicable.
5. Reassess, compare discoveries with the known setup, and test missing-permission behavior.
6. Rehearse the migration separately, record actual effort/execution/outage timings, and calibrate rules.
7. Verify assessment itself made no changes and collected no prohibited content.

Do not treat the current mocked tests as completion of this sequence or of the parent story.
