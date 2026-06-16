# Legacy-to-SPA migration instructions

Use this workflow when migrating an existing legacy Volunteer Engagement site and its site-connected customizations to the Volunteer Engagement 2.0 React SPA on Enhanced Data Model.

## Goal

Produce a new site that is similar in behavior and quality to `Portal-EDM`, with supported site customizations migrated from the legacy implementation.

## Baseline-first rule

Use `Portal-EDM` as the product baseline. Do not recreate the full legacy Volunteer Engagement portal in React. Compare the downloaded legacy export to the SPA baseline, identify the delta, and migrate only approved customizations, required configuration, and validation tasks.

For an uncustomized legacy Volunteer Engagement site, the expected output is mostly a classification report and cutover validation plan. The assistant should not recommend porting all legacy Liquid templates into React.

## Inputs

Ask the user to identify or confirm:

- The legacy site export folder produced from the existing Power Pages site.
- The target SPA source. Default to `Portal-EDM`.
- The customization source locations, if they differ from the legacy source tree.
- The target Power Pages environment URL.
- Whether the target site already exists in the environment.
- Authentication providers used by the existing site.
- Any custom Dataverse tables, web roles, table permissions, pages, templates, snippets, web files, or scripts that the site owner expects to preserve.

### Prepare the legacy site export

Before discovery, download the existing Power Pages site into a local source folder. This exported folder is the legacy source of truth for migration.

```shell
pac auth list
pac auth select --index <index>
pac pages list
pac pages download-code-site --path <legacy-site-export> --webSiteId <legacy-site-id> --overwrite
```

Use the downloaded folder for AI analysis. Do not rely on Microsoft internal legacy portal folders as the source.

If there are additional customizations outside the downloaded site folder, ask for those files or repositories and treat them as separate source inputs.

Store raw exports under `.migration-work/<site-name-or-id>/legacy-export/` when working inside the Volunteer Engagement solution. Keep that raw export unchanged. Use `.migration-work/<site-name-or-id>/working-copy/` only for scratch experiments. Final migration changes must go into `Portal-EDM/` or other tracked source folders, not into `.migration-work/`.

## Migration phases

### 1. Discover

Inventory the legacy portal and site customizations:

- Downloaded code-site metadata and folder structure.
- Web pages and routes.
- Web templates and Liquid logic.
- Content snippets and user-facing text.
- Web files, images, CSS, and JavaScript.
- Web roles and table permissions.
- Basic forms and form metadata.
- Bot consumers.
- Authentication configuration and sign-in-related pages.
- Custom Dataverse tables or columns referenced by the site.
- Localized variants or language-specific exported content, if the source site has multiple languages.
- Site settings, but only for classification. Do not migrate them by default.

Compare the legacy export with the new SPA implementation in `Portal-EDM` and identify what is already covered by the product.

### 2. Classify

Classify every discovered item as one of:

| Classification | Meaning | Default action |
| --- | --- | --- |
| Product baseline | Already exists in the new SPA | Do not duplicate |
| Site customization | Site-specific behavior or UI that should continue | Migrate to SPA or EDM metadata |
| Obsolete legacy implementation | Replaced by React SPA, Power Pages EDM, or product behavior | Do not migrate |
| Security-sensitive | Authentication, web roles, table permissions, Web API fields, anonymous access | Require explicit review |
| Environment-specific | URLs, identity provider secrets, site settings, tenant-specific values | Reconfigure, do not copy blindly |
| Unknown | Cannot be safely classified | Ask user or create a review item |

### 3. Map

Map legacy artifacts to SPA/EDM destinations:

| Legacy artifact | Preferred target |
| --- | --- |
| User-facing Liquid page behavior | React page or component under `Portal-EDM/src/pages` or `Portal-EDM/src/components` |
| Shared Liquid fragment | React component, hook, or service |
| Legacy JavaScript | Typed React/TypeScript logic, service layer, or hook |
| Legacy CSS | Fluent UI v9 `makeStyles` and SPA design tokens |
| Content snippet text | SPA localization-ready string source or existing content snippet pattern |
| Web files/images | `Portal-EDM/public`, `Portal-EDM/src/assets`, or `.powerpages-site/web-files`, matching existing patterns |
| Table permission | `.powerpages-site/table-permissions` plus role patch validation |
| Web role | `.powerpages-site/web-roles` and Dataverse web role association |
| Bot consumer / site agent | `.powerpages-site/bot-consumers`; assign roles with `npm run powerpages-site-agent:patch-roles` and configure with the `site-agent/` scripts |
| Basic form | SPA page/component or Power Pages form only when server-rendered authentication or profile behavior requires it |
| Site setting | Do not migrate by default. Classify and ask for approval. |

### 4. Implement

Work in small, reviewable slices:

1. Migrate one route or feature at a time.
2. Build the React component structure before moving business logic.
3. Convert ad hoc JavaScript to typed services/hooks.
4. Add required table permission and Web API field changes only when the feature needs them.
5. Keep user-facing text localization-ready.
6. Validate accessibility while building, not only at the end.

Do not carry forward legacy Liquid or Bootstrap patterns when the SPA already has a React/Fluent equivalent.

### 5. Validate

Run local validation from `Portal-EDM`:

```shell
npm run build
npm run lint
npm run test
```

Use browser validation for migrated flows. At minimum check:

- Home page.
- Opportunity listing/search/filtering.
- Engagement details.
- Apply/register flow.
- My engagements.
- Profile-related flows.
- Sign in and sign out.
- Any custom route or component.

### 6. Deploy

Use the target Power Pages environment selected by PAC CLI:

```shell
pac auth list
pac auth select --index <index>
npm run sync
npm run deploy
```

The current `npm run deploy` flow builds the SPA, uploads the code site, and patches table permission role arrays. If the target site is not listed yet, the local site metadata is used as the intended target. If the platform rejects upload because provisioning/import is required first, provision or import the site, run `npm run sync`, then retry deployment.

### 7. Complete

The migration is done only when:

- Local build, lint, and tests pass.
- Deployment succeeds.
- Required table permissions and web roles are assigned.
- Authentication works for supported providers.
- Site customizations are present in the new SPA.
- Browser smoke tests pass.
- Accessibility checks pass.
- No unapproved site settings were migrated.

## Non-goals

- Do not migrate legacy site settings by default.
- Do not assume every authentication provider can be copied from the old site.
- Do not preserve legacy implementation details that are replaced by the SPA architecture.
- Do not use the old managed-solution portal migration paths as the migration workflow.