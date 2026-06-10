# Deployment and validation instructions

Use these instructions before declaring a migration complete.

## Deployment model

The new Volunteer Engagement site is deployed from `Portal-EDM` using the existing npm and PAC CLI flow.

The deployment can target an environment where the site already exists. It can also start from local site metadata when the site is not listed yet, but if the platform rejects the upload because the site must be provisioned/imported first, create or import the site, run `npm run sync`, and retry.

## Environment selection

From `Portal-EDM`:

```shell
pac auth list
pac auth select --index <index>
npm run sync
```

Confirm the selected environment is the intended target before deployment.

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

Do not proceed to deployment with known build, lint, or test failures unless the user explicitly accepts the risk.

## Deploy

Run:

```shell
npm run deploy
```

This builds the SPA, uploads code-site assets and templates, runs table permission role patching, and runs bot consumer role patching.

After an initial deployment, the site can appear in Power Pages under **Inactive sites**. Reactivate the site in the target environment before browser validation. See [Reactivate sites](https://learn.microsoft.com/en-us/power-pages/admin/reactivate-website).

## Cache-aware validation

Power Pages can serve cached assets after upload. Do not rely only on normal refresh.

Use cache-bypassing checks in the browser console:

```javascript
fetch('/assets/index.js', { cache: 'no-store' })
fetch('/assets/index.css', { cache: 'no-store' })
```

Confirm the returned assets contain the expected build output before judging browser behavior.

## EDM website binding check

If `pac pages upload-code-site` succeeds but `/assets/index.js` or `/assets/index.css` returns 404, do not assume the Vite build is wrong. Verify that the hosted Power Pages runtime is bound to the same website record and Home root that was uploaded.

A common failed state is an existing Blank Page runtime still serving its original Home page while the upload creates a second `Portal-EDM` Home tree. Resolve the website binding or root-page metadata before treating this as a React, Vite, or asset packaging issue.

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
- Bot loads for intended roles if in scope.
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