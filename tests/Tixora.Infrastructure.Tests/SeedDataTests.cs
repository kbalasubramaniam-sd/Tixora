// File: tests/Tixora.Infrastructure.Tests/SeedDataTests.cs
using Microsoft.EntityFrameworkCore;
using Tixora.Domain.Enums;
using Tixora.Infrastructure.Data;

namespace Tixora.Infrastructure.Tests;

public class SeedDataTests : IDisposable
{
    private readonly TixoraDbContext _db;

    public SeedDataTests()
    {
        var options = new DbContextOptionsBuilder<TixoraDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _db = new TixoraDbContext(options);
        _db.Database.EnsureCreated();
    }

    public void Dispose()
    {
        _db.Dispose();
    }

    [Fact]
    public async Task Products_ShouldHave4WithCorrectCodes()
    {
        var products = await _db.Products.ToListAsync();

        Assert.Equal(4, products.Count);
        Assert.Contains(products, p => p.Code == ProductCode.RBT && p.Name == "Rabet" && p.PortalType == PortalType.Transactional);
        Assert.Contains(products, p => p.Code == ProductCode.RHN && p.Name == "Rhoon" && p.PortalType == PortalType.Transactional);
        Assert.Contains(products, p => p.Code == ProductCode.WTQ && p.Name == "Wtheeq" && p.PortalType == PortalType.ReadOnly);
        Assert.Contains(products, p => p.Code == ProductCode.MLM && p.Name == "Mulem" && p.PortalType == PortalType.ReadOnly);
    }

    [Fact]
    public async Task Users_ShouldHave12WithCorrectRoles()
    {
        var users = await _db.Users.ToListAsync();

        Assert.Equal(12, users.Count);

        // Verify role distribution
        Assert.Single(users, u => u.Role == UserRole.PartnershipTeam);
        Assert.Single(users, u => u.Role == UserRole.LegalTeam);
        Assert.Equal(2, users.Count(u => u.Role == UserRole.ProductTeam));
        Assert.Single(users, u => u.Role == UserRole.ExecutiveAuthority);
        Assert.Single(users, u => u.Role == UserRole.IntegrationTeam);
        Assert.Single(users, u => u.Role == UserRole.DevTeam);
        Assert.Single(users, u => u.Role == UserRole.BusinessTeam);
        Assert.Equal(3, users.Count(u => u.Role == UserRole.PartnerOps));
        Assert.Single(users, u => u.Role == UserRole.SystemAdministrator);

        // All active
        Assert.All(users, u => Assert.True(u.IsActive));

        // All have password hashes
        Assert.All(users, u => Assert.False(string.IsNullOrEmpty(u.PasswordHash)));
    }

    [Fact]
    public async Task Partners_ShouldHave3With6PartnerProducts()
    {
        var partners = await _db.Partners.Include(p => p.PartnerProducts).ToListAsync();

        Assert.Equal(3, partners.Count);

        var aai = partners.Single(p => p.Name == "Al Ain Insurance");
        Assert.Equal(2, aai.PartnerProducts.Count);
        Assert.Contains(aai.PartnerProducts, pp => pp.ProductCode == ProductCode.RBT);
        Assert.Contains(aai.PartnerProducts, pp => pp.ProductCode == ProductCode.WTQ);

        var dib = partners.Single(p => p.Name == "Dubai Islamic Bank");
        Assert.Equal(2, dib.PartnerProducts.Count);
        Assert.Contains(dib.PartnerProducts, pp => pp.ProductCode == ProductCode.RHN);
        Assert.Contains(dib.PartnerProducts, pp => pp.ProductCode == ProductCode.MLM);

        var eic = partners.Single(p => p.Name == "Emirates Insurance");
        Assert.Equal(2, eic.PartnerProducts.Count);
        Assert.Contains(eic.PartnerProducts, pp => pp.ProductCode == ProductCode.RBT);
        Assert.Contains(eic.PartnerProducts, pp => pp.ProductCode == ProductCode.RHN);

        // All start at None
        var allPPs = partners.SelectMany(p => p.PartnerProducts).ToList();
        Assert.Equal(6, allPPs.Count);
        Assert.All(allPPs, pp => Assert.Equal(LifecycleState.None, pp.LifecycleState));
    }

