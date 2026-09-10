# Component Structure Standards

## Strict Component Pattern

Every component in the ItemLanding module **MUST** follow this exact structure:

```
ComponentName/
  ├── index.ts                 # Public exports only
  ├── ComponentName.tsx        # Component implementation
  ├── ComponentName.types.ts   # TypeScript interfaces/types
  ├── ComponentName.styles.ts  # Styled components/makeStyles
  └── ComponentName.model.ts   # (optional) Business logic, helpers, constants
```

## Naming Conventions

- **Folder name**: PascalCase matching the component name exactly
- **File naming**: All files prefixed with the component name
- **Style files**: Always use `.styles.ts` (NOT `.styles.tsx`)
- **Types files**: Always use `.types.ts` for all type definitions
- **Model files**: Use `.model.ts` for business logic (optional, when needed)

## File Content Standards

### index.ts

```typescript
export * from "./ComponentName.types";
export * from "./ComponentName";
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
import React from "react";

// Types
import type { ComponentNameProps } from "./ComponentName.types";

// Styles
import { useComponentNameStyles } from "./ComponentName.styles";

export const ComponentName: React.FC<ComponentNameProps> = (props) => {
  const styles = useComponentNameStyles();

  // Component implementation
};
```

### ComponentName.styles.ts

```typescript
import { makeStyles, tokens } from "@fluentui/react-components";
import type { CSSProperties } from "react";

export const useComponentNameStyles = makeStyles({
  root: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    // Styles
  },
} satisfies Record<string, CSSProperties>);
```

**Type Safety Rules:**

- Add `import type { CSSProperties } from 'react'` for type checking
- Use `satisfies Record<string, CSSProperties>` for standard styles
- Use `satisfies Record<string, any>` if you have media queries or pseudo-selectors
- Convert numeric CSS property values to strings: `margin: '0'`, `flex: '1'`

```typescript
// ❌ Bad - Numeric values cause type errors
export const useStyles = makeStyles({
  container: {
    margin: 0,
    flex: 1,
  },
} satisfies Record<string, CSSProperties>);

// ✅ Good - String values for type safety
export const useStyles = makeStyles({
  container: {
		margin: '0',
		flex: '1',
// ✅ Good - Use 'any' for media queries/pseudo-selectors
export const useStyles = makeStyles({
  container: {
    display: "flex",
    "@media (max-width: 768px)": {
      flexDirection: "column",
    },
    "&:hover": {
      opacity: "0.8",
    },
  },
} satisfies Record<string, any>);
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

Import organization is handled automatically by Prettier with the `@trivago/prettier-plugin-sort-imports` plugin. Configuration is in `.prettierrc.json`.

The plugin automatically sorts imports in this order:

1. React
2. All third-party packages (npm dependencies)
3. Internal path aliases (@src, @context, @components, @services, @controller, @clients)
4. Relative imports (./ and ../)

No manual import organization is needed - just save the file and Prettier will handle it.

## Folder Structure Organization

```
ItemLanding/
  ├── context/           # Shared context providers
  ├── hooks/             # Shared hooks
  ├── helpers/           # Shared utilities
  │
  ├── Ribbon/            # Top-level component
  │   ├── index.ts
  │   ├── Ribbon.tsx
  │   ├── Ribbon.types.ts
  │   └── Ribbon.styles.ts
  │
  ├── Explorer/          # Feature component
  │   ├── index.ts
  │   ├── Explorer.tsx
  │   ├── Explorer.types.ts
  │   ├── Explorer.styles.ts
  │   │
  │   ├── components/    # Explorer-specific reusable components
  │   │   └── ExplorerItem/
  │   │       ├── index.ts
  │   │       ├── ExplorerItem.tsx
  │   │       ├── ExplorerItem.types.ts
  │   │       └── ExplorerItem.styles.ts
  │   │
  │   └── views/         # Explorer pages/views
  │       ├── Overview/
  │       │   ├── index.ts
  │       │   ├── Overview.tsx
  │       │   ├── Overview.types.ts
  │       │   ├── Overview.styles.ts
  │       │   ├── Overview.model.ts
  │       │   └── components/     # Overview-specific components
  │       │       └── HeroSection/
  │       │           ├── index.ts
  │       │           ├── HeroSection.tsx
  │       │           ├── HeroSection.types.ts
  │       │           └── HeroSection.styles.ts
  │       │
  │       └── Deployments/
  │           └── (same structure)
  │
  └── DeploymentStatusMessageBar/
      ├── index.ts
      ├── DeploymentStatusMessageBar.tsx
      ├── DeploymentStatusMessageBar.types.ts
      └── DeploymentStatusMessageBar.styles.ts
