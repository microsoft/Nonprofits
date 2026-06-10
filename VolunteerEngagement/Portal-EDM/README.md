# Volunteer Engagement Power Pages React SPA

Volunteer Engagement is a React, TypeScript, and Vite single-page application (SPA) deployed to Power Pages with Enhanced Data Model.

## Prerequisites

Review the official Power Pages guidance for creating and deploying SPA code sites: [Create and deploy a single-page application in Power Pages](https://learn.microsoft.com/en-us/power-pages/configure/create-code-sites).

- Power Pages Enhanced Data Model is enabled.
- A Power Pages site on version 9.7.4.x or later.
- A Power Pages environment where you have [admin privileges](https://learn.microsoft.com/en-us/power-pages/getting-started/create-manage#roles-and-permissions).
- [PAC CLI](https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction) version 1.44.x or later installed and authenticated to the desired target environment.
- [JavaScript file uploads](https://learn.microsoft.com/en-us/power-pages/configure/create-code-sites#allow-javascript-file-uploads) are allowed in the target Dataverse environment.
- [Common Data Model for Nonprofits](../../CommonDataModelforNonprofits/README.md) and [Volunteer Management](../../VolunteerManagement/README.md) are installed and configured in the target environment.
- Node.js 24 LTS recommended. The supported engine range is `>=20.18.1 <25`.
- PowerShell 7+ for helper scripts.
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli): required only for `npm run site:restart` and `scripts/site-admin/remove-power-pages-site.ps1`.

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

Builds the project, uploads JS, CSS, and web templates via `pac pages upload-code-site`, and patches table-permission and bot web-role assignments.

For a fresh deployment, run `npm run deploy` after the target environment and prerequisites are ready. The command builds the SPA and uploads the code site by using `powerpages.config.json`. After the first successful deployment, run `npm run sync` to refresh local metadata from the environment.

After the initial deployment, the site can appear in Power Pages under **Inactive sites**. In [Power Pages](https://make.powerpages.microsoft.com/), open the target environment, select **Inactive sites**, select the Volunteer Engagement site, and then select **Reactivate**. For more information, see [Reactivate sites](https://learn.microsoft.com/en-us/power-pages/admin/reactivate-website).

## Validate

Before deploying, run:

```shell
npm run build
npm run lint
npm run test
```

After deployment, validate the Volunteer Engagement flows in a browser:

- Home page loads.
- Opportunity listing, search, and filtering work.
- Engagement details load.
- Anonymous users only see public data.
- Sign in and sign out work for configured providers.
- Authenticated users can apply or register.
- My engagements and profile flows load for the signed-in user.
- Required role-based visibility and table permissions work as expected.

### Power Pages asset caching

Power Pages can continue serving cached web-file assets after `pac pages upload-code-site` reports success. A site restart does not reliably clear browser or CDN cache for JS/CSS assets, and fixed Vite filenames are used here to avoid stale HTML pointing at missing hashed files.

When validating a deployment, do not rely only on a normal page refresh. Use a cache-bypassing request such as `fetch('/assets/index.js', { cache: 'no-store' })` in the browser console to confirm the server has the new asset, or wait for the web-file cache TTL to expire before judging browser-rendered behavior.

## Troubleshooting

- Run `pac auth list` to verify the selected environment.
- Confirm `.powerpages-site/website.yml` points to the intended website record.
- If `/assets/*.js` or `/assets/*.css` returns 404 after upload, verify that the hosted runtime is bound to the same website record and Home root that was uploaded.
- If role-based table permissions or bot visibility are wrong after upload, rerun `npm run permissions:patch-roles` and `npm run permissions:patch-bot-roles`.

## Helper scripts

| Command | Description |
|---------|-------------|
| `npm run permissions:patch-roles` | Assigns web roles to table permissions via Dataverse API |
| `npm run permissions:patch-bot-roles` | Assigns web roles to bot consumers via Dataverse API |
| `npm run site:restart` | Restarts the Power Pages site. Requires [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli); run `az login` first. |
| `npm run sync` | Resolves the configured site in the selected PAC environment and downloads code-site metadata to `.powerpages-site/` |

## Package as a Dataverse solution

After the site is deployed and validated, you can add it to a Dataverse solution for transport across environments. Add the Power Pages site component to an unmanaged solution, then export it as managed for production or unmanaged for further development. For more information, see [Use solutions with Power Pages](https://learn.microsoft.com/en-us/power-pages/configure/power-pages-solutions).

## Additional resources

- [Create and deploy a single-page application in Power Pages](https://learn.microsoft.com/en-us/power-pages/configure/create-code-sites)
- [Power Pages roles and permissions](https://learn.microsoft.com/en-us/power-pages/getting-started/create-manage#roles-and-permissions)
- [Power Apps code apps samples](https://github.com/microsoft/PowerAppsCodeApps)
- [Power Platform CLI `pac pages` commands](https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/pages)
- [Power Pages Enhanced Data Model](https://learn.microsoft.com/en-us/power-pages/admin/enhanced-data-model)
- [Reactivate sites](https://learn.microsoft.com/en-us/power-pages/admin/reactivate-website)