    [Fact]
    public async Task WorkflowDefinitions_ShouldHave18()
    {
        var workflows = await _db.WorkflowDefinitions
            .Include(w => w.Stages)
            .ToListAsync();

        Assert.Equal(18, workflows.Count);

        // T-01: 4 workflows × 4 stages each
        var t01 = workflows.Where(w => w.TaskType == TaskType.T01).ToList();
        Assert.Equal(4, t01.Count);
        Assert.All(t01, w => Assert.Equal(4, w.Stages.Count));
        Assert.All(t01, w => Assert.Null(w.ProvisioningPath));

        // T-02: 4 workflows × 5 stages each
        var t02 = workflows.Where(w => w.TaskType == TaskType.T02).ToList();
        Assert.Equal(4, t02.Count);
        Assert.All(t02, w => Assert.Equal(5, w.Stages.Count));
        Assert.All(t02, w => Assert.Null(w.ProvisioningPath));

        // T-03: 6 workflows with varying stage counts
        var t03 = workflows.Where(w => w.TaskType == TaskType.T03).ToList();
        Assert.Equal(6, t03.Count);

        var t03PortalOnly = t03.Where(w => w.ProvisioningPath == ProvisioningPath.PortalOnly).ToList();
        Assert.Equal(2, t03PortalOnly.Count);
        Assert.All(t03PortalOnly, w => Assert.Equal(4, w.Stages.Count));

        var t03PortalAndApi = t03.Where(w => w.ProvisioningPath == ProvisioningPath.PortalAndApi).ToList();
        Assert.Equal(2, t03PortalAndApi.Count);
        Assert.All(t03PortalAndApi, w => Assert.Equal(5, w.Stages.Count));

        var t03ApiOnly = t03.Where(w => w.ProvisioningPath == ProvisioningPath.ApiOnly).ToList();
        Assert.Equal(2, t03ApiOnly.Count);
        Assert.All(t03ApiOnly, w => Assert.Equal(3, w.Stages.Count));

        // T-04: 4 workflows × 1 stage each
        var t04 = workflows.Where(w => w.TaskType == TaskType.T04).ToList();
        Assert.Equal(4, t04.Count);
        Assert.All(t04, w => Assert.Equal(1, w.Stages.Count));
    }

    [Fact]
    public async Task StageDefinitions_ShouldHaveValidRolesAndSla()
    {
        var stages = await _db.StageDefinitions.ToListAsync();

        // Total: T01(16) + T02(20) + T03_PO(8) + T03_PA(10) + T03_AO(6) + T04(4) = 64
        Assert.Equal(64, stages.Count);

        // All stages have valid roles (not negative)
        Assert.All(stages, s => Assert.True(Enum.IsDefined(typeof(UserRole), s.AssignedRole)));

        // All SLA values are non-negative
        Assert.All(stages, s => Assert.True(s.SlaBusinessHours >= 0));

        // All stages have non-empty names
        Assert.All(stages, s => Assert.False(string.IsNullOrWhiteSpace(s.StageName)));

        // All stages have valid StageType
        Assert.All(stages, s => Assert.True(Enum.IsDefined(typeof(StageType), s.StageType)));

        // Verify SLA=0 stages are PhaseGate or final notification stages
        var zeroSlaStages = stages.Where(s => s.SlaBusinessHours == 0).ToList();
        Assert.All(zeroSlaStages, s =>
            Assert.True(
                s.StageType == StageType.PhaseGate || s.StageName == "Stakeholder Notification",
                $"Stage '{s.StageName}' has SLA=0 but is not PhaseGate or Stakeholder Notification"
            ));
    }

    [Fact]
    public async Task AllWorkflows_ShouldBeActiveVersion1()
    {
        var workflows = await _db.WorkflowDefinitions.ToListAsync();

        Assert.All(workflows, w =>
        {
            Assert.True(w.IsActive);
            Assert.Equal(1, w.Version);
        });
    }

    [Fact]
    public async Task StageOrders_ShouldBeSequentialPerWorkflow()
    {
        var workflows = await _db.WorkflowDefinitions
            .Include(w => w.Stages)
            .ToListAsync();

        foreach (var workflow in workflows)
        {
            var orders = workflow.Stages.OrderBy(s => s.StageOrder).Select(s => s.StageOrder).ToList();
            var expected = Enumerable.Range(1, orders.Count).ToList();
            Assert.Equal(expected, orders);
        }
    }
}
