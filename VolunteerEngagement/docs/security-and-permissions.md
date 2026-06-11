# Security and Permissions Checklist

Use this checklist to confirm that Volunteer Engagement exposes only the data it should. Changes to anonymous access, table permissions, Web API fields, or web roles are security-sensitive. For background, see [Power Pages security](https://learn.microsoft.com/en-us/power-pages/security/power-pages-security).

## Web roles

- [ ] The site has one Anonymous Users role and one Authenticated Users role.
- [ ] Custom roles are assigned only where needed.

See [Create and assign web roles](https://learn.microsoft.com/en-us/power-pages/security/create-web-roles).

## Table permissions

- [ ] Every table used by the site has a matching table permission.
- [ ] Anonymous access is granted only to public opportunity data.
- [ ] Profile and participation data use self- or contact-scoped access for authenticated users.

See [Configure table permissions](https://learn.microsoft.com/en-us/power-pages/security/table-permissions) and [Assign table permissions](https://learn.microsoft.com/en-us/power-pages/security/assign-table-permissions).

## Web API

- [ ] Each table used through `/_api` has `Webapi/<table>/enabled` and `Webapi/<table>/fields` set.
- [ ] Field lists expose only the columns the site needs.

See [Portals Web API overview](https://learn.microsoft.com/en-us/power-pages/configure/web-api-overview).

## Site visibility and authentication

- [ ] Site visibility is set correctly (private during development, public for go-live).
- [ ] Identity providers and registration settings match your access policy.

See [Site visibility in Power Pages](https://learn.microsoft.com/en-us/power-pages/security/site-visibility) and [Set up site authentication](https://learn.microsoft.com/en-us/power-pages/security/authentication/configure-site).

## After changes

- [ ] Run `npm run permissions:patch-roles` and `npm run permissions:patch-bot-roles` if role assignments changed.
- [ ] Re-validate anonymous and authenticated flows.

For deployment steps, see the [Deployment Checklist](deployment-checklist.md).
