# Tixora — Technical Design Specification

**Tixora | Powering Every Request**
*Strategic Partner Management | Internal Operations Portal*
*Design Spec v1.0 | April 2026*

---

## 1. Overview

Tixora is an internal operations portal for managing partner-facing requests across four government-integrated platforms (Rabet, Rhoon, Wtheeq, Mulem) in the UAE. All users are internal employees. Partners are external entities managed through the system but never access it.

### Architecture Decision
**Clean Architecture Monolith** — single deployable unit with strict layer separation.

### Tech Stack
| Component | Technology |
|-----------|-----------|
| Backend | ASP.NET Core 10 Web API (C#) |
| Frontend | React (built separately via Google Stitch) |
| Database | SQL Server (local for hackathon, cloud-ready) |
| ORM | Entity Framework Core 10 |
| Email | In-app notifications only (MVP 1); email provider TBD (MVP 2) |
| Auth | Fake auth layer (seeded users + JWT), real SSO later |

---

## 2. Solution Structure

```
Tixora/
├── src/
│   ├── Tixora.Domain/
│   │   ├── Entities/
│   │   │   ├── Product.cs
│   │   │   ├── Partner.cs
│   │   │   ├── PartnerProduct.cs
│   │   │   ├── Ticket.cs
│   │   │   ├── StageLog.cs
│   │   │   ├── AuditEntry.cs
│   │   │   ├── SlaTracker.cs
│   │   │   ├── SlaPause.cs
│   │   │   ├── Document.cs
│   │   │   ├── Comment.cs
│   │   │   ├── Notification.cs
│   │   │   ├── FulfilmentRecord.cs
│   │   │   ├── User.cs
│   │   │   ├── DelegateApprover.cs
│   │   │   ├── WorkflowDefinition.cs
│   │   │   ├── StageDefinition.cs
│   │   │   ├── BusinessHoursConfig.cs
│   │   │   ├── Holiday.cs
│   │   │   └── SavedFilter.cs
│   │   ├── Enums/
│   │   │   ├── ProductCode.cs
│   │   │   ├── TaskType.cs
│   │   │   ├── ProductAccessMode.cs
│   │   │   ├── ProvisioningPath.cs
│   │   │   ├── TicketStatus.cs
│   │   │   ├── LifecycleState.cs
│   │   │   ├── StageType.cs
│   │   │   ├── StageAction.cs
│   │   │   ├── SlaStatus.cs
│   │   │   ├── UserRole.cs
│   │   │   ├── NotificationType.cs
│   │   │   └── IssueType.cs
│   │   ├── ValueObjects/
│   │   │   ├── TicketId.cs
│   │   │   └── BusinessHours.cs
│   │   └── Interfaces/
│   │       ├── ITicketRepository.cs
│   │       ├── IPartnerRepository.cs
│   │       ├── IUserRepository.cs
│   │       ├── IWorkflowRepository.cs
│   │       ├── IAuditRepository.cs
│   │       ├── INotificationRepository.cs
│   │       └── ISlaRepository.cs
│   │
│   ├── Tixora.Application/
│   │   ├── Services/
│   │   │   ├── TicketService.cs
│   │   │   ├── WorkflowEngine.cs
│   │   │   ├── SlaService.cs
│   │   │   ├── LifecycleService.cs
│   │   │   ├── NotificationService.cs
│   │   │   ├── AuditService.cs
│   │   │   ├── PartnerService.cs
│   │   │   ├── SearchService.cs
│   │   │   ├── ReportService.cs
│   │   │   └── AdminService.cs
│   │   ├── DTOs/
│   │   │   ├── Tickets/
│   │   │   │   ├── CreateTicketRequest.cs
│   │   │   │   ├── TicketDetailResponse.cs
│   │   │   │   ├── TicketListResponse.cs
│   │   │   │   ├── StageActionRequest.cs
│   │   │   │   ├── FulfilmentRequest.cs
│   │   │   │   └── ReRaiseRequest.cs
│   │   │   ├── Partners/
│   │   │   │   ├── PartnerListResponse.cs
│   │   │   │   └── PartnerProfileResponse.cs
│   │   │   ├── Auth/
│   │   │   │   ├── LoginRequest.cs
│   │   │   │   └── LoginResponse.cs
│   │   │   ├── Comments/
│   │   │   │   ├── CreateCommentRequest.cs
│   │   │   │   └── CommentResponse.cs
│   │   │   ├── Notifications/
│   │   │   │   └── NotificationResponse.cs
│   │   │   ├── Search/
│   │   │   │   ├── GlobalSearchResponse.cs
│   │   │   │   ├── AdvancedSearchRequest.cs
│   │   │   │   └── SavedFilterResponse.cs
│   │   │   ├── Reports/
│   │   │   │   └── ReportResponse.cs
│   │   │   ├── Admin/
│   │   │   │   ├── UserManagementDto.cs
│   │   │   │   ├── WorkflowConfigDto.cs
│   │   │   │   ├── SlaConfigDto.cs
│   │   │   │   ├── BusinessHoursDto.cs
│   │   │   │   └── DelegateDto.cs
│   │   │   └── Common/
│   │   │       ├── PagedResult.cs
│   │   │       └── FormSchemaResponse.cs
│   │   ├── Interfaces/
│   │   │   ├── ITicketService.cs
│   │   │   ├── IWorkflowEngine.cs
│   │   │   ├── ISlaService.cs
│   │   │   ├── ILifecycleService.cs
│   │   │   ├── INotificationService.cs
│   │   │   ├── IAuditService.cs
│   │   │   ├── IEmailSender.cs
│   │   │   └── IFileStorage.cs
│   │   └── Validators/
│   │       ├── CreateTicketValidator.cs
│   │       └── StageActionValidator.cs
│   │
│   ├── Tixora.Infrastructure/
│   │   ├── Data/
│   │   │   ├── AppDbContext.cs
│   │   │   ├── Migrations/
│   │   │   └── Configurations/
│   │   │       ├── ProductConfiguration.cs
│   │   │       ├── PartnerConfiguration.cs
│   │   │       ├── PartnerProductConfiguration.cs
│   │   │       ├── TicketConfiguration.cs
│   │   │       ├── StageLogConfiguration.cs
│   │   │       ├── AuditEntryConfiguration.cs
│   │   │       ├── SlaTrackerConfiguration.cs
│   │   │       ├── SlaPauseConfiguration.cs
│   │   │       ├── DocumentConfiguration.cs
│   │   │       ├── CommentConfiguration.cs
│   │   │       ├── NotificationConfiguration.cs
│   │   │       ├── FulfilmentRecordConfiguration.cs
│   │   │       ├── UserConfiguration.cs
│   │   │       ├── WorkflowDefinitionConfiguration.cs
│   │   │       ├── DelegateApproverConfiguration.cs
│   │   │       ├── BusinessHoursConfigConfiguration.cs
│   │   │       ├── HolidayConfiguration.cs
│   │   │       └── SavedFilterConfiguration.cs
│   │   ├── Repositories/
│   │   │   ├── TicketRepository.cs
│   │   │   ├── PartnerRepository.cs
│   │   │   ├── UserRepository.cs
│   │   │   ├── WorkflowRepository.cs
│   │   │   ├── AuditRepository.cs
│   │   │   ├── NotificationRepository.cs
│   │   │   └── SlaRepository.cs
│   │   ├── Email/
│   │   │   └── NoOpEmailSender.cs
│   │   ├── FileStorage/
│   │   │   └── LocalFileStorage.cs
│   │   └── Seed/
│   │       ├── SeedData.cs
│   │       ├── SeedUsers.cs
│   │       ├── SeedProducts.cs
│   │       └── SeedWorkflows.cs
│   │
│   └── Tixora.API/
│       ├── Controllers/
│       │   ├── AuthController.cs
│       │   ├── TicketsController.cs
│       │   ├── PartnersController.cs
│       │   ├── ProductsController.cs
│       │   ├── NotificationsController.cs
│       │   ├── DashboardController.cs
│       │   ├── ReportsController.cs
│       │   ├── SearchController.cs
│       │   └── AdminController.cs
│       ├── Middleware/
│       │   ├── FakeAuthMiddleware.cs
│       │   └── ErrorHandlingMiddleware.cs
│       ├── Program.cs
│       └── appsettings.json
│
├── tests/
│   ├── Tixora.Domain.Tests/
│   ├── Tixora.Application.Tests/
│   └── Tixora.API.Tests/
│
├── Tixora.sln
└── docs/

```

**Dependency rule:** Domain → (nothing). Application → Domain. Infrastructure → Application + Domain. API → all.

---

## 3. Domain Model

### 3.1 Enums

```csharp
public enum ProductCode { RBT, RHN, WTQ, MLM }

public enum TaskType { T01, T02, T03, T04, T05 }

public enum ProductAccessMode { Both, ApiOnly }
// Both = transactional portal + API (Rabet, Rhoon)
// ApiOnly = API primary, read-only portal exists (Wtheeq, Mulem)

public enum ProvisioningPath { PortalOnly, PortalAndApi, ApiOnly }
// Resolved at T-03 submission:
// ApiOnly products → always ProvisioningPath.ApiOnly
// Both products → user chooses PortalOnly or PortalAndApi

public enum TicketStatus
{
    Submitted,
    InReview,
    PendingRequesterAction,
    InProvisioning,
    Phase1Complete,    // T-02 only
    AwaitingUatSignal, // T-02 only: waiting for requester to signal UAT complete
    Phase2InReview,    // T-02 only
    Completed,
    Rejected,
    Cancelled
}

public enum LifecycleState { None, Agreed, UatActive, Onboarded, Live }

public enum StageType { Review, Approval, Provisioning, PhaseGate }

public enum StageAction
{
    Approve,
    Reject,
    ReturnForClarification,
    RespondToClarification,
    ClosePh1,
    SignalUatComplete,
    ClosePh2,
    Complete,
    Cancel,
    Reassign
}

public enum SlaStatus { OnTrack, AtRisk, Critical, Breached }

public enum UserRole
{
    Requester,
    Reviewer,
    Approver,
    IntegrationTeam,
    ProvisioningAgent,
    SystemAdministrator
}

public enum NotificationType
{
    RequestSubmitted,
    StageAdvanced,
    ClarificationRequested,
    ClarificationResponded,
    UatPhase1Complete,
    UatTestingSignalled,
    UatPhase2Complete,
    UatCompletionReminder,
    PortalAccountProvisioned,
    ApiCredentialsIssued,
    AccessIssueResolved,
    RequestRejected,
    RequestCancelled,
    TicketReassigned,
    DelegateApprovalTriggered,
    SlaWarning75,
    SlaWarning90,
    SlaBreach,
    RequestCompleted
}

public enum IssueType
{
    PortalLoginIssue,    // password reset, account unlock
    ApiCredentialIssue,  // key regeneration, certificate renewal
    PortalPasswordReset  // for read-only portals on API-only products
}
```

### 3.2 Entities

#### Product (seeded, immutable)
```csharp
public class Product
{
    public ProductCode Code { get; set; }          // PK
    public string Name { get; set; }               // "Rabet"
    public string Description { get; set; }
    public ProductAccessMode ProductAccessMode { get; set; }     // Both or ApiOnly
    public string PortalType { get; set; }         // "Transactional" or "Read-only"
}
```

#### Partner
```csharp
public class Partner
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string? Alias { get; set; }             // short name or code, e.g., "ABC-INS"
    public DateTime CreatedAt { get; set; }

    public ICollection<PartnerProduct> PartnerProducts { get; set; }
}
```

#### PartnerProduct (lifecycle per product)
```csharp
public class PartnerProduct
{
    public Guid Id { get; set; }
    public Guid PartnerId { get; set; }
    public ProductCode ProductCode { get; set; }
    public LifecycleState LifecycleState { get; set; }
    public DateTime StateChangedAt { get; set; }
    public DateTime CreatedAt { get; set; }

    public Partner Partner { get; set; }
    public Product Product { get; set; }
    public ICollection<Ticket> Tickets { get; set; }
}
```

#### Ticket
```csharp
public class Ticket
{
    public Guid Id { get; set; }
    public string TicketId { get; set; }           // "SPM-RBT-T01-20260401-0001"
    public Guid PartnerProductId { get; set; }
    public TaskType TaskType { get; set; }
    public ProductCode ProductCode { get; set; }
    public TicketStatus Status { get; set; }
    public int CurrentStageOrder { get; set; }
    public ProvisioningPath? ProvisioningPath { get; set; }    // T-03 only
    public IssueType? IssueType { get; set; }      // T-05 only
    public string FormData { get; set; }           // JSON — dynamic form submission
    public Guid CreatedByUserId { get; set; }
    public Guid? AssignedToUserId { get; set; }    // null until a user claims from role queue
    public Guid? RejectedTicketRef { get; set; }   // if re-raised from a rejected ticket
    public string? CancellationReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public PartnerProduct PartnerProduct { get; set; }
    public User CreatedBy { get; set; }
    public User? AssignedTo { get; set; }
    public ICollection<StageLog> StageLogs { get; set; }
    public ICollection<AuditEntry> AuditEntries { get; set; }
    public ICollection<SlaTracker> SlaTrackers { get; set; }
    public ICollection<Document> Documents { get; set; }
    public ICollection<Comment> Comments { get; set; }
    public ICollection<Notification> Notifications { get; set; }
    public FulfilmentRecord? FulfilmentRecord { get; set; }
}
```

#### StageLog
```csharp
public class StageLog
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public int StageOrder { get; set; }
    public string StageName { get; set; }
    public StageAction Action { get; set; }
    public Guid ActorUserId { get; set; }
    public string? Comments { get; set; }
    public Guid? ReassignedToUserId { get; set; }
    public DateTime Timestamp { get; set; }

    public Ticket Ticket { get; set; }
    public User Actor { get; set; }
}
```

#### AuditEntry (immutable, append-only)
```csharp
public class AuditEntry
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public Guid ActorUserId { get; set; }
    public string ActorName { get; set; }
    public string ActorRole { get; set; }
    public string ActionType { get; set; }         // free text: "StageAdvanced", "DocumentUploaded", etc.
    public string? Details { get; set; }           // JSON or free text
    public DateTime TimestampUtc { get; set; }

    public Ticket Ticket { get; set; }
}
```

#### SlaTracker
```csharp
public class SlaTracker
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public int StageOrder { get; set; }
    public string StageName { get; set; }
    public int TargetBusinessHours { get; set; }   // e.g., 16
    public double BusinessHoursElapsed { get; set; }
    public SlaStatus Status { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public bool IsBreach { get; set; }
    public int WarningThreshold75 { get; set; }    // hours
    public int WarningThreshold90 { get; set; }    // hours
    public bool Warning75Sent { get; set; }
    public bool Warning90Sent { get; set; }
    public bool BreachSent { get; set; }

    public Ticket Ticket { get; set; }
    public ICollection<SlaPause> Pauses { get; set; }
}

public class SlaPause
{
    public Guid Id { get; set; }
    public Guid SlaTrackerId { get; set; }
    public DateTime PausedAt { get; set; }
    public DateTime? ResumedAt { get; set; }
    public double PausedBusinessHours { get; set; } // calculated on resume

    public SlaTracker SlaTracker { get; set; }
}
```

#### Document
```csharp
public class Document
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public string FileName { get; set; }
    public string ContentType { get; set; }        // "application/pdf", etc.
    public long FileSizeBytes { get; set; }
    public string StoragePath { get; set; }        // local file path or blob URL
    public string DocumentType { get; set; }       // "AgreementCopy", "TermLetter", etc.
    public Guid UploadedByUserId { get; set; }
    public DateTime UploadedAt { get; set; }

    public Ticket Ticket { get; set; }
    public User UploadedBy { get; set; }
}
```

#### Comment
```csharp
public class Comment
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public Guid AuthorUserId { get; set; }
    public string Content { get; set; }
    public Guid? AttachmentDocumentId { get; set; }
    public DateTime CreatedAt { get; set; }

    public Ticket Ticket { get; set; }
    public User Author { get; set; }
    public Document? Attachment { get; set; }
}
```

#### Notification
```csharp
public class Notification
{
    public Guid Id { get; set; }
    public Guid? TicketId { get; set; }
    public Guid RecipientUserId { get; set; }
    public NotificationType Type { get; set; }
    public string Title { get; set; }
    public string? Body { get; set; }
    public bool IsRead { get; set; }
    public bool EmailSent { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }

    public Ticket? Ticket { get; set; }
    public User Recipient { get; set; }
}
```

#### FulfilmentRecord
```csharp
public class FulfilmentRecord
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public string RecordData { get; set; }         // JSON — structured per task type
    public Guid RecordedByUserId { get; set; }
    public DateTime RecordedAt { get; set; }

    public Ticket Ticket { get; set; }
    public User RecordedBy { get; set; }
}
```

#### User
```csharp
public class User
{
    public Guid Id { get; set; }
    public string FullName { get; set; }
    public string Email { get; set; }
    public string PasswordHash { get; set; }       // bcrypt for fake auth
    public UserRole Role { get; set; }             // single role per user
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}
// MVP 1: one role per user, access to all products (no product scoping).
// MVP 2: add UserProductScope join table to restrict users to specific products.
// MVP 2 entity:
//   UserProductScope { UserId, ProductCode } — a user with scopes only sees
//   tickets/queues for those products. "All products" = 4 rows (RBT, RHN, WTQ, MLM).
```

#### WorkflowDefinition + StageDefinition
```csharp
public class WorkflowDefinition
{
    public Guid Id { get; set; }
    public ProductCode ProductCode { get; set; }
    public TaskType TaskType { get; set; }
    public ProvisioningPath? ProvisioningPath { get; set; }    // null for non-T03, specific for T03 variants
    public int Version { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<StageDefinition> Stages { get; set; }
}
// Unique constraint: (ProductCode, TaskType, ProvisioningPath) WHERE IsActive = true
// Enforced via filtered unique index in EF configuration.

public class StageDefinition
{
    public Guid Id { get; set; }
    public Guid WorkflowDefinitionId { get; set; }
    public int StageOrder { get; set; }
    public string StageName { get; set; }
    public StageType StageType { get; set; }
    public UserRole AssignedRole { get; set; }
    public int SlaBusinessHours { get; set; }

    public WorkflowDefinition WorkflowDefinition { get; set; }
}
```

#### DelegateApprover
```csharp
public class DelegateApprover
{
    public Guid Id { get; set; }
    public Guid PrimaryUserId { get; set; }
    public Guid DelegateUserId { get; set; }
    public UserRole ApprovalScope { get; set; }
    public DateTime? ValidFrom { get; set; }       // null = permanent
    public DateTime? ValidTo { get; set; }
    public DateTime CreatedAt { get; set; }

    public User PrimaryUser { get; set; }
    public User DelegateUser { get; set; }
}
```

#### BusinessHoursConfig + Holiday
```csharp
public class BusinessHoursConfig
{
    public Guid Id { get; set; }
    public string WorkingDays { get; set; }        // JSON array: ["Sun","Mon","Tue","Wed","Thu"]
    public TimeOnly StartTime { get; set; }        // 08:00
    public TimeOnly EndTime { get; set; }          // 17:00
    public string Timezone { get; set; }           // "Asia/Dubai" (GST, UTC+4)
    public DateTime UpdatedAt { get; set; }
}

public class Holiday
{
    public Guid Id { get; set; }
    public DateOnly Date { get; set; }
    public string Name { get; set; }
    public DateTime CreatedAt { get; set; }
}
```

#### SavedFilter
```csharp
public class SavedFilter
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; }
    public string FilterData { get; set; }         // JSON of filter criteria
    public DateTime CreatedAt { get; set; }

    public User User { get; set; }
}
```

---

## 4. Workflow Engine

### 4.1 Core Behavior

The WorkflowEngine is the central service that drives ticket progression. It is configuration-driven — workflow paths are defined as data (WorkflowDefinition + StageDefinition), not hardcoded.

```
Ticket Created
    │
    ▼
Engine.Initialize(ticket)
    → Look up WorkflowDefinition for ProductCode × TaskType × ProvisioningPath
    → Set CurrentStageOrder = 1
    → Create SlaTracker for Stage 1
    → Assign ticket to Stage 1 role
    → Send "RequestSubmitted" notification
    │
    ▼
Stage Owner Acts
    ├── Approve → Engine.Advance(ticket)
    │       → Log StageLog + AuditEntry
    │       → Complete SlaTracker for current stage
    │       → If next stage exists: advance, create new SlaTracker, notify
    │       → If no next stage: Engine.Complete(ticket)
    │
    ├── Reject → Engine.Reject(ticket, reason)
    │       → Log StageLog + AuditEntry
    │       → Stop all SLA clocks
    │       → Set status = Rejected
    │       → Notify requester
    │
    ├── Return for Clarification → Engine.ReturnForClarification(ticket, note)
    │       → Log StageLog + AuditEntry
    │       → Pause SlaTracker (set PausedAt)
    │       → Set status = PendingRequesterAction
    │       → Notify requester
    │
    └── Reassign → Engine.Reassign(ticket, newUserId, reason)
            → Log StageLog + AuditEntry
            → Update AssignedToUserId
            → Notify new assignee + requester

Requester Responds to Clarification
    → Engine.RespondToClarification(ticket, response)
    → Resume SlaTracker (set ResumedAt, clear PausedAt)
    → Return ticket to the stage that raised the query
    → Set status = InReview
    → Notify stage owner

Engine.Complete(ticket)
    → Set status = Completed
    → Update PartnerProduct lifecycle state (see 4.2)
    → Send "RequestCompleted" notification
    → Seal audit trail
```

### 4.2 Lifecycle State Advancement

When a ticket completes, the engine checks if the PartnerProduct lifecycle should advance:

| Completed Task | Current State Required | New State |
|---------------|----------------------|-----------|
| T-01 | (any or new) | AGREED |
| T-02 Phase 1 | AGREED | UAT_ACTIVE |
| T-02 Phase 2 + T-03 both complete | UAT_ACTIVE | ONBOARDED |
| T-04 | ONBOARDED | LIVE |
| T-05 | ONBOARDED or LIVE | (no change) |

ONBOARDED requires both T-02 Phase 2 closed AND T-03 completed. The engine checks both conditions before advancing.

### 4.3 T-02 Two-Phase Flow

```
Stage 1: Product Team Review → Approve/Reject/Return
Stage 2: Integration Team — Phase 1 (Access Provisioning)
    → ClosePh1 action
    → Status = Phase1Complete
    → Notify requester + internal owners
    → Start AwaitingUatSignal status
Stage 3: Requester signals UAT testing complete
    → SignalUatComplete action (with evidence attachment)
    → Status = Phase2InReview
    → Start Phase 2 SLA clock
Stage 4: Integration Team — Phase 2 (UAT Sign-off)
    → ClosePh2 action (with UAT sign-off record)
    → Engine.Complete(ticket)
```

Phase 1 and Phase 2 have independent SLA trackers.

### 4.4 T-03 Product-Driven Access Path

```
ProvisioningPath resolved at submission:
    If Product.ProductAccessMode == ApiOnly → ProvisioningPath = ApiOnly (no toggle shown)
    If Product.ProductAccessMode == Both:
        Toggle OFF → ProvisioningPath = PortalOnly
        Toggle ON  → ProvisioningPath = PortalAndApi

Workflow routing:
    PortalOnly:  Partner Ops → Director → Provisioning Team → Complete
    ApiOnly:     Partner Ops → Director → Integration Team → Complete
    PortalAndApi: Partner Ops → Director → Provisioning → Integration → Complete (sequential, order configurable via seed data)
```

For PortalAndApi: stages run sequentially. The stage order is defined in seed data and can be adjusted without code changes.

### 4.5 Lifecycle Prerequisite Enforcement

Enforced at ticket creation time (not just warning):

| Task Being Created | Prerequisite Check | Block if not met |
|-------------------|-------------------|-----------------|
| T-02 | T-01 completed for same partner + product | Yes — blocked |
| T-03 | T-02 Phase 2 completed for same partner + product | Yes — blocked |
| T-04 | T-03 completed for same partner + product | Yes — blocked |
| T-05 | Partner is ONBOARDED or LIVE on the product | Yes — blocked |

The API returns a clear error message with a link to the partner's current lifecycle state and any in-progress prerequisite tickets.

### 4.6 Cancel Flow

- Available only when ticket.Status == Submitted (before any stage owner acts)
- Requester provides mandatory reason
- Status → Cancelled
- SLA clock stops
- All assigned stage owners notified
- Ticket remains in audit trail, cannot be re-opened

---

## 5. SLA Service

### 5.1 Business Hours Calculation

The SlaService calculates elapsed business hours by:
1. Reading BusinessHoursConfig (working days, start/end time, timezone)
2. Reading Holiday records
3. For each hour between start and now: counting only hours that fall within working days + working hours and are not holidays
4. Subtracting any paused duration (clarification periods)

### 5.2 SLA Monitoring

A background service (`SlaMonitoringService`) runs on a configurable interval (every 5 minutes):

```
For each active SlaTracker where CompletedAt == null:
    1. Calculate current BusinessHoursElapsed
    2. Update SlaTracker.BusinessHoursElapsed
    3. Determine SlaStatus:
        elapsed < 75% of target → OnTrack
        elapsed >= 75% and < 90% → AtRisk
        elapsed >= 90% and < 100% → Critical
        elapsed >= 100% → Breached
    4. Send notifications at thresholds (if not already sent):
        75%: notify stage owner → set Warning75Sent
        90%: notify stage owner + manager → set Warning90Sent
        100%: notify stage owner + manager + admin → set BreachSent, set IsBreach
```

### 5.3 SLA Pause/Resume

Tracked via `SlaPause` child table. Supports multiple pause/resume cycles per stage.

When a ticket is returned for clarification:
- Create new `SlaPause { SlaTrackerId, PausedAt = now }`
- BusinessHoursElapsed is frozen at current value

When the requester responds:
- Set `SlaPause.ResumedAt = now`
- Calculate `SlaPause.PausedBusinessHours` (business hours between PausedAt and ResumedAt)
- Clock resumes — total paused time = sum of all `SlaPause.PausedBusinessHours` for this tracker

---

## 6. Notification Service

### 6.1 In-App Notifications (MVP 1)

Every notification event creates an in-app Notification record (stored in DB, shown in the notification bell/inbox). No emails are sent in MVP 1.

### 6.2 Email Integration (MVP 2)

The `IEmailSender` interface is defined but the implementation is a no-op in MVP 1. When an email provider is selected post-hackathon, only the Infrastructure layer implementation needs to change.

```csharp
public interface IEmailSender
{
    Task SendAsync(string recipientEmail, string subject, string htmlBody);
}

// MVP 1: NoOpEmailSender (logs the intent, sends nothing)
// MVP 2: Real implementation with chosen provider (SES, Resend, SendGrid, etc.)
```

### 6.3 Notification Table

Full milestone → recipient mapping as defined in the product spec (US-012). Each notification stores: type, title, body, ticket reference, recipient, read status, email delivery status.

---

## 7. API Endpoints

### 7.1 Authentication
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/auth/login` | Login → JWT |
| GET | `/api/auth/me` | Current user profile |

### 7.2 Tickets
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/api/tickets` | Create ticket |
| GET | `/api/tickets` | List (filterable) |
| GET | `/api/tickets/{id}` | Full detail |
| PUT | `/api/tickets/{id}/advance` | Approve & advance |
| PUT | `/api/tickets/{id}/reject` | Reject |
| PUT | `/api/tickets/{id}/return` | Return for clarification |
| PUT | `/api/tickets/{id}/respond` | Requester responds |
| PUT | `/api/tickets/{id}/cancel` | Cancel (pre-action only) |
| PUT | `/api/tickets/{id}/reassign` | Reassign |
| PUT | `/api/tickets/{id}/complete-phase1` | T-02: close Phase 1 |
| PUT | `/api/tickets/{id}/signal-uat-complete` | T-02: requester signals UAT done |
| PUT | `/api/tickets/{id}/complete-phase2` | T-02: close Phase 2 |
| PUT | `/api/tickets/{id}/fulfilment` | Record fulfilment details |
| POST | `/api/tickets/{id}/comments` | Add comment |
| GET | `/api/tickets/{id}/comments` | List comments |
| POST | `/api/tickets/{id}/documents` | Upload document |
| GET | `/api/tickets/{id}/audit` | Audit trail |
| POST | `/api/tickets/re-raise/{rejectedTicketId}` | Create from rejected ticket |

### 7.3 Partners
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/partners` | List/search |
| GET | `/api/partners/{id}` | Profile with lifecycle |
| GET | `/api/partners/{id}/tickets` | Ticket history |

### 7.4 Products
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/products` | List with access types |
| GET | `/api/products/{code}/tasks` | Available tasks |
| GET | `/api/products/{code}/form-schema/{taskType}` | Dynamic form schema |

### 7.5 Notifications
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/notifications` | User's notifications |
| PUT | `/api/notifications/{id}/read` | Mark read |
| PUT | `/api/notifications/read-all` | Mark all as read |
| GET | `/api/notifications/unread-count` | Badge count |

### 7.6 Dashboard & Reports
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/dashboard/stats` | Role-adaptive stat cards (counts, SLA %, etc.) |
| GET | `/api/dashboard/action-required` | Tickets needing current user's action |
| GET | `/api/dashboard/activity` | Recent activity timeline for current user |
| GET | `/api/dashboard/my-tickets` | Requester's ticket list |
| GET | `/api/dashboard/team-queue` | Role-based team queue, sorted by SLA urgency |
| GET | `/api/reports/overview` | Aggregated metrics |
| GET | `/api/reports/export` | CSV export |

### 7.7 Search
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/search?q={query}` | Global search |
| POST | `/api/search/advanced` | Advanced search |
| GET | `/api/search/saved` | Saved filters |
| POST | `/api/search/saved` | Save filter |
| DELETE | `/api/search/saved/{id}` | Delete filter |

### 7.8 Admin
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/admin/users` | List users |
| POST | `/api/admin/users` | Create user |
| PUT | `/api/admin/users/{id}` | Update user |
| GET | `/api/admin/workflow-config` | Get routing matrix (read-only in MVP 1) |
| ~~PUT~~ | ~~`/api/admin/workflow-config/{productCode}/{taskType}`~~ | ~~MVP 2 — edit routing~~ |
| GET | `/api/admin/sla-config` | Get SLA targets |
| PUT | `/api/admin/sla-config/{productCode}/{taskType}` | Update SLA |
| GET | `/api/admin/business-hours` | Get business hours |
| PUT | `/api/admin/business-hours` | Update business hours |
| POST | `/api/admin/holidays` | Add holiday |
| DELETE | `/api/admin/holidays/{id}` | Remove holiday |
| GET | `/api/admin/delegates` | List delegates |
| POST | `/api/admin/delegates` | Create delegate |
| DELETE | `/api/admin/delegates/{id}` | Remove delegate |

---

## 8. Fake Auth Layer

### 8.1 Seed Users

| Email | Role | Product Scope |
|-------|------|--------------|
| `requester@tixora.local` | Requester | All |
| `reviewer@tixora.local` | Reviewer | All |
| `approver@tixora.local` | Approver | All |
| `integration@tixora.local` | Integration Team | All |
| `provisioning@tixora.local` | Provisioning Agent | All |
| `admin@tixora.local` | System Administrator | All |

Password for all: `Pass123!` (bcrypt hashed in seed data).

### 8.2 JWT Structure

```json
{
  "sub": "user-guid",
  "email": "requester@tixora.local",
  "name": "Test Requester",
  "role": "Requester",
  "products": ["RBT", "RHN", "WTQ", "MLM"],  // MVP 1: always all. MVP 2: scoped.
  "exp": 1743580800
}
```

### 8.3 FakeAuthMiddleware

Reads the Authorization Bearer token, validates the JWT signature (symmetric key stored in appsettings), and populates `HttpContext.User` with claims. Identical contract to what a real auth provider would produce — swap later without touching any downstream code.

---

## 9. Seed Data

### 9.1 Products (4 records)

Seeded from the product catalogue in the product spec. Immutable.

### 9.2 Workflow Definitions

Seeded with the default workflow matrix:

| Product × Task | Stages |
|---------------|--------|
| Any × T-01 | Legal Review → Product Review → EA Sign-off |
| Any × T-02 | Product Review → Integration Ph1 → (UAT Signal) → Integration Ph2 |
| Both × T-03 PortalOnly | Partner Ops → Director → Provisioning |
| Both × T-03 PortalAndApi | Partner Ops → Director → [Provisioning ∥ Integration] |
| ApiOnly × T-03 ApiOnly | Partner Ops → Director → Integration |
| Any × T-04 | Partner Ops → Provisioning |
| Any × T-05 | Provisioning (Verify + Resolve) |

### 9.3 SLA Defaults

| Task | Total SLA (business hours) |
|------|---------------------------|
| T-01 | 48 (16 per stage) |
| T-02 | Product Review: 8, Integration Ph1: 8, UAT Signal: 0 (no SLA — external wait), Integration Ph2: 24 |
| T-03 Portal | 24 |
| T-03 API / Both | 48 |
| T-04 | 8 |
| T-05 | 2 |

**Convention:** `SlaBusinessHours = 0` on a StageDefinition means no SLA tracking for that stage. The workflow engine skips SlaTracker creation. Used for external wait gates (e.g. awaiting partner UAT completion). The UatReminderService handles nudges for overdue waits.

### 9.4 Business Hours Default

- Working days: Sunday–Thursday
- Hours: 08:00–17:00
- Timezone: Asia/Dubai (GST, UTC+4)
- No holidays seeded (admin adds them)

### 9.5 Sample Partners (for demo)

Seed 3-4 sample partners at various lifecycle states to demonstrate the system:
- Partner A: LIVE on Rabet (all tasks completed)
- Partner B: UAT_ACTIVE on Rhoon (T-01 + T-02 Ph1 done)
- Partner C: AGREED on Wtheeq (only T-01 done)

---

## 10. File Storage

For the hackathon, documents are stored locally:

```csharp
public class LocalFileStorage : IFileStorage
{
    // Stores to: ./uploads/{ticketId}/{filename}
    // Returns the relative path as StoragePath
}
```

Interface is abstracted (`IFileStorage`) so it can be swapped to Azure Blob / S3 later.

Constraints enforced at the API layer:
- Accepted types: PDF, DOCX, XLSX, PNG, JPG
- Max size: 10 MB per file

---

## 11. Background Services

### 11.1 SlaMonitoringService

- Runs every 5 minutes via `IHostedService`
- Queries all active SLA trackers
- Recalculates business hours elapsed
- Sends threshold notifications
- Updates SLA status

### 11.2 UatReminderService

- Runs daily
- Checks T-02 tickets in AwaitingUatSignal status
- If configurable window exceeded (default: 30 business days), sends reminder to requester
- If second threshold exceeded, flags ticket for admin review

---

## 12. MVP Scope Boundary

### MVP 1 (Hackathon)
Everything described in this spec, including:
- Full ticket lifecycle (create, route, advance, reject, return, respond, cancel, complete)
- Workflow engine with configuration-driven routing
- T-02 two-phase flow with UAT signal
- T-03 product-driven access path
- Lifecycle state machine with enforcement
- SLA tracking with business hours + breach alerts
- Comments, documents, fulfilment records
- Notifications (in-app only)
- Immutable audit trail
- Partner lookup with lifecycle timeline
- Global + advanced search with saved filters
- Reports dashboard
- Admin: users, workflow config, SLA config, business hours, delegates
- Re-raise from rejected ticket
- Cancel (pre-action only)

### MVP 2 (Post-Hackathon)
- Draft management (auto-save, resume, delete)
- Real SSO/auth integration (Azure AD / Entra ID)
- Email notifications (choose provider: SES, Resend, SendGrid, or SMTP — wire up IEmailSender implementation)
- Dynamic workflow configuration admin (edit routing rules, add/remove stages via UI)
- Product-scoped users (restrict users to specific products via UserProductScope join table)
- Arabic (RTL) localisation
- Cloud blob storage (replace local file storage)
- Bulk user import via CSV
- Advanced SLA analytics

---

*Tixora Technical Design Spec v1.0 | April 2026*
