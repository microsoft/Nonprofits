# Volunteer Engagement Documentation Improvement Plan

Keep the Volunteer Engagement documentation simple, task-focused, and easy to maintain. The documentation should help a reader choose the right path, complete the setup, validate the site, and find official Microsoft guidance when they need more detail.

## Principles

- Write for the reader's task, not for the repository structure.
- Keep the top-level README short and use it as the entry point.
- Use short sections, clear headings, and numbered steps for procedures.
- Link to official Microsoft documentation instead of repeating long platform guidance.
- Add only documents that answer a real deployment, security, migration, or support question.

## Simple documentation set

| Document | Purpose |
| --- | --- |
| `README.md` | Explain what Volunteer Engagement is, who should use it, and where to go next. |
| `Portal-EDM/README.md` | Show developers how to install, build, test, and deploy the React SPA. |
| `docs/deployment-checklist.md` | Provide a short fresh-deployment checklist. |
| `docs/security-and-permissions.md` | Explain the minimum security, web role, table permission, and Web API checks. |
| `docs/operations-checklist.md` | Capture basic go-live and support checks, including cache, Site Checker, and custom domain items. |
| `docs/migration-checklist.md` | Summarize the legacy-to-SPA migration steps and point to the existing AI migration guidance. |

Create these documents only as needed. Each document should fit on one screen when possible and link to detailed Microsoft guidance for deeper tasks.

## Priority plan

1. Simplify the top-level README so it clearly identifies the product, prerequisites, and next step for each audience. (Done)
2. Add `docs/deployment-checklist.md` with only the required environment checks, commands, and post-deployment validation steps. (Done)
3. Add `docs/security-and-permissions.md` with the required web roles, table permissions, Web API settings, site visibility, and authentication checks. (Done)
4. Add `docs/operations-checklist.md` with Site Checker, cache, CDN, restart, custom domain, and go-live checks. (Done)
5. Add `docs/migration-checklist.md` only if migration users need a shorter entry point than the existing `.ai` and `.github` guidance. (Done)

## Official Microsoft links to use

- [Create and deploy a single-page application in Power Pages](https://learn.microsoft.com/en-us/power-pages/configure/create-code-sites)
- [Power Platform CLI overview](https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction)
- [Power Pages Enhanced Data Model](https://learn.microsoft.com/en-us/power-pages/admin/enhanced-data-model)
- [Power Pages security](https://learn.microsoft.com/en-us/power-pages/security/power-pages-security)
- [Configure table permissions](https://learn.microsoft.com/en-us/power-pages/security/table-permissions)
- [Create and assign web roles](https://learn.microsoft.com/en-us/power-pages/security/create-web-roles)
- [Portals Web API overview](https://learn.microsoft.com/en-us/power-pages/configure/web-api-overview)
- [Set up site authentication](https://learn.microsoft.com/en-us/power-pages/security/authentication/configure-site)
- [Site visibility in Power Pages](https://learn.microsoft.com/en-us/power-pages/security/site-visibility)
- [Use solutions with Power Pages](https://learn.microsoft.com/en-us/power-pages/configure/power-pages-solutions)
- [Run Site Checker](https://learn.microsoft.com/en-us/power-pages/admin/site-checker)
- [How server-side caching works in Power Pages](https://learn.microsoft.com/en-us/power-pages/admin/clear-server-side-cache)
- [Content Delivery Network](https://learn.microsoft.com/en-us/power-pages/configure/configure-cdn)
- [Add a custom domain name](https://learn.microsoft.com/en-us/power-pages/admin/add-custom-domain)
- [Microsoft Writing Style Guide](https://learn.microsoft.com/en-us/style-guide/welcome/)

## Done when

- A new reader can identify the correct documentation path in under one minute.
- A deployment owner can complete a fresh deployment by following a short checklist.
- A security reviewer can verify anonymous access, authenticated access, table permissions, and Web API exposure.
- A support owner can run the basic post-deployment and go-live checks.
- Detailed platform explanations are linked to Microsoft documentation instead of duplicated locally.