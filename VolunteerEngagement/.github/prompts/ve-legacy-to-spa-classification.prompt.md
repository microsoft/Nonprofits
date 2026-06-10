---
description: "Classify a legacy Volunteer Engagement Power Pages export or existing site against Volunteer Engagement 2.0, the Portal-EDM React SPA baseline, without editing files. Use for migration dry runs to a new portal SPA with enhanced data model."
agent: "agent"
argument-hint: "<legacy export folder>"
---

# Classify Volunteer Engagement legacy-to-SPA migration

Use `.ai/instructions/README.md` and the linked instruction files.

Treat the provided path or context as the downloaded legacy Volunteer Engagement site export. Compare it to `Portal-EDM`.

Do not edit files.

Produce a migration classification report with these sections:

- Product baseline already covered.
- Customizations to migrate.
- Obsolete legacy implementation.
- Items requiring validation.
- Items not to migrate.
- Unexpected deltas.
- Recommended next steps.

Apply the baseline-first rule: do not recommend rebuilding the full legacy Volunteer Engagement portal in React. Identify only the deltas that must move onto the enhanced SPA baseline.
