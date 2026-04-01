# S-02 New Request Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the multi-step ticket creation wizard — Product Selection → Task Selection → Dynamic Form → Pre-submission Review → Confirmation — wired to API endpoints with mock fallback.

**Architecture:** A wizard container manages step state and renders the active step component. Each step is its own file. Product and task data come from API hooks. The dynamic form (Step 3) uses React Hook Form + Zod for validation, with fields driven by the selected Product × Task combination. Mock data is provided for development.

**Tech Stack:** React, React Hook Form, Zod, TanStack Query, Tailwind CSS v4, existing UI components

**Stitch reference:** `frontend/.stitch-ref/new-request.html` — subagents MUST read this file for exact styling classes.

---

## File Map

```
frontend/src/
├── types/
│   └── product.ts                          # CREATE — Product, TaskOption, FormField types
├── api/
│   ├── endpoints/
│   │   └── products.ts                     # CREATE — product/task/form-schema API + mocks
│   └── hooks/
│       └── useProducts.ts                  # CREATE — TanStack Query hooks
├── components/
│   └── ui/
│       └── Stepper.tsx                     # CREATE — horizontal step indicator
├── pages/
│   └── NewRequest/
│       ├── index.tsx                       # CREATE — wizard container (step state)
│       ├── ProductStep.tsx                 # CREATE — product selection (2x2 grid)
│       ├── TaskStep.tsx                    # CREATE — task selection (vertical list)
│       ├── FormStep.tsx                    # CREATE — dynamic form (RHF + Zod)
│       ├── ReviewStep.tsx                  # CREATE — pre-submission summary
│       └── ConfirmationStep.tsx            # CREATE — success screen
├── App.tsx                                 # MODIFY — add /new-request route
```

---

### Task 1: Product & Form Types

**Files:**
- Create: `frontend/src/types/product.ts`

- [ ] **Step 1: Create src/types/product.ts**

```ts
import type { ProductCode, TaskType } from './enums'

export interface Product {
  code: ProductCode
  name: string
  description: string
  accessType: 'Portal + API' | 'API'
  icon: string
  bgIcon: string
}

export interface TaskOption {
  type: TaskType
  name: string
  description: string
  enabled: boolean
  disabledReason?: string
}

export interface FormFieldDefinition {
  name: string
  label: string
  type: 'text' | 'email' | 'textarea' | 'select' | 'date' | 'toggle' | 'file'
  required: boolean
  placeholder?: string
  helperText?: string
  options?: { label: string; value: string }[]
  section: string
  conditional?: { field: string; value: string | boolean }
}

export interface FormSchema {
  fields: FormFieldDefinition[]
  requiredDocuments: { name: string; label: string }[]
}

export interface TicketCreateRequest {
  productCode: ProductCode
  taskType: TaskType
  formData: Record<string, string | boolean>
  documents: { name: string; file: File }[]
}

export interface TicketCreateResponse {
  ticketId: string
  routedTo: string
}
```

- [ ] **Step 2: Commit**

```bash
cd frontend && git add -A && git commit -m "feat(s02): add product, task, and form schema types"
```

---

### Task 2: Products API Endpoints & Mock Data

**Files:**
- Create: `frontend/src/api/endpoints/products.ts`

- [ ] **Step 1: Create src/api/endpoints/products.ts**

