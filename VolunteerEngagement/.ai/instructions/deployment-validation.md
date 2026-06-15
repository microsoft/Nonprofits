# Deployment and validation instructions

Use these instructions before declaring a migration complete.

**Always check `Portal-EDM/README.md` and `scripts/` for existing npm scripts and helper scripts before constructing manual CLI or API calls.** The project provides scripts for deployment, syncing, permission patching, site restart, and site removal. Use them.

**Be proactive.** Guide the user through the full provisioning or migration flow step by step. After each step completes, immediately suggest and proceed to the next one without waiting to be asked. The typical fresh-install flow is: environment selection → unblock JS uploads → install dependencies → build/lint/test → deploy → reactivate site (user action) → restart site → get site URL → validate in browser → (when a Power Pages site agent is in scope and provisioned) assign site agent web roles → add VE/VM knowledge sources → apply advanced agent configuration. Surface blockers early, resolve them, and keep the flow moving.

Site agent role patching and configuration are separate, deliberate steps, not part of `npm run deploy`. After the site is live and the agent has finished provisioning, proactively suggest them in order and run each only after the user confirms. See `site-agent-setup.md`.

## Deployment model

The new Volunteer Engagement site is deployed from `Portal-EDM` using the existing npm and PAC CLI flow.

The deployment can target an environment where the site already exists. It can also start as a fresh install when no Power Pages website records exist yet. In that case, do not run `npm run sync` or resolver-based helper scripts before the first `npm run deploy`; let `pac pages upload-code-site` create the code-site website record from the local metadata first.

After the site exists, all post-deploy helper scripts must resolve the target by website record ID, not display name. This matters when a legacy Volunteer Engagement site and the new Enhanced/code-site deployment have the same name. If the platform rejects upload because the site must be provisioned/imported first, create or import the site, run `npm run sync` from the intended website record ID, and retry.

## Environment selection

**Always ask the user which environment to target before running any `pac` commands or deployment scripts.** Do not assume the currently active environment is correct.

From `Portal-EDM`:

```shell
pac auth list
pac auth select --index <index>
```

Confirm the selected environment is the intended target before deployment. For an existing Portal-EDM site, run `npm run sync` after selecting the environment to refresh local metadata. For a fresh install into an environment with no site records yet, skip sync until after the first deploy and manual reactivation.

## Unblock JavaScript file uploads

Power Pages code sites require `.js` file uploads, but Dataverse blocks `.js` by default in the `blockedattachments` organization setting. Before the first deployment to a new environment, remove `js` from the blocked list:

```shell
pac org update-settings --name blockedattachments
```

