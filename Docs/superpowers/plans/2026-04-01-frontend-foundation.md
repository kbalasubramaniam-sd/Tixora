# Frontend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the complete frontend foundation — design system, shared UI components, app shell with routing, auth layer, and API client — so that screen slices can be built independently on top of it.

**Architecture:** React SPA with Tailwind v4 (CSS-first config), React Router v7 (nested layouts), TanStack Query (server state), Radix UI (accessible primitives), React Hook Form + Zod (forms). The app shell renders a sidebar + top bar wrapping an `<Outlet />` for page content. Auth uses fake JWT from the backend.

**Tech Stack:** React 19, TypeScript, Vite 8, Tailwind CSS v4, React Router v7, TanStack Query v5, Radix UI, Axios, clsx + tailwind-merge

---

## File Map

```
frontend/
├── index.html                          # MODIFY — add Manrope font, update title
├── vite.config.ts                      # MODIFY — add Tailwind v4 plugin, path alias
├── tsconfig.app.json                   # MODIFY — add path alias
├── package.json                        # MODIFY — add all dependencies
├── src/
│   ├── index.css                       # REPLACE — Tailwind v4 @theme with design tokens
│   ├── main.tsx                        # REPLACE — providers (QueryClient, Router, Auth)
│   ├── App.tsx                         # REPLACE — route definitions
│   ├── App.css                         # DELETE
│   ├── assets/react.svg                # DELETE
│   ├── assets/vite.svg                 # DELETE
│   ├── assets/hero.png                 # DELETE
│   ├── utils/
│   │   └── cn.ts                       # CREATE — clsx + tailwind-merge utility
│   ├── types/
│   │   ├── user.ts                     # CREATE — User type, UserRole enum
│   │   └── enums.ts                    # CREATE — shared enums (TicketStatus, ProductCode, etc.)
│   ├── api/
│   │   └── client.ts                   # CREATE — Axios instance with auth interceptor
│   ├── contexts/
│   │   └── AuthContext.tsx             # CREATE — auth state, login/logout, JWT persistence
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx             # CREATE
│   │   │   ├── Card.tsx               # CREATE
│   │   │   ├── Chip.tsx               # CREATE
│   │   │   ├── Input.tsx              # CREATE
│   │   │   ├── Modal.tsx              # CREATE — Radix Dialog + glassmorphism
│   │   │   ├── EmptyState.tsx         # CREATE
│   │   │   └── Toast.tsx              # CREATE
│   │   └── layout/
│   │       ├── AppShell.tsx           # CREATE — sidebar + topbar + outlet
│   │       ├── TopBar.tsx             # CREATE
│   │       ├── Sidebar.tsx            # CREATE — role-adaptive nav
│   │       ├── ProtectedRoute.tsx     # CREATE
│   │       ├── ErrorBoundary.tsx      # CREATE
│   │       └── GlobalFallback.tsx     # CREATE
│   └── pages/
│       ├── Login.tsx                  # CREATE
│       └── Dashboard.tsx              # CREATE — placeholder for now
```

---

### Task 1: Install Dependencies & Configure Tooling

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/tsconfig.app.json`
- Modify: `frontend/index.html`
- Delete: `frontend/src/App.css`
- Delete: `frontend/src/assets/react.svg`
- Delete: `frontend/src/assets/vite.svg`
- Delete: `frontend/src/assets/hero.png`

- [ ] **Step 1: Install all dependencies**

```bash
cd frontend && npm install react-router@7 @tanstack/react-query@5 axios clsx tailwind-merge @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-toast @radix-ui/react-toggle react-hook-form @hookform/resolvers zod recharts
```

- [ ] **Step 2: Install Tailwind v4 dev dependencies**

```bash
cd frontend && npm install -D tailwindcss@4 @tailwindcss/vite@4
```

- [ ] **Step 3: Update vite.config.ts — add Tailwind plugin and path alias**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 4: Update tsconfig.app.json — add path alias**

Add inside `compilerOptions`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

(Merge with existing compilerOptions — keep all existing fields.)

- [ ] **Step 5: Update index.html — add Manrope font and title**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined" rel="stylesheet" />
    <title>Tixora | Powering Every Request</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: Delete Vite boilerplate files**

```bash
cd frontend && rm -f src/App.css src/assets/react.svg src/assets/vite.svg src/assets/hero.png
```

- [ ] **Step 7: Commit**

```bash
cd frontend && git add -A && git commit -m "chore: install dependencies and configure Tailwind v4, React Router, TanStack Query"
```

---

### Task 2: Design System — Tailwind v4 Theme & Utilities

**Files:**
- Replace: `frontend/src/index.css`
- Create: `frontend/src/utils/cn.ts`

- [ ] **Step 1: Replace src/index.css with Tailwind v4 theme**

```css
@import "tailwindcss";

