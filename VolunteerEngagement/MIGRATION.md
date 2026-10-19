# Migrate to Volunteer Engagement 2.0

This guide explains how to move an existing Volunteer Engagement Power Pages site to Volunteer Engagement 2.0, a React single-page application (SPA) deployed as a Power Pages code site on the Enhanced Data Model.

The migration creates a new Volunteer Engagement site. It does not upgrade the legacy site in place. Keep the legacy site available while you deploy, configure, and validate the new site.

## Why a migration is needed

Volunteer Engagement 2.0 replaces the legacy Liquid-based portal experience with the `Portal-EDM` React SPA. The new and legacy sites can coexist during migration because they have separate Power Pages website records.

Volunteer Engagement records remain in the shared Dataverse tables provided by Common Data Model for Nonprofits and Volunteer Management. The migration normally does not copy that business data. Site-specific pages, code, content, security metadata, authentication configuration, and other customizations must be reviewed and either reimplemented, reconfigured, or retired.

Do not copy the entire legacy portal into the new site. Volunteer Engagement 2.0 is the product baseline; migrate only approved customizations and configuration that the new experience does not already provide.

## Before you start

- Take a backup of the environment and preserve an unchanged export of the legacy site.
- Confirm that you have Power Pages and Dataverse administrator access in the target environment.
- Confirm that the target environment meets the [Deployment Checklist](docs/deployment-checklist.md) prerequisites.
- Install and configure [Common Data Model for Nonprofits](../CommonDataModelforNonprofits/README.md) and [Volunteer Management](../VolunteerManagement/README.md) in the target environment.
- Identify the legacy site's authentication providers, custom pages, scripts, styles, content, web roles, table permissions, site settings, languages, and site agent or bot configuration.
- Plan a test period, cutover window, and rollback decision point. Do not remove the legacy site before the new site is accepted.

## Migration overview

1. Export and inventory the legacy site.
2. Classify the differences between the legacy site and Volunteer Engagement 2.0.
3. Implement only approved customizations in the new SPA and code-site metadata.
4. Build, test, and deploy the new site alongside the legacy site.
5. Configure security, authentication, languages, and optional site agent features.
6. Validate the new site, cut over users, and retain the legacy site for rollback until acceptance is complete.

The repository provides an AI-assisted workflow for discovering and classifying legacy customizations. The migration can also be performed manually, but every customization and security-sensitive setting must still be reviewed. See the [Migration Checklist](docs/migration-checklist.md) for the detailed work list.

## Step-by-step

### 1. Export the legacy site

Authenticate to the environment that contains the existing site and download an unchanged source export:

```shell
pac auth list
pac auth select --index <index>
pac pages list
pac pages download-code-site --path <legacy-site-export> --webSiteId <legacy-site-id> --overwrite
```

Keep this export as the migration source of truth. Store any custom code or configuration maintained outside Power Pages with the export, but do not include secrets in migration files or source control.

### 2. Classify the legacy site

Compare the export with `VolunteerEngagement/Portal-EDM`. Classify each difference as:

| Classification | Action |
| --- | --- |
| Already provided by Volunteer Engagement 2.0 | Do not duplicate it |
| Required site customization | Reimplement it in the React SPA or Enhanced Data Model metadata |
| Obsolete legacy implementation | Retire it |
| Security-sensitive configuration | Review and approve it explicitly |
| Environment-specific configuration | Reconfigure it for the new site |
| Unknown | Resolve it before cutover |

For an uncustomized site, this phase should produce a short validation and cutover plan rather than a large code migration. Legacy Liquid templates, Bootstrap code, JavaScript, and CSS that implement standard product behavior should not be carried forward.

For AI-assisted classification, open `VolunteerEngagement/` as the VS Code workspace root and follow the instructions in [.ai/instructions/README.md](.ai/instructions/README.md).

### 3. Migrate approved customizations

Apply approved changes to the `Portal-EDM` baseline:

- Implement custom pages and behavior as React and TypeScript components.
- Move user-facing text into the existing localization pattern.
- Add only the Dataverse Web API fields, table permissions, and web roles required by the customization.
- Reconfigure authentication providers for the new site. Do not copy authentication settings, secrets, redirect URLs, or tenant-specific values blindly.
- Review site settings individually. Do not bulk-copy them from the legacy site.
- Reconfigure optional Power Pages site agent or bot features after the new site is provisioned.
- Validate migrated UI against WCAG AA accessibility expectations.

See [Security and Permissions Checklist](docs/security-and-permissions.md) for the required security review.

### 4. Build and deploy Volunteer Engagement 2.0

Follow the [Deployment Checklist](docs/deployment-checklist.md) to build, test, deploy, reactivate, synchronize, and restart the new site. Run its commands from `VolunteerEngagement/Portal-EDM/`.

The deployment creates the new code site and applies baseline table-permission role assignments. Authentication providers and the optional Power Pages site agent require separate configuration. See [Portal-EDM/README.md](Portal-EDM/README.md) for command details and troubleshooting.

### 5. Configure access and environment-specific settings

Complete the [Security and Permissions Checklist](docs/security-and-permissions.md), then configure the required identity providers, languages, custom domain, certificate, site visibility, and optional site agent features for the new site.

Authentication and web-role records can be site-specific. A successful sign-in alone does not prove that role assignments and data access migrated correctly.

### 6. Validate

Complete the post-deployment checks in the [Deployment Checklist](docs/deployment-checklist.md), [Security and Permissions Checklist](docs/security-and-permissions.md), and [Operations Checklist](docs/operations-checklist.md). In addition, verify every migrated custom page, integration, language, authentication provider, and accessibility requirement against the approved migration scope.

Record the results and unresolved review items before requesting business, security, and accessibility acceptance.

### 7. Cut over

After business, security, and accessibility acceptance:

1. Freeze changes to the legacy site's customizations and repeat any affected validation.
2. Configure the production custom domain or update customer-facing links to the new site.
3. Set the new site's visibility and confirm sign-in and critical volunteer journeys in production.
4. Monitor authentication, access, and volunteer transactions during the agreed support period.
5. Keep the legacy site available for the agreed rollback period, then retire it according to your organization's retention and change-management policies.

Do not delete the legacy site as part of the initial deployment. If cutover validation fails, direct users back to the legacy site while you correct and retest the new site.

## Safety and rollback

- The legacy and new sites can run side-by-side during migration.
- Keep the original site export unchanged and protect environment backups according to your organization's policy.
- Treat authentication, site settings, anonymous access, Web API fields, table permissions, web roles, and bot visibility as security-sensitive.
- Never store identity provider secrets, passwords, tokens, or connection strings in migration files or source control.
- Rollback means routing users back to the preserved legacy site. Dataverse business data is shared, so review any transactions created during the cutover window before attempting broader environment restoration.

## Related guidance

- [Migration Checklist](docs/migration-checklist.md) - detailed migration work list.
- [Deployment Checklist](docs/deployment-checklist.md) - deployment prerequisites and steps.
- [Security and Permissions Checklist](docs/security-and-permissions.md) - least-privilege validation.
- [Operations Checklist](docs/operations-checklist.md) - go-live and support checks.
- [Volunteer Engagement 2.0 deployment guide](Portal-EDM/README.md) - command and troubleshooting reference.
- [Power Platform CLI `pac pages` commands](https://learn.microsoft.com/en-us/power-platform/developer/cli/reference/pages) - official CLI reference.
