# Portal-EDM Scripts

- `localization/`: content snippet generation, language setup, and i18n validation.
- `permissions/`: table permission export and deployment role patching helpers.
- `shared/`: shared script helpers, including PAC environment and site ID resolution.
- `site-admin/`: Power Pages site operations such as restart and removal.

Scripts resolve the Power Pages website record ID from the selected PAC environment. When `../.powerpages-site/website.yml` has an `id`, that ID is the stable target; the site name may differ if it was renamed in Power Pages. If local site metadata is missing, `../powerpages.config.json` supplies the fallback site name. Script parameters can still override the resolved site ID for one-off runs.

If the selected environment does not list the local website ID yet, scripts continue with the ID from `../.powerpages-site/website.yml` so first deploy/import flows can proceed. They do not switch to another same-name site automatically.

Package scripts in `package.json` call the deployment-safe helpers directly:

- `npm run sync` -> `site-admin/sync-power-pages-site.ps1`
- `npm run permissions:patch-roles` -> `permissions/patch-table-permission-roles.ps1`
- `npm run site:restart` -> `site-admin/restart-power-pages-site.ps1`