@theme {
  /* Surface hierarchy */
  --color-surface: #f5fafa;
  --color-surface-container-lowest: #f8fdfc;
  --color-surface-container-low: #f0f5f4;
  --color-surface-container-highest: #dee3e3;

  /* Primary */
  --color-primary: #00696a;
  --color-primary-container: #23a2a3;
  --color-primary-fixed: #86f4f5;
  --color-on-primary: #ffffff;

  /* Text */
  --color-on-surface: #171d1c;
  --color-on-surface-variant: #3d4949;

  /* Secondary */
  --color-secondary-container: #c1eaea;
  --color-on-secondary-container: #456b6b;

  /* Outline */
  --color-outline-variant: #bcc9c8;

  /* Semantic */
  --color-error: #d32f2f;
  --color-error-container: #ffebee;
  --color-on-error: #ffffff;
  --color-warning: #e65100;
  --color-warning-container: #fff3e0;
  --color-success: #2e7d32;
  --color-success-container: #e8f5e9;

  /* Font */
  --font-sans: 'Manrope', sans-serif;

  /* Shadows */
  --shadow-ambient: 0 10px 40px rgba(23, 29, 28, 0.06);
}

/* Base styles */
body {
  margin: 0;
  font-family: var(--font-sans);
  color: var(--color-on-surface);
  background: var(--color-surface);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  min-height: 100svh;
}

/* Utility classes not expressible in Tailwind */
.gradient-primary {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-container) 100%);
}

.glass {
  background: rgba(248, 253, 252, 0.8);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* Focus glow for inputs */
.focus-glow:focus {
  box-shadow: 0 0 0 4px rgba(35, 162, 163, 0.15);
}

/* Ghost border */
.ghost-border {
  border: 1px solid rgba(188, 201, 200, 0.2);
}
```

- [ ] **Step 2: Create src/utils/cn.ts**

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 3: Verify Tailwind is working — update main.tsx temporarily**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <div className="flex items-center justify-center min-h-svh bg-surface">
      <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-ambient">
        <h1 className="text-4xl font-bold text-primary-container">Tixora</h1>
        <p className="text-sm text-on-surface-variant">Powering Every Request</p>
      </div>
    </div>
  </StrictMode>,
)
```

- [ ] **Step 4: Run dev server and verify**

```bash
cd frontend && npm run dev
```

Expected: centered card with "Tixora" in teal on a light background. Manrope font loaded. No Vite boilerplate.

- [ ] **Step 5: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: add Tailwind v4 design system with Tixora tokens and cn utility"
```

---

### Task 3: Type Definitions

**Files:**
- Create: `frontend/src/types/user.ts`
- Create: `frontend/src/types/enums.ts`

- [ ] **Step 1: Create src/types/enums.ts**

```ts
export enum ProductCode {
  RBT = 'RBT',
  RHN = 'RHN',
  WTQ = 'WTQ',
  MLM = 'MLM',
}

export enum TaskType {
  T01 = 'T01',
  T02 = 'T02',
  T03 = 'T03',
  T04 = 'T04',
  T05 = 'T05',
}

export enum TicketStatus {
  Draft = 'Draft',
  Submitted = 'Submitted',
  InReview = 'InReview',
  PendingRequesterAction = 'PendingRequesterAction',
  Approved = 'Approved',
  InProvisioning = 'InProvisioning',
  Completed = 'Completed',
  Rejected = 'Rejected',
  Cancelled = 'Cancelled',
  SlaBreached = 'SlaBreached',
}

export enum LifecycleState {
  None = 'None',
  Agreed = 'Agreed',
  UatActive = 'UatActive',
  Onboarded = 'Onboarded',
  Live = 'Live',
}

export enum SlaStatus {
  OnTrack = 'OnTrack',
  AtRisk = 'AtRisk',
  Critical = 'Critical',
  Breached = 'Breached',
}

export enum UserRole {
  Requester = 'Requester',
  Reviewer = 'Reviewer',
  Approver = 'Approver',
  IntegrationTeam = 'IntegrationTeam',
  ProvisioningAgent = 'ProvisioningAgent',
  SystemAdministrator = 'SystemAdministrator',
}
```

- [ ] **Step 2: Create src/types/user.ts**

```ts
import type { UserRole } from './enums'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  isActive: boolean
}

