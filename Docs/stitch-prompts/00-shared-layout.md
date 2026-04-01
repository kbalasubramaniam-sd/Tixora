# Tixora — Shared Layout & Navigation Shell

## Project Context
Tixora is an internal operations portal for managing partner-facing requests across 4 government-integrated platforms. Tagline: **"Powering Every Request"**. All users are internal employees. This is NOT a public-facing app.

## Design System Reference
Apply the design system from `Stitch_initialDesign.md` strictly:
- **Font:** Manrope throughout
- **No borders/dividers:** Use background color shifts (tonal layering) to separate sections
- **Surface hierarchy:** Base `#f5fafa` → `surface-container-low` `#f0f5f4` → `surface-container-highest` `#dee3e3`
- **Primary color:** Teal `#23a2a3` with gradient CTAs from `#00696a` to `#23a2a3` at 135deg
- **Text:** Never use `#000000`. Body text: `#171d1c`. Secondary text: `#3d4949`
- **Cards:** No border lines. Use tonal layering. Corner radius `0.5rem`
- **Buttons:** Primary = gradient + white text. Secondary = ghost border (`#bcc9c8` at 20% opacity) + teal text. Tertiary = text only.
- **Glassmorphism** for modals/popovers: semi-transparent background + `backdrop-blur: 16px`
- **Shadows:** `box-shadow: 0 10px 40px rgba(23, 29, 28, 0.06)` only for floating elements
- **Spacing:** Use 8px grid. `spacing-4` (1rem) between list items, `spacing-8` (2rem) between major sections

## App Shell Layout

### Structure
```
┌─────────────────────────────────────────────────────────┐
│  Top Bar (fixed, 64px height)                           │
│  ┌──────┬───────────────────────────────┬──────────────┐│
│  │ Logo │  Global Search Bar            │ 🔔 Avatar   ││
│  └──────┴───────────────────────────────┴──────────────┘│
├──────────┬──────────────────────────────────────────────┤
│ Sidebar  │  Main Content Area                           │
│ (240px)  │                                              │
│          │                                              │
│ Nav      │  Page content renders here                   │
│ Items    │                                              │
│          │                                              │
│          │                                              │
│          │                                              │
│          │                                              │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### Top Bar
- **Background:** `surface-container-lowest` (`#f8fdfc`) with glassmorphism effect
- **Left:** Tixora logo — the word "Tixora" in Manrope Bold 1.25rem, primary color `#23a2a3`. Below it in `0.6875rem` label text: "Powering Every Request" in `#3d4949`
- **Center:** Global search bar — rounded input (`border-radius: 2rem`), `surface-container-low` fill, placeholder text "Search tickets, partners, users..." in `#3d4949`. Search icon on left. Width: 480px max, centered.
- **Right:** Notification bell icon with unread count badge (small teal circle with white number). User avatar circle (initials) with dropdown on click showing: name, role, "Sign Out"

### Sidebar Navigation
- **Background:** `surface-container-low` (`#f0f5f4`)
- **Width:** 240px, does NOT reach the bottom of the screen — leaves 24px gap at bottom for the "floating sidebar" modern effect described in the design system
- **Corner radius:** `1.5rem` on bottom-right corner only
- **Nav items:** Each item is a row with icon + label. Manrope Medium 0.875rem.
  - Default state: `#3d4949` text
  - Hover: `surface-container-highest` background, smooth transition
  - Active: `primary` (`#23a2a3`) text color, left accent bar (3px, primary color, rounded)

### Navigation Items (role-adaptive)

**All roles see:**
- Dashboard (home icon)
- My Tickets (ticket icon)
- Notifications (bell icon)

**Requester additionally sees:**
- New Request (plus-circle icon) — primary CTA styling

**Reviewer / Approver / Integration / Provisioning see:**
- Team Queue (inbox icon)

**All roles see:**
- Partners (building icon)
- Search (search icon)

**System Administrator additionally sees:**
- Admin section header (label, not clickable)
  - Users (people icon)
  - Workflows (git-branch icon)
  - SLA Settings (clock icon)
  - Business Hours (calendar icon)

**Bottom of sidebar:**
- Reports (chart icon) — visible to Reviewer, Approver, Admin, and managers

### Responsive Behavior
- Below 1024px: sidebar collapses to icon-only (64px width), labels hidden
- Below 768px: sidebar becomes a hamburger menu overlay

### Page Transition
- Content area has a subtle fade-in on page change (200ms ease)

## Global Components

### Notification Bell Dropdown
- Click opens a dropdown panel (320px wide, max 400px tall, scrollable)
- Glassmorphism background
- Each notification: icon + title + timestamp + unread dot
- "View All" link at bottom → navigates to full Notifications page
- Unread count badge disappears when all read

### User Avatar Dropdown
- Shows: user full name, email, role badge (chip style using `secondary-container` `#c1eaea`)
- "Sign Out" button (tertiary style)

### Toast Notifications
- Bottom-right corner, auto-dismiss after 5 seconds
- Success: subtle green tint. Error: subtle red tint. Info: subtle teal tint.
- Glassmorphism background, rounded corners

### Empty States
- Centered illustration placeholder + heading + description text
- Example: "No tickets yet" / "Your queue is empty" / "No results found"