```ts
import { apiClient } from '@/api/client'
import { ProductCode, TaskType } from '@/types/enums'
import type { Product, TaskOption, FormSchema, TicketCreateRequest, TicketCreateResponse } from '@/types/product'

// --- Mock data ---

const mockProducts: Product[] = [
  { code: ProductCode.RBT, name: 'Rabet', description: 'RBT · Federal Authority ICP', accessType: 'Portal + API', icon: 'hub', bgIcon: 'lan' },
  { code: ProductCode.RHN, name: 'Rhoon', description: 'RHN · ADP + ITC', accessType: 'Portal + API', icon: 'account_tree', bgIcon: 'cloud_sync' },
  { code: ProductCode.WTQ, name: 'Wtheeq', description: 'WTQ · ADP + ITC', accessType: 'API', icon: 'data_object', bgIcon: 'code' },
  { code: ProductCode.MLM, name: 'Mulem', description: 'MLM · Motor', accessType: 'API', icon: 'settings_input_component', bgIcon: 'directions_car' },
]

const mockTasks: Record<string, TaskOption[]> = {
  [ProductCode.RBT]: [
    { type: TaskType.T01, name: 'Agreement Validation & Sign-off', description: 'Validate and sign off a partner agreement', enabled: true },
    { type: TaskType.T02, name: 'UAT Access Creation', description: 'Request UAT environment access for a partner', enabled: true },
    { type: TaskType.T03, name: 'Partner Account Creation', description: 'Create a partner account on the platform', enabled: true },
    { type: TaskType.T04, name: 'User Account Creation', description: 'Create user accounts for an existing partner', enabled: false, disabledReason: 'Requires completed Partner Account (T-03)' },
    { type: TaskType.T05, name: 'Access & Credential Support', description: 'Resolve login or credential issues', enabled: false, disabledReason: 'Requires partner in ONBOARDED state' },
  ],
  [ProductCode.RHN]: [
    { type: TaskType.T01, name: 'Agreement Validation & Sign-off', description: 'Validate and sign off a partner agreement', enabled: true },
    { type: TaskType.T02, name: 'UAT Access Creation', description: 'Request UAT environment access for a partner', enabled: true },
    { type: TaskType.T03, name: 'Partner Account Creation', description: 'Create a partner account on the platform', enabled: true },
    { type: TaskType.T04, name: 'User Account Creation', description: 'Create user accounts for an existing partner', enabled: true },
    { type: TaskType.T05, name: 'Access & Credential Support', description: 'Resolve login or credential issues', enabled: true },
  ],
  [ProductCode.WTQ]: [
    { type: TaskType.T01, name: 'Agreement Validation & Sign-off', description: 'Validate and sign off a partner agreement', enabled: true },
    { type: TaskType.T02, name: 'UAT Access Creation', description: 'Request UAT environment access for a partner', enabled: true },
    { type: TaskType.T03, name: 'Partner Account Creation', description: 'Create a partner account on the platform', enabled: true },
    { type: TaskType.T04, name: 'User Account Creation', description: 'Create user accounts for an existing partner', enabled: true },
    { type: TaskType.T05, name: 'Access & Credential Support', description: 'Resolve login or credential issues', enabled: true },
  ],
  [ProductCode.MLM]: [
    { type: TaskType.T01, name: 'Agreement Validation & Sign-off', description: 'Validate and sign off a partner agreement', enabled: true },
    { type: TaskType.T02, name: 'UAT Access Creation', description: 'Request UAT environment access for a partner', enabled: true },
    { type: TaskType.T03, name: 'Partner Account Creation', description: 'Create a partner account on the platform', enabled: true },
    { type: TaskType.T04, name: 'User Account Creation', description: 'Create user accounts for an existing partner', enabled: true },
    { type: TaskType.T05, name: 'Access & Credential Support', description: 'Resolve login or credential issues', enabled: true },
  ],
}

const mockFormSchemas: Record<string, FormSchema> = {
  [`${ProductCode.RBT}-${TaskType.T01}`]: {
    fields: [
      { name: 'partnerName', label: 'Partner Name', type: 'text', required: true, placeholder: 'Enter partner company name', section: 'Partner Information' },
      { name: 'scope', label: 'Scope', type: 'text', required: true, placeholder: 'Full data exchange, partial, etc.', section: 'Partner Information' },
      { name: 'effectiveDate', label: 'Effective Date', type: 'date', required: true, section: 'Partner Information' },
      { name: 'commercialTerms', label: 'Commercial Terms', type: 'textarea', required: true, placeholder: 'Describe commercial terms', section: 'Partner Information' },
      { name: 'signatoryName', label: 'Signatory Name', type: 'text', required: true, placeholder: 'Full name of signatory', section: 'Signatory Details' },
      { name: 'signatoryTitle', label: 'Signatory Title', type: 'text', required: true, placeholder: 'Title / designation', section: 'Signatory Details' },
    ],
    requiredDocuments: [
      { name: 'agreementCopy', label: 'Agreement Copy' },
      { name: 'termLetter', label: 'Term Letter' },
      { name: 'vatCertificate', label: 'VAT Certificate' },
      { name: 'powerOfAttorney', label: 'Power of Attorney' },
    ],
  },
}

// Default fallback schema for any Product × Task not explicitly defined
const defaultFormSchema: FormSchema = {
  fields: [
    { name: 'partnerName', label: 'Partner Name', type: 'text', required: true, placeholder: 'Enter partner company name', section: 'Partner Information' },
    { name: 'description', label: 'Request Description', type: 'textarea', required: true, placeholder: 'Describe your request', section: 'Request Details' },
    { name: 'contactEmail', label: 'Contact Email', type: 'email', required: true, placeholder: 'email@example.com', section: 'Request Details' },
  ],
  requiredDocuments: [],
}

// --- API calls with mock fallback ---

export async function fetchProducts(): Promise<Product[]> {
  try {
    const res = await apiClient.get<Product[]>('/products')
    return res.data
  } catch {
    return mockProducts
  }
}

export async function fetchTasks(productCode: string): Promise<TaskOption[]> {
  try {
    const res = await apiClient.get<TaskOption[]>(`/products/${productCode}/tasks`)
    return res.data
  } catch {
    return mockTasks[productCode] ?? mockTasks[ProductCode.RBT]
  }
}

export async function fetchFormSchema(productCode: string, taskType: string): Promise<FormSchema> {
  try {
    const res = await apiClient.get<FormSchema>(`/products/${productCode}/form-schema/${taskType}`)
    return res.data
  } catch {
    return mockFormSchemas[`${productCode}-${taskType}`] ?? defaultFormSchema
  }
}

export async function submitTicket(request: TicketCreateRequest): Promise<TicketCreateResponse> {
  try {
    const res = await apiClient.post<TicketCreateResponse>('/tickets', request)
    return res.data
  } catch {
    // Dev mock: generate fake ticket ID
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const seq = String(Math.floor(Math.random() * 9999)).padStart(4, '0')
    return {
      ticketId: `SPM-${request.productCode}-${request.taskType}-${date}-${seq}`,
      routedTo: 'Legal Review',
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd frontend && git add -A && git commit -m "feat(s02): add products API endpoints with mock data"
```