```

## Architectural Patterns

### views/ vs components/

Distinguish between full pages and reusable building blocks:

- **views/** - Complete pages/screens (routing destinations)
  - Examples: `Overview/`, `Deployments/`
  - Full pages with their own state, business logic, and complete UI
  - Align with router paths/navigation
- **components/** - Reusable building blocks
  - Examples: `ExplorerSidebar/`, `DeploymentStatusMessageBar/`
  - Shared across multiple views within the same feature
  - Should not contain routing logic

### Component Nesting Strategy

**Rule**: Components should be nested based on their usage scope.

1. **Single-use components** → Nest under parent in `components/` folder

   ```
   OverviewSuccess/
     └── components/
         └── QuickStartSection/    # Only used by OverviewSuccess
   ```

2. **Multi-use components** → Place in `shared/` folder at appropriate level

   ```
   Overview/
     └── components/
         └── shared/
             ├── ResourceCard/      # Used by both Success & Failure
             └── ResourcesSection/
   ```

3. **Feature-wide components** → Place in feature `components/` folder
   ```
   Explorer/
     └── components/
         └── ExplorerSidebar/       # Used by all Explorer views
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
export * from "./ComponentName.types";
export * from "./ComponentName";

// ✅ Good - Folder-level exports
export * from "./Overview";
export * from "./Deployments";

// ❌ Avoid - Explicit individual exports (harder to maintain)
export { Component } from "./Component";
export type { ComponentProps } from "./Component.types";
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

export type ComponentStatus = "loading" | "success" | "error";
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
9. **views/ for pages**: Full routing destinations go in `views/`, reusable parts in `components/`
10. **Shared components need 2+ users**: Don't create `shared/` prematurely
11. **Style type safety**: Always use `satisfies Record<string, CSSProperties>` or `satisfies Record<string, any>` for type checking
12. **CSS values as strings**: Use string values for numeric CSS properties (`margin: '0'`, `flex: '1'`)
13. **Import type syntax**: Use `import type { }` for type-only imports to avoid bundling issues
14. **Enum usage**: Import enums as values (not type-only) when used in comparisons or runtime code

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

| Usage Pattern            | Location                    | Example                                         |
| ------------------------ | --------------------------- | ----------------------------------------------- |
| Used by 1 component only | `Parent/components/Child/`  | `OverviewSuccess/components/QuickStartSection/` |
| Used by 2+ siblings      | `Parent/components/shared/` | `Overview/components/shared/ResourceCard/`      |
| Used across all views    | `Feature/components/`       | `Explorer/components/ExplorerSidebar/`          |
| Full pages/screens       | `Feature/views/`            | `Explorer/views/Overview/`                      |

### Import Order

Automated by Prettier - see configuration in `.prettierrc.json`.

## Type System Best Practices

### Context Organization

When organizing context files, apply the same component structure pattern:

```typescript
// ✅ Good - Contexts in folders with types and model files
contexts/
  └── DeploymentContext/
      ├── index.ts                          # Barrel exports
      ├── DeploymentContext.tsx             # Context provider
      ├── DeploymentContext.types.ts        # Type definitions
      ├── DeploymentContext.model.ts        # Business logic
      └── helpers/                          # Context-specific helpers
          ├── BronzeModuleActivityConfig.ts
          └── PackageModulePreparer.ts

// ❌ Bad - Loose files at root level
contexts/
  ├── DeploymentContext.tsx
  ├── DeploymentContext.types.ts
  └── DeploymentContext.model.ts
```

### Import Path Corrections After Reorganization

When moving components into folders, remember to update import paths:

```typescript
// Before: Component at root level
import { Helper } from "../../helpers/UIHelper";

// After: Component nested in folder (add one more ../)
import { Helper } from "../../../helpers/UIHelper";
```

**Rule**: Each folder level adds one `../` to relative imports.

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
import type { ComponentProps } from "./ComponentName.types";
export const Component: React.FC<ComponentProps> = () => {};

// index.ts - Re-export types for external use
export * from "./ComponentName";
export * from "./ComponentName.types";
```

### Enum vs Type-Only Imports

**Critical Rule**: Enums are both types AND values at runtime.

```typescript
// ✅ Good - Regular import for enums used as values
import { StepId } from "./types";
if (step.id === StepId.Review) {
} // Runtime comparison

// ✅ Good - Type-only import for interfaces
import type { StepConfig } from "./types";
const config: StepConfig = {};

// ❌ Bad - Type-only import for enum used as value
import type { StepId } from "./types";
if (step.id === StepId.Review) {
} // ERROR: StepId not available at runtime
```

## Example: Before & After

### Before (Non-standard)

```
HeroSection/
  ├── HeroSection.tsx        # Contains types inline, styles use wrong constraint
  ├── HeroSection.styles.ts  # margin: 0 (numeric values)
  └── index.ts               # Just exports component

// HeroSection.styles.ts
export const useStyles = makeStyles({
  container: {
    margin: 0,          // ❌ Numeric value
    flex: 1,            // ❌ Numeric value
  },
});
```

### After (Standard)

```
HeroSection/
  ├── index.ts                    # Exports component AND types
  ├── HeroSection.tsx             # Imports types from .types.ts
  ├── HeroSection.types.ts        # All type definitions
  └── HeroSection.styles.ts       # Type-safe with satisfies

// HeroSection.styles.ts
import type { CSSProperties } from 'react';

export const useStyles = makeStyles({
  container: {
    margin: '0',        // ✅ String value
    flex: '1',          // ✅ String value
  },
} satisfies Record<string, CSSProperties>);
```
