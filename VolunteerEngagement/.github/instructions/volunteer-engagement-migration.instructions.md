---
description: "Use when migrating, extending, validating, or comparing Volunteer Engagement Power Pages sites, existing sites, legacy VE exports, new portal SPA, Portal-EDM, React SPA, enhanced data model, Enhanced Data Model, or site customizations."
applyTo:
  - ".ai/**"
  - ".github/**"
  - "Portal-EDM/**"
  - "VolunteerEngagement/.ai/**"
  - "VolunteerEngagement/.github/**"
  - "VolunteerEngagement/Portal-EDM/**"
---

# Volunteer Engagement migration instructions

When the user asks about Volunteer Engagement migration, migrating an existing site to a new portal SPA, legacy Power Pages sites, Standard Data Model to Enhanced Data Model, enhanced data model, `Portal-EDM`, React SPA customizations, exported Power Pages sites, table permissions, web roles, site settings, authentication, bot consumers, Power Pages site agent setup, localization, or accessibility, use the detailed instruction package in `.ai/instructions`.

These instructions are intentionally folder-local to Volunteer Engagement. They are not mirrored at the repository root.

Start with:

- `.ai/instructions/README.md`
- `.ai/instructions/legacy-to-spa-migration.md`
- `.ai/instructions/customization-migration.md`
- `.ai/instructions/deployment-validation.md`

Core rules:

- Use `Portal-EDM` as the target baseline. Do not rebuild Volunteer Engagement from zero.
- Treat the exported legacy site as the source of customization deltas.
- Put raw downloaded source-site exports under `.migration-work/<site-name-or-id>/legacy-export/`; final migration output belongs in `Portal-EDM/`, not `.migration-work/`.
- Do not migrate site settings by default. Classify them and require review.
- Do not copy authentication configuration, secrets, or tenant-specific values.
- Preserve least privilege for web roles, table permissions, Web API fields, and bot visibility.
- Prefer React, TypeScript, Fluent UI v9, and the existing `Portal-EDM` service patterns over legacy Liquid or Bootstrap implementation details.
