# Component Structure Standards

## Component Pattern

Components and pages should follow the existing folder-per-component pattern when they contain meaningful styles, local types, or reusable implementation details:

```
ComponentName/
  ├── index.ts                 # Public exports only
  ├── ComponentName.tsx        # Component implementation
  ├── ComponentName.styles.ts  # makeStyles hook
  ├── ComponentName.types.ts   # Optional: local interfaces/types/constants
  └── ComponentName.model.ts   # Optional: business logic, helpers, constants
```

Small pages or components may omit `.types.ts` or `.model.ts` when there are no local types, constants, or helpers. Preserve established local patterns when editing existing components.

## Naming Conventions

- **Folder name**: PascalCase matching the component name exactly
- **File naming**: All files prefixed with the component name
- **Style files**: Always use `.styles.ts` (NOT `.styles.tsx`)
- **Types files**: Use `.types.ts` for local type definitions when needed
- **Model files**: Use `.model.ts` for business logic (optional, when needed)

## File Content Standards

### index.ts

Export the component and any public types from the folder. Match the existing export style for that component area:

```typescript
export { ComponentName } from './ComponentName';
export type { ComponentNameProps } from './ComponentName.types';
```

For default-export pages, a default barrel export is acceptable:

```typescript
export { default } from './ComponentName';
```

### ComponentName.types.ts

```typescript
export interface ComponentNameProps {
	// Props definition
}

// Additional types/interfaces related to this component
```

### ComponentName.tsx

```typescript
import React from 'react';

import type { ComponentNameProps } from './ComponentName.types';
import { useStyles } from './ComponentName.styles';

export function ComponentName(props: ComponentNameProps) {
  const styles = useStyles();

	// Component implementation
}
```

Use functional components. Prefer the local component style already present in the file or neighboring components; do not convert between `function`, `const`, default export, and named export just for style.

### ComponentName.styles.ts

```typescript
import { makeStyles, tokens } from '@fluentui/react-components';

export const useStyles = makeStyles({
	root: {
		display: 'flex',
		gap: tokens.spacingHorizontalM,
		// Styles
	},
});
```

**Type Safety Rules:**

- Use `makeStyles` from `@fluentui/react-components`; do not add CSS modules, Bootstrap, Tailwind, or shadcn/ui.
- Keep style hooks in `.styles.ts`, usually exported as `useStyles` unless neighboring files use a more specific name.
- Use Fluent UI tokens where practical.
- Follow the project TypeScript and lint rules; add stronger style typing only when it helps and does not fight Fluent UI's accepted style syntax.

```typescript
// Use normal makeStyles syntax for pseudo-selectors and media queries.
export const useStyles = makeStyles({
	container: {
		display: 'flex',
		'@media (max-width: 768px)': {
			flexDirection: 'column',
		},
		'&:hover': {
			opacity: '0.8',
		},
	},
});
```

### ComponentName.model.ts (optional)

```typescript
// Constants, helpers, business logic
export const COMPONENT_CONSTANTS = {
	// ...
};

export const helperFunction = () => {
	// ...
};
```

## Import Order

Import organization is handled automatically by Prettier with the `@trivago/prettier-plugin-sort-imports` plugin. Configuration is in `Portal-EDM/.prettierrc.json`.

The plugin automatically sorts imports in this order:

1. `react`
2. `react-dom`
3. `react-router`
4. Third-party packages (npm dependencies)
5. `@/context/*` (app contexts)
6. `@/components/*` (components)
7. `@/hooks/*` (custom hooks)
8. `@/services/*` (API/service layers)
9. `@/types*` (type definitions)
10. Relative imports (`./` or `../`)

Groups are separated by blank lines automatically. No manual import organization is needed — just save the file and Prettier will handle it.

## Folder Structure Organization

The project uses `src/pages/` for route-level pages and `src/components/` for reusable components:

```
src/
  ├── context/           # Shared context providers
  ├── hooks/             # Shared hooks
  ├── services/          # API service layer
  ├── types/             # Shared type definitions
  │
  ├── pages/             # Route-level pages (flat files or folders)
  │   ├── Home.tsx
  │   ├── Search.tsx
  │   ├── EngagementDetails.tsx
  │   └── MyEngagements.tsx
  │
  ├── components/        # Reusable components
  │   ├── index.ts       # Barrel exports
  │   │
  │   ├── EngagementCard/
  │   │   ├── index.ts
  │   │   ├── EngagementCard.tsx
  │   │   ├── EngagementCard.types.ts
  │   │   └── EngagementCard.styles.ts
  │   │
  │   ├── HeroBanner/
  │   │   ├── index.ts
  │   │   ├── HeroBanner.tsx
  │   │   ├── HeroBanner.types.ts
  │   │   └── HeroBanner.styles.ts
  │   │
  │   ├── FilterSidebar/
  │   │   ├── index.ts
  │   │   ├── FilterSidebar.tsx
  │   │   ├── FilterSidebar.types.ts
  │   │   └── FilterSidebar.styles.ts
  │   │
  │   └── Layout/
  │       ├── index.ts
  │       ├── Layout.tsx
  │       ├── Layout.types.ts
  │       └── Layout.styles.ts
  │
  ├── App.tsx
  └── main.tsx
```

