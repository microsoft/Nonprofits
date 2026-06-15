# Portal-EDM Scripts

- `localization/`: content snippet generation, language setup, and i18n validation.
- `permissions/`: table permission export, table permission role patching, and Power Pages site agent role patching helpers.
- `site-agent/`: Power Pages site agent setup and VE/VM knowledge-source customization helpers.
- `shared/`: shared script helpers, including PAC environment and site ID resolution.
- `site-admin/`: Power Pages site operations such as restart and removal.

Scripts resolve the Power Pages website record ID from the selected PAC environment. When `../.powerpages-site/website.yml` has an `id`, scripts validate that ID against the selected environment before using it; the site name may differ if it was renamed in Power Pages. If that local ID is stale but the selected environment has exactly one site with the configured name, scripts use that single match and ask you to sync afterward. If local site metadata is missing, `../powerpages.config.json` supplies the fallback site name. Script parameters can still override the resolved site ID for one-off runs, but explicit IDs are also validated against the selected environment.

If the selected environment does not list the local website ID and site-name matching is ambiguous or missing, scripts stop instead of using committed metadata from another environment. For a fresh code-site deployment, run `npm run deploy` first, reactivate the site in Power Pages, then run `npm run sync` so `../.powerpages-site/website.yml` reflects the target environment.

Do not run `npm run site:restart` before a fresh deployment has been reactivated. PAC CLI and the Power Platform API can list portal host records or stale URLs before the newly installed site has an assigned, usable URL.

Package scripts in `package.json` call these helpers:

- `npm run sync` -> `site-admin/sync-power-pages-site.ps1`
- `npm run permissions:patch-roles` -> `permissions/patch-table-permission-roles.ps1`
- `npm run powerpages-site-agent:patch-roles` -> `permissions/patch-site-agent-roles.ps1`
- `npm run powerpages-site-agent:customize-ve-vm` -> `site-agent/customize-ve-vm-site-agent.ps1`
- `npm run powerpages-site-agent:configure-advanced` -> `site-agent/configure-site-agent-advanced.ps1`
- `npm run site:restart` -> `site-admin/restart-power-pages-site.ps1`

`npm run deploy` builds the SPA, uploads the Power Pages code site, and then runs the table-permission role patch helper. Power Pages site agent role patching is a separate, deliberate step.