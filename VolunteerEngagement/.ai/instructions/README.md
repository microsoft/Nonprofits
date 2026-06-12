# Volunteer Engagement AI instructions

Use these instructions when migrating a legacy Volunteer Engagement Power Pages site to the Volunteer Engagement 2.0 React SPA on Enhanced Data Model.

These files are the public AI entry point for this migration work. They are intentionally stored under `VolunteerEngagement/.ai/instructions` so they live beside the Volunteer Engagement source material.

## Source inputs

Use the source site's exported code-site as the canonical legacy source. Do not assume access to Microsoft internal legacy portal folders.

The site owner should download their existing Power Pages site into a local source folder before migration:

```shell
pac auth select --index <index>
pac pages list
pac pages download-code-site --path <legacy-site-export> --webSiteId <legacy-site-id> --overwrite
```

After download, inspect the exported site metadata, web templates, web files, snippets, permissions, roles, bot consumers, and localized content in that folder.

Use these inputs as the canonical references:

| Area | Path | Purpose |
| --- | --- | --- |
| Legacy site export | `<legacy-site-export>` | Downloaded source from the existing Power Pages site |
| Customization source | Provided repository, package, or exported site folder | Custom pages, Liquid, JavaScript, CSS, snippets, permissions, roles, bot setup, and other site-connected changes |
| New SPA baseline | `Portal-EDM` | React + TypeScript + Vite SPA deployed to Power Pages Enhanced Data Model |

## Migration workspace

Use `.migration-work/` for local migration inputs and analysis artifacts. This folder is gitignored and is intended for raw exports, scratch copies, notes, screenshots, and comparison output.

Recommended layout:

```text
.migration-work/
  <site-name-or-id>/
    legacy-export/    # Raw downloaded source site. Keep unchanged.
    edm-export/       # Optional target/EDM export for comparison.
    working-copy/     # Optional scratch copy for experiments.
    notes/            # Local notes and classification evidence.
    screenshots/      # Browser validation screenshots.
    raw-diffs/        # Temporary comparison output.
```

Do not put final migration output in `.migration-work/`. Commit-ready changes belong in `Portal-EDM/`, `.ai/instructions/`, `.github/`, or another tracked source folder.

Use the existing `.ai` material as supporting context:

- `.ai/context/ve-overview.md`
- `.ai/context/ve-vm-dependency.md`
- `Portal-EDM/README.md`

Migration should follow the SPA/code-site workflow described in this instruction set, not legacy managed-solution portal migration paths.

## Baseline-first rule

Use `Portal-EDM` as the target baseline. Do not rebuild Volunteer Engagement from zero. Use the legacy site export to identify customizations and configuration differences that must move onto the enhanced SPA baseline.

If the legacy export is an uncustomized Volunteer Engagement site, produce a classification and validation report rather than a large code migration. Most baseline product pages, templates, snippets, and Liquid logic should be classified as already covered or replaced by the SPA.

## Instruction files

Read these files in order:

1. `legacy-to-spa-migration.md` - end-to-end AI migration workflow.
2. `customization-migration.md` - how to classify and migrate site customizations.
3. `spa-development.md` - how to work in the React SPA implementation.
4. `authentication-migration.md` - authentication provider and web role migration guidance.
5. `site-agent-setup.md` - Power Pages site agent (Copilot Studio) setup, web roles, knowledge sources, and advanced configuration guidance.
6. `localization-accessibility.md` - localization readiness and WCAG expectations.
7. `deployment-validation.md` - deployment, smoke testing, and definition of done.

## AI operating rules

- Treat the existing source site as production data. Do not overwrite, delete, or bulk-copy configuration without explicit approval.
- Migrate site-specific customizations by default, except site settings. Site settings require classification and approval before migration.
- Preserve authentication behavior, web roles, table permissions, routes, content, and site-specific UX unless the user explicitly decides to change them.
- Prefer implementing user-facing behavior in the React SPA instead of carrying forward legacy Liquid or JavaScript unchanged.
- Keep the site English-only for the initial output, but prepare all new user-facing text for localization.
- Require WCAG AA accessibility validation for migrated and newly generated UI.
- Use Power Pages Web API and table permissions deliberately. Any change that expands anonymous access or exposed fields is security-sensitive.
- Use `npm run build`, `npm run lint`, `npm run test`, `npm run deploy`, and browser smoke tests before declaring the migration complete.

## Quality bar

- Write public, reader-focused guidance. Avoid internal project shorthand, private environment names, and assumptions that only Microsoft engineering has access to.
- Verify claims against the source export, `Portal-EDM`, or documented Power Pages behavior. Mark unknowns as review items instead of guessing.
- Use placeholders such as `<legacy-site-id>` and `<environment-url>` for tenant-specific values.
- Never write secrets, passwords, tokens, client secrets, connection strings, or private keys into prompts, markdown, scripts, logs, or source files.
- Require explicit review for authentication changes, web role changes, table permissions, anonymous access, Web API field exposure, bot visibility, and site settings.
- Preserve least privilege. Do not expand access to make a migration easier.
- Keep user-facing text localization-ready and UI changes aligned with WCAG AA expectations.
- End each migration task with evidence: changed files, validation commands, browser checks, unresolved review items, and known limitations.

## Official references

Use these Microsoft references for platform behavior. Keep the tested guidance in this instruction set as the operational source of truth when CLI behavior differs by version or data model.

- [Power Platform CLI `pac pages` commands](https://learn.microsoft.com/power-platform/developer/cli/reference/pages)
- [Power Pages security](https://learn.microsoft.com/power-pages/security/power-pages-security)
- [Power Pages table permissions](https://learn.microsoft.com/power-pages/security/table-permissions)
- [Power Pages Web API overview](https://learn.microsoft.com/power-pages/configure/web-api-overview)
- [Set up site authentication in Power Pages](https://learn.microsoft.com/power-pages/security/authentication/configure-site)
- [Publish a Copilot Studio agent to a live or demo website](https://learn.microsoft.com/microsoft-copilot-studio/publication-connect-bot-to-web-channels)
- [Accessibility at Microsoft](https://www.microsoft.com/accessibility)

## Expected outcome

The migration is complete when the migrated solution has a Volunteer Engagement 2.0 React SPA site on Enhanced Data Model that:

- Builds locally.
- Deploys successfully to the target Power Pages environment.
- Preserves supported authentication behavior.
- Preserves site-specific customizations in the new SPA model.
- Preserves required web roles and table permissions.
- Passes browser smoke tests.
- Passes WCAG AA-oriented accessibility checks.
- Keeps new text localization-ready.