---

### Task 3: TanStack Query Hooks for Products

**Files:**
- Create: `frontend/src/api/hooks/useProducts.ts`

- [ ] **Step 1: Create src/api/hooks/useProducts.ts**

```ts
import { useQuery, useMutation } from '@tanstack/react-query'
import { fetchProducts, fetchTasks, fetchFormSchema, submitTicket } from '@/api/endpoints/products'
import type { TicketCreateRequest } from '@/types/product'

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  })
}

export function useTasks(productCode: string | null) {
  return useQuery({
    queryKey: ['tasks', productCode],
    queryFn: () => fetchTasks(productCode!),
    enabled: !!productCode,
  })
}

export function useFormSchema(productCode: string | null, taskType: string | null) {
  return useQuery({
    queryKey: ['form-schema', productCode, taskType],
    queryFn: () => fetchFormSchema(productCode!, taskType!),
    enabled: !!productCode && !!taskType,
  })
}

export function useSubmitTicket() {
  return useMutation({
    mutationFn: (request: TicketCreateRequest) => submitTicket(request),
  })
}
```

- [ ] **Step 2: Commit**

```bash
cd frontend && git add -A && git commit -m "feat(s02): add TanStack Query hooks for products, tasks, form schema"
```

---

### Task 4: Stepper UI Component

**Files:**
- Create: `frontend/src/components/ui/Stepper.tsx`

**IMPORTANT:** Read `frontend/.stitch-ref/new-request.html` lines 146-178 for the exact Stitch stepper classes.

- [ ] **Step 1: Create src/components/ui/Stepper.tsx**

The subagent must read `frontend/.stitch-ref/new-request.html` and extract the exact stepper styling. Key Stitch classes:

- Container: `flex items-center justify-between relative` with `max-w-4xl mx-auto mb-16`
- Background line: `absolute top-1/2 left-0 w-full h-[2px] bg-surface-container-highest -translate-y-1/2 z-0`
- Active step circle: `w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white shadow-[0_0_15px_rgba(35,162,163,0.4)] ring-4 ring-white`
- Completed step circle: same as active but with `bg-primary` and a checkmark icon
- Future step circle: `w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant ring-4 ring-white`
- Active label: `text-[10px] font-bold uppercase tracking-widest text-primary`
- Future label: `text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50`

