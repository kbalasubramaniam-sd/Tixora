# Design System Documentation: Professional Precision

## 1. Overview & Creative North Star: "The Digital Architect"
This design system moves beyond the standard B2B SaaS "dashboard" look toward an aesthetic of **Architectural Precision**. Our Creative North Star is "The Digital Architect"—a philosophy that prioritizes structural integrity, light-play, and spatial intent over decorative elements. 

We break the "template" look by treating the browser as a physical space. By utilizing intentional asymmetry, expansive white space, and **Tonal Layering** instead of rigid borders, we create a high-end editorial experience that signals institutional trust and modern sophistication.

---

## 2. Colors: Tonal Depth & The "No-Line" Rule
The palette is rooted in a deep, professional teal (`#23a2a3`), supported by a sophisticated range of cool grays and soft teints. 

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through background color shifts.
*   **The Technique:** Place a `surface-container-low` component on top of a `surface` background. The shift in value provides all the separation necessary without the visual clutter of "boxes."

### Surface Hierarchy & Nesting
Treat the UI as a series of nested layers. Each inner container should use a slightly higher or lower tier to define its importance:
*   **Base:** `surface` (#f5fafa)
*   **Lower Tier:** `surface-container-low` (#f0f5f4) for background sections.
*   **Highest Priority:** `surface-container-highest` (#dee3e3) for active UI elements or sidebars.

### The "Glass & Gradient" Rule
To achieve a premium feel, use **Glassmorphism** for floating elements (e.g., Modals, Popovers). Use a semi-transparent `surface-container-lowest` with a `backdrop-blur` of 12px-20px. 
*   **Signature Textures:** For primary CTAs, do not use flat hex codes. Apply a subtle linear gradient from `primary` (#00696a) to `primary-container` (#23a2a3) at a 135-degree angle to provide a "machined" professional finish.

---

## 3. Typography: Editorial Authority
We use **Manrope** for its geometric clarity and modern B2B tone. The hierarchy is designed to feel like a high-end financial journal.

*   **Display (lg/md/sm):** Used for high-impact data points or hero statements. Use `tight` letter-spacing (-0.02em) to give it a "locked-in" architectural feel.
*   **Headline & Title:** These are your anchors. Always ensure high contrast between `headline-lg` (2rem) and `body-md` (0.875rem) to create a clear informational hierarchy.
*   **Labels (md/sm):** Set in `0.75rem` or `0.6875rem`. Use these for metadata and micro-copy. In this system, labels should never be pure black; use `on-surface-variant` (#3d4949) to keep the UI feeling "soft" and premium.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often a crutch for poor spatial planning. In this system, depth is earned through tone.

*   **The Layering Principle:** Stack `surface-container-lowest` cards on top of `surface-container-low` backgrounds. This creates a "soft lift" that feels integrated into the environment.
*   **Ambient Shadows:** If a floating effect is required (e.g., a dropdown menu), use an extra-diffused shadow: `box-shadow: 0 10px 40px rgba(23, 29, 28, 0.06);`. The shadow color is a tint of our `on-surface` (#171d1c), not a generic gray.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use the `outline-variant` (#bcc9c8) at **20% opacity**. 100% opaque borders are forbidden.

---

## 5. Components: Primitive Guidelines

### Buttons
*   **Primary:** Gradient of `primary` to `primary-container`. Corner radius: `DEFAULT` (0.5rem). High-contrast `on-primary` (white) text.
*   **Secondary:** No background. Use a `Ghost Border` (outline-variant at 20%) with `primary` colored text.
*   **Tertiary:** No border, no background. Text only. Use for low-priority actions.

### Cards & Lists
*   **Strict Rule:** Forbid the use of divider lines. Separate list items using `spacing-4` (1rem) of vertical white space or by alternating background tones (e.g., even rows using `surface-container-low`).
*   **Radii:** All cards must follow the "Round Four" standard: `DEFAULT` (0.5rem). For larger containers like hero sections, use `xl` (1.5rem) to emphasize the "modern" feel.

### Input Fields
*   **Standard State:** Use `surface-container-lowest` as the fill. 
*   **Focus State:** Do not just change the border color. Increase the background brightness and apply a subtle `primary` (teal) ambient glow (4px blur).

### Chips & Tags
*   **Action Chips:** Use `secondary-container` (#c1eaea) with `on-secondary-container` (#456b6b) text. These should feel like small, tactile stones.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical layouts. A sidebar that doesn't reach the bottom of the screen creates a modern "floating" look.
*   **Do** lean into the `primary-fixed` (#86f4f5) for data visualization highlights to ensure the teal feels vibrant, not muddy.
*   **Do** use the Spacing Scale religiously. Consistent gaps (e.g., always `spacing-8` between major sections) create the "trustworthy" precision our users expect.

### Don't
*   **Don’t** use 100% black (#000000) for text. Always use `on-surface` (#171d1c) for better readability and a more premium "ink on paper" feel.
*   **Don’t** use hard-edged boxes. Even the smallest "Round Four" radius (0.5rem) softens the UI and makes the "Professional" brand feel approachable.
*   **Don’t** use standard Dividers (<hr>). If you feel the need for a line, try adding 24px of empty space instead.