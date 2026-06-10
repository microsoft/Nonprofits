# Customization migration instructions

Use these instructions to decide what to migrate from a legacy Volunteer Engagement site into the new React SPA site.

## Default position

Migrate site-specific customizations, except site settings. Site settings are not migrated by default because they can change security, authentication, Web API exposure, portal runtime behavior, caching, and environment-specific bindings.

## Customizations in scope

The AI migration workflow should inspect and classify:

- Web pages and routes.
- Web templates and Liquid code.
- Content snippets and labels.
- Web files, images, CSS, and JavaScript.
- Web roles.
- Table permissions.
- Bot consumers.
- Basic forms and form metadata.
- Custom Dataverse tables and columns used by the portal.
- Authentication-related customizations.
- Site-specific navigation, headers, footers, and page content.

## Site settings policy

Do not bulk-copy site settings from the legacy portal.

Classify each setting first:

| Site setting type | Action |
| --- | --- |
| Required by new SPA | Keep the target SPA value |
| Environment-specific | Reconfigure in target environment |
| Customization dependency | Ask for approval, then recreate deliberately |
| Authentication or security setting | Ask for approval and validate with the authentication owner |
| Web API exposure setting | Ask for approval and verify least privilege |
| Obsolete legacy setting | Do not migrate |
| Unknown setting | Do not migrate until classified |

Examples of settings that require extra care:

- Authentication provider settings.
- `Webapi/<table>/enabled` and `Webapi/<table>/fields`.
- Domain, URL, callback, and redirect settings.
- CORS, CSP, header, or security-related settings.
- Search, caching, and portal runtime settings.

## Migration patterns

### Legacy Liquid to React

When migrating Liquid templates:

- Identify the user-visible behavior and data dependencies.
- Rebuild the behavior as React components, hooks, and services.
- Use Power Pages Web API for client-side data access where appropriate.
- Keep server-rendered Power Pages behavior only where the platform requires it, such as built-in authentication pages.
- Remove legacy Liquid-specific workarounds unless still needed in EDM.

### Legacy CSS to Fluent UI

When migrating styling:

- Use Fluent UI v9 components and `makeStyles`.
- Preserve the organization's brand intent when requested, but keep layout and accessibility consistent with the SPA.
- Avoid carrying forward Bootstrap-specific classes as the primary styling mechanism.
- Check responsive behavior at mobile, tablet, and desktop widths.

### Legacy JavaScript to TypeScript

When migrating scripts:

- Convert global scripts to typed functions, hooks, or services.
- Avoid DOM manipulation when React state can express the behavior.
- Keep Power Pages-specific browser APIs isolated in services or utilities.
- Validate error handling and loading states.

### Custom Liquid pages

Do not copy custom Liquid pages into the new site unchanged. Classify each page by purpose, data dependencies, permissions, and user journey.

| Legacy page type | Default action |
| --- | --- |
| Static information page | Recreate as a React route, component, or localization-ready content surface. |
| FetchXML or data display page | Move data access into `Portal-EDM/src/services` and render with React and Fluent UI. |
| Custom form page | Prefer an SPA form with existing API helpers. Keep a Power Pages form only when platform server-side behavior is required. |
| Authentication, registration, invitation, or password page | Do not convert blindly. Keep platform-supported behavior and only migrate approved content or styling changes. |
| Page that duplicates SPA baseline behavior | Do not migrate. Fold approved text, branding, or configuration changes into the existing SPA page. |
| Admin or internal page | Require role, table permission, and Web API review before migration. |
| Page that loads third-party scripts | Require security and privacy review before migration. |

Record the original URL, navigation placement, dependent templates, snippets, web files, table permissions, web roles, site settings, and custom Dataverse tables before implementing the replacement.

### Content snippets and text

When migrating content:

- Preserve source-site text that is still relevant.
- Move new SPA text into the localization-ready string pattern used by `Portal-EDM`.
- Do not hard-code new user-facing text inside components unless the current SPA pattern explicitly allows it.

### Permissions and roles

When migrating permissions:

- Preserve least privilege.
- Verify every Web API table has a matching table permission.
- Verify role arrays are present after `pac pages upload-code-site` by running the role patch flow.
- Treat anonymous access changes as security-sensitive and require explicit review.

## Review checklist

Before considering a customization migrated, verify:

- The user-facing behavior exists in the SPA.
- The implementation uses React/TypeScript/Fluent UI patterns.
- Required data access is covered by table permissions and site Web API settings.
- Text is localization-ready.
- Keyboard and screen reader behavior are acceptable.
- Mobile and desktop layouts work.
- The customization does not depend on unapproved legacy site settings.
