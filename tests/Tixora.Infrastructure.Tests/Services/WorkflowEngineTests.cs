// File: tests/Tixora.Infrastructure.Tests/Services/WorkflowEngineTests.cs
using Microsoft.EntityFrameworkCore;
using Tixora.Application.DTOs.Tickets;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;
using Tixora.Infrastructure.Data;
using Tixora.Infrastructure.Services;

namespace Tixora.Infrastructure.Tests.Services;

public class WorkflowEngineTests : IDisposable
{
    private readonly TixoraDbContext _db;
    private readonly WorkflowEngine _engine;

    // Deterministic GUIDs for test data
    private static readonly Guid PartnerId = new("aaaaaaaa-0001-0001-0001-000000000001");
    private static readonly Guid PartnerProductId = new("aaaaaaaa-0002-0002-0002-000000000001");
    private static readonly Guid WorkflowId = new("aaaaaaaa-0003-0003-0003-000000000001");
    private static readonly Guid Stage1Id = new("aaaaaaaa-0004-0004-0004-000000000001");
    private static readonly Guid LegalUserId = new("aaaaaaaa-0005-0005-0005-000000000001");
    private static readonly Guid PartnershipUserId = new("aaaaaaaa-0006-0006-0006-000000000001");

    public WorkflowEngineTests()
    {
        var options = new DbContextOptionsBuilder<TixoraDbContext>()
            .UseInMemoryDatabase($"WorkflowEngineTests_{Guid.NewGuid()}")
            .Options;

        _db = new TixoraDbContext(options);
        _engine = new WorkflowEngine(_db);

        SeedTestData();
    }

    private void SeedTestData()
    {
        // Partner
        _db.Partners.Add(new Partner
        {
            Id = PartnerId,
            Name = "Test Partner",
            Alias = "TST",
            CreatedAt = DateTime.UtcNow
        });

        // PartnerProduct — lifecycle = None (ready for T-01)
        _db.PartnerProducts.Add(new PartnerProduct
        {
            Id = PartnerProductId,
            PartnerId = PartnerId,
            ProductCode = ProductCode.RBT,
            CompanyCode = "TST-RBT",
            LifecycleState = LifecycleState.None,
            StateChangedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        });

        // WorkflowDefinition for T-01 RBT
        _db.WorkflowDefinitions.Add(new WorkflowDefinition
        {
            Id = WorkflowId,
            ProductCode = ProductCode.RBT,
            TaskType = TaskType.T01,
            ProvisioningPath = null,
            Version = 1,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });

        // Stage 1 — Legal Review
        _db.StageDefinitions.Add(new StageDefinition
        {
            Id = Stage1Id,
            WorkflowDefinitionId = WorkflowId,
            StageOrder = 1,
            StageName = "Legal Review",
            StageType = StageType.Review,
            AssignedRole = UserRole.LegalTeam,
            SlaBusinessHours = 24
        });

        // Users
        _db.Users.Add(new User
        {
            Id = LegalUserId,
            FullName = "Test Legal User",
            Email = "legal@test.ae",
            PasswordHash = "not-used",
            Role = UserRole.LegalTeam,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });

        _db.Users.Add(new User
        {
            Id = PartnershipUserId,
            FullName = "Test Partnership User",
            Email = "partnership@test.ae",
            PasswordHash = "not-used",
            Role = UserRole.PartnershipTeam,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });

        _db.SaveChanges();
    }

    public void Dispose()
    {
        _db.Dispose();
    }

    [Fact]
    public async Task CreateTicketAsync_ValidT01_CreatesTicketWithCorrectFields()
    {
        // Arrange
        var request = new CreateTicketRequest(
            ProductCode: "RBT",
            TaskType: "T01",
            PartnerId: PartnerId,
            ProvisioningPath: null,
            IssueType: null,
            FormData: "{\"agreementNumber\": \"AGR-001\"}"
        );

        // Act
        var result = await _engine.CreateTicketAsync(request, PartnershipUserId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("RBT", result.ProductCode);
        Assert.Equal("T01", result.TaskType);
        Assert.Equal("Submitted", result.Status);
        Assert.Equal(1, result.CurrentStageOrder);
        Assert.Equal("Legal Review", result.CurrentStageName);
        Assert.Equal("Test Legal User", result.AssignedToName);
        Assert.Equal("Test Partner", result.PartnerName);
        Assert.Null(result.ProvisioningPath);
        Assert.Null(result.IssueType);

        // Verify TicketId format: SPM-RBT-T01-YYYYMMDD-001
        Assert.StartsWith("SPM-RBT-T01-", result.TicketId);
        Assert.EndsWith("-001", result.TicketId);
    }

    [Fact]
    public async Task CreateTicketAsync_ValidT01_CreatesAuditEntry()
    {
        // Arrange
        var request = new CreateTicketRequest("RBT", "T01", PartnerId, null, null, "{}");

        // Act
        var result = await _engine.CreateTicketAsync(request, PartnershipUserId);

        // Assert
        var audit = await _db.AuditEntries.FirstOrDefaultAsync(a => a.TicketId == result.Id);
        Assert.NotNull(audit);
        Assert.Equal("TicketCreated", audit.ActionType);
        Assert.Equal(PartnershipUserId, audit.ActorUserId);
    }

    [Fact]
    public async Task CreateTicketAsync_WrongLifecycleState_Throws()
    {
        // Arrange — partner-product is in None state, but T-02 requires Onboarded
        var request = new CreateTicketRequest("RBT", "T02", PartnerId, null, null, "{}");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.CreateTicketAsync(request, PartnershipUserId));

        Assert.Contains("lifecycle state", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("Onboarded", ex.Message);
    }

    [Fact]
    public async Task CreateTicketAsync_InvalidPartnerProduct_Throws()
    {
        // Arrange — non-existent partner ID
        var request = new CreateTicketRequest("RBT", "T01", Guid.NewGuid(), null, null, "{}");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.CreateTicketAsync(request, PartnershipUserId));

        Assert.Contains("No partner-product found", ex.Message);
    }