```tsx
import { cn } from '@/utils/cn'

interface Step {
  label: string
  icon: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn('max-w-4xl mx-auto mb-16', className)}>
      <div className="flex items-center justify-between relative">
        {/* Background line */}
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-surface-container-highest -translate-y-1/2 z-0" />

        {steps.map((step, i) => {
          const isCompleted = i < currentStep
          const isActive = i === currentStep
          const isFuture = i > currentStep

          return (
            <div key={step.label} className="relative z-10 flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center ring-4 ring-white',
                  isCompleted && 'bg-primary text-white',
                  isActive && 'bg-primary-container text-white shadow-[0_0_15px_rgba(35,162,163,0.4)]',
                  isFuture && 'bg-surface-container-highest text-on-surface-variant',
                )}
              >
                <span
                  className="material-symbols-outlined text-xl"
                  style={isCompleted || isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {isCompleted ? 'check' : step.icon}
                </span>
              </div>
              <span
                className={cn(
                  'absolute -bottom-7 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap',
                  isCompleted && 'text-primary',
                  isActive && 'text-primary',
                  isFuture && 'text-on-surface-variant/50',
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd frontend && git add -A && git commit -m "feat(s02): add Stepper UI component matching Stitch design"
```

---

### Task 5: Product Selection Step

**Files:**
- Create: `frontend/src/pages/NewRequest/ProductStep.tsx`

**IMPORTANT:** Read `frontend/.stitch-ref/new-request.html` lines 184-267 for the exact product card styling.

- [ ] **Step 1: Create src/pages/NewRequest/ProductStep.tsx**

The subagent must read `frontend/.stitch-ref/new-request.html` and copy the exact card classes. Key structure per card:

- Container: `group relative bg-surface-container-lowest rounded-xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(23,29,28,0.08)] cursor-pointer overflow-hidden`
- Background icon (decorative): `absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity` with `material-symbols-outlined text-6xl`
- Icon box: `w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center group-hover:bg-primary-container/10 transition-colors`
- Access type chip: Portal+API uses `bg-secondary-container text-on-secondary-container`, API uses `bg-surface-container-highest text-on-surface-variant`
- Both chips: `px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`
- Product name: `text-2xl font-bold text-on-surface mb-2`
- Description: `text-on-surface-variant font-medium leading-relaxed`
- CTA: `mt-8 flex items-center text-primary font-bold text-sm` with arrow icon

```tsx
import { useProducts } from '@/api/hooks/useProducts'
import type { Product } from '@/types/product'
import type { ProductCode } from '@/types/enums'

interface ProductStepProps {
  onSelect: (product: Product) => void
}

export function ProductStep({ onSelect }: ProductStepProps) {
  const { data: products, isLoading } = useProducts()

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <div className="h-8 w-64 bg-surface-container-low rounded animate-pulse mb-2" />
          <div className="h-5 w-96 bg-surface-container-low rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl p-8 animate-pulse h-52" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-[2rem] font-bold text-on-surface tracking-tight mb-2 leading-tight">
          Select a Product
        </h1>
        <p className="text-on-surface-variant text-lg leading-relaxed">
          Choose the platform this request relates to
        </p>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {products?.map((product) => (
          <div
            key={product.code}
            onClick={() => onSelect(product)}
            className="group relative bg-surface-container-lowest rounded-xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(23,29,28,0.08)] cursor-pointer overflow-hidden"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onSelect(product) }}
          >
            {/* Decorative background icon */}
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <span className="material-symbols-outlined text-6xl">{product.bgIcon}</span>
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center group-hover:bg-primary-container/10 transition-colors">
                  <span className="material-symbols-outlined text-primary">{product.icon}</span>
                </div>
                <span
                  className={
                    product.accessType === 'Portal + API'
                      ? 'bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider'
                      : 'bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider'
                  }
                >
                  {product.accessType}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-on-surface mb-2">{product.name}</h3>
              <p className="text-on-surface-variant font-medium leading-relaxed">{product.description}</p>
              <div className="mt-8 flex items-center text-primary font-bold text-sm">
                <span>Select Platform</span>
                <span className="material-symbols-outlined ml-2 text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Help section */}
      <div className="mt-12">
        <div className="bg-surface-container-low rounded-xl p-6 flex items-center gap-6">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <span className="material-symbols-outlined text-warning">info</span>
          </div>
          <div>
            <h4 className="text-on-surface font-bold text-sm uppercase tracking-wider mb-1">Need assistance?</h4>
            <p className="text-on-surface-variant text-sm">
              If you don't see the product you need, contact your department administrator or reach out to Support.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd frontend && git add -A && git commit -m "feat(s02): add ProductStep matching Stitch design exactly"
```

