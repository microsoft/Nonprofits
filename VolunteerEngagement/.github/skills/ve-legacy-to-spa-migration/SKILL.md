---
name: ve-legacy-to-spa-migration
description: "Migrate, classify, or validate Volunteer Engagement legacy Power Pages sites and customizations against Volunteer Engagement 2.0, the Portal-EDM React SPA on Enhanced Data Model. Use when users ask to migrate an existing site to the new portal SPA, move a site to enhanced data model, migrate legacy VE, compare Portal-EDM, inspect site settings, Liquid pages, table permissions, web roles, bot consumers, authentication, localization, accessibility, or run migration dry runs."
argument-hint: "<legacy export path or site id> <target environment> <task: classify|migrate|validate>"
---

# Volunteer Engagement legacy-to-SPA migration

Use this skill for multi-step Volunteer Engagement migration work where the source is an existing legacy Power Pages site and the target is the Volunteer Engagement 2.0 React SPA on Enhanced Data Model.

## Source of truth

Before planning or editing, read the relevant files in `.ai/instructions`:

1. `README.md`
2. `legacy-to-spa-migration.md`
3. `customization-migration.md`
4. `spa-development.md`
5. `authentication-migration.md`
6. `bot-setup.md`
7. `localization-accessibility.md`
8. `deployment-validation.md`

Use `Portal-EDM` as the target baseline. Do not rebuild Volunteer Engagement from zero.

## When to use

Use this skill when the user asks to:

- Migrate an existing site to Volunteer Engagement 2.0.
- Move a legacy site to the enhanced Volunteer Engagement SPA.
- Export or inspect a legacy Volunteer Engagement Power Pages site.
- Compare a legacy VE site with `Portal-EDM`.
- Migrate legacy site customizations to the React SPA.
- Classify Liquid pages, content snippets, web files, table permissions, web roles, site settings, or bot consumers.
- Validate authentication, local username/password sign-in, Microsoft Entra sign-in, bot visibility, localization readiness, or accessibility.
- Run a dry-run migration report for an uncustomized or customized legacy VE site.

## Procedure

1. Confirm the source site or exported folder.
   - If only a site ID is provided, run `pac pages list` in the selected environment and confirm whether the ID is a Power Pages website record ID.
   - For Standard Data Model source sites only, use `pac pages download --path <legacy-site-export> --websiteId <website-id> --modelVersion 1` when `download-code-site` is not supported. Do not use `modelVersion 1` for the new `Portal-EDM` target deployment.
   - For Enhanced Data Model code sites, use `pac pages download-code-site --path <legacy-site-export> --webSiteId <website-id> --overwrite`.
   - Prefer `.migration-work/<site-name-or-id>/legacy-export/` for raw exports when working in this solution. Keep raw exports unchanged and put final migration output in `Portal-EDM/`.
2. Inventory the source export.
   - Pages, templates, snippets, web files, table permissions, web roles, forms, bot consumers, site settings, localization, and authentication-related metadata.
3. Compare with `Portal-EDM`.
   - Classify product baseline, site customizations, obsolete legacy implementation, security-sensitive items, environment-specific items, and unknowns.
4. Apply the baseline-first rule.
   - If the source is uncustomized VE, produce a classification and validation report. Do not recommend porting all Liquid templates.
   - If custom deltas exist, map them to React routes/components, services, localization-ready strings, or reviewed Power Pages metadata.
5. Require review for sensitive changes.
   - Site settings, authentication providers, secrets, anonymous access, table permissions, Web API fields, web roles, bot visibility, and third-party scripts.
   - Public bot visibility is allowed for opportunity discovery and general help, but apply, profile, participation, and personal-data bot flows must require sign-in.
6. Validate before declaring completion.
   - Use `npm run build`, `npm run lint`, `npm run test`, `npm run deploy`, `npm run permissions:patch-roles`, `npm run permissions:patch-bot-roles`, browser smoke tests, and WCAG AA-oriented checks as applicable from `Portal-EDM`.

## Output expectations

For classification or dry-run tasks, include these sections:

- Product baseline already covered.
- Customizations to migrate.
- Obsolete legacy implementation.
- Items requiring validation.
- Items not to migrate.
- Unexpected deltas.
- Recommended next steps.

For implementation tasks, include changed files, validation commands, browser checks, unresolved review items, and known limitations.
