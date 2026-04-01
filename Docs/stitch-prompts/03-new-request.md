# Tixora — New Request (Ticket Creation Flow)

## Design System
Apply all rules from `00-shared-layout.md`. Renders inside the app shell.

## Overview
A multi-step wizard for creating a new ticket. The flow: Product Selection → Task Selection → Dynamic Form → Pre-submission Summary → Confirmation.

## Step Indicator (persistent across all steps)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ● Product  ──── ○ Task  ──── ○ Details  ──── ○ Review │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- Horizontal stepper at top of content area
- Completed steps: teal filled circle + teal line
- Current step: teal filled circle, pulsing subtle glow
- Future steps: `#bcc9c8` outline circle + gray line
- Step labels: `label-md` (0.75rem), teal for completed/current, `#3d4949` for future

---

## Step 1: Product Selection

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  "Select a Product" — headline-lg (2rem)                │
│  "Choose the platform this request relates to"          │
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │                     │  │                     │      │
│  │  Rabet              │  │  Rhoon              │      │
│  │  RBT · ICP          │  │  RHN · ADP + ITC    │      │
│  │  Portal + API       │  │  Portal + API       │      │
│  │                     │  │                     │      │
│  └─────────────────────┘  └─────────────────────┘      │
│                                                         │
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │                     │  │                     │      │
│  │  Wtheeq             │  │  Mulem              │      │
│  │  WTQ · ADP + ITC    │  │  MLM · Motor        │      │
│  │  API                │  │  API                │      │
│  │                     │  │                     │      │
│  └─────────────────────┘  └─────────────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Product Cards (2x2 grid)
- Each card: `surface-container-lowest` background, `0.5rem` radius, padding `spacing-6`
- **Product name:** `title-lg` (1.375rem), `#171d1c`, Manrope SemiBold
- **Product code + authority:** `label-md`, `#3d4949` (e.g., "RBT · Federal Authority ICP")
- **Access type chip:** below the authority line
  - "Portal + API" → `secondary-container` chip (`#c1eaea`, `#456b6b` text)
  - "API" → same chip style
- **Hover:** card lifts with ambient shadow, subtle teal tint on background
- **Selected:** teal left accent bar (4px), background shifts to slightly teal-tinted (`#f0fafa`)
- Click selects → auto-advances to Step 2 after 300ms

### Data Source
- GET `/api/products` — returns list with name, code, description, accessType

---

## Step 2: Task Selection

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  "What do you need?" — headline-lg                      │
│  "Select the type of request for [Product Name]"        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ T-01 · Agreement Validation & Sign-off          │    │
│  │ Validate and sign off a partner agreement       │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ T-02 · UAT Access Creation                      │    │
│  │ Request UAT environment access for a partner    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ T-03 · Production Account Creation              │    │
│  │ Set up production accounts and users for a      │    │
│  │ partner                                         │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ T-05 · Access & Credential Support              │    │
│  │ Resolve login or credential issues              │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [ ← Back ]                                             │
└─────────────────────────────────────────────────────────┘
```

### Task Cards (vertical list, full width)
- Each card: `surface-container-lowest`, padding `spacing-5`, radius `0.5rem`
- **Task code + name:** `title-md` (1.125rem), `#171d1c`
- **Description:** `body-sm` (0.8125rem), `#3d4949`
- Vertical spacing between cards: `spacing-4` (1rem)
- **Hover:** same lift effect as product cards
- **Selected:** teal left accent bar
- **Disabled state:** If lifecycle prereqs are not met, card is grayed out (`opacity: 0.5`) with a tooltip: "Requires completed [prerequisite task] for this partner"
- Click selects → advances to Step 3

### Lifecycle enforcement
- If user selects T-02 but partner has no T-01 completed → card disabled with message
- Enforced via GET `/api/products/{code}/tasks` which returns available tasks with eligibility status

### Back Button
- Tertiary style (text only), `#23a2a3`, left arrow icon
- Returns to Step 1 preserving selection

### Data Source
- GET `/api/products/{code}/tasks`

---

## Step 3: Dynamic Form

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  "Agreement Validation & Sign-off" — headline-lg        │
│  Product chip: [Rabet · RBT]     Task chip: [T-01]     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Partner Information                              │    │
│  │                                                  │    │
│  │ Partner Name        [________________]           │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Required Documents                               │    │
│  │                                                  │    │
│  │ Trade License       [Upload] ✓ uploaded          │    │
│  │ VAT Certificate     [Upload]                     │    │
│  │ Power of Attorney   [Upload]                     │    │
│  │ Duly Filled Agreement [Upload]                   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [ ← Back ]                    [ Review & Submit → ]    │
└─────────────────────────────────────────────────────────┘
```

### Form Structure
- Form sections are grouped in tonal containers (`surface-container-lowest` cards)
- Section headings: `title-md` (1.125rem), `#171d1c`
- Section spacing: `spacing-8` (2rem) between cards
- **Form fields are dynamic** — fetched from the API per Product × Task combination

### Field Styling
- All inputs: `surface-container-lowest` fill (slightly brighter than the card they sit on), no border, `0.5rem` radius, height 48px
- **Label:** Above field, `label-md` (0.75rem), `#3d4949`, Manrope Medium
- **Helper text:** Below field, `label-sm` (0.6875rem), `#3d4949` at 70% opacity
- **Required indicator:** Teal asterisk (*) next to label
- **Focus state:** Background brightens + subtle teal ambient glow (4px blur)
- **Validation error:** Field gets a soft red underline (2px, `#d32f2f` at 60%), error message below in `label-sm` red
- **Field spacing:** `spacing-4` (1rem) between fields