    [Fact]
    public async Task CreateTicketAsync_InvalidProductCode_Throws()
    {
        var request = new CreateTicketRequest("INVALID", "T01", PartnerId, null, null, "{}");

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.CreateTicketAsync(request, PartnershipUserId));

        Assert.Contains("Invalid product code", ex.Message);
    }

    [Fact]
    public async Task CreateTicketAsync_InvalidTaskType_Throws()
    {
        var request = new CreateTicketRequest("RBT", "T99", PartnerId, null, null, "{}");

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.CreateTicketAsync(request, PartnershipUserId));

        Assert.Contains("Invalid task type", ex.Message);
    }

    [Fact]
    public async Task CreateTicketAsync_T03WithoutProvisioningPath_Throws()
    {
        var request = new CreateTicketRequest("RBT", "T03", PartnerId, null, null, "{}");

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.CreateTicketAsync(request, PartnershipUserId));

        Assert.Contains("ProvisioningPath is required", ex.Message);
    }

    [Fact]
    public async Task CreateTicketAsync_T04WithoutIssueType_Throws()
    {
        var request = new CreateTicketRequest("RBT", "T04", PartnerId, null, null, "{}");

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.CreateTicketAsync(request, PartnershipUserId));

        Assert.Contains("IssueType is required", ex.Message);
    }

    [Fact]
    public async Task CreateTicketAsync_TwoTicketsSameDay_SequentialNumbers()
    {
        // Arrange
        var request = new CreateTicketRequest("RBT", "T01", PartnerId, null, null, "{}");

        // Act — create two tickets
        var result1 = await _engine.CreateTicketAsync(request, PartnershipUserId);
        var result2 = await _engine.CreateTicketAsync(request, PartnershipUserId);

        // Assert
        Assert.EndsWith("-001", result1.TicketId);
        Assert.EndsWith("-002", result2.TicketId);
    }

    // ─────────────────────────────────────────────────────
    //  ApproveStageAsync tests
    // ─────────────────────────────────────────────────────

    [Fact]
    public async Task ApproveStageAsync_SingleStage_AdvancesToNextStage()
    {
        // Arrange — add a second stage so the first approval advances (not completes)
        var stage2Id = new Guid("aaaaaaaa-0007-0007-0007-000000000001");
        var productTeamUserId = new Guid("aaaaaaaa-0008-0008-0008-000000000001");

        _db.StageDefinitions.Add(new StageDefinition
        {
            Id = stage2Id,
            WorkflowDefinitionId = WorkflowId,
            StageOrder = 2,
            StageName = "Product Review",
            StageType = StageType.Review,
            AssignedRole = UserRole.ProductTeam,
            SlaBusinessHours = 16
        });
        _db.Users.Add(new User
        {
            Id = productTeamUserId,
            FullName = "Test Product User",
            Email = "product@test.ae",
            PasswordHash = "not-used",
            Role = UserRole.ProductTeam,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        var created = await _engine.CreateTicketAsync(
            new CreateTicketRequest("RBT", "T01", PartnerId, null, null, "{}"),
            PartnershipUserId);

        // Act
        var result = await _engine.ApproveStageAsync(created.Id, LegalUserId, "Looks good");

        // Assert
        Assert.Equal("InReview", result.Status);
        Assert.Equal(2, result.CurrentStageOrder);
        Assert.Equal("Product Review", result.CurrentStageName);
    }

    [Fact]
    public async Task ApproveStageAsync_FinalStage_CompletesTicketAndAdvancesLifecycle()
    {
        // Arrange — single-stage workflow; stage 1 is the final stage
        var created = await _engine.CreateTicketAsync(
            new CreateTicketRequest("RBT", "T01", PartnerId, null, null, "{}"),
            PartnershipUserId);

        // Act
        var result = await _engine.ApproveStageAsync(created.Id, LegalUserId, null);

        // Assert
        Assert.Equal("Completed", result.Status);
        Assert.Null(result.CurrentStageName); // no current stage when completed

        // Verify lifecycle advanced to Onboarded
        var partnerProduct = await _db.PartnerProducts.FindAsync(PartnerProductId);
        Assert.Equal(LifecycleState.Onboarded, partnerProduct!.LifecycleState);
    }

    [Fact]
    public async Task ApproveStageAsync_WrongUser_Throws()
    {
        // Arrange
        var created = await _engine.CreateTicketAsync(
            new CreateTicketRequest("RBT", "T01", PartnerId, null, null, "{}"),
            PartnershipUserId);

        var wrongUserId = new Guid("aaaaaaaa-ffff-ffff-ffff-000000000001");

        // Act & Assert
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.ApproveStageAsync(created.Id, wrongUserId, null));

        Assert.Contains("not the assigned owner", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    // ─────────────────────────────────────────────────────
    //  RejectAsync tests
    // ─────────────────────────────────────────────────────

    [Fact]
    public async Task RejectAsync_SetsStatusToRejected()
    {
        // Arrange
        var created = await _engine.CreateTicketAsync(
            new CreateTicketRequest("RBT", "T01", PartnerId, null, null, "{}"),
            PartnershipUserId);

        // Act
        var result = await _engine.RejectAsync(created.Id, LegalUserId, "Does not meet requirements");

        // Assert
        Assert.Equal("Rejected", result.Status);
    }

    // ─────────────────────────────────────────────────────
    //  ReturnForClarificationAsync tests
    // ─────────────────────────────────────────────────────

    [Fact]
    public async Task ReturnForClarificationAsync_SetsPendingRequesterAction()
    {
        // Arrange
        var created = await _engine.CreateTicketAsync(
            new CreateTicketRequest("RBT", "T01", PartnerId, null, null, "{}"),
            PartnershipUserId);

        // Act
        var result = await _engine.ReturnForClarificationAsync(
            created.Id, LegalUserId, "Please provide more details");

        // Assert
        Assert.Equal("PendingRequesterAction", result.Status);
    }

    // ─────────────────────────────────────────────────────
    //  RespondToClarificationAsync tests
    // ─────────────────────────────────────────────────────

    [Fact]
    public async Task RespondToClarificationAsync_RestoresPreviousStatus()
    {
        // Arrange — create ticket, return for clarification, then respond
        var created = await _engine.CreateTicketAsync(
            new CreateTicketRequest("RBT", "T01", PartnerId, null, null, "{}"),
            PartnershipUserId);

        await _engine.ReturnForClarificationAsync(
            created.Id, LegalUserId, "Please clarify agreement number");

        // Act
        var result = await _engine.RespondToClarificationAsync(
            created.Id, PartnershipUserId, "Here is the clarification");

        // Assert — stage 1 is Review type → restores to InReview
        Assert.Equal("InReview", result.Status);
    }

    // ─────────────────────────────────────────────────────
    //  CancelAsync tests
    // ─────────────────────────────────────────────────────

    [Fact]
    public async Task CancelAsync_SubmittedTicket_SetsCancelled()
    {
        // Arrange
        var created = await _engine.CreateTicketAsync(
            new CreateTicketRequest("RBT", "T01", PartnerId, null, null, "{}"),
            PartnershipUserId);

        // Ticket starts as Submitted — cancel it
        var result = await _engine.CancelAsync(created.Id, PartnershipUserId, "No longer needed");

        // Assert
        Assert.Equal("Cancelled", result.Status);
    }

    [Fact]
    public async Task CancelAsync_NonSubmittedTicket_Throws()
    {
        // Arrange — approve first to move past Submitted
        var created = await _engine.CreateTicketAsync(
            new CreateTicketRequest("RBT", "T01", PartnerId, null, null, "{}"),
            PartnershipUserId);

        // Approve → moves to Completed (single-stage workflow)
        await _engine.ApproveStageAsync(created.Id, LegalUserId, null);

        // Act & Assert — cannot cancel a Completed ticket
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _engine.CancelAsync(created.Id, PartnershipUserId, "Trying to cancel"));

        Assert.Contains("Submitted", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    // ─────────────────────────────────────────────────────
    //  ReassignAsync tests
    // ─────────────────────────────────────────────────────

    [Fact]
    public async Task ReassignAsync_ChangesAssignedUser()
    {
        // Arrange — add a second LegalTeam user to reassign to
        var legalUser2Id = new Guid("aaaaaaaa-0009-0009-0009-000000000001");
        _db.Users.Add(new User
        {
            Id = legalUser2Id,
            FullName = "Second Legal User",
            Email = "legal2@test.ae",
            PasswordHash = "not-used",
            Role = UserRole.LegalTeam,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        var created = await _engine.CreateTicketAsync(
            new CreateTicketRequest("RBT", "T01", PartnerId, null, null, "{}"),
            PartnershipUserId);

        // Act — reassign from LegalUserId to legalUser2Id
        var result = await _engine.ReassignAsync(created.Id, PartnershipUserId, legalUser2Id);

        // Assert
        Assert.Equal("Second Legal User", result.AssignedToName);
    }

    // ─────────────────────────────────────────────────────
    //  Full T-01 flow test
    // ─────────────────────────────────────────────────────

    [Fact]
    public async Task FullT01Flow_FourStages_CompletesAndAdvancesToOnboarded()
    {
        // Arrange — add 3 more stages and users to make it a proper 4-stage T-01 flow
        var productUserId = new Guid("bbbbbbbb-0001-0001-0001-000000000001");
        var eaUserId = new Guid("bbbbbbbb-0002-0002-0002-000000000001");
        // PartnershipUserId already exists (seeded as stage-4 approver too)

        _db.StageDefinitions.Add(new StageDefinition
        {
            Id = new Guid("bbbbbbbb-0003-0003-0003-000000000001"),
            WorkflowDefinitionId = WorkflowId,
            StageOrder = 2,
            StageName = "Product Review",
            StageType = StageType.Review,
            AssignedRole = UserRole.ProductTeam,
            SlaBusinessHours = 16
        });
        _db.StageDefinitions.Add(new StageDefinition
        {
            Id = new Guid("bbbbbbbb-0004-0004-0004-000000000001"),
            WorkflowDefinitionId = WorkflowId,
            StageOrder = 3,
            StageName = "EA Sign-off",
            StageType = StageType.Approval,
            AssignedRole = UserRole.ExecutiveAuthority,
            SlaBusinessHours = 8
        });
        _db.StageDefinitions.Add(new StageDefinition
        {
            Id = new Guid("bbbbbbbb-0005-0005-0005-000000000001"),
            WorkflowDefinitionId = WorkflowId,
            StageOrder = 4,
            StageName = "Stakeholder Notification",
            StageType = StageType.Review,
            AssignedRole = UserRole.PartnershipTeam,
            SlaBusinessHours = 0
        });
        _db.Users.Add(new User
        {
            Id = productUserId,
            FullName = "Test Product User",
            Email = "product2@test.ae",
            PasswordHash = "not-used",
            Role = UserRole.ProductTeam,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });
        _db.Users.Add(new User
        {
            Id = eaUserId,
            FullName = "Test EA User",
            Email = "ea@test.ae",
            PasswordHash = "not-used",
            Role = UserRole.ExecutiveAuthority,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync();

        // Act — create ticket and approve all 4 stages
        var created = await _engine.CreateTicketAsync(
            new CreateTicketRequest("RBT", "T01", PartnerId, null, null, "{}"),
            PartnershipUserId);

        Assert.Equal("Submitted", created.Status);
        Assert.Equal(1, created.CurrentStageOrder);

        // Stage 1: Legal Review → approve as LegalUser
        var after1 = await _engine.ApproveStageAsync(created.Id, LegalUserId, null);
        Assert.Equal("InReview", after1.Status);
        Assert.Equal(2, after1.CurrentStageOrder);

        // Stage 2: Product Review → approve as ProductUser
        var after2 = await _engine.ApproveStageAsync(created.Id, productUserId, null);
        Assert.Equal("InReview", after2.Status);
        Assert.Equal(3, after2.CurrentStageOrder);

        // Stage 3: EA Sign-off → approve as EA User
        var after3 = await _engine.ApproveStageAsync(created.Id, eaUserId, null);
        Assert.Equal("InReview", after3.Status);
        Assert.Equal(4, after3.CurrentStageOrder);

        // Stage 4: Stakeholder Notification → approve as Partnership User (final stage)
        var final = await _engine.ApproveStageAsync(created.Id, PartnershipUserId, null);

        // Assert — ticket completed and lifecycle advanced
        Assert.Equal("Completed", final.Status);
        Assert.Null(final.CurrentStageName);

        var partnerProduct = await _db.PartnerProducts.FindAsync(PartnerProductId);
        Assert.Equal(LifecycleState.Onboarded, partnerProduct!.LifecycleState);

        // Verify audit trail has TicketCompleted entry
        var completedAudit = await _db.AuditEntries
            .FirstOrDefaultAsync(a => a.TicketId == created.Id && a.ActionType == "TicketCompleted");
        Assert.NotNull(completedAudit);
    }
}