export interface AuthResponse {
  token: string
  user: User
}

export interface LoginRequest {
  email: string
  password: string
}
```

- [ ] **Step 3: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: add TypeScript type definitions for user and shared enums"
```

---

### Task 4: API Client

**Files:**
- Create: `frontend/src/api/client.ts`

- [ ] **Step 1: Create src/api/client.ts**

```ts
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('tixora_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-logout on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tixora_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)
```

- [ ] **Step 2: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: add Axios API client with auth interceptor"
```

---

### Task 5: Auth Context

**Files:**
- Create: `frontend/src/contexts/AuthContext.tsx`

- [ ] **Step 1: Create src/contexts/AuthContext.tsx**

```tsx
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { apiClient } from '@/api/client'
import type { User, AuthResponse, LoginRequest } from '@/types/user'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('tixora_token'),
  )
  const [isLoading, setIsLoading] = useState(true)

  // On mount, if we have a token, fetch the current user
  useEffect(() => {
    if (!token) {
      setIsLoading(false)
      return
    }

    apiClient
      .get<User>('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => {
        // Token is invalid — clear it
        localStorage.removeItem('tixora_token')
        setToken(null)
      })
      .finally(() => setIsLoading(false))
  }, [token])

  const login = useCallback(async (credentials: LoginRequest) => {
    const res = await apiClient.post<AuthResponse>('/auth/login', credentials)
    const { token: newToken, user: newUser } = res.data
    localStorage.setItem('tixora_token', newToken)
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('tixora_token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

- [ ] **Step 2: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: add AuthContext with JWT login, logout, and session restore"
```

---

### Task 6: Error Boundaries

**Files:**
- Create: `frontend/src/components/layout/ErrorBoundary.tsx`
- Create: `frontend/src/components/layout/GlobalFallback.tsx`

- [ ] **Step 1: Create src/components/layout/ErrorBoundary.tsx**

```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="bg-surface-container-lowest rounded-lg p-8 shadow-ambient max-w-md text-center">
            <div className="text-4xl mb-4">⚠</div>
            <h2 className="text-lg font-semibold text-on-surface mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-on-surface-variant mb-6">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="gradient-primary text-on-primary font-semibold text-sm px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

- [ ] **Step 2: Create src/components/layout/GlobalFallback.tsx**

```tsx
export function GlobalFallback() {
  return (
    <div className="flex items-center justify-center min-h-svh bg-surface">
      <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-ambient max-w-md text-center">
        <div className="text-5xl mb-4">⚠</div>
        <h1 className="text-xl font-bold text-on-surface mb-2">
          Tixora encountered an error
        </h1>
        <p className="text-sm text-on-surface-variant mb-6">
          Please refresh the page. If the problem persists, contact your system administrator.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="gradient-primary text-on-primary font-semibold text-sm px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          Refresh Page
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: add ErrorBoundary and GlobalFallback components"
```

---

### Task 7: Core UI Components — Button, Card, Chip, Input

**Files:**
- Create: `frontend/src/components/ui/Button.tsx`
- Create: `frontend/src/components/ui/Card.tsx`
- Create: `frontend/src/components/ui/Chip.tsx`
- Create: `frontend/src/components/ui/Input.tsx`

- [ ] **Step 1: Create src/components/ui/Button.tsx**

```tsx
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'gradient-primary text-on-primary font-semibold hover:opacity-90 active:scale-[0.99]',
  secondary: 'ghost-border text-primary-container font-medium hover:bg-surface-container-low',
  tertiary: 'text-primary-container font-medium hover:bg-surface-container-low',
  danger: 'ghost-border text-error font-medium hover:bg-error-container',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 rounded',
  md: 'text-sm px-5 py-2.5 rounded-lg',
  lg: 'text-sm px-6 py-3 rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 transition-all duration-150',
          variantStyles[variant],
          sizeStyles[size],
          (disabled || loading) && 'opacity-50 pointer-events-none',
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : null}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'
```

- [ ] **Step 2: Create src/components/ui/Card.tsx**

```tsx
import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

type CardSurface = 'lowest' | 'low' | 'base' | 'highest'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  surface?: CardSurface
  children: ReactNode
}

const surfaceStyles: Record<CardSurface, string> = {
  lowest: 'bg-surface-container-lowest',
  low: 'bg-surface-container-low',
  base: 'bg-surface',
  highest: 'bg-surface-container-highest',
}

export function Card({ surface = 'lowest', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-lg p-5', surfaceStyles[surface], className)}
      {...props}
    >
      {children}
    </div>
  )
}
```

- [ ] **Step 3: Create src/components/ui/Chip.tsx**

```tsx
import type { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

type ChipVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: ChipVariant
}

const variantStyles: Record<ChipVariant, string> = {
  default: 'bg-secondary-container text-on-secondary-container',
  success: 'bg-success-container text-success',
  warning: 'bg-warning-container text-warning',
  error: 'bg-error-container text-error',
  info: 'bg-secondary-container text-on-secondary-container',
}

export function Chip({ variant = 'default', className, children, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
```

- [ ] **Step 4: Create src/components/ui/Input.tsx**

```tsx
import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-on-surface-variant">
            {label}
            {props.required && <span className="text-primary-container ml-0.5">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-12 px-4 rounded-lg bg-surface-container-lowest text-sm text-on-surface',
            'placeholder:text-on-surface-variant/50 outline-none transition-shadow',
            'focus-glow',
            error && 'shadow-[inset_0_-2px_0_0_rgba(211,47,47,0.6)]',
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-error">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-[0.6875rem] text-on-surface-variant/70">{helperText}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
```

- [ ] **Step 5: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: add Button, Card, Chip, and Input UI components"
```

---

### Task 8: Modal, EmptyState, and Toast Components

**Files:**
- Create: `frontend/src/components/ui/Modal.tsx`
- Create: `frontend/src/components/ui/EmptyState.tsx`
- Create: `frontend/src/components/ui/Toast.tsx`

- [ ] **Step 1: Create src/components/ui/Modal.tsx**

```tsx
import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onOpenChange, title, description, children, className }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm transition-opacity duration-200" />
        <Dialog.Content
          className={cn(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            'glass rounded-3xl p-8 shadow-ambient',
            'w-full max-w-md max-h-[85vh] overflow-y-auto',
            'transition-all duration-200',
            className,
          )}
        >
          <Dialog.Title className="text-lg font-semibold text-on-surface">
            {title}
          </Dialog.Title>
          {description && (
            <Dialog.Description className="text-sm text-on-surface-variant mt-1">
              {description}
            </Dialog.Description>
          )}
          <div className="mt-6">{children}</div>
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
              aria-label="Close"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

- [ ] **Step 2: Create src/components/ui/EmptyState.tsx**

```tsx
interface EmptyStateProps {
  icon?: string
  title: string
  description: string
}

export function EmptyState({ icon = 'inbox', title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-4">
        {icon}
      </span>
      <h3 className="text-base font-semibold text-on-surface mb-1">{title}</h3>
      <p className="text-sm text-on-surface-variant max-w-sm">{description}</p>
    </div>
  )
}
```

- [ ] **Step 3: Create src/components/ui/Toast.tsx**

A simple toast system using React state. We'll keep this lightweight — no Radix Toast for now since we just need bottom-right auto-dismiss.

```tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 5000)
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'glass rounded-lg px-4 py-3 shadow-ambient text-sm font-medium',
              'transition-all duration-300',
              t.type === 'success' && 'bg-success-container/80 text-success',
              t.type === 'error' && 'bg-error-container/80 text-error',
              t.type === 'info' && 'bg-secondary-container/80 text-on-secondary-container',
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
```

- [ ] **Step 4: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: add Modal (glassmorphism), EmptyState, and Toast components"
```

---

### Task 9: Login Page

**Files:**
- Create: `frontend/src/pages/Login.tsx`

- [ ] **Step 1: Create src/pages/Login.tsx**

Reference: Stitch login screen (project `14130211189051506529`, screen `c7822683cc5b43dfa4a96ebe8bc20981`) and `Docs/stitch-prompts/01-login.md`.

```tsx
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login({ email, password })
      navigate('/', { replace: true })
    } catch {
      setError('Invalid email or password')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-svh bg-surface bg-[radial-gradient(circle_at_50%_50%,rgba(35,162,163,0.03),transparent_70%)]">
      <div className="w-full max-w-[400px] bg-surface-container-lowest rounded-3xl p-8 shadow-ambient">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-container tracking-tight">
            Tixora
          </h1>
          <p className="text-xs font-medium text-on-surface-variant mt-1">
            Powering Every Request
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            autoComplete="email"
          />

          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
              tabIndex={-1}
            >
              <span className="material-symbols-outlined text-xl">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </button>
          </div>

          <div className="mt-2">
            <Button
              type="submit"
              loading={loading}
              size="lg"
              className="w-full"
            >
              Sign In
            </Button>
          </div>

          {error && (
            <p className="text-xs text-error text-center">{error}</p>
          )}
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: add Login page matching Stitch design"
```

---

### Task 10: App Shell — Sidebar and TopBar

**Files:**
- Create: `frontend/src/components/layout/TopBar.tsx`
- Create: `frontend/src/components/layout/Sidebar.tsx`
- Create: `frontend/src/components/layout/AppShell.tsx`
- Create: `frontend/src/components/layout/ProtectedRoute.tsx`

- [ ] **Step 1: Create src/components/layout/TopBar.tsx**

```tsx
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Chip } from '@/components/ui/Chip'

export function TopBar() {
  const { user, logout } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`
    : '??'

  return (
    <header className="fixed top-0 left-0 right-0 h-16 glass z-40 flex items-center px-6 gap-4">
      {/* Logo */}
      <div className="flex flex-col mr-4">
        <span className="text-xl font-bold text-primary-container leading-tight">Tixora</span>
        <span className="text-[0.6875rem] text-on-surface-variant leading-tight">
          Powering Every Request
        </span>
      </div>

      {/* Global Search */}
      <div className="flex-1 flex justify-center">
        <div className="relative w-full max-w-[480px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
            search
          </span>
          <input
            type="text"
            placeholder="Search tickets, partners, users..."
            className="w-full h-10 pl-10 pr-4 rounded-full bg-surface-container-low text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus-glow transition-shadow"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button className="relative p-2 rounded-lg hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
          {/* Unread badge — hardcoded for now, will be dynamic */}
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary-container text-on-primary text-[10px] font-bold flex items-center justify-center">
            3
          </span>
        </button>

        {/* User avatar */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-9 h-9 rounded-full bg-primary-container text-on-primary text-sm font-semibold flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            {initials}
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-12 w-56 glass rounded-xl p-4 shadow-ambient z-50">
                <p className="text-sm font-semibold text-on-surface">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-on-surface-variant">{user?.email}</p>
                <Chip className="mt-2">{user?.role}</Chip>
                <button
                  onClick={logout}
                  className="mt-4 w-full text-left text-sm text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Create src/components/layout/Sidebar.tsx**

```tsx
import { NavLink } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole } from '@/types/enums'
import { cn } from '@/utils/cn'

interface NavItem {
  label: string
  icon: string
  to: string
  roles?: UserRole[]
  isPrimary?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: 'dashboard', to: '/' },
  { label: 'My Tickets', icon: 'confirmation_number', to: '/my-tickets' },
  { label: 'Notifications', icon: 'notifications', to: '/notifications' },
  {
    label: 'New Request',
    icon: 'add_circle',
    to: '/new-request',
    roles: [UserRole.Requester, UserRole.SystemAdministrator],
    isPrimary: true,
  },
  {
    label: 'Team Queue',
    icon: 'inbox',
    to: '/team-queue',
    roles: [UserRole.Reviewer, UserRole.Approver, UserRole.IntegrationTeam, UserRole.ProvisioningAgent, UserRole.SystemAdministrator],
  },
  { label: 'Partners', icon: 'business', to: '/partners' },
  { label: 'Search', icon: 'search', to: '/search' },
]