Without this step, `pac pages upload-code-site` fails with `PortalFileContentUploadFailed` for `.js` web files. See [Allow JavaScript file uploads](https://learn.microsoft.com/en-us/power-pages/configure/create-code-sites#allow-javascript-file-uploads).

## Local validation

Run:

```shell
npm run build
npm run lint
npm run test
```

If the change includes tests that require test type checking, also run:

```shell
npm run test:typecheck
```

For localization or Power Pages template changes, also run:

```shell
pwsh -NoProfile -File ./scripts/localization/check-strings.ps1
```

This validates SPA string coverage, content snippet metadata, the `MSVE_Home` runtime bootstrap template, and duplicate SPA shell markup in content page copies.

Do not proceed to deployment with known build, lint, or test failures unless the user explicitly accepts the risk.

## Deploy

Run:

```shell
npm run deploy
```

This builds the SPA, uploads code-site assets and templates, and runs table permission role patching. Power Pages site agent role patching and advanced configuration are separate, deliberate steps, not part of `npm run deploy`. After the site is live and the agent has finished provisioning, proactively suggest running them in order; see `site-agent-setup.md`.

After an initial deployment, the site appears in Power Pages under **Inactive sites** and has no working URL until reactivated. Reactivation is a manual step — it must be done by the user in [Power Pages](https://make.powerpages.microsoft.com/): select the environment, open **Inactive sites**, select the site, and click **Reactivate**. There is no PAC CLI or API command to reactivate a site.

Do not run `npm run site:restart`, query a runtime URL, or start browser validation before the user confirms that the newly deployed site was reactivated in Power Pages. PAC CLI and the Power Platform API can return portal host records, `StateConfigured`, `Is Site Active: Yes`, or old/stale URLs for the Dataverse website record before the fresh install has an assigned, usable URL. Those values are not proof that the installed site is reactivated or serving content.

AI agents cannot reactivate a site. Ask the user to do it and wait for confirmation before proceeding to restart, site URL lookup, or browser validation.

## Restarting the site

Use `npm run site:restart` to restart the site only after the site has been reactivated in Power Pages. The script resolves the correct Power Platform site ID from the website record ID in `.powerpages-site/website.yml` and validates that the website record exists in the selected PAC environment — do not look up or hard-code Power Platform site IDs manually. Multiple Power Platform site instances can be bound to the same Dataverse website record; the restart script handles this. Requires Azure CLI (`az login`) authenticated to the same tenant as the environment.

The restart script prints the site URL (e.g. `https://site-xyz.powerappsportals.com`). After a deploy or restart, always surface this URL to the user so they can navigate to it.

## Getting the site URL

After reactivation, the environment ID is available from `pac env who` and the website record ID is in `.powerpages-site/website.yml` after syncing from the target environment. Use these to query the Power Platform API for the site URL:

```
GET https://api.powerplatform.com/powerpages/environments/{envId}/websites?api-version=2024-10-01
```

Filter the response by `websiteRecordId`, sort by `createdOn` descending (newest first), and take `websiteUrl` from the first match. Only use this after reactivation has been confirmed; host records can exist before the installed site has a usable URL.

## Cache-aware validation

Power Pages can serve cached assets after upload. Do not rely only on normal refresh.

Use cache-bypassing checks in the browser console:

```javascript
fetch('/assets/index.js', { cache: 'no-store' })
fetch('/assets/index.css', { cache: 'no-store' })
```

Confirm the returned assets contain the expected build output before judging browser behavior.

## First-visit authorization state

After the first deployment, reactivation, metadata sync, table-permission role patching, and restart, an existing browser session can still show an unauthorized or access-denied state. Treat this as a Power Pages authorization/cache timing behavior before assuming the metadata is wrong. Validate with a fresh session: use an InPrivate/incognito window, or sign out and back in, so Power Pages reevaluates the current user and web roles. If the fresh session still fails, recheck the table-permission role patch output, target website record ID, and web role metadata.

## EDM website binding check

If `pac pages upload-code-site` succeeds but `/assets/index.js` or `/assets/index.css` returns 404, do not assume the Vite build is wrong. Verify that the hosted Power Pages runtime is bound to the same website record and Home root that was uploaded.

A common failed state is an existing Blank Page runtime still serving its original Home page while the upload creates a second `Portal-EDM` Home tree. Resolve the website binding or root-page metadata before treating this as a React, Vite, or asset packaging issue.

## Localization runtime bootstrap check

After adding a language or syncing site metadata, validate the deployed localized URL in the browser. A successful sync, language metadata clone, deploy, and restart can still leave the SPA running with fallback strings if the active page template does not emit the bootstrap element expected by `src/bootstrap/portalBootstrap.ts`.

Check the page console:

```javascript
document.querySelector('#ve-bootstrap-data') !== null
window.__VE_LOCALE
window.__VE_LANGUAGES
window.__VE_STRINGS
```

For a localized URL such as `/cs-CZ/`, `window.__VE_LOCALE` should match the active language and `window.__VE_STRINGS` should contain `MSVE_SPA/*` keys from Power Pages content snippets.

## Browser smoke tests

Validate at minimum:

- Home page loads.
- Header, navigation, and footer work.
- Opportunity listing loads real data.
- Search, filtering, and sorting work.
- Engagement details load.
- Anonymous users only see public data.
- Sign in works for supported providers.
- Authenticated users can apply/register.
- My engagements loads the signed-in user's data.
- Profile-related pages or flows work.
- Custom pages and components work.
- Site agent loads for intended roles if in scope.
- Sign out works.

## Accessibility smoke tests

Validate:

- Keyboard-only navigation for all changed workflows.
- Visible focus order.
- Labels for forms and icon buttons.
- Contrast for changed UI.
- Mobile responsive layout.
- No overlapping or clipped text.
- Dialog and menu focus behavior.

## Security smoke tests

Validate:

- Table permissions are patched after upload.
- Anonymous users cannot access authenticated data.
- Authenticated users cannot access another contact's private data.
- Web API exposed fields are limited to required columns.
- Custom roles do not unintentionally expand access.
- No unapproved site settings were migrated.

## Final definition of done

The migration is done when:

- Local build passes.
- Lint passes.
- Tests pass.
- Deployment succeeds.
- Table permissions and web roles are correct.
- Authentication is preserved for supported providers.
- Site customizations are preserved in the SPA.
- Browser smoke tests pass.
- WCAG AA-oriented checks pass.
- The site remains localization-ready.
- Any limitations or unverified authentication providers are documented.