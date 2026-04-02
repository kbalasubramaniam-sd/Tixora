# E2: Full Ticket Lifecycle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add re-raise after rejection and prove all 4 task types work end-to-end with comprehensive integration tests that walk a partner through the full lifecycle (None → Onboarded → UatActive → UatCompleted → Live).

**Architecture:** Minimal code changes (DTO + WorkflowEngine re-raise validation) plus one large integration test class that exercises every workflow path.

**Tech Stack:** .NET 10, EF Core 10 InMemory, xUnit, WebApplicationFactory

**Spec:** `Docs/superpowers/specs/2026-04-02-e2-full-lifecycle-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/Tixora.Application/DTOs/Tickets/CreateTicketRequest.cs` | Modify | Add optional RejectedTicketRef |
| `src/Tixora.Application/DTOs/Tickets/TicketDetailResponse.cs` | Modify | Add RejectedTicketRef field |
| `src/Tixora.Infrastructure/Services/WorkflowEngine.cs` | Modify | Validate and store re-raise ref |
| `src/Tixora.Infrastructure/Services/TicketQueryService.cs` | Modify | Populate re-raise ref in detail |
| `tests/Tixora.API.Tests/Controllers/FullLifecycleTests.cs` | Create | E2e lifecycle integration tests |

---

### Task 1: Re-raise DTO + WorkflowEngine Changes

Add `RejectedTicketRef` to CreateTicketRequest and TicketDetailResponse. Update WorkflowEngine to validate and store the reference.

**Files:**
- Modify: `src/Tixora.Application/DTOs/Tickets/CreateTicketRequest.cs`
- Modify: `src/Tixora.Application/DTOs/Tickets/TicketDetailResponse.cs`
- Modify: `src/Tixora.Infrastructure/Services/WorkflowEngine.cs`
- Modify: `src/Tixora.Infrastructure/Services/TicketQueryService.cs`

- [ ] **Step 1: Update CreateTicketRequest DTO**

Replace the file content:

```csharp
// File: src/Tixora.Application/DTOs/Tickets/CreateTicketRequest.cs
namespace Tixora.Application.DTOs.Tickets;

public record CreateTicketRequest(
    string ProductCode,
    string TaskType,
    Guid PartnerId,
    string? ProvisioningPath,
    string? IssueType,
    string FormData,
    Guid? RejectedTicketRef = null
);
```

- [ ] **Step 2: Update TicketDetailResponse DTO**

Add `RejectedTicketRef` as the last field (after LifecycleState):

```csharp
// File: src/Tixora.Application/DTOs/Tickets/TicketDetailResponse.cs
namespace Tixora.Application.DTOs.Tickets;

public record TicketDetailResponse(
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
    string CompanyCode,
    object FormData,
    object[] Documents,
    WorkflowStageResponse[] WorkflowStages,
    object[] Comments,
    AuditEntryResponse[] AuditTrail,
    ClarificationResponse? Clarification,
    string? AssignedTo,
    string CreatedBy,
    string? AccessPath,
    string LifecycleState,
    string? RejectedTicketRef = null
);
```

- [ ] **Step 3: Update WorkflowEngine.CreateTicketAsync**

In `src/Tixora.Infrastructure/Services/WorkflowEngine.cs`, find the ticket creation block (around line 283). Add re-raise validation BEFORE creating the ticket entity (after step 9, before step 10), and set `RejectedTicketRef` on the ticket.

Add this block before `// 10. Create Ticket entity`:

```csharp
        // 9b. Validate re-raise reference (if provided)
        if (request.RejectedTicketRef.HasValue)
        {
            var rejectedTicket = await _db.Tickets
                .FirstOrDefaultAsync(t => t.Id == request.RejectedTicketRef.Value);

            if (rejectedTicket is null)
                throw new InvalidOperationException("Referenced rejected ticket does not exist.");

            if (rejectedTicket.Status != TicketStatus.Rejected)
                throw new InvalidOperationException("Referenced ticket is not rejected. Only rejected tickets can be re-raised.");

            if (rejectedTicket.ProductCode != productCode || rejectedTicket.TaskType != taskType)
                throw new InvalidOperationException("Re-raised ticket must have the same product and task type as the rejected ticket.");
        }
```

Then in the ticket creation block, add `RejectedTicketRef`:

```csharp
        var ticket = new Ticket
        {
            // ... existing fields ...
            RejectedTicketRef = request.RejectedTicketRef,
            // ... rest of fields ...
        };
```

Also, after the "TicketCreated" audit entry, add a re-raise audit entry if applicable:

