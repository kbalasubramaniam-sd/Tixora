# Query Endpoints — Design Spec

## Goal

Add 6 read-only endpoints that wire the frontend Dashboard, My Tickets, Team Queue, and Ticket Detail pages to real data. Replace all mock/fallback data in the frontend API layer.

---

## 1. Architecture

**Separation of concerns:** WorkflowEngine handles mutations (create, approve, reject, etc.). A new `ITicketQueryService` handles all reads. Both live in Application (interface) and Infrastructure (implementation).

**New files:**
- `src/Tixora.Application/Interfaces/ITicketQueryService.cs`
- `src/Tixora.Infrastructure/Services/TicketQueryService.cs`
- `src/Tixora.API/Controllers/DashboardController.cs`
- `src/Tixora.Application/DTOs/Dashboard/` — dashboard-specific DTOs
- `src/Tixora.Application/DTOs/Tickets/TicketSummaryResponse.cs`
- `src/Tixora.Application/DTOs/Tickets/TicketDetailResponse.cs`

**Modified files:**
- `src/Tixora.API/Controllers/TicketsController.cs` — add GET /my and GET /{id}
- `src/Tixora.Infrastructure/DependencyInjection.cs` — register ITicketQueryService

---

## 2. Endpoints

### 2.1 Dashboard Controller — `api/dashboard`

All [Authorize]. All read-only.

#### `GET /api/dashboard/stats`

Returns 4 stat cards with presentation metadata (icons, colors, badges). The stat definitions are role-dependent — backend knows the role from JWT and returns the appropriate labels and icons.

**Response shape** (matches frontend `DashboardStats` type exactly):
```json
{
  "stat1": { "label": "My Open Requests", "value": 7, "icon": "inbox", "iconBg": "bg-primary-container/10", "iconColor": "text-primary", "badge": "Active", "badgeStyle": "text-xs font-bold text-primary" },
  "stat2": { ... },
  "stat3": { ... },
  "stat4": { ... }
}
```

**Stat definitions by role group:**

