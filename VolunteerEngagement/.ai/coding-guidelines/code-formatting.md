# Code Formatting Guidelines

## 📋 Overview
This document outlines code formatting standards and automatic formatting setup for consistent code style across the Volunteer Engagement Portal project.

## 🎯 Formatting Configuration

### Primary Configuration
The project uses **Prettier** for code formatting with configuration defined in:
```
Portal-EDM/.prettierrc.json
```

All code formatting should follow the rules defined in this configuration file.

### Key Prettier Rules
| Rule | Value |
|------|-------|
| `useTabs` | `true` |
| `tabWidth` | `4` |
| `semi` | `true` (semicolons required) |
| `singleQuote` | `true` |
| `printWidth` | `120` |
| `trailingComma` | `"all"` |
| `bracketSpacing` | `true` |
| `arrowParens` | `"always"` |

### Import Organization
Import ordering is handled automatically by **`@trivago/prettier-plugin-sort-imports`** configured in `.prettierrc.json`. The defined order is:

1. `react`
2. `react-dom`
3. `react-router`
4. Third-party modules
5. `@/context/*` (app contexts)
6. `@/components/*` (components)
7. `@/hooks/*` (custom hooks)
8. `@/services/*` (API/service layers)
9. `@/types*` (type definitions)
10. Relative imports (`./` or `../`)

Groups are separated by blank lines automatically.

## 🔧 ESLint Integration

ESLint is configured in `Portal-EDM/.eslintrc.cjs`. Formatting rules (`indent`, `quotes`, `semi`) are **disabled** in ESLint to avoid conflicts with Prettier.

Key ESLint rules:
- `@typescript-eslint/no-explicit-any`: **off** (any is allowed)
- `@typescript-eslint/no-unused-vars`: **warn** (underscore-prefixed args ignored)
- `no-empty`: **error** (but empty catch blocks allowed)
- `react-refresh/only-export-components`: **warn**

### Scope
- Applies to all TypeScript/JavaScript files in the `Portal-EDM/src/` directory
- Includes React components, contexts, hooks, services, and type files
- Covers `.ts`, `.tsx` file extensions

## ⚙️ Portal-EDM Service Conventions

The current SPA uses React 18, Fluent UI v9, `react-router-dom` v6, Vite, npm, and Power Pages Web API. Do not introduce Bun, TanStack Router, shadcn/ui, Tailwind, React Server Components, or React 19-only patterns unless the project deliberately adopts them.

### Service Layer

- Keep domain API access in `Portal-EDM/src/services/`, one service file per domain where practical.
- Use the existing helpers in `src/services/apiClient.ts` instead of creating new fetch wrappers.
- POST, PATCH, and DELETE requests require the Power Pages anti-forgery token sent as `__RequestVerificationToken`.
- For `@odata.bind`, use the exact Dataverse relationship `NavigationPropertyName` casing. Do not guess lowercase names.
- PATCH payloads must contain only known editable fields. Do not spread Web API response objects into PATCH bodies because they include OData metadata and formatted values.
- Wrap role-dependent reads that may return 403 and return an intentional empty state only when that behavior is expected for the flow.

### Power Pages Metadata

- Every Dataverse table accessed through `/_api` needs matching `Webapi/<table>/enabled`, `Webapi/<table>/fields`, and table-permission metadata under `Portal-EDM/.powerpages-site`.
- For `@odata.bind` associations, confirm the source table has append rights and the target table has append-to rights.
- After `pac pages upload-code-site`, run the project role patch flow through `npm run deploy` or `npm run permissions:patch-roles`; do not invent a separate upload flow.
- Do not run `pac` commands until the target environment has been confirmed.

## 🚀 Automatic Formatting Setup

### VS Code Integration
Ensure your VS Code settings include:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "prettier.configPath": "./Portal-EDM/.prettierrc.json",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

### npm Scripts
```bash
# Format all source files
npm run format

# Check formatting without making changes
npm run format:check

# Lint all source files
npm run lint

# Lint and auto-fix
npm run lint:fix
```

### Manual Formatting Commands
```bash
# Format a specific file
npx prettier --write "src/components/MyComponent.tsx"

# Format all source files
npx prettier --write "src/**/*.{ts,tsx,css}"

# Check formatting without making changes
npx prettier --check "src/**/*.{ts,tsx,css}"
```

## 📝 Formatting Rules Application

### When to Format
- **Before committing** - Always format code before commit
- **During refactoring** - Apply formatting when making code changes
- **When adding new files** - Ensure new files follow formatting rules
- **During code reviews** - Check that formatting is consistent

### AI Assistant Guidelines
When modifying or creating code:

1. **Use tabs for indentation** (tabWidth: 4) — never spaces
2. **Use single quotes** for strings
3. **Include semicolons** at end of statements
4. **Apply trailing commas** in multi-line constructs
5. **Keep lines under 120 characters**
6. **Follow import order** defined in `.prettierrc.json`
7. **Preserve existing formatting** when making small targeted changes
8. **Don't mix formatting changes** with logic changes in the same commit
9. **Use path aliases** (`@/components/...`, `@/hooks/...`) instead of deep relative imports

## ✅ Quality Checklist

Before committing code, verify:
- [ ] Code uses tabs for indentation (not spaces)
- [ ] Single quotes are used for strings
- [ ] Semicolons are present
- [ ] Trailing commas are used in multi-line arrays/objects
- [ ] Lines stay within 120-character width
- [ ] Imports follow the defined group order with blank line separators
- [ ] No ESLint warnings or errors (`npm run lint`)
- [ ] Formatting is consistent (`npm run format:check`)

## 🔍 Common Formatting Issues

### Tab Indentation
This project uses **tabs**, not spaces. AI assistants must generate code with tab characters.

❌ **Wrong** - spaces
```typescript
const myFunction = (param: string) => {
  return {
    value: param,
    formatted: true,
  };
};
```

✅ **Correct** - tabs
```typescript
const myFunction = (param: string) => {
	return {
		value: param,
		formatted: true,
	};
};
```

### Import Organization
❌ **Wrong** - unsorted, no grouping
```typescript
import { MyComponent } from './MyComponent';
import React from 'react';
import { Button } from '@fluentui/react-components';
import { useAppContext } from '@/context/AppContext';
```

✅ **Correct** - sorted groups with separators
```typescript
import React from 'react';

import { Button } from '@fluentui/react-components';

import { useAppContext } from '@/context/AppContext';

import { MyComponent } from './MyComponent';
```

### Configuration Conflicts
- If formatting looks wrong, check `Portal-EDM/.prettierrc.json`
- Don't override Prettier rules in individual files
- ESLint formatting rules are intentionally disabled — Prettier handles them

## 📊 Formatting Workflow

1. **Write code** with focus on logic and structure
2. **Use path aliases** (`@/`) for imports from `src/`
3. **Apply Prettier formatting** via save-on-format or `npm run format`
4. **Run linter** via `npm run lint` to catch non-formatting issues
5. **Build** with `npm run build` to verify TypeScript compilation
6. **Commit formatted code** following project standards

---
*Configuration: `Portal-EDM/.prettierrc.json`, `Portal-EDM/.eslintrc.cjs`*