```csharp
        if (request.RejectedTicketRef.HasValue)
        {
            var rejectedTicket = await _db.Tickets
                .FirstOrDefaultAsync(t => t.Id == request.RejectedTicketRef.Value);

            _db.AuditEntries.Add(new AuditEntry
            {
                Id = Guid.CreateVersion7(),
                TicketId = ticket.Id,
                ActorUserId = createdByUserId,
                ActionType = "ReRaised",
                Details = $"Re-raised from rejected ticket {rejectedTicket?.TicketId}.",
                TimestampUtc = now
            });
        }
```

- [ ] **Step 4: Update TicketQueryService.GetTicketDetailAsync**

In `src/Tixora.Infrastructure/Services/TicketQueryService.cs`, find the `return new TicketDetailResponse(...)` at the end of `GetTicketDetailAsync`. Add the `RejectedTicketRef` field.

First, before the return statement, resolve the rejected ticket's display TicketId:

```csharp
    // Resolve re-raise reference display ID
    string? rejectedTicketRef = null;
    if (ticket.RejectedTicketRef.HasValue)
    {
        rejectedTicketRef = await _db.Tickets.AsNoTracking()
            .Where(t => t.Id == ticket.RejectedTicketRef.Value)
            .Select(t => t.TicketId)
            .FirstOrDefaultAsync();
    }
```

Then add to the TicketDetailResponse constructor as the last argument:

```csharp
        RejectedTicketRef: rejectedTicketRef
```

- [ ] **Step 5: Verify build**

Run: `dotnet build src/Tixora.sln`
Expected: Build succeeded, 0 errors

- [ ] **Step 6: Run existing tests**

Run: `dotnet test src/Tixora.sln --verbosity quiet`
Expected: All 56 existing tests pass (the new optional parameter has a default value, so existing callers are unaffected)

- [ ] **Step 7: Commit**

```bash
git add src/Tixora.Application/DTOs/Tickets/CreateTicketRequest.cs src/Tixora.Application/DTOs/Tickets/TicketDetailResponse.cs src/Tixora.Infrastructure/Services/WorkflowEngine.cs src/Tixora.Infrastructure/Services/TicketQueryService.cs
git commit -m "feat: add re-raise after rejection — validate and store RejectedTicketRef"
```

---

### Task 2: Full Lifecycle Integration Test

The main event — one test that walks Al Ain Insurance / RBT through the entire lifecycle: T-01 → T-02 → T-03 → T-04. This single test proves all 4 task types work end-to-end.

**Files:**
- Create: `tests/Tixora.API.Tests/Controllers/FullLifecycleTests.cs`

**Context (critical for implementer):**

Seed users and their emails (all password "Password1!"):
- sarah.ahmad@tixora.ae — PartnershipTeam (creates all tickets, completes notification stages, signals UAT)
- omar.khalid@tixora.ae — LegalTeam
- hannoun@tixora.ae — ProductTeam
- fatima.noor@tixora.ae — ExecutiveAuthority
- khalid.rashed@tixora.ae — IntegrationTeam
- ahmed.tariq@tixora.ae — DevTeam
- layla.hassan@tixora.ae — BusinessTeam
- vilina.sequeira@tixora.ae — PartnerOps

Seed partner: Al Ain Insurance, Id = `b2c3d4e5-0002-0002-0002-000000000001`, has product RBT at LifecycleState.None.

Test helper: `TestHelpers.GetAuthTokenAsync(client, email, password)` and `TestHelpers.SetAuthToken(client, token)`.

Existing factory: `CustomWebApplicationFactory` — fresh InMemory DB per instance.

Workflow stages (from seed data):
- **T-01 RBT:** Legal Review (LegalTeam) → Product Review (ProductTeam) → EA Sign-off (EA) → Stakeholder Notification (PartnershipTeam)
- **T-02 RBT:** Product Team Review (ProductTeam) → Access Provisioning (IntegrationTeam) → API Credential Creation (DevTeam) → Awaiting UAT Signal (PartnershipTeam, PhaseGate) → UAT Sign-off (IntegrationTeam)
- **T-03 RBT PortalAndApi:** Partner Ops Review (PartnerOps) → Product Team Sign-off (ProductTeam) → Dev Provisioning (DevTeam) → Business Provisioning (BusinessTeam) → API Provisioning (IntegrationTeam)
- **T-04 RBT:** Verify & Resolve (DevTeam)

- [ ] **Step 1: Create FullLifecycleTests.cs**

