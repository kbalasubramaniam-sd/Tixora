# FedEx Shipment UI — Design Spec

**Date:** 2026-04-03
**Scope:** Frontend only — ShipmentPanel component + API wiring
**Backend:** Built separately (3 endpoints, see below)

## Context

T-01 (Agreement Validation & Sign-off) ends when the EA officer approves at the EA Sign-off stage. After approval, the signed contract is couriered to the partner via FedEx. This feature adds an inline panel on completed T-01 tickets so the EA officer can validate the address, book a domestic shipment, and print the label — all without leaving the ticket page.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| When to show | After approval (ticket Completed) | Optional — doesn't block the approval flow |
| Who can use | EA officer who approved | They own the sign-off responsibility |
| Sender address | Hardcoded in BE config | Always ships from Tixora office |
| Service type | Domestic priority (hardcoded in BE) | UAE only, one service fits all |
| UI pattern | Inline sidebar panel (not modal) | Small form, stays in ticket context |
| Emirate field | Select dropdown (7 UAE emirates) | No free-text — reduces validation errors |

## Backend Endpoints (built by other window)

| Method | Endpoint | Body | Returns |
|--------|----------|------|---------|
| `POST` | `/api/shipments/validate-address` | `{ recipientName, companyName, phone, street, city, emirate, postalCode }` | `{ valid: bool, correctedAddress?: {...}, errors?: string[] }` |
| `POST` | `/api/shipments/book` | `{ ticketId, recipientName, companyName, phone, street, city, emirate, postalCode }` | `{ id, trackingNumber, status }` |
| `GET` | `/api/shipments/{id}/label` | — | PDF binary stream |

Note: Exact response shapes will be confirmed when BE handoff arrives. The FE should adapt field names to match.

## Component: ShipmentPanel

### Location

`frontend/src/pages/TicketDetail/ShipmentPanel.tsx`

Rendered in the TicketDetail right sidebar (`<aside>`), below PartnerPanel.

### Visibility Conditions

All must be true:
- `ticket.taskType === 'T01'`
- `ticket.status === 'Completed'`
- Current user's role is `ExecutiveAuthority`

If any condition is false, the panel does not render.

### Three States

#### State 1: Address Form (initial, or no shipment exists)

Card with header "Ship Contract" and a courier icon.

Fields (all inside the card):
- **Recipient Name** — text, required, placeholder "Contact person name"
- **Company Name** — text, required, pre-filled from `ticket.partnerName`
- **Phone** — tel, required, placeholder "+971 XX XXX XXXX"
- **Street Address** — text, required
- **City** — text, required
- **Emirate** — select, required, options: Abu Dhabi, Dubai, Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah, Fujairah
- **Postal Code** — text, optional

Button: "Validate Address" (primary-gradient style)

#### State 2: Address Validated

- Address displayed read-only in a compact summary with green checkmark icon
- If BE returned corrected address, show corrected values with a note "Address corrected by FedEx"
- "Edit" link to return to State 1
- Button: "Book Shipment" (primary-gradient)

#### State 3: Shipment Booked

- Tracking number displayed prominently (large, mono font)
- "Print Label" button — opens `/api/shipments/{id}/label` in new tab (PDF)
- "Track on FedEx" link — opens `https://www.fedex.com/fedextrack/?trknbr={trackingNumber}` in new tab
- Timestamp: "Booked on {date}"
- No further actions — panel is complete

### State Persistence

On mount, check if a shipment already exists for this ticket:
- If `GET /api/shipments/book` response or ticket detail includes shipment data → show State 3
- Otherwise → show State 1

Implementation note: The BE may include shipment data in the TicketDetailResponse, or we may need a separate `GET /api/shipments?ticketId={id}` endpoint. Adapt when BE handoff arrives.

### Error Handling

| Error | Behavior |
|-------|----------|
| Address validation fails | Show inline errors below the form. Keep form populated. |
| Address validation returns `valid: false` with errors | Show error list in red below the button |
| Booking fails | Show error message with "Retry" button. Don't lose the validated address. |
| FedEx API timeout | "FedEx service unavailable. Please try again in a few minutes." |
| Label download fails | "Unable to download label. Try again." |

### Styling

- Card: `bg-surface-container-lowest p-6 rounded-xl custom-shadow`
- Header: icon + "Ship Contract" title (same pattern as ActionsPanel/SlaPanel headers)
- Form inputs: same style as NewRequest FormStep (`bg-surface-container-lowest border-none rounded-lg h-12 px-4`)
- Validate button: `primary-gradient text-on-primary` full-width
- Book button: `primary-gradient text-on-primary` full-width
- Tracking number: `text-2xl font-mono font-bold text-primary`
- Print button: full-width with print icon
- Success state: subtle green-tinted background on the tracking card

## Files to Create/Modify

| File | Action |
|------|--------|
| `frontend/src/api/endpoints/shipments.ts` | Create — API functions |
| `frontend/src/api/hooks/useShipments.ts` | Create — React Query hooks |
| `frontend/src/pages/TicketDetail/ShipmentPanel.tsx` | Create — the panel component |
| `frontend/src/pages/TicketDetail/index.tsx` | Modify — add ShipmentPanel to sidebar |

## Out of Scope

- Sender address UI (hardcoded in BE config)
- Service type selection (hardcoded in BE)
- Shipment tracking updates/webhooks
- Multiple shipments per ticket
- Brevo email integration (separate feature)