const adminItems: NavItem[] = [
  { label: 'Users', icon: 'group', to: '/admin/users' },
  { label: 'Workflows', icon: 'account_tree', to: '/admin/workflows' },
  { label: 'SLA Settings', icon: 'schedule', to: '/admin/sla' },
  { label: 'Business Hours', icon: 'calendar_month', to: '/admin/business-hours' },
]

const reportItem: NavItem = {
  label: 'Reports',
  icon: 'bar_chart',
  to: '/reports',
  roles: [UserRole.Reviewer, UserRole.Approver, UserRole.SystemAdministrator],
}

export function Sidebar() {
  const { user } = useAuth()
  const role = user?.role

  const visibleNav = navItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role)),
  )
  const showAdmin = role === UserRole.SystemAdministrator
  const showReports = reportItem.roles?.includes(role!)

  return (
    <aside className="fixed left-0 top-16 bottom-6 w-60 bg-surface-container-low rounded-br-3xl z-30 flex flex-col py-4 px-3 overflow-y-auto">
      <nav className="flex flex-col gap-1 flex-1">
        {visibleNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                isActive
                  ? 'text-primary-container bg-surface-container-lowest'
                  : 'text-on-surface-variant hover:bg-surface-container-highest',
                item.isPrimary && !isActive && 'text-primary-container',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary-container" />
                )}
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}

        {showAdmin && (
          <>
            <div className="mt-4 mb-1 px-3">
              <span className="text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-wider">
                Admin
              </span>
            </div>
            {adminItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                    isActive
                      ? 'text-primary-container bg-surface-container-lowest'
                      : 'text-on-surface-variant hover:bg-surface-container-highest',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary-container" />
                    )}
                    <span className="material-symbols-outlined text-xl">{item.icon}</span>
                    {item.label}
                  </>
                )}
              </NavLink>
            ))}
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Reports at bottom */}
        {showReports && (
          <NavLink
            to="/reports"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative',
                isActive
                  ? 'text-primary-container bg-surface-container-lowest'
                  : 'text-on-surface-variant hover:bg-surface-container-highest',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary-container" />
                )}
                <span className="material-symbols-outlined text-xl">{reportItem.icon}</span>
                {reportItem.label}
              </>
            )}
          </NavLink>
        )}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 3: Create src/components/layout/AppShell.tsx**

