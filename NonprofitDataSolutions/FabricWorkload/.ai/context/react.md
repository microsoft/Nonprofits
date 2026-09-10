# React + TypeScript Code Guidelines (2025)

## Project Setup & Management

- Use **bun** for package management and runtime
- Initialize with `bun create vite` using React + TypeScript template
- Install **TanStack Router** with `bun add @tanstack/react-router`
- Set up **shadcn/ui** components with `bunx shadcn-ui@latest init`
- Configure **Tailwind CSS v4** following their migration guide
- Enable **React 19** features and concurrent rendering

## Modern React Architecture (2025)

### Server Components & RSC

- Use **React Server Components** when possible for better performance
- Mark client components explicitly with `"use client"` directive
- Leverage server-side rendering for initial page loads
- Implement streaming with Suspense boundaries

### Component Patterns

- **File size limit**: Keep components under 300 lines
- Use **function components** exclusively (no class components)
- Implement **compound components** for complex UI patterns
- Prefer **composition** over prop drilling
- Use **render props** and **children as function** patterns sparingly

## State Management (2025)

### Built-in React State

- Use `useState` for local component state
- Use `useReducer` for complex state logic
- Leverage **React 19's use()** hook for promises and context
- Implement **optimistic updates** with `useOptimistic` and `useTransition`

### Global State Solutions

- **Zustand** for simple global state (`bun add zustand`)
- **Jotai** for atomic state management (`bun add jotai`)
- **TanStack Query** for server state (`bun add @tanstack/react-query`)
- Avoid Redux unless absolutely necessary

### Context Best Practices

- Split contexts by concern (auth, theme, etc.)
- Use `useMemo` to prevent unnecessary re-renders
- Implement context providers with value memoization
- Consider **Context + useReducer** for complex local state

## Modern Hooks & Patterns

### Custom Hooks

```typescript
//  Good: Focused, reusable hook
function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Implementation...

  return { user, loading, login, logout };
}

//  Good: Data fetching hook
function useUser(id: string) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => fetchUser(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

### Performance Optimization

- Use **React.memo()** for expensive components
- Implement **useMemo()** for expensive calculations
- Use **useCallback()** for stable function references
- Leverage **React.lazy()** and **Suspense** for code splitting
- Implement **virtual scrolling** for large lists

## Component Architecture

### Component Types

```typescript
//  Server Component (default)
async function UserProfile({ userId }: { userId: string }) {
  const user = await fetchUser(userId) // Server-side data fetching
  return <div>{user.name}</div>
}

//  Client Component (interactive)
"use client"
function InteractiveButton({ onClick }: { onClick: () => void }) {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>
}

//  Compound Component Pattern
function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>
}

Card.Header = function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="card-header">{children}</div>
}

Card.Body = function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="card-body">{children}</div>
}
```

### Props & TypeScript

```typescript
//  Good: Strict prop types
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}

//  Good: Generic components
interface ListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor: (item: T) => string
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>
          {renderItem(item, index)}
        </li>
      ))}
    </ul>
  )
}
```

## Data Fetching & Async Patterns

### TanStack Query Best Practices

```typescript
//  Good: Query with proper configuration
function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

//  Good: Mutation with optimistic updates
function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onMutate: async (newUser) => {
      await queryClient.cancelQueries({ queryKey: ["users"] });
      const previousUsers = queryClient.getQueryData(["users"]);

      queryClient.setQueryData(["users"], (old: User[]) => [
        ...old,
        { ...newUser, id: Date.now() }, // Optimistic ID
      ]);

      return { previousUsers };
    },
    onError: (err, newUser, context) => {
      queryClient.setQueryData(["users"], context?.previousUsers);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
```

### Suspense & Error Boundaries

```typescript
//  Good: Error boundary component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={<div>Something went wrong</div>}
      onError={(error) => console.error('Error caught:', error)}
    >
      {children}
    </ErrorBoundary>
  )
}

//  Good: Suspense with fallback
function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ErrorBoundary>
        <UserProfile userId="123" />
      </ErrorBoundary>
    </Suspense>
  )
}
```

## Form Handling (2025)

### React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18 years old')
})

type UserFormData = z.infer<typeof userSchema>

function UserForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema)
  })

  const onSubmit = async (data: UserFormData) => {
    try {
      await createUser(data)
    } catch (error) {
      // Handle error
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create User'}
      </button>
    </form>
  )
}
```

