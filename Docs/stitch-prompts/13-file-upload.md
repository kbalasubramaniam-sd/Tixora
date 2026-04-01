# Tixora — File Upload Component

## Design System
Apply all rules from `00-shared-layout.md`. This is a reusable component used in ticket creation (03-new-request) and ticket detail (04-ticket-detail) screens.

## Overview
File upload is used for required documents on ticket creation (T-01) and optional attachments on comments. Two modes: **Required Document Upload** (named slots) and **General Attachment** (free upload).

---

## Required Document Upload (T-01 form)

Used when the form schema specifies named document slots (e.g., Trade License, VAT Certificate).

### Layout — Empty State
```
┌─────────────────────────────────────────────────────────┐
│ Required Documents                                       │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Trade License *                                    │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │                                              │  │  │
│  │  │     ☁ Drag and drop your file here           │  │  │
│  │  │     or                                       │  │  │
│  │  │     [ Browse Files ]                         │  │  │
│  │  │                                              │  │  │
│  │  │     PDF, DOCX, XLSX, PNG, JPG · Max 10 MB    │  │  │
│  │  │                                              │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  VAT Certificate *                                  │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │     ☁ Drag and drop your file here           │  │  │
│  │  │     or [ Browse Files ]                      │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Layout — Uploading State
```
┌────────────────────────────────────────────────────┐
│  Trade License *                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  📄 trade_license.pdf                        │  │
│  │  ████████████░░░░░░░░  62%    2.1 MB         │  │
│  │  Uploading...                     [ Cancel ]  │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

### Layout — Uploaded State
```
┌────────────────────────────────────────────────────┐
│  Trade License *                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  ✓ trade_license.pdf              2.1 MB  ×  │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

### Layout — Error State
```
┌────────────────────────────────────────────────────┐
│  Trade License *                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  ⚠ file_too_large.pdf            15.2 MB     │  │
│  │  File exceeds 10 MB limit          [ Retry ]  │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

---

## General Attachment Upload (Comments)

Used for optional file attachments on comments. Single file per comment.

### Layout — Empty
```
┌─────────────────────────────────────────────────────┐
│  [ 📎 Attach File ]                                  │
└─────────────────────────────────────────────────────┘
```

### Layout — Attached
```
┌─────────────────────────────────────────────────────┐
│  📎 screenshot.png  (0.8 MB)                    ×   │
└─────────────────────────────────────────────────────┘
```

---

## Component Specifications

### Drop Zone (Empty State)
- Background: `surface-container-lowest` (`#f8fdfc`)
- Border: 2px dashed `outline-variant` (`#bcc9c8`) at 30% opacity
- Corner radius: `0.5rem`
- Padding: `spacing-6` (1.5rem) vertical, `spacing-4` (1rem) horizontal
- Content centered vertically and horizontally
- **Cloud icon:** 24px, `#3d4949` at 50% opacity
- **"Drag and drop your file here":** `body-md` (0.875rem), `#3d4949`
- **"or":** `label-sm` (0.6875rem), `#3d4949` at 50% opacity
- **Browse Files button:** Secondary style — ghost border (`#bcc9c8` at 20%), teal text (`#23a2a3`), `0.5rem` radius, height 36px
- **Format hint:** `label-sm` (0.6875rem), `#3d4949` at 50% opacity
- Min height: 120px

### Drop Zone — Drag Hover
- Border changes to solid 2px `#23a2a3`
- Background shifts to `#f0fafa` (subtle teal tint)
- Text changes to "Drop file to upload" in teal

### Document Label
- Above the drop zone
- `label-md` (0.75rem), `#3d4949`, Manrope Medium
- Required indicator: teal asterisk (*) after label name

### Uploading State
- Drop zone collapses to a single row (48px height)
- **File icon:** 16px document icon, `#3d4949`
- **Filename:** `body-sm` (0.8125rem), `#171d1c`, truncate with ellipsis if > 30 chars
- **Progress bar:** full width below filename, 4px height, teal fill (`#23a2a3`), gray track (`#bcc9c8` at 20%)
- **Percentage:** `label-sm`, `#3d4949`, right of progress bar
- **File size:** `label-sm`, `#3d4949`, far right
- **"Uploading...":** `label-sm`, `#3d4949` at 70%
- **Cancel button:** Tertiary text, `#d32f2f` (red), far right

### Uploaded State
- Single row, 48px height
- Background: `surface-container-lowest`
- **Checkmark icon:** 16px, teal (`#23a2a3`)
- **Filename:** `body-sm`, `#171d1c`
- **File size:** `label-sm`, `#3d4949`, right-aligned
- **Remove button (×):** 20px icon button, `#3d4949` at 50%, hover → `#d32f2f`
- Click remove → returns to empty drop zone state

### Error State
- Single row, 48px height
- Background: `#fef2f2` (very light red tint)
- **Warning icon:** 16px, `#d32f2f`
- **Filename:** `body-sm`, `#171d1c`
- **Error message:** `label-sm`, `#d32f2f`
- **Retry button:** Tertiary text, teal, far right
- Click retry → re-opens file picker

---

## Validation Rules

| Rule | Behavior |
|------|----------|
| **File too large (> 10 MB)** | Error state: "File exceeds 10 MB limit" |
| **Invalid format** | Error state: "Unsupported file type. Use PDF, DOCX, XLSX, PNG, or JPG" |
| **Upload failure (network)** | Error state: "Upload failed. Check your connection" + Retry |
| **Required document missing** | On form submission: highlight the empty drop zone with red dashed border + "This document is required" in `label-sm` red below |

## Accepted Formats
- PDF (`.pdf`)
- Word (`.docx`)
- Excel (`.xlsx`)
- Images (`.png`, `.jpg`, `.jpeg`)

## Size Limit
- Maximum: 10 MB per file
- Display file size in human-readable format: "2.1 MB", "842 KB"

## Accessibility
- Drop zone is keyboard focusable (Tab → Enter opens file picker)
- Screen reader: "Upload Trade License, required. Drag and drop or press Enter to browse."
- Uploaded state: "Trade License uploaded: trade_license.pdf, 2.1 megabytes. Press Delete to remove."
- Progress announces at 25%, 50%, 75%, 100%

## API Integration
- Upload: POST `/api/tickets/{id}/documents` (multipart/form-data)
- During ticket creation (before ticket exists): files are uploaded to a temporary staging area, then associated with the ticket on submission
- Response includes: `{ documentId, fileName, contentType, fileSizeBytes, storagePath }`