```tsx
import { Outlet } from 'react-router'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { ErrorBoundary } from './ErrorBoundary'

export function AppShell() {
  return (
    <div className="min-h-svh bg-surface">
      <TopBar />
      <Sidebar />
      <main className="ml-60 pt-16 min-h-svh">
        <div className="p-8 transition-opacity duration-200">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 4: Create src/components/layout/ProtectedRoute.tsx**

```tsx
import { Navigate } from 'react-router'
import { useAuth } from '@/contexts/AuthContext'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-svh bg-surface">
        <div className="text-primary-container animate-spin">
          <span className="material-symbols-outlined text-4xl">progress_activity</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
```

- [ ] **Step 5: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: add AppShell with TopBar, role-adaptive Sidebar, and ProtectedRoute"
```

---

### Task 11: Router Setup & Placeholder Dashboard

**Files:**
- Create: `frontend/src/pages/Dashboard.tsx`
- Replace: `frontend/src/App.tsx`
- Replace: `frontend/src/main.tsx`

- [ ] **Step 1: Create src/pages/Dashboard.tsx — placeholder**

```tsx
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div>
      <h1 className="text-3xl font-semibold text-on-surface tracking-tight">
        Good morning, {user?.firstName}
      </h1>
      <div className="mt-1 mb-8">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-secondary-container text-on-secondary-container">
          {user?.role}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <p className="text-3xl font-semibold text-on-surface">—</p>
            <p className="text-xs text-on-surface-variant mt-1">Stat {i}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6 mt-8">
        <div className="col-span-3">
          <Card>
            <h2 className="text-lg font-semibold text-on-surface mb-4">Action Required</h2>
            <p className="text-sm text-on-surface-variant">No pending actions. Dashboard data will be wired in S-01.</p>
          </Card>
        </div>
        <div className="col-span-2">
          <Card>
            <h2 className="text-lg font-semibold text-on-surface mb-4">Recent Activity</h2>
            <p className="text-sm text-on-surface-variant">Activity timeline will be wired in S-01.</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Replace src/App.tsx — route definitions**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          {/* Screen slices will add routes here */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 3: Replace src/main.tsx — providers**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ToastProvider } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/layout/ErrorBoundary'
import { GlobalFallback } from '@/components/layout/GlobalFallback'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={<GlobalFallback />}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
```

