# Migration Checklist

Use this checklist to move a legacy Volunteer Engagement site to Volunteer Engagement 2.0. The validated migration path in this repository is AI-assisted. Detailed guidance is in `.ai/instructions/` and `.github/`. Open `VolunteerEngagement/` as the workspace root so this guidance is available.

If you migrate without AI assistance, use this checklist as a planning aid and validate every customization, security setting, authentication provider, and table permission manually before cutover.

## Choose the migration scope

- [ ] Confirm whether the legacy site is uncustomized or has site-specific customizations.
- [ ] Use `Portal-EDM` as the target baseline. Do not rebuild the full legacy portal in React.
- [ ] For an uncustomized legacy site, produce a classification and validation report instead of moving legacy Liquid, JavaScript, or CSS into the SPA.
- [ ] For a customized legacy site, migrate only approved customizations that are still needed on Volunteer Engagement 2.0.

## Prepare

- [ ] Keep the existing Volunteer Engagement site available as the migration source.
- [ ] Export the legacy site for comparison by using the Power Platform CLI command that matches the source site's data model.
- [ ] Confirm the target environment meets the [Deployment Checklist](deployment-checklist.md) prerequisites.

## Classify customizations

- [ ] Compare the legacy export with the `Portal-EDM` React SPA baseline.
- [ ] Identify custom pages, Liquid, web files, snippets, table permissions, web roles, authentication settings, and bot setup.
- [ ] Decide which site-specific changes to keep, change, or drop.
- [ ] Treat site settings, authentication providers, anonymous access, Web API fields, table permissions, web roles, bot visibility, and third-party scripts as security-sensitive review items.

See `.ai/instructions/legacy-to-spa-migration.md` and `.ai/instructions/customization-migration.md`.

## Move and validate

- [ ] Move approved changes into `Portal-EDM`.
- [ ] Migrate authentication and site agent configuration as needed. See `.ai/instructions/authentication-migration.md` and `.ai/instructions/site-agent-setup.md`.
- [ ] Deploy and validate using the [Deployment Checklist](deployment-checklist.md) and [Security and Permissions Checklist](security-and-permissions.md).
- [ ] Keep the legacy site until Volunteer Engagement 2.0 is validated.