| Role | stat1 | stat2 | stat3 | stat4 |
|------|-------|-------|-------|-------|
| PartnershipTeam | My Open Requests (created by me, active) | Pending My Action (assigned to me, active) | Completed This Month (created by me, completed) | Avg Resolution Time (placeholder "—" for MVP 1, SLA is E3) |
| LegalTeam, ProductTeam, ExecutiveAuthority | In My Queue (assigned to me, active) | Near SLA Breach (placeholder 0, E3) | Processed Today (stage logs where I'm actor, today) | SLA Compliance Rate (placeholder "—", E3) |
| IntegrationTeam, DevTeam, BusinessTeam, PartnerOps | Assigned to Me (active) | SLA At Risk (placeholder 0, E3) | Completed This Week (actor in completed stage logs, this week) | Avg Completion Time (placeholder "—", E3) |
| SystemAdministrator | Total Open Tickets (all active) | SLA Breaches Today (placeholder 0, E3) | Tickets Created Today (all, today) | System Compliance (placeholder "—", E3) |

MVP 1 note: SLA-related stats return 0 or "—". Real values come in E3.

#### `GET /api/dashboard/action-required`

Returns tickets assigned to the current user with active status. Ordered by CreatedAt ascending (oldest first — act on the most urgent).

For PartnershipTeam: also includes tickets in `PendingRequesterAction` where the user is the original requester (they need to respond).

**Response:** `TicketSummaryResponse[]` (max 20)

#### `GET /api/dashboard/activity`

Returns recent audit entries for tickets the current user is involved in (created by or assigned to, or was actor in any stage log). Mapped to the frontend `ActivityEntry` shape.

**Response:** `ActivityEntryResponse[]` (max 10, ordered by timestamp desc)

**Icon/color mapping by ActionType:**

| ActionType | icon | iconBg | iconColor |
|------------|------|--------|-----------|
| TicketCreated | add_circle | bg-primary-container | text-on-primary-container |
| StageApproved | check_circle | bg-success-container | text-success |
| StageRejected | cancel | bg-error-container | text-error |
| ReturnedForClarification | help | bg-warning-container | text-warning |
| ClarificationResponded | reply | bg-primary-container | text-on-primary-container |
| TicketCompleted | task_alt | bg-success-container | text-success |
| TicketCancelled | block | bg-error-container | text-error |
| Reassigned | swap_horiz | bg-secondary-container | text-on-secondary-container |

#### `GET /api/dashboard/team-queue`

Returns tickets visible to the current user's role, with optional filters.

**Visibility rules:**
- PartnershipTeam: tickets created by them
- SystemAdministrator: all tickets
- All other roles: tickets where any stage in the workflow has their role as AssignedRole (not just current stage — they may need to act later)

**Query params (all optional):**
- `product` — filter by ProductCode name (e.g., "RBT")
- `task` — filter by TaskType name (e.g., "T01")
- `slaStatus` — ignored in MVP 1 (SLA is E3)
- `partner` — filter by partner name (contains)
- `requester` — filter by requester name (contains)

**Response:** `TicketSummaryResponse[]`, ordered by UpdatedAt desc. Only active tickets (exclude Completed, Rejected, Cancelled).

### 2.2 Tickets Controller — `api/tickets`

#### `GET /api/tickets/my`

Returns all tickets created by the current user. All statuses (including terminal). Ordered by CreatedAt desc.

**Response:** `TicketSummaryResponse[]`

#### `GET /api/tickets/{id:guid}`

Returns full ticket detail with workflow stages, audit trail, and clarification info.

**Response:** `TicketDetailResponse`

Returns 404 if ticket not found.

---

## 3. DTOs

### TicketSummaryResponse

```csharp
public record TicketSummaryResponse(
    string Id,                  // Guid as string (frontend expects string)
    string TicketId,            // SPM-RBT-T01-...
    string ProductCode,         // "RBT" (enum name)
    string TaskType,            // "T01" (enum name)
    string PartnerName,
    string RequesterName,
    string Status,              // "InReview" (enum name)
    string CurrentStage,        // Stage name or "" if terminal
    string SlaStatus,           // "OnTrack" always (MVP 1)
    double SlaHoursRemaining,   // 0 always (MVP 1)
    DateTime CreatedAt,
    DateTime UpdatedAt
);
```

### TicketDetailResponse

```csharp
public record TicketDetailResponse(
    // -- TicketSummary fields (flat, not inherited) --
    string Id,
    string TicketId,
    string ProductCode,
    string TaskType,
    string PartnerName,
    string RequesterName,
    string Status,
    string CurrentStage,
    string SlaStatus,
    double SlaHoursRemaining,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    // -- Detail fields --
    string CompanyCode,             // PartnerProduct.CompanyCode
    object FormData,                // Deserialized JSON (returned as object for flexibility)
    TicketDocumentResponse[] Documents,       // Empty array (E3)
    WorkflowStageResponse[] WorkflowStages,
    TicketCommentResponse[] Comments,         // Empty array (E3)
    AuditEntryResponse[] AuditTrail,
    ClarificationResponse? Clarification,
    string? AssignedTo,             // Current assignee name
    string CreatedBy,               // Requester name
    string? AccessPath,             // "portal" | "api" | "both" from ProvisioningPath
    string LifecycleState           // "None" | "Onboarded" | etc.
);
```

### WorkflowStageResponse

```csharp
public record WorkflowStageResponse(
    string Name,
    string Icon,                    // Material icon mapped from StageType
    string Status,                  // "completed" | "current" | "future"
    string? AssignedTo,             // Name of assigned user (current stage only)
    DateTime? CompletedAt           // From StageLog (Approve action)
);
```

**Icon mapping from StageType:**
- Review → "rate_review"
- Approval → "verified"
- Provisioning → "settings"
- PhaseGate → "flag"

Final pseudo-stage "Complete" always appended with icon "check_circle".

### AuditEntryResponse

```csharp
public record AuditEntryResponse(
    string Id,
    string Type,            // Mapped from ActionType → "stage_transition" | "approval" | "rejection" | "return"
    string Description,
    DateTime Timestamp
);
```

**Type mapping from ActionType:**
- TicketCreated → "stage_transition"
- StageApproved → "approval"
- StageRejected → "rejection"
- ReturnedForClarification → "return"
- ClarificationResponded → "stage_transition"
- TicketCompleted → "approval"
- TicketCancelled → "rejection"
- Reassigned → "stage_transition"

### ClarificationResponse

```csharp
public record ClarificationResponse(
    string RequestedBy,         // Actor name who returned for clarification
    DateTime RequestedAt,
    string Note,                // The clarification comment
    string? Response,           // Requester's response (if responded)
    DateTime? RespondedAt
);
```

Built from the last two StageLog entries with Actions `ReturnForClarification` and `RespondToClarification`.

### Dashboard DTOs

```csharp
public record StatEntryResponse(
    string Label,
    object Value,               // int or string
    string Icon,
    string IconBg,
    string IconColor,
    string? Badge = null,
    string? BadgeStyle = null,
    string? ValueColor = null
);

public record DashboardStatsResponse(
    StatEntryResponse Stat1,
    StatEntryResponse Stat2,
    StatEntryResponse Stat3,
    StatEntryResponse Stat4
);

public record ActivityEntryResponse(
    string Id,
    string Title,
    string Description,
    string Timestamp,           // Relative: "2 hours ago", "Yesterday, 14:20"
    string Icon,
    string IconBg,
    string IconColor
);
```

### Placeholder DTOs (E3 — return empty)

```csharp
public record TicketDocumentResponse(
    string Id, string Name, string Size, string UploadedBy, DateTime UploadedAt
);

public record TicketCommentResponse(
    string Id, string Author, string Role, string Body, DateTime CreatedAt
);
```

---

## 4. ITicketQueryService Interface

```csharp
public interface ITicketQueryService
{
    Task<DashboardStatsResponse> GetDashboardStatsAsync(Guid userId, UserRole role);
    Task<List<TicketSummaryResponse>> GetActionRequiredAsync(Guid userId, UserRole role);
    Task<List<ActivityEntryResponse>> GetRecentActivityAsync(Guid userId);
    Task<List<TicketSummaryResponse>> GetTeamQueueAsync(Guid userId, UserRole role, string? product, string? task, string? partner, string? requester);
    Task<List<TicketSummaryResponse>> GetMyTicketsAsync(Guid userId);
    Task<TicketDetailResponse?> GetTicketDetailAsync(Guid ticketId);
}
```

---

## 5. Query Patterns (EF Core)

All queries use `AsNoTracking()` for read performance.

**TicketSummary projection** (shared by multiple endpoints):
```csharp
.Select(t => new TicketSummaryResponse(
    t.Id.ToString(),
    t.TicketId,
    t.ProductCode.ToString(),
    t.TaskType.ToString(),
    t.PartnerProduct.Partner.Name,
    t.CreatedBy.FullName,
    t.Status.ToString(),
    t.Status >= TicketStatus.Completed ? "" : 
        t.WorkflowDefinition.Stages
            .Where(s => s.StageOrder == t.CurrentStageOrder)
            .Select(s => s.StageName).FirstOrDefault() ?? "",
    "OnTrack",  // SLA placeholder
    0,          // SLA placeholder
    t.CreatedAt,
    t.UpdatedAt
))
```

**Active ticket filter** (reusable):
```csharp
static readonly TicketStatus[] TerminalStatuses = [TicketStatus.Completed, TicketStatus.Rejected, TicketStatus.Cancelled];

// Where not terminal
.Where(t => !TerminalStatuses.Contains(t.Status))
```

**Team queue visibility:**
```csharp
// For non-admin, non-partnership roles:
// Tickets where any stage in the workflow requires the user's role
.Where(t => t.WorkflowDefinition.Stages.Any(s => s.AssignedRole == role))
```

**Ticket detail — workflow stages:**
```csharp
// Get all stage definitions for the ticket's workflow, ordered by StageOrder
// For each stage:
//   - If StageOrder < CurrentStageOrder → "completed" (find approve StageLog for CompletedAt)
//   - If StageOrder == CurrentStageOrder → "current" (show assignee name)
//   - If StageOrder > CurrentStageOrder → "future"
// Append "Complete" pseudo-stage at end
```

---

## 6. Relative Timestamps

The ActivityEntry `timestamp` field is a human-readable relative string. Computed in the service:

- < 1 hour: "{N} mins ago"
- < 24 hours: "{N} hours ago"
- Yesterday: "Yesterday, HH:mm"
- This week: "Mon, HH:mm" (day of week)
- Older: "dd MMM, HH:mm"

---

## 7. Tests

**Integration tests (TicketsController):**
- GET /tickets/my → returns tickets created by logged-in user
- GET /tickets/my → does not return other users' tickets
- GET /tickets/{id} → returns full detail with stages
- GET /tickets/{id} → 404 for non-existent ticket
- GET /tickets/{id} → unauthenticated → 401

**Integration tests (DashboardController):**
- GET /dashboard/stats → returns 4 stats for PartnershipTeam role
- GET /dashboard/action-required → returns only tickets assigned to user
- GET /dashboard/activity → returns recent audit entries
- GET /dashboard/team-queue → respects role visibility
- GET /dashboard/team-queue?product=RBT → filters by product

---

## 8. Frontend Enum Mismatches (noted, not fixed here)

The frontend `TicketStatus` enum has values that don't exist in the backend:
- `Draft` — not used (tickets go straight to Submitted)
- `Approved` — backend uses InReview/InProvisioning (no separate Approved status)
- `SlaBreached` — E3 concern

The backend has statuses the frontend doesn't:
- `Phase1Complete`, `AwaitingUatSignal`, `Phase2InReview` — T-02 specific

**Decision:** Backend returns the exact enum name string. Frontend StatusChip component already handles unknown statuses with a fallback style. The frontend enums should be aligned in a future FE task.

---

## 9. Scope Boundaries

**In scope (this chunk):**
- 6 GET endpoints with real data from DB
- ITicketQueryService interface + implementation
- DashboardController
- All DTOs listed above
- Integration tests

**Out of scope (deferred):**
- SLA tracking/calculation (E3)
- Documents (E3)
- Comments (E3)
- Pagination (not needed for MVP 1 volumes)
- Full-text search (E4)