---

### Task 6: Task Selection Step

**Files:**
- Create: `frontend/src/pages/NewRequest/TaskStep.tsx`

- [ ] **Step 1: Create src/pages/NewRequest/TaskStep.tsx**

```tsx
import { useTasks } from '@/api/hooks/useProducts'
import type { Product, TaskOption } from '@/types/product'
import { cn } from '@/utils/cn'

interface TaskStepProps {
  product: Product
  onSelect: (task: TaskOption) => void
  onBack: () => void
}

export function TaskStep({ product, onSelect, onBack }: TaskStepProps) {
  const { data: tasks, isLoading } = useTasks(product.code)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-[2rem] font-bold text-on-surface tracking-tight mb-2 leading-tight">
          What do you need?
        </h1>
        <p className="text-on-surface-variant text-lg leading-relaxed">
          Select the type of request for <span className="font-bold text-on-surface">{product.name}</span>
        </p>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {isLoading ? (
          [1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-surface-container-lowest rounded-xl p-6 animate-pulse h-20" />
          ))
        ) : (
          tasks?.map((task) => (
            <div
              key={task.type}
              onClick={() => task.enabled && onSelect(task)}
              className={cn(
                'group relative bg-surface-container-lowest rounded-xl p-6 transition-all duration-300 overflow-hidden',
                task.enabled
                  ? 'cursor-pointer hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(23,29,28,0.08)]'
                  : 'opacity-50 cursor-not-allowed',
              )}
              role="button"
              tabIndex={task.enabled ? 0 : -1}
              onKeyDown={(e) => { if (e.key === 'Enter' && task.enabled) onSelect(task) }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-on-surface mb-1">
                    {task.type.replace('T0', 'T-0')} · {task.name}
                  </h3>
                  <p className="text-sm text-on-surface-variant">{task.description}</p>
                  {!task.enabled && task.disabledReason && (
                    <p className="text-xs text-error mt-2">{task.disabledReason}</p>
                  )}
                </div>
                {task.enabled && (
                  <span className="material-symbols-outlined text-primary transition-transform group-hover:translate-x-1">
                    arrow_forward
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Back button */}
      <button
        onClick={onBack}
        className="mt-8 flex items-center text-primary font-bold text-sm hover:text-primary-container transition-colors"
      >
        <span className="material-symbols-outlined mr-1 text-sm">arrow_back</span>
        Back to Products
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd frontend && git add -A && git commit -m "feat(s02): add TaskStep with lifecycle-disabled states"
```

---

### Task 7: Dynamic Form Step

**Files:**
- Create: `frontend/src/pages/NewRequest/FormStep.tsx`

- [ ] **Step 1: Create src/pages/NewRequest/FormStep.tsx**

