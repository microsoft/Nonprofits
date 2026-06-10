# Code Formatting & Style Guidelines — Power Pages React SPA

## Formatting Rules

This project uses **ESLint** (no Prettier). Formatting conventions match the MC4N monorepo `.editorconfig`.

| Rule | Value |
|------|-------|
| Indentation | Tabs |
| Quotes | Single quotes |
| Semicolons | Required |
| Trailing commas | ES5 style |
| Line endings | LF preferred |
| Max line length | No hard limit; keep readable |

### Lint Command
```bash
npm run lint
```

## TypeScript

- `strict: true` is enabled in `tsconfig.json`
- `noUnusedLocals` and `noUnusedParameters` are enabled
- Use `type` imports for type-only references: `import type { Foo } from '...'`
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use path alias `@/` instead of relative `../` paths

## React Patterns

### Component Structure
- Functional components only (no class components)
- Use `makeStyles` from `@fluentui/react-components` for styling — no CSS modules, no inline style objects (except one-off layout)
- Use Fluent UI v9 components exclusively — no Bootstrap, no custom CSS for UI elements
- Keep page-level components in `src/pages/`, reusable UI in `src/components/`

### State Management
- Component-level `useState` / `useReducer` for local state
- Custom hooks in `src/hooks/` for shared logic (e.g., `useAuth`)
- No external state library (no Redux, no Zustand)

### Routing
- react-router-dom v6 with `<Route>` definitions in `App.tsx`
- Power Pages appends trailing slashes to URLs — strip with `.replace(/\/$/, '')` when matching paths

## Service Layer (API)

### Architecture
- One service file per domain in `src/services/` (SRP)
- Core HTTP helpers in `apiClient.ts` (`apiGet`, `apiPost`, `apiPatch`, `apiDelete`)
- Barrel re-export in `api.ts` for backward compatibility

### Power Pages Web API Rules

1. **Anti-forgery token**: Required for POST/PATCH/DELETE. Fetched via `getToken()` in `apiClient.ts` and sent as `__RequestVerificationToken` header.

2. **`@odata.bind` casing**: Must match the **exact NavigationPropertyName** from Dataverse relationship metadata (camelCase, not lowercase). Example:
   ```typescript
   // CORRECT — matches NavigationPropertyName
   'msnfp_contactId@odata.bind': `/contacts(${contactId})`
   
   // WRONG — lowercase doesn't match
   'msnfp_contactid@odata.bind': `/contacts(${contactId})`
   ```

3. **PATCH payloads**: Only send explicitly known fields. Never spread an API response object into a PATCH body — it contains OData metadata (`@odata.etag`, formatted values) that Power Pages rejects.
   ```typescript
   // CORRECT — pick only editable fields
   const fields = { firstname: contact.firstname, lastname: contact.lastname };
   await apiPatch(`/_api/contacts(${id})`, fields);
   
   // WRONG — spreads OData metadata
   const { contactid, ...fields } = contact;
   await apiPatch(`/_api/contacts(${id})`, fields);
   ```

4. **Table permissions**: Every Dataverse table accessed via Web API needs:
   - `Webapi/<table>/enabled = true` site setting
   - `Webapi/<table>/fields` site setting listing allowed columns
   - A `.tablepermission.yml` file with appropriate scope, roles, and CRUD flags
   - For `@odata.bind` associations: `append: true` on source table, `appendto: true` on target table

5. **Anonymous vs authenticated calls**: Guard API calls that require authentication:
   ```typescript
   // Only call if user is signed in
   if (user) {
       const part = await fetchParticipation(user.contactId, engId);
   }
   ```

6. **Graceful 403 handling**: For data that may not be accessible to all roles, wrap in try/catch and return empty:
   ```typescript
   export async function fetchEngagements(): Promise<Engagement[]> {
       try {
           const data = await apiGet<{ value: Engagement[] }>(url);
           return data.value;
       } catch {
           return [];
       }
   }
   ```

## Deployment

```bash
# Full deploy pipeline
npm run deploy    # = build + upload + permissions:patch-roles

# Individual steps
npm run build                    # tsc && vite build
npm run upload                   # pac pages upload-code-site --rootPath .
npm run permissions:patch-roles  # Restores web roles stripped by PAC CLI
```

**Critical**: `permissions:patch-roles` must run after every upload. PAC CLI strips `adx_entitypermission_webrole` from table permission content JSON, causing 403 errors.

## Import Organization

### Order
1. React / React DOM
2. Third-party libraries (Fluent UI, react-router-dom)
3. Local components (`@/components/...`)
4. Hooks (`@/hooks/...`)
5. Services (`@/services/...`)
6. Types (`@/types/...` — use `import type`)

### Example
```typescript
import { useState, useEffect } from 'react';
import { makeStyles, Button, Text } from '@fluentui/react-components';
import { useNavigate } from 'react-router-dom';
import { EngagementCard } from '@/components/EngagementCard';
import { useAuth } from '@/hooks/useAuth';
import { fetchEngagements } from '@/services/api';
import type { Engagement } from '@/types';
```

---
*Project: volunteer-engagement-portal | Stack: React 18 + Vite 6 + Fluent UI v9 + Power Pages*