## Architectural Patterns

### pages/ vs components/

Distinguish between full pages and reusable building blocks:

- **pages/** - Complete pages/screens (routing destinations)
  - Examples: `Home.tsx`, `Search.tsx`, `EngagementDetails.tsx`
  - Full pages with their own state, data fetching, and complete UI
  - Align with React Router routes
- **components/** - Reusable building blocks
  - Examples: `EngagementCard/`, `HeroBanner/`, `FilterSidebar/`
  - Shared across multiple pages
  - Should not contain routing logic

### Component Nesting Strategy

**Rule**: Components should be nested based on their usage scope.

1. **Single-use components** → Nest under parent in `components/` folder

   ```
   EngagementCard/
     └── components/
         └── SkillTag/    # Only used by EngagementCard
   ```

2. **Multi-use components** → Place in `shared/` folder at appropriate level

   ```
   components/
     └── shared/
         └── StatusBadge/     # Used by multiple components
   ```

3. **App-wide components** → Place in top-level `components/` folder
   ```
   components/
     └── Layout/              # Used across all pages
   ```

**Benefits:**

- Immediately understand component scope by location
- Prevents accidental coupling
- Easier to delete/refactor features
- Clear ownership and dependencies

### shared/ Folder Pattern

Use `shared/` when **2+ sibling components** need the same component:

```
components/
  ├── ParentA/
  │   └── components/
  │       └── ChildA/              # Only used by ParentA
  ├── ParentB/
  │   └── components/
  │       └── ChildB/              # Only used by ParentB
  └── shared/
      └── SharedComponent/         # Used by ParentA AND ParentB
```

**When NOT to use shared/:**

- Component used by only one parent → nest under that parent
- Component used across different features → move to higher level

### Export Patterns

Use barrel exports (`export *`) in index files for cleaner imports:

```typescript
// ✅ Good - Simple and maintainable
export * from './ComponentName.types';
export * from './ComponentName';

// ✅ Good - Folder-level exports
export * from './EngagementCard';
export * from './HeroBanner';

// ❌ Avoid - Explicit individual exports (harder to maintain)
export { Component } from './Component';
export type { ComponentProps } from './Component.types';
```

**Benefits:**

- Less maintenance when adding files
- Automatically exports everything from index files
- Consistent pattern across codebase

### Types vs Model Files

**ComponentName.types.ts** - Pure TypeScript definitions

```typescript
// ONLY interfaces, types, enums
export interface ComponentProps {
	data: string;
}

export type ComponentStatus = 'loading' | 'success' | 'error';
```

**ComponentName.model.ts** - Business logic and data

```typescript
// Constants, helper functions, data transformations
export const DEFAULT_CONFIG = {
	timeout: 3000,
};

export const transformData = (input: RawData): ProcessedData => {
	// Business logic
};
```

**Rule**: If it's executable code or data, it goes in `.model.ts`. If it's just type information, it goes in `.types.ts`.

## Rules & Best Practices

1. **No exceptions**: Every component follows the strict structure
2. **index.ts is the public API**: Always import from component folder, never from specific files
3. **Types are always separate**: Never define types inline in `.tsx` files
4. **Consistent file extensions**: `.ts` for styles (not `.tsx`)
5. **Component-scoped naming**: Prefix all exports with component name to avoid conflicts
6. **Nest by usage scope**: Single-use components go under their parent, multi-use go in `shared/`
7. **Use barrel exports**: Prefer `export *` in index files
8. **Separate types from logic**: `.types.ts` for definitions, `.model.ts` for executable code
9. **pages/ for routes**: Full routing destinations go in `pages/`, reusable parts in `components/`
10. **Shared components need 2+ users**: Don't create `shared/` prematurely
11. **Style type safety**: Always use `satisfies Record<string, CSSProperties>` or `satisfies Record<string, any>` for type checking
12. **CSS values as strings**: Use string values for numeric CSS properties (`margin: '0'`, `flex: '1'`)
13. **Import type syntax**: Use `import type { }` for type-only imports to avoid bundling issues
14. **Enum usage**: Import enums as values (not type-only) when used in comparisons or runtime code
15. **Path aliases**: Use `@/` aliases (`@/components/...`, `@/hooks/...`) instead of deep relative paths

## Migration Checklist

When refactoring existing components:

- [ ] Create/verify `ComponentName.types.ts` exists
- [ ] Move all type definitions to `.types.ts`
- [ ] Move business logic/constants to `.model.ts` (if applicable)
- [ ] Ensure style file is `.styles.ts` (not `.tsx`)
- [ ] Add `import type { CSSProperties } from 'react'` to style files
- [ ] Add `satisfies Record<string, CSSProperties>` (or `any` if using media queries)
- [ ] Convert numeric CSS values to strings (`0` → `'0'`, `1` → `'1'`)
- [ ] Create/update `index.ts` with barrel export pattern (`export *`)
- [ ] Import types using `import type { }` syntax (except enums used as values)
- [ ] Organize imports in standard order
- [ ] Verify component nesting (single-use under parent, multi-use in `shared/`)
- [ ] Update folder-level index files to use `export *`
- [ ] Verify no circular dependencies
- [ ] Update all imports to use folder import (not file import)
- [ ] Check for duplicate exports between `.tsx` and `.types.ts` files
- [ ] Verify import paths after folder reorganization (adjust `../` levels)
- [ ] Replace deep relative paths with `@/` aliases where possible

## Quick Reference

### Component File Requirements

| File                  | Required    | Purpose                            |
| --------------------- | ----------- | ---------------------------------- |
| `index.ts`            | ✅ Yes      | Barrel exports (`export *`)        |
| `Component.tsx`       | ✅ Yes      | React component implementation     |
| `Component.types.ts`  | ✅ Yes      | TypeScript interfaces/types        |
| `Component.styles.ts` | ✅ Yes      | Fluent UI styles (even if empty)   |
| `Component.model.ts`  | ⚠️ Optional | Business logic, constants, helpers |

### Where to Place Components

| Usage Pattern            | Location                    | Example                                      |
| ------------------------ | --------------------------- | -------------------------------------------- |
| Used by 1 component only | `Parent/components/Child/`  | `EngagementCard/components/SkillTag/`        |
| Used by 2+ siblings      | `Parent/components/shared/` | `components/shared/StatusBadge/`             |
| Used across all pages    | `components/`               | `components/Layout/`                         |
| Full pages/screens       | `pages/`                    | `pages/Home.tsx`                             |

### Import Order

Automated by Prettier — see configuration in `Portal-EDM/.prettierrc.json`.

## Type System Best Practices

### Context Organization

When organizing context files, apply the same component structure pattern:

```typescript
// ✅ Good - Contexts in folders with types and model files
context/
  └── AuthContext/
      ├── index.ts                    # Barrel exports
      ├── AuthContext.tsx             # Context provider
      ├── AuthContext.types.ts        # Type definitions
      └── AuthContext.model.ts        # Business logic

// ❌ Bad - Loose files at root level
context/
  ├── AuthContext.tsx
  ├── AuthContext.types.ts
  └── AuthContext.model.ts
```

### Import Path Corrections After Reorganization

When moving components into folders, remember to update import paths:

```typescript
// Before: Component at root level
import { Helper } from '../../hooks/useAuth';

// After: Component nested in folder (add one more ../)
import { Helper } from '../../../hooks/useAuth';

// Best: Use path aliases to avoid fragile relative paths
import { useAuth } from '@/hooks/useAuth';
```

**Rule**: Each folder level adds one `../` to relative imports. Prefer `@/` aliases.

### Avoiding Duplicate Type Exports

```typescript
// ❌ Bad - Types exported from both files
// ComponentName.types.ts
export interface ComponentProps {}

// ComponentName.tsx
export interface ComponentProps {} // Duplicate!
export const Component = () => {};

// ✅ Good - Single source of truth
// ComponentName.types.ts
export interface ComponentProps {}

// ComponentName.tsx
import type { ComponentProps } from './ComponentName.types';
export const Component: React.FC<ComponentProps> = () => {};

// index.ts - Re-export types for external use
export * from './ComponentName';
export * from './ComponentName.types';
```

### Enum vs Type-Only Imports

**Critical Rule**: Enums are both types AND values at runtime.

```typescript
// ✅ Good - Regular import for enums used as values
import { StepId } from './types';
if (step.id === StepId.Review) {} // Runtime comparison

// ✅ Good - Type-only import for interfaces
import type { StepConfig } from './types';
const config: StepConfig = {};

// ❌ Bad - Type-only import for enum used as value
import type { StepId } from './types';
if (step.id === StepId.Review) {} // ERROR: StepId not available at runtime
```

## Example: Before & After

### Before (Non-standard)

```
HeroBanner/
  ├── HeroBanner.tsx        # Contains types inline, styles use wrong constraint
  ├── HeroBanner.styles.ts  # margin: 0 (numeric values)
  └── index.ts              # Just exports component

// HeroBanner.styles.ts
export const useStyles = makeStyles({
  container: {
    margin: 0,          // ❌ Numeric value
    flex: 1,            // ❌ Numeric value
  },
});
```

### After (Standard)

```
HeroBanner/
  ├── index.ts                    # Exports component AND types
  ├── HeroBanner.tsx              # Imports types from .types.ts
  ├── HeroBanner.types.ts         # All type definitions
  └── HeroBanner.styles.ts        # Type-safe with satisfies

// HeroBanner.styles.ts
import type { CSSProperties } from 'react';

export const useStyles = makeStyles({
  container: {
    margin: '0',        // ✅ String value
    flex: '1',          // ✅ String value
  },
} satisfies Record<string, CSSProperties>);
```
