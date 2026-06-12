# Migration Checklist

Use this checklist to move a legacy Volunteer Engagement site to Volunteer Engagement 2.0. The detailed AI-assisted guidance is in `.ai/instructions/` and `.github/`. Open `VolunteerEngagement/` as the workspace root so this guidance is available.

## Prepare

- [ ] Keep the existing Volunteer Engagement site available as the migration source.
- [ ] Export the legacy site for comparison.
- [ ] Confirm the target environment meets the [Deployment Checklist](deployment-checklist.md) prerequisites.

## Classify customizations

- [ ] Compare the legacy export with the `Portal-EDM` React SPA baseline.
- [ ] Identify custom pages, Liquid, web files, snippets, table permissions, web roles, authentication settings, and bot setup.
- [ ] Decide which site-specific changes to keep, change, or drop.

See `.ai/instructions/legacy-to-spa-migration.md` and `.ai/instructions/customization-migration.md`.

## Move and validate

- [ ] Move approved changes into `Portal-EDM`.
- [ ] Migrate authentication and site agent configuration as needed. See `.ai/instructions/authentication-migration.md` and `.ai/instructions/site-agent-setup.md`.
- [ ] Deploy and validate using the [Deployment Checklist](deployment-checklist.md) and [Security and Permissions Checklist](security-and-permissions.md).
- [ ] Keep the legacy site until Volunteer Engagement 2.0 is validated.
