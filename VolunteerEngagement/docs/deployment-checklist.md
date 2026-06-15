# Deployment Checklist

Use this checklist for a fresh Volunteer Engagement deployment. Run all commands from `Portal-EDM/`. For detailed steps, see [Portal-EDM/README.md](../Portal-EDM/README.md).

## Before you deploy

- [ ] [Common Data Model for Nonprofits](../../CommonDataModelforNonprofits/README.md) and [Volunteer Management](../../VolunteerManagement/README.md) are installed and configured in the target environment.
- [ ] [Power Pages Enhanced Data Model](https://learn.microsoft.com/en-us/power-pages/admin/enhanced-data-model) is enabled.
- [ ] [Power Platform CLI](https://learn.microsoft.com/en-us/power-platform/developer/cli/introduction) is installed and authenticated to the target environment.
- [ ] JavaScript file uploads are allowed in the target environment. See [Create and deploy a single-page application in Power Pages](https://learn.microsoft.com/en-us/power-pages/configure/create-code-sites).
- [ ] Node.js 24 LTS and PowerShell 7+ are installed.

If `pac pages upload-code-site` fails while uploading `.js` files, confirm that JavaScript file uploads are allowed in Dataverse. The official SPA deployment guidance explains how to update the environment's blocked attachment settings.

## Deploy

1. Install dependencies: `npm ci`.
2. Authenticate: `pac auth create --environment <environment-url>`.
3. Validate locally: `npm run build`, `npm run lint`, and `npm run test`.
4. Deploy: `npm run deploy`.
5. In Power Pages, open **Inactive sites** and reactivate Volunteer Engagement. See [Reactivate sites](https://learn.microsoft.com/en-us/power-pages/admin/reactivate-website).
6. After reactivation, refresh local metadata: `npm run sync`.
7. Restart the site: `npm run site:restart`.

## After you deploy and reactivate

- [ ] Home page loads.
- [ ] Opportunity listing, search, and filtering work.
- [ ] Engagement details load.
- [ ] Anonymous users only see public data.
- [ ] Sign in and sign out work.
- [ ] Authenticated users can apply or register.
- [ ] My engagements and profile flows load for the signed-in user.

- [ ] If the first browser session shows unauthorized or access denied, retry with a fresh session. See the deployment validation instructions for details.

For caching behavior during validation, see the [Operations Checklist](operations-checklist.md).