### Document Upload
- Each required doc: label on left, upload button on right
- Upload button: secondary style (ghost border + teal text), "Upload" with upload icon
- After upload: filename shown with checkmark icon (teal) and a remove (x) button
- Accepted formats: PDF, DOCX, XLSX, PNG, JPG. Max 10MB.
- Drag-and-drop zone: dashed `outline-variant` at 20% opacity, teal text "Drop file here"

### T-02 Form: UAT Access Creation
- **Partner Name** — lookup/select (required)
- **UAT User Details:**
  - Full Name (text, required)
  - Email (email, required)
  - Mobile (text, required)
  - Designation (text, required)
  - Company Code (text, required)

### T-03 Form: Production Account Creation
Partner Name and Company Code are **inferred from lifecycle** — displayed as disabled/prepopulated fields, not user input.

- **Account Info:**
  - Company Code (text, disabled — prepopulated from T-02)
  - API Opt-In Selection (toggle for "Both" products; always on for API-only products)

- **Portal Admin User:**
  - Full Name (text, required)
  - Email (email, required)
  - Mobile (text, required)
  - Designation (text, required)

- **Network:**
  - IP Addresses for Whitelisting (textarea, one per line)

- **Invoicing Information:**
  - Emails (dynamic list — add/remove email inputs, at least one required)
  - Phone Numbers (dynamic list — add/remove phone inputs, at least one required)
  - Dynamic: "Add Email" / "Add Phone" buttons with teal icon, remove (x) per row

- **Customer Support Contact Information:**
  - "Required for our CX team to handle incoming customer cases"
  - **First Level Contact** — dynamic list of { Name, Mobile, Email } (at least one required)
  - **First Level Escalation** — dynamic list of { Name, Mobile, Email } (at least one required)
  - **Second Level Escalation** — dynamic list of { Name, Mobile, Email } (at least one required)
  - Each contact row: 3 inline fields + remove (x) button. "Add Contact" below each level.

- **API Opt-In section** (only for "Both" products — Rabet, Rhoon):
  - Toggle: "Does this partner also require API access?"
  - Toggle OFF: API fields hidden
  - Toggle ON: additional section slides in (no extra fields beyond IP whitelisting above)
  - For API-only products (Wtheeq, Mulem): no toggle, API path always selected

### T-05 Form: Access & Credential Support
- **Issue Type** — dropdown driven by product access type:
  - Both products: "Portal login issue" | "API credential issue"
  - API products: "Portal password reset" | "API credential issue"
- **Description** — textarea for additional details about the issue (required)

### Navigation
- **Back button:** Tertiary, returns to Step 2
- **Review & Submit button:** Primary gradient CTA, disabled until all mandatory fields and documents are filled
- Show count of remaining mandatory items: "3 required fields remaining" in `label-sm`

### Data Source
- GET `/api/products/{code}/form-schema/{taskType}` — returns field definitions, required docs, conditional logic

---

## Step 4: Pre-submission Summary

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  "Review Your Request" — headline-lg                    │
│  "Please verify all details before submitting"          │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Product: Rabet (RBT)                             │    │
│  │ Task: T-01 · Agreement Validation & Sign-off     │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Partner Information                              │    │
│  │ Partner Name: ABC Insurance Co.                  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Documents (4 attached)                           │    │
│  │ ✓ Trade License — trade_lic.pdf (2.1 MB)        │    │
│  │ ✓ VAT Certificate — vat.pdf (0.8 MB)            │    │
│  │ ✓ Power of Attorney — poa.pdf (1.1 MB)          │    │
│  │ ✓ Duly Filled Agreement — agreement.pdf (1.4 MB)│    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [ ← Edit ]                          [ Submit → ]      │
└─────────────────────────────────────────────────────────┘
```

### Specifications
- Read-only display of all entered data, organized in the same sections as the form
- Each section: `surface-container-lowest` card
- Field labels: `label-md`, `#3d4949`. Field values: `body-md`, `#171d1c`
- Documents section shows filename, file size, and teal checkmark
- **Edit button:** Tertiary, returns to Step 3 with all data preserved
- **Submit button:** Primary gradient CTA, "Submit Request"
- On click: loading spinner, then POST to `/api/tickets`

---

## Step 5: Submission Confirmation

### Layout
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              ┌──────────────────────┐                   │
│              │                      │                   │
│              │   ✓ (large teal      │                   │
│              │      checkmark)      │                   │
│              │                      │                   │
│              │  Request Submitted   │                   │
│              │                      │                   │
│              │  SPM-RBT-T01-        │                   │
│              │  20260401-0001       │                   │
│              │                      │                   │
│              │  Routed to:          │                   │
│              │  Legal Review        │                   │
│              │                      │                   │
│              │ [View Ticket]        │                   │
│              │ [Create Another]     │                   │
│              └──────────────────────┘                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Specifications
- Centered card, same styling as login card (`1.5rem` radius, ambient shadow)
- Large teal checkmark icon (48px) with subtle pulse animation on load
- "Request Submitted" in `headline-md`, `#171d1c`
- Ticket ID in `title-lg`, `#23a2a3`, monospace-like weight (Manrope Bold)
- "Routed to: [First Stage Name]" in `body-md`, `#3d4949`
- **View Ticket button:** Primary gradient, navigates to ticket detail
- **Create Another button:** Secondary (ghost border), returns to Step 1
