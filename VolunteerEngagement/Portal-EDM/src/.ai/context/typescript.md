## Project Setup & Management

- Use **bun** for package management and runtime
- Initialize with `bun create vite` using React + TypeScript template
- Install **TanStack Router** with `bun add @tanstack/react-router`
- Set up **shadcn/ui** components with `bunx shadcn-ui@latest init`
- Configure **Tailwind CSS v4** following their migration guide

## Routing Structure

- **File-based routing** with TanStack Router
- Place routes in `src/routes/` directory
- Use `_layout.tsx` for shared layouts
- Name route files descriptively: `dashboard.tsx`, `users.$userId.tsx`
- Implement route guards and loading states

## Component Architecture

- **File size limit**: Keep components under 300 lines
- Break large components into smaller, focused sub-components
- Use composition over inheritance
- Create reusable UI components in `src/components/ui/`
- Business logic components in `src/components/features/`

## Styling Guidelines

- **Tailwind CSS v4** for all styling - avoid custom CSS files
- Use shadcn/ui components as base building blocks
- Implement consistent design tokens through Tailwind config
- Prefer utility classes over component-level CSS
- Use Tailwind's responsive prefixes for mobile-first design

## Icons with Phosphor

- Install with `bun add phosphor-react`
- Import specific icons: `import { House, User, Settings } from 'phosphor-react'`
- Use consistent weight across app (regular, bold, light, etc.)
- Set default size and color via props: `<House size={24} weight="regular" />`
- Create icon wrapper component for consistent styling

## TypeScript Standards

- Enable strict mode in `tsconfig.json`
- Define interfaces for all props and API responses
- Use type guards for runtime type checking
- Leverage utility types (`Partial`, `Pick`, `Omit`)
- Create custom types in `src/types/` directory

## Code Organization

```
src/
├── components/
│   ├── ui/           # shadcn components
│   └── features/     # business components
├── routes/           # file-based routes
├── lib/             # utilities & config
├── hooks/           # custom React hooks
└── types/           # TypeScript definitions
```

## Best Practices

- Use custom hooks for shared logic
- Implement proper error boundaries
- Add loading states for async operations
- Use React Query/TanStack Query for data fetching
- Follow React naming conventions (PascalCase for components)
- Add JSDoc comments for complex component props
- Implement proper form validation with react-hook-form + zod

## Essential Packages

- **@tanstack/react-router** for routing
- **@tanstack/react-query** for data fetching
- **react-hook-form** + **zod** for forms
- **phosphor-react** for icons
- **date-fns** for date manipulation

## Bun Commands Reference

```bash
bun create vite          # Initialize project
bun add <package>        # Add dependency
bun add -d <package>     # Add dev dependency
bun install              # Install dependencies
bun run dev              # Start dev server
bun run build            # Build for production
```