```tsx
import { useEffect, useMemo } from 'react'
import { useForm, type FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useFormSchema } from '@/api/hooks/useProducts'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Product, TaskOption, FormFieldDefinition } from '@/types/product'

interface FormStepProps {
  product: Product
  task: TaskOption
  initialData?: Record<string, string | boolean>
  onSubmit: (data: Record<string, string | boolean>) => void
  onBack: () => void
}

function buildZodSchema(fields: FormFieldDefinition[]) {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const field of fields) {
    if (field.type === 'toggle') {
      shape[field.name] = z.boolean().optional()
    } else if (field.required) {
      shape[field.name] = z.string().min(1, `${field.label} is required`)
    } else {
      shape[field.name] = z.string().optional()
    }
  }
  return z.object(shape)
}

function groupBySection(fields: FormFieldDefinition[]): Record<string, FormFieldDefinition[]> {
  const groups: Record<string, FormFieldDefinition[]> = {}
  for (const field of fields) {
    if (!groups[field.section]) groups[field.section] = []
    groups[field.section].push(field)
  }
  return groups
}

export function FormStep({ product, task, initialData, onSubmit, onBack }: FormStepProps) {
  const { data: schema, isLoading } = useFormSchema(product.code, task.type)

  const zodSchema = useMemo(
    () => (schema ? buildZodSchema(schema.fields) : z.object({})),
    [schema],
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<FieldValues>({
    resolver: zodResolver(zodSchema),
    mode: 'onChange',
    defaultValues: initialData ?? {},
  })

  // Reset form when schema loads
  useEffect(() => {
    if (schema && initialData) reset(initialData)
  }, [schema, initialData, reset])

  if (isLoading || !schema) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-surface-container-low rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  const sections = groupBySection(schema.fields)
  const errorCount = Object.keys(errors).length
  const fieldCount = schema.fields.filter((f) => f.required).length
  const filledCount = fieldCount - errorCount

  function onFormSubmit(data: FieldValues) {
    onSubmit(data as Record<string, string | boolean>)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-[2rem] font-bold text-on-surface tracking-tight mb-2 leading-tight">
          {task.name}
        </h1>
        <div className="flex items-center gap-3">
          <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {product.name} · {product.code}
          </span>
          <span className="bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {task.type.replace('T0', 'T-0')}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} noValidate>
        {/* Form sections */}
        {Object.entries(sections).map(([sectionName, fields]) => (
          <div key={sectionName} className="bg-surface-container-lowest rounded-xl p-8 mb-8">
            <h2 className="text-lg font-bold text-on-surface uppercase tracking-tight mb-6">{sectionName}</h2>
            <div className="space-y-5">
              {fields.map((field) => {
                const error = errors[field.name]?.message as string | undefined

                if (field.type === 'textarea') {
                  return (
                    <div key={field.name} className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-on-surface-variant">
                        {field.label}
                        {field.required && <span className="text-primary-container ml-0.5">*</span>}
                      </label>
                      <textarea
                        {...register(field.name)}
                        placeholder={field.placeholder}
                        rows={4}
                        className="px-4 py-3 rounded-lg bg-surface-container-lowest text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus-glow transition-shadow resize-none ghost-border"
                      />
                      {error && <p className="text-xs text-error">{error}</p>}
                      {field.helperText && !error && (
                        <p className="text-[0.6875rem] text-on-surface-variant/70">{field.helperText}</p>
                      )}
                    </div>
                  )
                }

                if (field.type === 'select' && field.options) {
                  return (
                    <div key={field.name} className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-on-surface-variant">
                        {field.label}
                        {field.required && <span className="text-primary-container ml-0.5">*</span>}
                      </label>
                      <select
                        {...register(field.name)}
                        className="h-12 px-4 rounded-lg bg-surface-container-lowest text-sm text-on-surface outline-none focus-glow transition-shadow ghost-border"
                      >
                        <option value="">Select...</option>
                        {field.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {error && <p className="text-xs text-error">{error}</p>}
                    </div>
                  )
                }

                return (
                  <Input
                    key={field.name}
                    {...register(field.name)}
                    type={field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text'}
                    label={field.label}
                    placeholder={field.placeholder}
                    helperText={field.helperText}
                    error={error}
                    required={field.required}
                  />
                )
              })}
            </div>
          </div>
        ))}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center text-primary font-bold text-sm hover:text-primary-container transition-colors"
          >
            <span className="material-symbols-outlined mr-1 text-sm">arrow_back</span>
            Back
          </button>
          <div className="flex items-center gap-4">
            <span className="text-xs text-on-surface-variant">
              {filledCount} of {fieldCount} required fields
            </span>
            <Button type="submit" className="shadow-lg shadow-primary/20 rounded-xl">
              Review &amp; Submit
              <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd frontend && git add -A && git commit -m "feat(s02): add FormStep with React Hook Form + Zod dynamic validation"
```

---

