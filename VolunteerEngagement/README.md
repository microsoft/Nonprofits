# Volunteer Engagement

Volunteer Engagement is a Power Pages React single-page application (SPA), built on the Microsoft Power Platform, that gives volunteers a self-service web experience to discover opportunities, apply or register for engagements, manage their profile, and review their engagements. This package contains the Power Pages Enhanced Data Model implementation and AI-assisted guidance for migrating legacy Volunteer Engagement site customizations to Volunteer Engagement 2.0.

![Volunteer Engagement home page](../Documents/img/volunteer-engagement-home-page.png)

Volunteers can use Volunteer Engagement to:

- Create and update a profile with experience, skills, interests, availability, and contact information.
- Search for engagement opportunities that match their interests, schedule, and location.
- Apply or register for engagement opportunities by using their volunteer profile.
- Review upcoming and previous engagements, including participation details and contributed hours.

Volunteer Engagement works with [Volunteer Management](../VolunteerManagement/README.md), where staff create and manage the engagement opportunities that volunteers see, and is built on [Common Data Model for Nonprofits](../CommonDataModelforNonprofits/README.md). Install and configure both in the target environment before you deploy Volunteer Engagement.

## Deploy

[Deploy Volunteer Engagement](Portal-EDM/README.md). Run all development and deployment commands from `Portal-EDM/`.

Before you deploy, confirm that:

- [Common Data Model for Nonprofits](../CommonDataModelforNonprofits/README.md) and [Volunteer Management](../VolunteerManagement/README.md) are installed and configured in the target environment.
- [Power Pages Enhanced Data Model](https://learn.microsoft.com/en-us/power-pages/admin/enhanced-data-model) is enabled.
- [Power Platform CLI](https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction) is installed and authenticated.

Volunteer Engagement itself doesn't need to be preinstalled.

## Use

Use the checklist that matches your task:

- Deploy a new site: [Deployment Checklist](docs/deployment-checklist.md)
- Review security and permissions: [Security and Permissions Checklist](docs/security-and-permissions.md)
- Run go-live and support checks: [Operations Checklist](docs/operations-checklist.md)
- Migrate a legacy site: [Migration Checklist](docs/migration-checklist.md)

## AI-assisted development and migration

Volunteer Engagement-specific AI guidance is stored in `.ai/` and `.github/`. When using Copilot to work on this solution, open `VolunteerEngagement/` as the workspace root so that folder-local guidance is available for VE tasks.

For scenario-specific AI instruction files for SPA development, customization, deployment validation, and migration, see [Portal-EDM/README.md](Portal-EDM/README.md#ai-assisted-work).