```csharp
// File: tests/Tixora.API.Tests/Controllers/FullLifecycleTests.cs
using System.Net;
using System.Net.Http.Json;
using Tixora.Application.DTOs.Tickets;

namespace Tixora.API.Tests.Controllers;

public class FullLifecycleTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private static readonly Guid AlAinInsuranceId = new("b2c3d4e5-0002-0002-0002-000000000001");

    public FullLifecycleTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    // ─── Helpers ─────────────────────────────────────────

    private async Task LoginAs(string email)
    {
        var token = await TestHelpers.GetAuthTokenAsync(_client, email, "Password1!");
        TestHelpers.SetAuthToken(_client, token);
    }

    private async Task<TicketResponse> CreateTicket(string productCode, string taskType, string? provisioningPath = null, string? issueType = null, Guid? rejectedTicketRef = null)
    {
        await LoginAs("sarah.ahmad@tixora.ae");

        var request = new CreateTicketRequest(
            ProductCode: productCode,
            TaskType: taskType,
            PartnerId: AlAinInsuranceId,
            ProvisioningPath: provisioningPath,
            IssueType: issueType,
            FormData: "{}",
            RejectedTicketRef: rejectedTicketRef
        );

        var response = await _client.PostAsJsonAsync("/api/tickets", request);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<TicketResponse>())!;
    }

    private async Task<TicketResponse> ApproveAs(string email, Guid ticketId, string? comments = null)
    {
        await LoginAs(email);
        var response = await _client.PostAsJsonAsync(
            $"/api/tickets/{ticketId}/approve",
            new ActionRequest(Comments: comments));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<TicketResponse>())!;
    }

    private async Task<TicketDetailResponse> GetDetail(Guid ticketId)
    {
        await LoginAs("sarah.ahmad@tixora.ae");
        var response = await _client.GetAsync($"/api/tickets/{ticketId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await response.Content.ReadFromJsonAsync<TicketDetailResponse>())!;
    }

    // ─── Test 1: Full Partner Lifecycle ──────────────────

    [Fact]
    public async Task FullPartnerLifecycle_NoneToLive()
    {
        // ═══════════════════════════════════════════════════
        // T-01: Agreement Validation — None → Onboarded
        // ═══════════════════════════════════════════════════

        var t01 = await CreateTicket("RBT", "T01");
        Assert.Equal("Submitted", t01.Status);
        Assert.Equal(1, t01.CurrentStageOrder);

        // Stage 1: Legal Review (omar — LegalTeam)
        var t01s1 = await ApproveAs("omar.khalid@tixora.ae", t01.Id);
        Assert.Equal(2, t01s1.CurrentStageOrder);
        Assert.Equal("InReview", t01s1.Status);

        // Stage 2: Product Review (hannoun — ProductTeam)
        var t01s2 = await ApproveAs("hannoun@tixora.ae", t01.Id);
        Assert.Equal(3, t01s2.CurrentStageOrder);
        Assert.Equal("InReview", t01s2.Status);

        // Stage 3: EA Sign-off (fatima — ExecutiveAuthority)
        var t01s3 = await ApproveAs("fatima.noor@tixora.ae", t01.Id);
        Assert.Equal(4, t01s3.CurrentStageOrder);
        Assert.Equal("InReview", t01s3.Status);

        // Stage 4: Stakeholder Notification (sarah — PartnershipTeam)
        var t01s4 = await ApproveAs("sarah.ahmad@tixora.ae", t01.Id);
        Assert.Equal("Completed", t01s4.Status);

        // Verify lifecycle advanced to Onboarded
        var t01Detail = await GetDetail(t01.Id);
        Assert.Equal("Onboarded", t01Detail.LifecycleState);

        // ═══════════════════════════════════════════════════
        // T-02: UAT Access — Onboarded → UatCompleted
        // ═══════════════════════════════════════════════════

        var t02 = await CreateTicket("RBT", "T02");
        Assert.Equal("Submitted", t02.Status);

        // Stage 1: Product Team Review (hannoun — ProductTeam)
        var t02s1 = await ApproveAs("hannoun@tixora.ae", t02.Id);
        Assert.Equal(2, t02s1.CurrentStageOrder);
        Assert.Equal("InProvisioning", t02s1.Status);

        // Stage 2: Access Provisioning (khalid — IntegrationTeam)
        // ** This should trigger mid-workflow lifecycle → UatActive
        var t02s2 = await ApproveAs("khalid.rashed@tixora.ae", t02.Id);
        Assert.Equal(3, t02s2.CurrentStageOrder);
        Assert.Equal("InProvisioning", t02s2.Status);

        // Verify mid-workflow lifecycle advancement
        var t02MidDetail = await GetDetail(t02.Id);
        Assert.Equal("UatActive", t02MidDetail.LifecycleState);

        // Stage 3: API Credential Creation (ahmed — DevTeam)
        var t02s3 = await ApproveAs("ahmed.tariq@tixora.ae", t02.Id);
        Assert.Equal(4, t02s3.CurrentStageOrder);
        Assert.Equal("AwaitingUatSignal", t02s3.Status);

        // Stage 4: Awaiting UAT Signal — PhaseGate (sarah — PartnershipTeam)
        var t02s4 = await ApproveAs("sarah.ahmad@tixora.ae", t02.Id);
        Assert.Equal(5, t02s4.CurrentStageOrder);
        Assert.Equal("InReview", t02s4.Status);

        // Stage 5: UAT Sign-off (khalid — IntegrationTeam)
        var t02s5 = await ApproveAs("khalid.rashed@tixora.ae", t02.Id);
        Assert.Equal("Completed", t02s5.Status);

        // Verify lifecycle advanced to UatCompleted
        var t02Detail = await GetDetail(t02.Id);
        Assert.Equal("UatCompleted", t02Detail.LifecycleState);

        // ═══════════════════════════════════════════════════
        // T-03: Production Account — UatCompleted → Live
        // ═══════════════════════════════════════════════════

        var t03 = await CreateTicket("RBT", "T03", provisioningPath: "PortalAndApi");
        Assert.Equal("Submitted", t03.Status);

        // Stage 1: Partner Ops Review (vilina — PartnerOps)
        var t03s1 = await ApproveAs("vilina.sequeira@tixora.ae", t03.Id);
        Assert.Equal(2, t03s1.CurrentStageOrder);
        Assert.Equal("InReview", t03s1.Status);

        // Stage 2: Product Team Sign-off (hannoun — ProductTeam)
        var t03s2 = await ApproveAs("hannoun@tixora.ae", t03.Id);
        Assert.Equal(3, t03s2.CurrentStageOrder);
        Assert.Equal("InProvisioning", t03s2.Status);

        // Stage 3: Dev Provisioning (ahmed — DevTeam)
        var t03s3 = await ApproveAs("ahmed.tariq@tixora.ae", t03.Id);
        Assert.Equal(4, t03s3.CurrentStageOrder);
        Assert.Equal("InProvisioning", t03s3.Status);

        // Stage 4: Business Provisioning (layla — BusinessTeam)
        var t03s4 = await ApproveAs("layla.hassan@tixora.ae", t03.Id);
        Assert.Equal(5, t03s4.CurrentStageOrder);
        Assert.Equal("InProvisioning", t03s4.Status);

        // Stage 5: API Provisioning (khalid — IntegrationTeam)
        var t03s5 = await ApproveAs("khalid.rashed@tixora.ae", t03.Id);
        Assert.Equal("Completed", t03s5.Status);

        // Verify lifecycle advanced to Live
        var t03Detail = await GetDetail(t03.Id);
        Assert.Equal("Live", t03Detail.LifecycleState);

        // ═══════════════════════════════════════════════════
        // T-04: Support — Live → Live (no change)
        // ═══════════════════════════════════════════════════

        var t04 = await CreateTicket("RBT", "T04", issueType: "PortalLoginIssue");
        Assert.Equal("Submitted", t04.Status);

        // Stage 1: Verify & Resolve (ahmed — DevTeam)
        var t04s1 = await ApproveAs("ahmed.tariq@tixora.ae", t04.Id);
        Assert.Equal("Completed", t04s1.Status);

        // Verify lifecycle unchanged at Live
        var t04Detail = await GetDetail(t04.Id);
        Assert.Equal("Live", t04Detail.LifecycleState);
    }

    // ─── Test 2: Reject + Re-raise ──────────────────────

    [Fact]
    public async Task RejectAndReRaise_CreatesLinkedTicket()
    {
        // Create a T-01/RBT ticket
        var original = await CreateTicket("RBT", "T01");

        // Reject it as omar (LegalTeam)
        await LoginAs("omar.khalid@tixora.ae");
        var rejectResponse = await _client.PostAsJsonAsync(
            $"/api/tickets/{original.Id}/reject",
            new ActionRequest(Comments: "Insufficient documentation"));
        Assert.Equal(HttpStatusCode.OK, rejectResponse.StatusCode);

        var rejected = await rejectResponse.Content.ReadFromJsonAsync<TicketResponse>();
        Assert.Equal("Rejected", rejected!.Status);

        // Re-raise with reference to rejected ticket
        var reRaised = await CreateTicket("RBT", "T01", rejectedTicketRef: original.Id);
        Assert.Equal("Submitted", reRaised.Status);
        Assert.NotEqual(original.Id, reRaised.Id);

        // Verify the detail shows the re-raise reference
        var detail = await GetDetail(reRaised.Id);
        Assert.NotNull(detail.RejectedTicketRef);
        Assert.Equal(original.TicketId, detail.RejectedTicketRef);

        // Verify audit trail mentions re-raise
        Assert.Contains(detail.AuditTrail, a => a.Type == "stage_transition" && a.Description.Contains("Re-raised"));
    }

    // ─── Test 3: Lifecycle Gate Enforcement ──────────────

    [Fact]
    public async Task LifecycleGateEnforcement_BlocksWrongOrderTickets()
    {
        await LoginAs("sarah.ahmad@tixora.ae");

        // T-02 requires Onboarded, but Al Ain Insurance/RBT is at None
        var t02Response = await _client.PostAsJsonAsync("/api/tickets", new CreateTicketRequest(
            ProductCode: "RBT", TaskType: "T02", PartnerId: AlAinInsuranceId,
            ProvisioningPath: null, IssueType: null, FormData: "{}"));
        Assert.Equal(HttpStatusCode.BadRequest, t02Response.StatusCode);

        // T-03 requires UatCompleted, also blocked at None
        var t03Response = await _client.PostAsJsonAsync("/api/tickets", new CreateTicketRequest(
            ProductCode: "RBT", TaskType: "T03", PartnerId: AlAinInsuranceId,
            ProvisioningPath: "PortalAndApi", IssueType: null, FormData: "{}"));
        Assert.Equal(HttpStatusCode.BadRequest, t03Response.StatusCode);
    }

    // ─── Test 4: Re-raise Validation ────────────────────

    [Fact]
    public async Task ReRaise_NonRejectedTicket_Returns400()
    {
        // Create a ticket (status = Submitted, not rejected)
        var ticket = await CreateTicket("RBT", "T01");

        // Try to re-raise from a non-rejected ticket
        await LoginAs("sarah.ahmad@tixora.ae");
        var response = await _client.PostAsJsonAsync("/api/tickets", new CreateTicketRequest(
            ProductCode: "RBT", TaskType: "T01", PartnerId: AlAinInsuranceId,
            ProvisioningPath: null, IssueType: null, FormData: "{}",
            RejectedTicketRef: ticket.Id));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ReRaise_NonExistentTicket_Returns400()
    {
        await LoginAs("sarah.ahmad@tixora.ae");
        var response = await _client.PostAsJsonAsync("/api/tickets", new CreateTicketRequest(
            ProductCode: "RBT", TaskType: "T01", PartnerId: AlAinInsuranceId,
            ProvisioningPath: null, IssueType: null, FormData: "{}",
            RejectedTicketRef: Guid.NewGuid()));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
```

