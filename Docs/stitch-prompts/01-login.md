# Tixora — Login Page

## Design System
Apply all rules from `00-shared-layout.md` design system section. This page has NO sidebar and NO top bar — it's a standalone fullscreen layout.

## Layout

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              ┌──────────────────────┐                   │
│              │                      │                   │
│              │     Tixora Logo      │                   │
│              │  Powering Every      │                   │
│              │     Request          │                   │
│              │                      │                   │
│              │  ┌────────────────┐  │                   │
│              │  │ Email          │  │                   │
│              │  └────────────────┘  │                   │
│              │  ┌────────────────┐  │                   │
│              │  │ Password       │  │                   │
│              │  └────────────────┘  │                   │
│              │                      │                   │
│              │  [ Sign In ========] │                   │
│              │                      │                   │
│              └──────────────────────┘                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Specifications

### Background
- Full viewport, `surface` (`#f5fafa`) base
- Subtle radial gradient from center: a very faint teal glow (`#23a2a3` at 3% opacity) radiating outward — gives depth without being decorative

### Login Card
- Centered vertically and horizontally
- Width: 400px max
- Background: `surface-container-lowest` (`#f8fdfc`)
- No border (use tonal layering against the page background for separation)
- Corner radius: `1.5rem` (xl size for hero-level containers)
- Padding: `spacing-8` (2rem) all sides
- Subtle ambient shadow: `box-shadow: 0 10px 40px rgba(23, 29, 28, 0.06)`

### Logo Section
- "Tixora" in Manrope Bold, `display-md` size (2.25rem), primary color `#23a2a3`
- "Powering Every Request" below in Manrope Regular, `label-md` (0.75rem), `#3d4949`
- 2rem gap below tagline before form fields

### Form Fields
- **Email input:** `surface-container-lowest` fill, Manrope Regular 0.875rem, placeholder "Email address" in `#3d4949` at 50% opacity. No visible border. On focus: background brightens slightly + subtle teal ambient glow (4px blur, `#23a2a3` at 15% opacity). Corner radius `0.5rem`. Height: 48px. Full width.
- **Password input:** Same styling as email. Type: password with show/hide toggle icon on right. Placeholder "Password".
- Gap between fields: `spacing-4` (1rem)
- Gap between password and button: `spacing-6` (1.5rem)

### Sign In Button
- Full width
- Height: 48px
- Background: linear gradient 135deg from `#00696a` to `#23a2a3`
- Text: "Sign In" in Manrope SemiBold 0.875rem, white (`#ffffff`)
- Corner radius: `0.5rem`
- Hover: gradient shifts slightly brighter, subtle scale(1.01) transform
- Active: scale(0.99)
- Loading state: text replaced with a small spinner

### Error State
- On invalid credentials: a subtle red-tinted message appears below the Sign In button
- Text: "Invalid email or password" in `0.75rem`, `#d32f2f`
- No aggressive red boxes or borders — keep it soft

### Behavior
- POST to `/api/auth/login` with `{ email, password }`
- On success: store JWT token, redirect to Dashboard
- On error: show error message, clear password field, focus email field