- [ ] **Step 4: Run dev server and verify the full flow**

```bash
cd frontend && npm run dev
```

Expected behavior:
1. Visit `http://localhost:5173` → redirected to `/login` (no token)
2. Login page shows: centered card, Tixora branding, email/password fields, Sign In button
3. (Without backend running, login will fail — that's expected. The UI should render correctly.)

- [ ] **Step 5: Verify build succeeds**

```bash
cd frontend && npm run build
```

Expected: clean build, no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
cd frontend && git add -A && git commit -m "feat: wire up React Router, providers, Login page, and placeholder Dashboard"
```

---

## Summary

| Task | What it builds | Files |
|------|---------------|-------|
| 1 | Dependencies & tooling config | package.json, vite.config, tsconfig, index.html |
| 2 | Tailwind v4 theme + cn utility | index.css, utils/cn.ts |
| 3 | TypeScript types | types/user.ts, types/enums.ts |
| 4 | API client with auth interceptor | api/client.ts |
| 5 | Auth context (login/logout/JWT) | contexts/AuthContext.tsx |
| 6 | Error boundaries | layout/ErrorBoundary.tsx, layout/GlobalFallback.tsx |
| 7 | Core UI: Button, Card, Chip, Input | components/ui/*.tsx |
| 8 | Modal, EmptyState, Toast | components/ui/*.tsx |
| 9 | Login page | pages/Login.tsx |
| 10 | App shell: TopBar, Sidebar, ProtectedRoute | components/layout/*.tsx |
| 11 | Router setup, providers, placeholder Dashboard | App.tsx, main.tsx, pages/Dashboard.tsx |

After this plan completes, the app will have: working login screen, authenticated shell with role-adaptive sidebar, all core UI primitives, and a placeholder dashboard ready for S-01 to fill in.
