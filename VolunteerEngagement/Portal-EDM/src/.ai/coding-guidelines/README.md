# Coding Guidelines — Volunteer Engagement Portal (Power Pages React SPA)

This folder contains AI assistant guidelines for maintaining code quality and consistency in the **Volunteer Engagement Portal**, a React SPA deployed to Power Pages via BYOC (Bring Your Own Code).

## Stack

- **React 18** + **TypeScript 5** (strict mode)
- **Vite 6** (bundler)
- **Fluent UI v9** (`@fluentui/react-components`)
- **react-router-dom v6** (client-side routing)
- **Power Pages Web API** (`/_api/`) for Dataverse data access
- **ESLint 8** with `@typescript-eslint` (linting)
- **Prettier 3** with `@trivago/prettier-plugin-sort-imports` (formatting and import order)

## Guidelines

- **`code-formatting.md`** — Indentation, quotes, semicolons, ESLint rules, file structure
- **`component-structure.md`** — Folder-per-component pattern, styles/types extraction, barrel exports

## Key Conventions

### Formatting
- **Indentation**: tabs, width 4 — set by Prettier (`useTabs: true`, `tabWidth: 4`)
- **Quotes**: single quotes
- **Semicolons**: required
- **Formatting**: Prettier (`.prettierrc.json`); run `npm run format` to apply

### File Organization
- Pages in `src/pages/`
- Services (API layer) in `src/services/` — one file per domain (SRP)
- Hooks in `src/hooks/`
- Components in `src/components/`
- Types in `src/types/`
- Path alias: `@/` maps to `src/`

### Power Pages Specifics
- Anti-forgery token required for POST/PATCH/DELETE via `__RequestVerificationToken` header
- Table permissions (YAML files in `.powerpages-site/table-permissions/`) control API access
- `@odata.bind` property names must use exact NavigationPropertyName casing from Dataverse metadata
- After every `pac pages upload`, run `patch-roles` to restore web roles stripped by PAC CLI
- Deploy command: `npm run deploy` (= build + upload + patch-roles)

---
*These guidelines are specifically designed for AI assistant use to maintain codebase quality and consistency.*