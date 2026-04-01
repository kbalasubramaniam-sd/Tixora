# Tixora — Add / Edit User Form

## Design System
Apply all rules from `00-shared-layout.md`. This is a modal overlay that opens on top of the Admin: Users page (`11-admin.md`).

## Overview
A form modal for creating new portal users or editing existing ones. Used by the System Administrator from the User Management page.

## Modal Container

- Opens as a centered modal overlay
- Glassmorphism background: semi-transparent `surface-container-lowest` + `backdrop-blur: 16px`
- Overlay backdrop: `#171d1c` at 40% opacity
- Modal width: 560px
- Corner radius: `1.5rem`
- Padding: `spacing-8` (2rem) all sides
- Ambient shadow: `box-shadow: 0 10px 40px rgba(23, 29, 28, 0.06)`

## Layout

```
┌─────────────────────────────────────────────────┐
│  Add New User                              [×]  │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ Full Name *                             │    │
│  │ ┌─────────────────────────────────────┐ │    │
│  │ │ e.g., Ahmed Al Khoori              │ │    │
│  │ └─────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ Email Address *                         │    │
│  │ ┌─────────────────────────────────────┐ │    │
│  │ │ e.g., ahmed@company.com            │ │    │
│  │ └─────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ Password *                              │    │
│  │ ┌─────────────────────────────────────┐ │    │
│  │ │ ••••••••                      [👁]  │ │    │
│  │ └─────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ Role *                                  │    │
│  │ ┌─────────────────────────────────────┐ │    │
│  │ │ Select a role...              [▾]   │ │    │
│  │ └─────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │ Status                                  │    │
│  │ [●━━━━━━] Active                        │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Save    │  │  Cancel  │  │ Deactivate   │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Modal Header

- **Create mode:** "Add New User" in `headline-md` (1.5rem), `#171d1c`
- **Edit mode:** "Edit User" in `headline-md`
- **Close button (×):** Top right corner, tertiary style, `#3d4949`. Hover: `#171d1c`

## Field Specifications

### Full Name
- **Type:** Text input, required
- **Styling:** `surface-container-lowest` fill (slightly brighter than modal background), no border, `0.5rem` radius, 48px height, full width
- **Label:** Above field, `label-md` (0.75rem), `#3d4949`, Manrope Medium. Teal asterisk (*) for required
- **Placeholder:** "e.g., Ahmed Al Khoori" in `#3d4949` at 50% opacity
- **Focus state:** Background brightens + subtle teal ambient glow (4px blur, `#23a2a3` at 15%)
- **Validation:** Minimum 2 characters. Error shown inline below field: `label-sm`, `#d32f2f`
- **Edit mode:** Pre-filled with existing name, fully editable

### Email Address
- **Type:** Email input, required
- **Styling:** Same as Full Name
- **Placeholder:** "e.g., ahmed@company.com"
- **Validation:** Must be a valid email format. Shows error "Invalid email address" if not
- **Create mode:** Fully editable
- **Edit mode:** Read-only — field is grayed out (`opacity: 0.6`, cursor: not-allowed). Tooltip on hover: "Email cannot be changed after creation"

### Password
- **Type:** Password input, required on create only
- **Styling:** Same as Full Name, with a show/hide toggle icon on the right side of the input
- **Toggle icon:** Eye icon (`👁`), clicking toggles between password dots and visible text
- **Placeholder:** "Minimum 8 characters"
- **Validation:** Minimum 8 characters. Error: "Password must be at least 8 characters"
- **Create mode:** Visible and required
- **Edit mode:** Entirely hidden (not rendered). Password changes are handled separately via a "Reset Password" tertiary link shown in its place. Clicking "Reset Password" opens a small inline form with new password field + confirm button.

### Role
- **Type:** Dropdown select, required (single selection — one role per user)
- **Styling:** Same as text inputs — `surface-container-lowest` fill, no border, `0.5rem` radius, 48px height, full width
- **Label:** "Role" above field, `label-md`, `#3d4949`, with teal asterisk
- **Placeholder:** "Select a role..." in `#3d4949` at 50% opacity
- **Options:**
  - Requester
  - Reviewer
  - Approver
  - Integration Team
  - Provisioning Agent
  - System Administrator
