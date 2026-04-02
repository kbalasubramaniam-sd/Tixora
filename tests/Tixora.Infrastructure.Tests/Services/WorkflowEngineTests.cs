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
}
