# Volunteer Engagement Power Pages React SPA

Volunteer Engagement is a React, TypeScript, and Vite single-page application (SPA) deployed to Power Pages with Enhanced Data Model.

## Prerequisites

Review the official Power Pages guidance for creating and deploying SPA code sites: [Create and deploy a single-page application in Power Pages](https://learn.microsoft.com/en-us/power-pages/configure/create-code-sites).

- Power Pages Enhanced Data Model is enabled.
- A Power Pages environment where you have [admin privileges](https://learn.microsoft.com/en-us/power-pages/getting-started/create-manage#roles-and-permissions).
- [PAC CLI](https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction) version 1.44.x or later installed and authenticated to the desired target environment.
- [JavaScript file uploads](https://learn.microsoft.com/en-us/power-pages/configure/create-code-sites#allow-javascript-file-uploads) are allowed in the target Dataverse environment.
- [Common Data Model for Nonprofits](../../CommonDataModelforNonprofits/README.md) and [Volunteer Management](../../VolunteerManagement/README.md) are installed and configured in the target environment.
- Node.js 24 LTS recommended. The supported engine range is `>=20.18.1`.
- PowerShell 7+ for helper scripts.
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) or Az PowerShell signed in to the target tenant: required for `npm run site:restart`, `scripts/site-admin/remove-power-pages-site.ps1`, and the `powerpages-site-agent:*` Dataverse helper scripts.

## Folder structure

```
Portal-EDM/
├── src/                    # React application source
├── dist/                   # Build output (gitignored)
├── .powerpages-site/       # Tracked code-site metadata for upload-code-site
├── scripts/                # PowerShell helper scripts
└── powerpages.config.json  # PAC CLI code-site configuration
```

## Getting started

### 1. Install dependencies

```shell
npm ci
```

### 2. Authenticate with PAC CLI

```shell
pac auth create --environment <environment-url>
```

### 3. Sync code-site metadata when the site already exists

```shell
npm run sync
```

Downloads `.powerpages-site/` metadata from the connected environment. For a fresh deployment, skip this step until after the first successful `npm run deploy`.

## Development

Local Vite development is optional and only supports anonymous/public-flow checks through the `VITE_PORTAL_URL` proxy. Validate authenticated flows on the deployed Power Pages site.

```shell
npm run dev          # Start Vite dev server for anonymous/public-flow checks
npm run build        # TypeScript check + production build
npm run build:dev    # Development build (no minification)
npm run test         # Run Vitest tests
npm run lint         # Run ESLint
npm run lint:fix     # Run ESLint with auto-fix
npm run format       # Format source files with Prettier
npm run format:check # Check formatting without writing
npm run preview      # Preview the production build locally
```

## AI-assisted work

When using Copilot to work on Volunteer Engagement, open `VolunteerEngagement/` as the workspace root so the folder-local `.github` and `.ai` guidance is available for VE tasks.

For current `Portal-EDM` runtime anchors that AI should not infer from legacy context, see [docs/operational-notes.md](docs/operational-notes.md).

Use the AI guidance for these scenarios. The paths below are relative to `VolunteerEngagement/`.

Develop or customize the React SPA in `Portal-EDM`:

- `.ai/instructions/spa-development.md`
- `.ai/instructions/localization-accessibility.md`
- `.ai/instructions/deployment-validation.md`

Migrate an existing Volunteer Engagement Power Pages site to Volunteer Engagement 2.0:

- `.ai/instructions/README.md`
- `.ai/instructions/legacy-to-spa-migration.md`
- `.ai/instructions/customization-migration.md`
- `.ai/instructions/deployment-validation.md`

The migration workflow treats `Portal-EDM` as the target baseline and uses the exported legacy site to identify custom pages, Liquid, web files, snippets, table permissions, web roles, authentication settings, bot setup, and other site-connected customizations that need review.

## Deployment

### `npm run deploy`: Daily development deployment

```shell
npm run deploy
```

Builds the project, uploads JS, CSS, and web templates via `pac pages upload-code-site` (configured by `powerpages.config.json`), and patches table-permission web-role assignments. Site agent role patching is a separate, deliberate step described in [Power Pages site agent](#power-pages-site-agent).

For a fresh deployment, run `npm run deploy` once the target environment and prerequisites are ready.

After the initial deployment, the site can appear in Power Pages under **Inactive sites** and does not have an assigned, usable URL until it is reactivated. In [Power Pages](https://make.powerpages.microsoft.com/), open the target environment, select **Inactive sites**, select the Volunteer Engagement site, and then select **Reactivate**. Do not run `npm run site:restart`, rely on PAC/API portal URLs, or start browser validation until reactivation is complete. For more information, see [Reactivate sites](https://learn.microsoft.com/en-us/power-pages/admin/reactivate-website).

After reactivation, run `npm run sync` to refresh local metadata from the environment, then run `npm run site:restart` and validate the site in a browser.

## Validate

Before deploying, run:

```shell
npm run build
npm run lint
npm run test
pwsh -NoProfile -File ./scripts/localization/check-strings.ps1
```

After deployment and reactivation, validate the Volunteer Engagement flows in a browser:

- Home page loads.
- Opportunity listing, search, and filtering work.
- Engagement details load.
- Anonymous users only see public data.
- Sign in and sign out work for configured providers.
- Authenticated users can apply or register.
- My engagements and profile flows load for the signed-in user.
- Required role-based visibility and table permissions work as expected.

If the first browser session shows unauthorized or access denied after deployment, validate with a fresh session by using an InPrivate/incognito window or signing out and back in. If the issue persists, recheck table-permission role patching and target-site metadata.

For localized sites, confirm the deployed page contains `#ve-bootstrap-data` and that `window.__VE_LOCALE`, `window.__VE_LANGUAGES`, and `window.__VE_STRINGS` are populated for the active language. Metadata-only snippet checks are not enough to prove the runtime is localized.

### Power Pages asset caching

Power Pages can continue serving cached web-file assets after `pac pages upload-code-site` reports success. A site restart does not reliably clear browser or CDN cache for JS/CSS assets, and fixed Vite filenames are used here to avoid stale HTML pointing at missing hashed files.

When validating a deployment, do not rely only on a normal page refresh. Use a cache-bypassing request such as `fetch('/assets/index.js', { cache: 'no-store' })` in the browser console to confirm the server has the new asset, or wait for the web-file cache TTL to expire before judging browser-rendered behavior.

## Localization

The SPA ships in English and is localization-ready. Translatable strings live in `src/i18n/fallback.ts` and are served at runtime from Power Pages content snippets. Scripts in `scripts/localization/` manage the workflow:

| Script | Purpose |
|--------|---------|
| `generate-snippets.ps1` | Generates content-snippet metadata for every `fallback.ts` key. Adds a single key with `-Key` and `-Value`. |
| `add-language.ps1` | Clones the English snippets and content pages for a new language code. |
| `sync-strings.ps1` | Regenerates `fallback.ts` from the English content snippets to keep the dev fallback aligned with Dataverse. |
| `check-strings.ps1` | Validates string coverage, snippet metadata, and the runtime bootstrap template. |

Run a script with PowerShell 7+, for example:

```shell
pwsh -NoProfile -File ./scripts/localization/add-language.ps1 -LanguageCode fr-FR
```

Enable the target language in Power Pages Admin before you generate or upload localized metadata. For detailed guidance, see [.ai/instructions/localization-accessibility.md](../.ai/instructions/localization-accessibility.md).

## Troubleshooting

- Run `pac auth list` to verify the selected environment.
- Confirm `.powerpages-site/website.yml` points to the intended website record.
- If `/assets/*.js` or `/assets/*.css` returns 404 after upload, verify that the hosted runtime is bound to the same website record and Home root that was uploaded.
- If role-based table permissions are wrong after upload, rerun `npm run permissions:patch-roles`.
- If users see unauthorized or access denied after deployment, validate with a fresh session and then recheck role patching if it persists.
- If the Power Pages site agent is missing web roles, rerun `npm run powerpages-site-agent:patch-roles`.

## Helper scripts

| Command | Description |
|---------|-------------|
| `npm run permissions:patch-roles` | Assigns web roles to table permissions via Dataverse API |
| `npm run powerpages-site-agent:patch-roles` | Assigns web roles to the Power Pages site agent Bot Consumer via Dataverse API |
| `npm run powerpages-site-agent:customize-ve-vm` | Adds Portal-EDM VE/VM Dataverse knowledge sources to the Power Pages site agent |
| `npm run powerpages-site-agent:configure-advanced` | Applies JSON-defined Copilot Studio Overview instructions and Knowledge Source components to the Power Pages site agent |
| `npm run site:restart` | Restarts the Power Pages site. Requires [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli); run `az login` first. |
| `npm run sync` | After reactivation, resolves the configured site in the selected PAC environment and downloads code-site metadata to `.powerpages-site/` |

## Power Pages site agent

The portal can include a Power Pages site agent (a Copilot Studio agent). The agent is auto-provisioned asynchronously after the first deployment; wait for provisioning to finish before running these helpers. Site agent configuration is a deliberate, post-provisioning step and is not part of `npm run deploy`.

Before running the configuration helpers for a newly provisioned site, open **Set up > Agents** in Power Pages, confirm **Site agent** and **Show in Chat Widget** are enabled, then save the agent once. This creates the bot consumer metadata that the helper scripts configure. The helper scripts publish the agent automatically after they apply changes; pass `-SkipPublish` only when you deliberately want to defer publishing.

For detailed setup and security guidance, see [.ai/instructions/site-agent-setup.md](../.ai/instructions/site-agent-setup.md).

### Assign site agent web roles

```shell
npm run powerpages-site-agent:patch-roles
```

Assigns web roles to the site agent's Enhanced Data Model Bot Consumer component. By default it assigns `Anonymous Users` and `Authenticated Users`. The defaults apply only when neither `-RoleNames` nor `-RoleIds` is supplied. To choose roles explicitly, run the script directly:

```shell
pwsh -NoProfile -File ./scripts/permissions/patch-site-agent-roles.ps1 -RoleNames "Authenticated Users"
```

If the site agent enablement setting is missing, add `-EnsureSiteAgentEnabled`.

### Add VE/VM knowledge sources

```shell
npm run powerpages-site-agent:customize-ve-vm
```

Targets Enhanced Data Model sites only. Creates or updates a site-specific `dvtablesearch` knowledge source, adds the Portal-EDM tables used by the volunteer experience, links the source to the EDM `powerpagesite` row and the site agent default GPT component, and publishes the agent when changes are applied.

The default `Public` profile includes only public browsing data. For an authenticated-only portal agent, use the broader profile:

```shell
pwsh -NoProfile -File ./scripts/site-agent/customize-ve-vm-site-agent.ps1 -Profile VolunteerPortal
```

The script blocks non-public knowledge sources while the Bot Consumer is assigned to `Anonymous Users`. Remove the anonymous role before using `-Profile VolunteerPortal`. For staff-only deployments that should also use the Volunteer Management model-app search source, add `-IncludeVolunteerManagementModelAppSearch` after confirming web roles and table permissions.

### Apply advanced Copilot Studio configuration

```shell
npm run powerpages-site-agent:configure-advanced
```

Reads `scripts/site-agent/site-agent-advanced.config.json` and writes the configured text to the default GPT component's Overview `instructions` field. It can also create or update Copilot Studio Knowledge Source components, such as the default public portal-page search source.

The `instructions` and `knowledge` arrays are prompt guidance, not Dataverse `dvtablesearch` sources; use `powerpages-site-agent:customize-ve-vm` for table-backed knowledge sources. Use `-ConfigPath` to apply a different configuration file, `-RemoveInstructions` to clear the Overview `instructions` field while leaving other metadata in place, `-SkipPublish` to defer publishing, or `-ForcePublish` to publish even when no metadata changed. If the site URL cannot be resolved from Power Pages metadata or the Admin API, pass `-WebsiteUrl`.

## Package as a Dataverse solution

After the site is deployed and validated, you can add it to a Dataverse solution for transport across environments. Add the Power Pages site component to an unmanaged solution, then export it as managed for production or unmanaged for further development. For more information, see [Use solutions with Power Pages](https://learn.microsoft.com/en-us/power-pages/configure/power-pages-solutions).

## Additional resources

- [Create and deploy a single-page application in Power Pages](https://learn.microsoft.com/en-us/power-pages/configure/create-code-sites)
- [Power Pages roles and permissions](https://learn.microsoft.com/en-us/power-pages/getting-started/create-manage#roles-and-permissions)
- [Power Apps code apps samples](https://github.com/microsoft/PowerAppsCodeApps)
- [Power Platform CLI `pac pages` commands](https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/pages)
- [Power Pages Enhanced Data Model](https://learn.microsoft.com/en-us/power-pages/admin/enhanced-data-model)
- [Reactivate sites](https://learn.microsoft.com/en-us/power-pages/admin/reactivate-website)
