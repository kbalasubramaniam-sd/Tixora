# Tixora — Reports Dashboard

## Design System
Apply all rules from `00-shared-layout.md`. Renders inside the app shell.

## Overview
Aggregated operational reporting for managers and administrators. Metrics, charts, and exportable data.

## Layout

```
┌─────────────────────────────────────────────────────────┐
│  "Reports" — headline-lg                                │
│  Date Range: [Last 7 days ▾] [Custom: From → To]       │
│                                          [Export CSV]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐           │
│  │ Total  │ │ Avg    │ │ SLA    │ │ Reject │           │
│  │ Reqs   │ │ Resol. │ │ Comp.  │ │ Rate   │           │
│  │ 142    │ │ 18.5h  │ │ 94.2%  │ │ 3.1%   │           │
│  └────────┘ └────────┘ └────────┘ └────────┘           │
│                                                         │
│  ┌──────────────────────────┐ ┌────────────────────┐    │
│  │                          │ │                    │    │
│  │  Requests by Product     │ │  Requests by Task  │    │
│  │  (bar chart)             │ │  (bar chart)       │    │
│  │                          │ │                    │    │
│  └──────────────────────────┘ └────────────────────┘    │
│                                                         │
│  ┌──────────────────────────┐ ┌────────────────────┐    │
│  │                          │ │                    │    │
│  │  Avg Resolution by Task  │ │  T-03 Access Path  │    │
│  │  (horizontal bar)        │ │  Split (donut)     │    │
│  │                          │ │                    │    │
│  └──────────────────────────┘ └────────────────────┘    │
│                                                         │
│  ┌──────────────────────────┐ ┌────────────────────┐    │
│  │                          │ │                    │    │
│  │  SLA Performance Trend   │ │  T-02 Phase        │    │
│  │  (line chart over time)  │ │  Duration (bar)    │    │
│  │                          │ │                    │    │
│  └──────────────────────────┘ └────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Top Rejection Reasons (table)                    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Date Range Filter
- Dropdown: Last 7 days / Last 30 days / Last 90 days / Custom
- Custom: two date pickers (From / To)
- All metrics and charts update when date range changes
- **Export CSV** button: tertiary, right-aligned, exports all report data

## Summary Stat Cards (top row, 4 cards)
- Same styling as dashboard stat cards
- **Total Requests:** count for the period
- **Avg Resolution Time:** in business hours
- **SLA Compliance Rate:** percentage, green if > 90%, amber if 80-90%, red if < 80%
- **Rejection Rate:** percentage

## Charts (2x3 grid)

All charts use the teal palette for consistency:
- Primary data: `#23a2a3`
- Secondary: `#00696a`
- Accent: `#86f4f5` (for highlights, per design system)
- Neutral: `#bcc9c8`

### Chart Cards
- Each chart in a `surface-container-lowest` card, `0.5rem` radius, padding `spacing-5`
- Chart title: `title-md` (1.125rem), `#171d1c`
- Chart subtitle/description: `label-sm`, `#3d4949`

### Chart 1: Requests by Product (bar chart)
- Vertical bars, one per product (RBT, RHN, WTQ, MLM)
- Color: teal gradient bars
- Y-axis: count, X-axis: product names

### Chart 2: Requests by Task (bar chart)
- Vertical bars, one per task type (T-01 through T-04)
- Same teal bars

### Chart 3: Average Resolution Time by Task (horizontal bar)
- Horizontal bars, longest on top
- Shows hours, labeled at end of each bar

### Chart 4: T-03 Access Path Split (donut chart)
- Segments: Portal Only / Portal + API / API Only
- Center: total T-03 count
- Colors: `#23a2a3`, `#00696a`, `#86f4f5`

### Chart 5: SLA Compliance Trend (line chart)
- X-axis: time (daily or weekly depending on range)
- Y-axis: compliance percentage
- Line color: `#23a2a3`
- Area fill below line: `#23a2a3` at 10% opacity
- Target line at 90%: dashed, `#3d4949`

### Chart 6: T-02 Phase Duration (grouped bar)
- Two bars per product: Phase 1 avg duration and Phase 2 avg duration
- Colors: `#23a2a3` (Ph1), `#00696a` (Ph2)

## Top Rejection Reasons Table
- Simple table, 5 rows max
- Columns: Rank | Reason | Count | Percentage
- Same table styling as elsewhere (alternating rows, no borders)

## Data Source
- GET `/api/reports/overview?from={date}&to={date}`
- GET `/api/reports/export?from={date}&to={date}` — CSV download