### Task 8: Review Step

**Files:**
- Create: `frontend/src/pages/NewRequest/ReviewStep.tsx`

- [ ] **Step 1: Create src/pages/NewRequest/ReviewStep.tsx**

```tsx
import { Button } from '@/components/ui/Button'
import type { Product, TaskOption } from '@/types/product'

interface ReviewStepProps {
  product: Product
  task: TaskOption
  formData: Record<string, string | boolean>
  onSubmit: () => void
  onBack: () => void
  isSubmitting: boolean
}

export function ReviewStep({ product, task, formData, onSubmit, onBack, isSubmitting }: ReviewStepProps) {
  const entries = Object.entries(formData).filter(([, v]) => v !== '' && v !== undefined)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-[2rem] font-bold text-on-surface tracking-tight mb-2 leading-tight">
          Review Your Request
        </h1>
        <p className="text-on-surface-variant text-lg leading-relaxed">
          Please verify all details before submitting
        </p>
      </div>

      {/* Product & Task */}
      <div className="bg-surface-container-lowest rounded-xl p-8 mb-8">
        <div className="flex items-center gap-3">
          <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {product.name} · {product.code}
          </span>
          <span className="bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            {task.type.replace('T0', 'T-0')} · {task.name}
          </span>
        </div>
      </div>

      {/* Form Data */}
      <div className="bg-surface-container-lowest rounded-xl p-8 mb-8">
        <h2 className="text-lg font-bold text-on-surface uppercase tracking-tight mb-6">Request Details</h2>
        <div className="space-y-4">
          {entries.map(([key, value]) => (
            <div key={key} className="flex justify-between items-start py-2">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className="text-sm font-medium text-on-surface text-right max-w-[60%]">
                {String(value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center text-primary font-bold text-sm hover:text-primary-container transition-colors"
        >
          <span className="material-symbols-outlined mr-1 text-sm">arrow_back</span>
          Edit Details
        </button>
        <Button
          onClick={onSubmit}
          loading={isSubmitting}
          className="shadow-lg shadow-primary/20 rounded-xl"
        >
          Submit Request
          <span className="material-symbols-outlined text-sm ml-1">send</span>
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd frontend && git add -A && git commit -m "feat(s02): add ReviewStep with read-only summary"
```

---

### Task 9: Confirmation Step

**Files:**
- Create: `frontend/src/pages/NewRequest/ConfirmationStep.tsx`

- [ ] **Step 1: Create src/pages/NewRequest/ConfirmationStep.tsx**

```tsx
import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'

interface ConfirmationStepProps {
  ticketId: string
  routedTo: string
}

export function ConfirmationStep({ ticketId, routedTo }: ConfirmationStepProps) {
  return (
    <div className="max-w-lg mx-auto text-center py-16">
      <div className="bg-surface-container-lowest rounded-3xl p-12 shadow-xl shadow-teal-900/5">
        {/* Checkmark */}
        <div className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center mx-auto mb-6">
          <span
            className="material-symbols-outlined text-4xl text-primary-container"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check_circle
          </span>
        </div>

        <h1 className="text-2xl font-extrabold text-on-surface mb-2">Request Submitted</h1>

        <p className="text-3xl font-extrabold text-primary tracking-tight mb-4">{ticketId}</p>

        <p className="text-on-surface-variant text-sm mb-8">
          Routed to: <span className="font-bold text-on-surface">{routedTo}</span>
        </p>

        <div className="flex flex-col gap-3">
          <Link to={`/tickets/${ticketId}`}>
            <Button className="w-full shadow-lg shadow-primary/20 rounded-xl">View Ticket</Button>
          </Link>
          <Link to="/new-request">
            <Button variant="secondary" className="w-full rounded-xl">Create Another</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd frontend && git add -A && git commit -m "feat(s02): add ConfirmationStep with ticket ID and routing info"
```

---

### Task 10: Wizard Container & Route

