# Volunteer Engagement Operational Notes

This file is a compact source-of-truth map for humans and AI assistants. It does not replace the detailed AI migration and coding guidance in `../../.ai` and `../../.github`; it records current `Portal-EDM` facts that are risky to infer from legacy Volunteer Engagement context.

## Current SPA Routes

Routes are defined in `src/App.tsx`. Power Pages may prepend a language segment such as `/en-US`; the app detects that segment and uses it as the React Router basename.

| Route | Component | Access expectation | Notes |
| --- | --- | --- | --- |
| `/` | `Home` | Anonymous and authenticated | Public opportunity listing, filtering, and sorting. |
| `/opportunities` | Redirects to `/` | Anonymous and authenticated | Legacy-compatible route. |
| `/engagement/:id` | `EngagementDetails` | Anonymous can view public data; signed-in users can apply/register where allowed | Uses the public opportunity id in the URL. |
| `/my-engagements` | `MyEngagements` | Authenticated | Shows the signed-in contact's participation data. |
| `/profile` | `Profile` | Authenticated | Contact information, availability, preferences, and qualifications. |
| `/profile-availability` | `Profile` | Authenticated | Legacy-compatible route into the profile experience. |
| `/profile-prefandqual` | `Profile` | Authenticated | Legacy-compatible route into the profile experience. |
| `/search` | `Search` | Anonymous and authenticated | Search over public opportunity data. |
| `/success` | `Success` | Contextual | Confirmation page after apply/cancel actions. |
| `/access-denied` | `AccessDenied` | Any | Permission failure page. |
| `*` | `NotFound` | Any | SPA fallback route. |

## Current Web API Surface

Every table used through `/_api` needs matching `Webapi/<table>/enabled`, `Webapi/<table>/fields`, and table-permission metadata in `.powerpages-site`. Changes to anonymous access, table permissions, Web API fields, or web roles are security-sensitive.

| Service | Tables/endpoints | Operations | Main flows |
| --- | --- | --- | --- |
| `engagementService.ts` | `msnfp_publicengagementopportunities`, `msnfp_engagementopportunityschedules`, `msnfp_engagementopportunityparticipantquals` | Read | Home, search, engagement details, shift display, required qualifications. |
| `participationService.ts` | `msnfp_participations`, `msnfp_participationschedules`, `contacts` | Read, create, patch | Apply/register, cancel/update participation, book/cancel shifts, mark contact as volunteer. |
| `contactService.ts` | `contacts` | Read, patch | Profile contact details. |
| `availabilityService.ts` | `msnfp_availabilities` | Read, create, delete | Profile availability. |
| `preferenceService.ts` | `msnfp_preferencetypes`, `msnfp_preferences` | Read, create, delete | Profile preferences. |
| `qualificationService.ts` | `msnfp_qualificationtypes`, `msnfp_qualifications` | Read, create, delete | Profile qualifications. |

The core HTTP helpers are in `src/services/apiClient.ts`. POST, PATCH, and DELETE require the Power Pages anti-forgery token. The helper first uses `window.shell.getTokenDeferred()` when available, then falls back to `/_layout/tokenhtml`.

## Runtime Bootstrap

Power Pages renders bootstrap data from `.powerpages-site/web-templates/msve_home/MSVE_Home.webtemplate.source.html` into a hidden `#ve-bootstrap-data` element. `src/bootstrap/portalBootstrap.ts` reads that element and initializes:

- `window.Microsoft.Dynamic365.Portal.User`
- `window.__VE_LOCALE`
- `window.__VE_LANGUAGES`
- `window.__VE_STRINGS`

`src/hooks/useAuth.ts` resolves the current portal user from that global first. If the global is missing but the `__Portal-user` cookie exists, it falls back to `/_api/contacts?$select=contactid,firstname,lastname,emailaddress1&$top=1`. With a self-scoped Contact table permission, that query should only return the current contact.

`src/i18n/LocaleContext.tsx` consumes `window.__VE_STRINGS` and falls back to `src/i18n/fallback.ts` when portal-injected strings are absent. The `MSVE_SPA/Keys` site setting controls which content snippets the web template injects.

## Development And Deployment Assumptions

- Local Vite development is optional. `VITE_PORTAL_URL` in `.env` proxies `/_api` and `/_layout` to a Power Pages host, but authenticated flows must still be validated on the deployed site.
- `npm run build`, `npm run lint`, and `npm run test` are the local validation baseline before deployment.
- `npm run deploy` builds, uploads with `pac pages upload-code-site --rootPath .`, then patches table-permission and bot-consumer role arrays.
- After switching PAC environments, run `npm run sync` before deploying.
- If `/assets/index.js` or `/assets/index.css` returns 404 after upload, verify the hosted runtime is bound to the same website record and Home root that was uploaded before treating it as a Vite build issue.
- Power Pages can keep serving cached JS/CSS after upload. Validate the server-side asset with `fetch('/assets/index.js', { cache: 'no-store' })` or wait for the cache TTL before judging browser-rendered behavior.

## AI Guidance Boundaries

- Use `.ai/instructions` and `.github/skills/ve-legacy-to-spa-migration` for legacy migration, customization classification, authentication, bot, accessibility, and deployment validation workflows.
- Use this file for current `Portal-EDM` runtime anchors.
- Treat `.ai/context/ve-overview.md` as legacy/product background unless it explicitly refers to the current `Portal-EDM` SPA source.
- Do not infer new table permissions, Web API fields, anonymous access, authentication settings, or bot visibility from legacy exports without explicit review.