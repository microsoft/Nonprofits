# Volunteer Engagement 2.0 SPA development instructions

Use these instructions when building or modifying site customizations in `Portal-EDM`.

## Authoritative stack

The SPA uses:

- npm, not Bun.
- Node.js `>=20.18.1 <25`.
- React 18.
- TypeScript.
- Vite.
- Fluent UI v9.
- `react-router-dom` v6.
- Power Pages Enhanced Data Model code-site deployment.
- Power Pages Web API for Dataverse access.

If any local AI guidance conflicts with this stack, follow this file and `Portal-EDM/README.md`.

## Setup

From `Portal-EDM`:

```shell
npm ci
npm run sync
```

Use PAC CLI to select the target environment:

```shell
pac auth list
pac auth select --index <index>
```

## Development commands

```shell
npm run dev
npm run build
npm run lint
npm run test
npm run test:typecheck
npm run deploy
```

Use `npm run dev` for local SPA development and `npm run deploy` for Power Pages deployment.

## Code organization

Follow the existing SPA structure:

| Area | Path |
| --- | --- |
| Pages | `src/pages` |
| Reusable components | `src/components` |
| Context providers | `src/context` |
| Hooks | `src/hooks` |
| Services and API access | `src/services` |
| Types | `src/types` |
| Localization | `src/i18n` |
| Tests | `src/test` and colocated test patterns |

Prefer existing components, hooks, service helpers, and types before creating new abstractions.

## React and Fluent UI rules

- Use functional components.
- Use Fluent UI v9 components and `makeStyles`.
- Use existing theme and layout patterns.
- Keep page-specific logic in pages and reusable logic in components/hooks/services.
- Do not introduce Bootstrap as a primary UI dependency for new SPA work.
- Do not add external state management unless the project adopts it broadly.

## Power Pages Web API rules

- Use existing API client helpers in `src/services`.
- POST, PATCH, and DELETE require the Power Pages anti-forgery token.
- Only send known editable fields in PATCH bodies.
- Use exact Dataverse navigation property names for `@odata.bind` fields.
- Guard authenticated calls when the user might be anonymous.
- Every table accessed through Web API needs matching site settings, allowed fields, and table permissions.
- Treat anonymous Web API access as security-sensitive.

## Routing rules

- Use the existing `react-router-dom` route pattern.
- Preserve public URLs where possible when migrating custom pages.
- Handle Power Pages trailing slash behavior consistently with the current SPA.

## Localization readiness

- Keep new user-facing strings in the SPA localization-ready pattern.
- Use English for the initial migration output.
- Do not build new features that require editing component source just to translate visible text later.

## Accessibility rules

- Meet WCAG AA expectations.
- Use semantic elements and Fluent UI accessibility behavior where possible.
- Validate keyboard navigation, focus order, visible focus, labels, dialogs, headings, landmarks, and contrast.

## Before finishing a change

Run:

```shell
npm run build
npm run lint
npm run test
```

Then validate the changed route or workflow in a browser. For deployed asset validation, use a cache-bypassing request such as:

```javascript
fetch('/assets/index.js', { cache: 'no-store' })
```