## Styling & UI (2025)

### Tailwind CSS v4 Best Practices

```typescript
//  Good: Consistent component styling
function Button({ variant, size, children, ...props }: ButtonProps) {
  const baseClasses = 'rounded-lg font-medium transition-colors focus:outline-none focus:ring-2'

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  const classes = cn(baseClasses, variants[variant], sizes[size])

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}
```

### CSS-in-JS Alternatives

- **Tailwind CSS v4** (recommended)
- **Panda CSS** for design tokens
- **StyleX** for Meta-style CSS-in-JS
- Avoid styled-components in favor of Tailwind

## Testing Strategy (2025)

### Testing Libraries

```bash
bun add -d @testing-library/react @testing-library/jest-dom vitest jsdom
bun add -d @testing-library/user-event happy-dom
```

### Component Testing

```typescript
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'

describe('Button', () => {
  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(<Button onClick={handleClick}>Click me</Button>)

    await user.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledOnce()
  })
})
```

## Code Organization & File Structure

```
src/
   app/                 # App router (if using Next.js)
   components/
      ui/             # shadcn/ui components
      features/       # business logic components
      layout/         # layout components
   hooks/              # custom React hooks
   lib/                # utilities, configurations
   stores/             # global state (Zustand/Jotai)
   types/              # TypeScript type definitions
   utils/              # helper functions
   __tests__/          # test files
```

## Essential Packages (2025)

### Core Dependencies

```bash
bun add @tanstack/react-router @tanstack/react-query
bun add react-hook-form @hookform/resolvers/zod zod
bun add zustand phosphor-react date-fns
bun add class-variance-authority clsx tailwind-merge
```

### Development Dependencies

```bash
bun add -d @types/react @types/react-dom
bun add -d @testing-library/react @testing-library/jest-dom
bun add -d vitest jsdom happy-dom
bun add -d eslint @typescript-eslint/eslint-plugin
bun add -d prettier eslint-plugin-react-hooks
```

## Performance Best Practices

### Bundle Optimization

- Use **dynamic imports** for code splitting
- Implement **tree shaking** with proper imports
- Leverage **React.lazy()** for route-based splitting
- Use **webpack-bundle-analyzer** to identify large bundles

### Runtime Performance

- Implement **virtualization** for large lists (react-window)
- Use **Web Workers** for heavy computations
- Implement **progressive loading** for images
- Leverage **Service Workers** for caching

### Memory Management

- Clean up **subscriptions** and **event listeners**
- Use **WeakMap** and **WeakSet** for temporary references
- Implement proper **cleanup** in useEffect
- Avoid **memory leaks** in custom hooks

## Accessibility (2025)

### WCAG 2.2 Compliance

- Use **semantic HTML** elements
- Implement **proper ARIA** attributes
- Ensure **keyboard navigation** works
- Maintain **color contrast** ratios
- Add **focus indicators** for all interactive elements

### Testing Accessibility

```bash
bun add -d @axe-core/react eslint-plugin-jsx-a11y
```

## Development Workflow

### Code Quality Tools

```bash
# ESLint configuration
bun add -d eslint @typescript-eslint/eslint-plugin
bun add -d eslint-plugin-react eslint-plugin-react-hooks
bun add -d eslint-plugin-jsx-a11y

# Prettier for formatting
bun add -d prettier

# Type checking
bun run tsc --noEmit
```

### Pre-commit Hooks

```bash
bun add -d husky lint-staged
# Configure to run linting and type checking before commits
```

## Bun Commands Reference

```bash
bun create vite my-app --template react-ts  # Initialize project
bun add <package>                           # Add dependency
bun add -d <package>                        # Add dev dependency
bun install                                 # Install dependencies
bun run dev                                 # Start dev server
bun run build                               # Build for production
bun run preview                             # Preview production build
bun run test                                # Run tests
bun run lint                                # Run ESLint
bun run type-check                          # TypeScript type checking
```

## 2025 React Trends to Embrace

- **React Server Components** for better performance
- **Concurrent rendering** with Suspense and Transitions
- **Fine-grained reactivity** with signals (experimental)
- **AI-powered development** tools and assistants
- **Web Components** integration with React
- **Edge-side rendering** and streaming
- **Progressive enhancement** strategies