- [ ] **Step 2: Verify build**

Run: `dotnet build src/Tixora.sln`
Expected: 0 errors

- [ ] **Step 3: Run new tests**

Run: `dotnet test src/Tixora.sln --filter "FullyQualifiedName~FullLifecycleTests" --verbosity normal`
Expected: All 5 tests pass

If any tests fail, debug by reading the error message carefully. Common issues:
- Wrong user email (check seed data)
- Status assertion wrong (check GetStatusForStageType mapping)
- Lifecycle not advancing (check ApproveStageAsync lifecycle logic)

- [ ] **Step 4: Run full test suite**

Run: `dotnet test src/Tixora.sln --verbosity quiet`
Expected: All tests pass (56 existing + 5 new = 61)

- [ ] **Step 5: Commit**

```bash
git add tests/Tixora.API.Tests/Controllers/FullLifecycleTests.cs
git commit -m "test: add full lifecycle integration tests — T-01→T-02→T-03→T-04, re-raise, gate enforcement"
```

---

## Self-Review Checklist

| Spec Section | Plan Task | Status |
|-------------|-----------|--------|
| 1. Re-raise DTO change | Task 1 Step 1 | Covered |
| 1. WorkflowEngine validation | Task 1 Step 3 | Covered |
| 1. Edge cases (non-rejected, non-existent, mismatched) | Task 2 Tests 4-5 | Covered |
| 2. T-01 full flow | Task 2 Test 1 | Covered |
| 2. T-02 full flow with mid-lifecycle | Task 2 Test 1 | Covered |
| 2. T-03 PortalAndApi | Task 2 Test 1 | Covered |
| 2. T-04 support | Task 2 Test 1 | Covered |
| 2. Rejection + re-raise | Task 2 Test 2 | Covered |
| 2. Lifecycle gate enforcement | Task 2 Test 3 | Covered |
| 3. TicketDetail RejectedTicketRef | Task 1 Steps 2,4 | Covered |