**Files:**
- Create: `frontend/src/pages/NewRequest/index.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create src/pages/NewRequest/index.tsx**

```tsx
import { useState } from 'react'
import { Stepper } from '@/components/ui/Stepper'
import { ProductStep } from './ProductStep'
import { TaskStep } from './TaskStep'
import { FormStep } from './FormStep'
import { ReviewStep } from './ReviewStep'
import { ConfirmationStep } from './ConfirmationStep'
import { useSubmitTicket } from '@/api/hooks/useProducts'
import type { Product, TaskOption } from '@/types/product'
import type { ProductCode, TaskType } from '@/types/enums'

const STEPS = [
  { label: 'Product', icon: 'category' },
  { label: 'Task', icon: 'assignment' },
  { label: 'Details', icon: 'edit_note' },
  { label: 'Review', icon: 'verified' },
]

export default function NewRequest() {
  const [step, setStep] = useState(0)
  const [product, setProduct] = useState<Product | null>(null)
  const [task, setTask] = useState<TaskOption | null>(null)
  const [formData, setFormData] = useState<Record<string, string | boolean>>({})
  const [result, setResult] = useState<{ ticketId: string; routedTo: string } | null>(null)

  const submitMutation = useSubmitTicket()

  function handleProductSelect(p: Product) {
    setProduct(p)
    setTask(null)
    setFormData({})
    setStep(1)
  }

  function handleTaskSelect(t: TaskOption) {
    setTask(t)
    setFormData({})
    setStep(2)
  }

  function handleFormSubmit(data: Record<string, string | boolean>) {
    setFormData(data)
    setStep(3)
  }

  async function handleFinalSubmit() {
    if (!product || !task) return
    const res = await submitMutation.mutateAsync({
      productCode: product.code as ProductCode,
      taskType: task.type as TaskType,
      formData,
      documents: [],
    })
    setResult(res)
    setStep(4)
  }

  // Confirmation is step 4 — no stepper shown
  if (step === 4 && result) {
    return <ConfirmationStep ticketId={result.ticketId} routedTo={result.routedTo} />
  }

  return (
    <div>
      <Stepper steps={STEPS} currentStep={step} />

      {step === 0 && <ProductStep onSelect={handleProductSelect} />}

      {step === 1 && product && (
        <TaskStep product={product} onSelect={handleTaskSelect} onBack={() => setStep(0)} />
      )}

      {step === 2 && product && task && (
        <FormStep
          product={product}
          task={task}
          initialData={formData}
          onSubmit={handleFormSubmit}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && product && task && (
        <ReviewStep
          product={product}
          task={task}
          formData={formData}
          onSubmit={handleFinalSubmit}
          onBack={() => setStep(2)}
          isSubmitting={submitMutation.isPending}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add /new-request route to App.tsx**

Import the NewRequest page with lazy loading and add it to the routes:

```tsx
import { lazy, Suspense } from 'react'
```

Add at top of file:
```tsx
const NewRequest = lazy(() => import('@/pages/NewRequest'))
```

Add route inside the protected shell routes (after the Dashboard index route):
```tsx
<Route path="new-request" element={<Suspense fallback={<div />}><NewRequest /></Suspense>} />
```

- [ ] **Step 3: Verify build**

```bash
cd frontend && npm run build
```

Must pass with zero errors.

- [ ] **Step 4: Commit**

```bash
cd frontend && git add -A && git commit -m "feat(s02): add NewRequest wizard container and /new-request route"
```

---

## Summary

| Task | What it builds | Files |
|------|---------------|-------|
| 1 | Product/form types | types/product.ts |
| 2 | Products API + mock data | api/endpoints/products.ts |
| 3 | TanStack Query hooks | api/hooks/useProducts.ts |
| 4 | Stepper UI component | components/ui/Stepper.tsx |
| 5 | Product Selection step | pages/NewRequest/ProductStep.tsx |
| 6 | Task Selection step | pages/NewRequest/TaskStep.tsx |
| 7 | Dynamic Form step (RHF + Zod) | pages/NewRequest/FormStep.tsx |
| 8 | Review step | pages/NewRequest/ReviewStep.tsx |
| 9 | Confirmation step | pages/NewRequest/ConfirmationStep.tsx |
| 10 | Wizard container + route | pages/NewRequest/index.tsx, App.tsx |

After this plan completes: the full New Request wizard is functional with Product → Task → Form → Review → Confirmation flow, mock data fallback, lifecycle-disabled task states, dynamic form validation, and the route wired in.
