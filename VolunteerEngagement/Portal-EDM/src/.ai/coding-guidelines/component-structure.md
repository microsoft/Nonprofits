# Component & Page Structure Guidelines

## Folder-per-Component Pattern

Every component and page MUST live in its own folder with extracted styles and types. This applies to both `src/components/` and `src/pages/`.

### Folder Structure

```
ComponentName/
├── ComponentName.tsx        # Component implementation
├── ComponentName.styles.ts  # makeStyles hook (exported as useStyles)
├── ComponentName.types.ts   # Types, interfaces, constants (if any)
└── index.ts                 # Barrel re-export
```

### Rules

1. **Styles** — Extract all `makeStyles` calls into `ComponentName.styles.ts`. Export the hook as `useStyles`:
   ```typescript
   // ComponentName.styles.ts
   import { makeStyles, tokens } from '@fluentui/react-components';

   export const useStyles = makeStyles({
   	root: { ... },
   	header: { ... },
   });
   ```

2. **Types** — Extract local types, interfaces, and module-level constants into `ComponentName.types.ts`:
   ```typescript
   // ComponentName.types.ts
   export interface ComponentNameProps {
   	title: string;
   	onClose: () => void;
   }

   export type SortBy = 'date' | 'name';

   export const DEFAULT_PAGE_SIZE = 20;
   ```
   - Skip `.types.ts` if the component has no local types or constants (simple pages like NotFound, AccessDenied)
   - Shared/cross-cutting types still go in `src/types/`

3. **Barrel export** — Every folder has an `index.ts` that re-exports the component and optionally its types:
   ```typescript
   // index.ts (for default exports)
   export { default } from './ComponentName';

   // index.ts (for named exports)
   export { ComponentName } from './ComponentName';
   export type { ComponentNameProps } from './ComponentName.types';
   ```

4. **Component file** — Import styles and types from sibling files:
   ```typescript
   // ComponentName.tsx
   import { useStyles } from './ComponentName.styles';
   import type { ComponentNameProps } from './ComponentName.types';
   ```
   - Do NOT import `makeStyles` in the component file — it belongs in `.styles.ts`
   - Keep `tokens` import in whichever file uses it (often both `.styles.ts` and `.tsx`)

### When to Create Each File

| File | Create when... |
|------|---------------|
| `ComponentName.styles.ts` | Always — every component has at least some styles |
| `ComponentName.types.ts` | Component has local interfaces, types, enums, or module-level constants |
| `index.ts` | Always — provides clean import paths |

### Import Paths

With barrel exports, consumers import from the folder:
```typescript
// From App.tsx or other files
import Home from '@/pages/Home';              // resolves to Home/index.ts
import { EngagementCard } from '@/components/EngagementCard';
```

No changes needed to existing import paths when converting a flat file to a folder — the `index.ts` barrel maintains backward compatibility.
