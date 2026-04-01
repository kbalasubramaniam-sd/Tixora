# Tixora — Admin Pages

## Design System
Apply all rules from `00-shared-layout.md`. Renders inside the app shell. Only accessible to System Administrator role.

## Overview
Four admin sub-pages accessible from the sidebar under "Admin" section:
1. Users
2. Workflows
3. SLA Settings
4. Business Hours

> **MVP 2:** Partner Management (add/edit partners and company codes via UI). For MVP 1, partners are seeded data.

---

## Admin: Users

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  "User Management" — headline-lg                        │
│  [ + Add User ] (primary gradient button)               │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ 🔍 Search users...                               │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Name    │ Email   │ Role         │ Status │         │
│  ├─────────────────────────────────────────────────┤    │
│  │ Ahmed K │ ahmed@  │ [Reviewer]   │ Active │         │
│  │ Sara M  │ sara@   │ [Requester]  │ Active │         │
│  │ Omar R  │ omar@   │ [Admin]      │ Active │         │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### User Table
- Columns: Name | Email | Role (chip) | Status (Active/Inactive)
- Same table styling (alternating rows, no borders)
- Click row → opens edit modal
- Search bar above table, filters in real-time

### Add/Edit User Modal
- See `12-user-form.md` for the full user creation/edit form specification.
- Opens as a glassmorphism modal overlay from the user table.

### Data Source
- GET `/api/admin/users`
- POST `/api/admin/users`
- PUT `/api/admin/users/{id}`

---

## Admin: Workflows

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  "Workflow Configuration" — headline-lg                  │
│                                                         │
│  Product selector tabs: [Rabet] [Rhoon] [Wtheeq] [Mulem]│
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ T-01 · Agreement Validation                      │    │
│  │ Stages: Legal Review → Product Review → EA Signoff│   │
│  │ [ Edit ]                                         │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ T-02 · UAT Access Creation                       │    │
│  │ Stages: Product Review → Integration (Ph1 → Ph2) │   │
│  │ [ Edit ]                                         │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ T-03 · Production Account Creation                │    │
│  │ Portal: Partner Ops → Director → Provisioning    │    │
│  │ API: Partner Ops → Director → Integration        │    │
│  │ [ Edit ]                                         │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ T-04 · Access & Credential Support               │    │
│  │ Stages: Provisioning                             │    │
│  │ [ Edit ]                                         │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Product Tabs
- Horizontal tab bar at top
- Each tab: product name + code
- Active tab: teal underline
- Switching tabs shows that product's workflow configurations

### Workflow Cards (one per task)
- `surface-container-lowest` card
- **Task name:** `title-md`, `#171d1c`
- **Stage visualization:** horizontal pipeline showing stage names with arrows (→)
- T-03 shows both Portal and API paths
- **Edit button:** Secondary style, opens edit modal
- Card spacing: `spacing-4`

### Edit Workflow Modal (Glassmorphism)
- Shows the stage pipeline as editable:
  - Each stage: name, type (Review/Approval/Provisioning/PhaseGate), assigned role
  - Stages can be reordered (drag handle)
  - Add/remove stage buttons
- **Note:** "Changes apply to new tickets only. In-flight tickets continue on their current path."
- **Save** and **Cancel** buttons

### Data Source
- GET `/api/admin/workflow-config`
- PUT `/api/admin/workflow-config/{productCode}/{taskType}`

---

## Admin: SLA Settings

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  "SLA Configuration" — headline-lg                      │
│                                                         │
│  Product selector tabs: [Rabet] [Rhoon] [Wtheeq] [Mulem]│
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Task         │ Stage          │ SLA (hrs) │ 75% │ 90%│
│  ├─────────────────────────────────────────────────┤    │
│  │ T-01         │ Legal Review   │ [16]      │ [12]│[14]│
│  │              │ Product Review │ [16]      │ [12]│[14]│
│  │              │ EA Sign-off    │ [16]      │ [12]│[14]│
│  ├─────────────────────────────────────────────────┤    │
│  │ T-02         │ Product Review │ [4]       │ [3] │[3] │
│  │              │ Phase 1        │ [4]       │ [3] │[3] │
│  │              │ Phase 2        │ [TBD]     │     │    │
│  ├─────────────────────────────────────────────────┤    │
│  │ ...          │                │           │     │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [ Save Changes ] (primary)                             │
│  "Changes apply to new tickets only"                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### SLA Table
- Editable table with inline number inputs
- Columns: Task | Stage | SLA Hours | 75% Threshold | 90% Threshold
- Number inputs: small, `surface-container-lowest` fill, 60px wide
- Grouped by task type with visual separation (extra spacing between groups)
- **Save Changes** button: primary gradient, bottom of page
- Info note: "Changes apply to new tickets only. In-flight tickets retain their original SLA targets." in `label-sm`, `#3d4949`

### Data Source
- GET `/api/admin/sla-config`
- PUT `/api/admin/sla-config/{productCode}/{taskType}`

---

## Admin: Business Hours & Holidays

### Layout
```
┌─────────────────────────────────────────────────────────┐
│  "Business Hours & Holidays" — headline-lg              │
│                                                         │
│  ┌──────────────────────────┐ ┌────────────────────┐    │
│  │ Business Hours            │ │ Holiday Calendar   │    │
│  │                          │ │                    │    │
│  │ Working Days:            │ │ 2026               │    │
│  │ ☑ Sun ☑ Mon ☑ Tue       │ │                    │    │
│  │ ☑ Wed ☑ Thu ☐ Fri       │ │ 01 Jan — New Year  │    │
│  │ ☐ Sat                   │ │ 30 Mar — Eid       │    │
│  │                          │ │ 02 Dec — Nat. Day  │    │
│  │ Start: [08:00]           │ │ ...                │    │
│  │ End:   [17:00]           │ │                    │    │
│  │ Timezone: GST (UTC+4)   │ │ [ + Add Holiday ]  │    │
│  │                          │ │                    │    │
│  │ [ Save ]                 │ │                    │    │
│  └──────────────────────────┘ └────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Business Hours Card (left, 50%)
- Day checkboxes: Sun through Sat
- Start/End time: time picker inputs
- Timezone: display only (GST / UTC+4)
- **Save** button: primary

### Holiday Calendar Card (right, 50%)
- Year selector at top
- List of holidays: date + name + delete (x) button
- **Add Holiday** button: secondary, opens small modal with date picker + holiday name field
- Holidays sorted chronologically

### Delegate Approvers Section (below, full width)
```
┌─────────────────────────────────────────────────────────┐
│  "Delegate Approvers" — title-lg                        │
│  [ + Add Delegate ] (secondary button)                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Primary     │ Delegate   │ Scope    │ Period    │ x  │
│  ├─────────────────────────────────────────────────┤    │
│  │ Ahmed K     │ Sara M     │ Approver │ Permanent │ x  │
│  │ Omar R      │ Fatima H   │ EA       │ 5-12 Apr  │ x  │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- Table: Primary Approver | Delegate | Approval Scope | Period (Permanent / date range) | Delete
- **Add Delegate** modal: select primary approver, select delegate, select scope, choose permanent or time-bound
- Same table styling as elsewhere

### Data Source
- GET/PUT `/api/admin/business-hours`
- POST `/api/admin/holidays`
- DELETE `/api/admin/holidays/{id}`
- GET/POST/DELETE `/api/admin/delegates`
