# E2: Full Ticket Lifecycle — Design Spec

## Goal

Validate all 4 task types work end-to-end through the WorkflowEngine, add re-raise after rejection, and prove the full partner lifecycle (None → Onboarded → UatActive → UatCompleted → Live) with comprehensive integration tests.

---

## 1. Re-raise After Rejection

### CreateTicketRequest Change

Add optional field to existing DTO:

```csharp
public record CreateTicketRequest(
    string ProductCode,
    string TaskType,
    Guid PartnerId,
    string? ProvisioningPath,
    string? IssueType,
    string FormData,
    Guid? RejectedTicketRef  // NEW — optional reference to rejected ticket
);
```

### WorkflowEngine.CreateTicketAsync Change

If `RejectedTicketRef` is provided:
1. Load the referenced ticket
2. Validate it exists and has `Status == Rejected`
3. Validate it has the same ProductCode and TaskType (can't re-raise a T-01 as a T-02)
4. Store `RejectedTicketRef` on the new ticket
5. Add audit entry: `"Re-raised from {rejectedTicket.TicketId}"`

If validation fails, throw `InvalidOperationException` (maps to 400).

No workflow changes — new ticket starts from stage 1 with the full workflow. Lifecycle gates still apply normally.

### Edge Cases
- Re-raise a ticket that isn't rejected → 400
- Re-raise with mismatched ProductCode/TaskType → 400
- Re-raise a non-existent ticket → 400
- Multiple re-raises of the same rejected ticket → allowed (no uniqueness constraint)

---

## 2. Integration Tests — Full Lifecycle

### Test Class: `FullLifecycleTests`

Uses `CustomWebApplicationFactory` with InMemory DB + seeded data.

**Test partner:** Al Ain Insurance (Id: `b2c3d4e5-0002-0002-0002-000000000001`), product RBT, starts at `LifecycleState.None`.

**Seed users and their roles (used for stage approvals):**
- sarah.ahmad@tixora.ae — PartnershipTeam (creates tickets, completes notification stages, signals UAT)
- omar.khalid@tixora.ae — LegalTeam (T-01 stage 1)
- hannoun@tixora.ae — ProductTeam (T-01 stage 2, T-02 stage 1, T-03 stage 2)
- fatima.noor@tixora.ae — ExecutiveAuthority (T-01 stage 3)
- khalid.rashed@tixora.ae — IntegrationTeam (T-02 stages 2+5, T-03 stage 5)
- ahmed.tariq@tixora.ae — DevTeam (T-02 stage 3, T-03 stage 3, T-04 stage 1)
- layla.hassan@tixora.ae — BusinessTeam (T-03 stage 4)
- vilina.sequeira@tixora.ae — PartnerOps (T-03 stage 1)

### Test Matrix

#### Test 1: `T01_FullFlow_CompletesAndAdvancesToOnboarded`

```
Create T-01/RBT as sarah → Status=Submitted, Stage=1
  → omar (LegalTeam) approves stage 1 → Stage=2, Status=InReview
  → hannoun (ProductTeam) approves stage 2 → Stage=3, Status=InReview
  → fatima (EA) approves stage 3 → Stage=4, Status=InReview
  → sarah (PartnershipTeam) approves stage 4 → Status=Completed
Assert: ticket.Status == Completed
Assert: PartnerProduct.LifecycleState == Onboarded (via GET /tickets/{id})
```

#### Test 2: `T02_FullFlow_TwoPhase_CompletesAndAdvancesToUatCompleted`

```
Create T-02/RBT as sarah (requires Onboarded) → Status=Submitted, Stage=1
  → hannoun (ProductTeam) approves stage 1 → Stage=2, Status=InProvisioning
  → khalid (IntegrationTeam) approves stage 2 → Stage=3, Status=InProvisioning
    ** Assert: LifecycleState == UatActive (mid-workflow advancement)
  → ahmed (DevTeam) approves stage 3 → Stage=4, Status=AwaitingUatSignal
  → sarah (PartnershipTeam) approves stage 4 (PhaseGate) → Stage=5, Status=InReview
  → khalid (IntegrationTeam) approves stage 5 → Status=Completed
Assert: ticket.Status == Completed
Assert: LifecycleState == UatCompleted
```

#### Test 3: `T03_PortalAndApi_FullFlow_CompletesAndAdvancesToLive`

```
Create T-03/RBT/PortalAndApi as sarah (requires UatCompleted) → Status=Submitted, Stage=1
  → vilina (PartnerOps) approves stage 1 → Stage=2, Status=InReview
  → hannoun (ProductTeam) approves stage 2 → Stage=3, Status=InProvisioning
  → ahmed (DevTeam) approves stage 3 → Stage=4, Status=InProvisioning
  → layla (BusinessTeam) approves stage 4 → Stage=5, Status=InProvisioning
  → khalid (IntegrationTeam) approves stage 5 → Status=Completed
Assert: ticket.Status == Completed
Assert: LifecycleState == Live
```

#### Test 4: `T04_Support_SingleStage_CompletesNoLifecycleChange`

```
Create T-04/RBT as sarah (requires Live) → Status=Submitted, Stage=1
  → ahmed (DevTeam) approves stage 1 → Status=Completed
Assert: ticket.Status == Completed
Assert: LifecycleState == Live (unchanged)
```

#### Test 5: `RejectAndReRaise_CreatesLinkedTicket`

```
Create T-01/RBT as sarah → Status=Submitted
  → omar (LegalTeam) rejects → Status=Rejected
Create new T-01/RBT as sarah with RejectedTicketRef = rejected ticket's Id
Assert: new ticket created successfully (201)
Assert: new ticket detail shows RejectedTicketRef
  → Complete full T-01 flow (omar → hannoun → fatima → sarah)
Assert: Status=Completed, LifecycleState=Onboarded
```

#### Test 6: `LifecycleGateEnforcement_BlocksWrongOrderTickets`

```
Assert: T-02/RBT at LifecycleState.None → 400
Assert: T-03/RBT at LifecycleState.None → 400
```

**Note:** Tests 1-4 must run sequentially within a single test method (or ordered test) because each depends on the lifecycle state left by the previous one. Use a single `[Fact]` that walks the full lifecycle, or use `IAsyncLifetime` to share state.

### Approach: Single Sequential Test

Since tests 1-4 build on each other's lifecycle state, implement as one large integration test: `FullPartnerLifecycle_NoneToLive`. This avoids test ordering issues and makes the dependency explicit.

Tests 5 and 6 are independent and can be separate `[Fact]` methods.

---

## 3. Ticket Detail — RejectedTicketRef Exposure

The `TicketDetailResponse` should expose the re-raise link. Add to the response:

```csharp
// In TicketDetailResponse — add field:
string? RejectedTicketRef  // TicketId (display string) of the rejected ticket, or null
```

This lets the frontend show "Re-raised from SPM-RBT-T01-..." on the ticket detail page.

---

## 4. Scope Summary

**Code changes:**
- `CreateTicketRequest` — add optional `RejectedTicketRef` field
- `WorkflowEngine.CreateTicketAsync` — validate and store re-raise reference
- `TicketDetailResponse` — add `RejectedTicketRef` field
- `TicketQueryService.GetTicketDetailAsync` — populate re-raise ref

**Tests:**
- `FullLifecycleTests.cs` — 3 test methods covering full lifecycle, re-raise, and gate enforcement

**No changes to:**
- WorkflowEngine approve/reject/return/respond/cancel/reassign logic
- Seed data
- Controllers (existing POST /tickets handles the new optional field via DTO)
- DashboardController / query endpoints