- **Dropdown styling:** Glassmorphism panel below the select, same ambient shadow. Each option: `body-md`, `#171d1c`. Hover: subtle teal tint. Selected: teal text with checkmark.
- **Validation:** Must be selected. Error: "Select a role"
- **Edit mode:** Pre-selected with user's current role
- **Note:** Each user has exactly one role. All users have access to all products — no product scoping in MVP 1.

### Status
- **Type:** Toggle switch
- **Default (create):** Active (ON)
- **ON state:** Teal (`#23a2a3`) track, white circle knob. Label: "Active" in `body-md`, `#171d1c`
- **OFF state:** Gray (`#bcc9c8`) track. Label: "Inactive" in `body-md`, `#3d4949`
- **Smooth transition:** 200ms ease on toggle
- **Edit mode:** Reflects current user status

## Action Buttons

Bottom of modal, horizontal row with `spacing-3` gap:

### Save Button
- **Style:** Primary gradient (135deg from `#00696a` to `#23a2a3`), white text "Save", Manrope SemiBold 0.875rem
- **Width:** 120px, height: 44px, `0.5rem` radius
- **Disabled state:** When required fields are incomplete — gradient replaced with `#bcc9c8` flat, white text at 50% opacity, cursor: not-allowed
- **Loading state:** Text replaced with small white spinner (20px), button remains full width
- **Hover (enabled):** Gradient shifts slightly brighter, subtle `scale(1.01)`
- **Active:** `scale(0.99)`

### Cancel Button
- **Style:** Tertiary — no background, no border, teal text "Cancel"
- **Width:** auto, height: 44px
- **Hover:** Subtle `surface-container-low` background appears

### Deactivate Button (edit mode only)
- **Visibility:** Only rendered when editing an existing active user. Hidden on create and when editing an already-inactive user.
- **Style:** Secondary — ghost border (`#bcc9c8` at 20%) with red text "Deactivate" (`#c62828`)
- **Width:** auto, height: 44px
- **On click:** Opens a confirmation prompt (small inline card below the button, not a nested modal):
  ```
  ┌──────────────────────────────────────────┐
  │  Deactivate this user?                   │
  │  They will no longer be able to log in   │
  │  or receive ticket assignments.           │
  │                                          │
  │  [ Confirm ] (red gradient)  [ Cancel ]  │
  └──────────────────────────────────────────┘
  ```
- **Confirm button:** Red gradient (`#c62828` to `#d32f2f`), white text
- **On confirm:** PUT `/api/admin/users/{id}` with `{ isActive: false }` → toast → close modal

## Behavior

### Create Flow
1. Admin clicks "+ Add User" on User Management page
2. Modal opens with all fields empty, status defaulted to Active
3. Admin fills in all required fields
4. Save button enables when all required fields are valid
5. On Save click: POST `/api/admin/users` with form data
6. **Success:** Green toast "User created successfully", modal closes, user table refreshes with new user visible
7. **Error (duplicate email):** Inline error below email field: "A user with this email already exists"
8. **Error (server):** Red toast "Something went wrong. Please try again."

### Edit Flow
1. Admin clicks a row in the user table
2. Modal opens pre-filled with all user data. Email field is read-only. Password field is hidden (replaced with "Reset Password" link).
3. Admin modifies fields
4. On Save click: PUT `/api/admin/users/{id}` with updated data
5. **Success:** Green toast "User updated successfully", modal closes, table refreshes

### Close/Discard Behavior
- Clicking outside the modal or pressing Escape:
  - If no changes made: modal closes immediately
  - If unsaved changes exist: show inline prompt "Discard unsaved changes?" with Discard (tertiary red) / Keep Editing (tertiary) buttons
- Cancel button behaves the same as clicking outside

## Data Source
- POST `/api/admin/users` — create new user
- PUT `/api/admin/users/{id}` — update existing user
- GET `/api/admin/users/{id}` — fetch user data for edit mode (or passed from parent table row data)
