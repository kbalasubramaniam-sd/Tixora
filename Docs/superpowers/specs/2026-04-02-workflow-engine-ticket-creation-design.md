# Workflow Engine + Ticket Creation — Design Spec

## Goal

Build the workflow engine that drives linear stage progression, and the ticket creation endpoint that kicks off the first workflow (T-01). This is the core of Tixora — every ticket flows through the workflow engine.

## Tech Stack

- .NET 10, EF Core 10, Clean Architecture
- ITixoraDbContext (no repositories)
- Controllers (not minimal APIs)

---

## 1. WorkflowEngine Service

**Interface:** `src/Tixora.Application/Interfaces/IWorkflowEngine.cs`
**Implementation:** `src/Tixora.Infrastructure/Services/WorkflowEngine.cs`

### Responsibilities
- Resolve which WorkflowDefinition applies for a given (ProductCode, TaskType, ProvisioningPath?)
- Create a new Ticket with correct initial state
- Generate the ticket ID: `SPM-{ProductCode}-{TaskType}-{YYYYMMDD}-{SEQ}`
- Set initial stage (StageOrder=1) and assign to the correct role's user
- Create the first StageLog entry
- Create an AuditEntry for ticket creation

### Key Method: `CreateTicketAsync`

```csharp
Task<Ticket> CreateTicketAsync(CreateTicketRequest request, Guid createdByUserId);
```

**Input:**
- `ProductCode` — which product
- `TaskType` — T01/T02/T03/T04
- `PartnerId` — which partner (resolved to PartnerProduct)
- `ProvisioningPath?` — only for T03
- `IssueType?` — only for T04
- `FormData` — JSON string of form fields

**Flow:**
1. Validate: PartnerProduct exists for (PartnerId, ProductCode)
2. Validate: lifecycle state allows this task type (e.g., T01 requires None, T02 requires Onboarded, T03 requires UatCompleted, T04 requires Live)
3. Resolve WorkflowDefinition (ProductCode + TaskType + ProvisioningPath, IsActive=true)
4. Generate TicketId: query MAX(SequenceNumber) for today + product + task type, increment
5. Create Ticket entity with Status=Submitted, CurrentStageOrder=1
6. Create StageLog for stage 1 (Action=Approve is wrong — no action yet, just assignment). Actually, no StageLog on creation — StageLog records actions taken. The ticket just starts at stage 1.
7. Create AuditEntry (ActionType="TicketCreated")
8. Auto-assign: find an active user with the role matching stage 1's AssignedRole. For MVP 1, just pick the first active user with that role (round-robin deferred to MVP 2).
9. SaveChanges

### Lifecycle Validation Rules

| TaskType | Required LifecycleState |
|----------|------------------------|
| T01 | None |
| T02 | Onboarded |
| T03 | UatCompleted |
| T04 | Live |

### Ticket ID Format

`SPM-{ProductCode}-{TaskType}-{YYYYMMDD}-{SEQ:000}`

Example: `SPM-RBT-T01-20260402-001`

SequenceNumber is per-day, per-product, per-task-type. Stored on the Ticket entity. Generated via MAX+1 query (with a note to refactor to sp_GetAppLock if concurrency becomes an issue).

## 2. DTOs

**`Application/DTOs/Tickets/CreateTicketRequest.cs`:**
```csharp
public record CreateTicketRequest(
    string ProductCode,
    string TaskType,
    Guid PartnerId,
    string? ProvisioningPath,
    string? IssueType,
    string FormData
);
```

**`Application/DTOs/Tickets/TicketResponse.cs`:**
```csharp
public record TicketResponse(
    Guid Id,
    string TicketId,
    string ProductCode,
    string TaskType,
    string Status,
    int CurrentStageOrder,
    string? CurrentStageName,
    string? AssignedTo,
    string PartnerName,
    string? ProvisioningPath,
    string? IssueType,
    DateTime CreatedAt
);
```

## 3. TicketsController

**`src/Tixora.API/Controllers/TicketsController.cs`:**

- `POST /api/tickets` — `[Authorize]`, accepts CreateTicketRequest, calls WorkflowEngine.CreateTicketAsync, returns TicketResponse
- Only PartnershipTeam and SystemAdministrator can create tickets (validate role from claims)

## 4. DI Registration

Add `IWorkflowEngine` → `WorkflowEngine` as scoped in `DependencyInjection.cs`.

## 5. Tests

**Unit tests for WorkflowEngine:**
- CreateTicket with valid T-01 request → ticket created with correct TicketId, Status=Submitted, CurrentStageOrder=1
- CreateTicket with wrong lifecycle state → throws/returns error
- CreateTicket with invalid product/partner combo → throws/returns error
- TicketId generation: two tickets same day → sequential numbers

**Integration tests:**
- POST /api/tickets with valid T-01 → 201 + correct response
- POST /api/tickets with PartnershipTeam role → 201
- POST /api/tickets with DevTeam role → 403
- POST /api/tickets with lifecycle violation → 400
