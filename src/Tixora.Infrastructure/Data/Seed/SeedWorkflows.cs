// File: src/Tixora.Infrastructure/Data/Seed/SeedWorkflows.cs
using Microsoft.EntityFrameworkCore;
using Tixora.Domain.Entities;
using Tixora.Domain.Enums;

namespace Tixora.Infrastructure.Data.Seed;

public static class SeedWorkflows
{
    // ──────────────────────────────────────────────
    //  T-01 Workflow IDs (4 — one per product)
    // ──────────────────────────────────────────────
    public static readonly Guid T01_RBT = new("d4e5f6a7-0101-0001-0001-000000000001");
    public static readonly Guid T01_RHN = new("d4e5f6a7-0101-0001-0001-000000000002");
    public static readonly Guid T01_WTQ = new("d4e5f6a7-0101-0001-0001-000000000003");
    public static readonly Guid T01_MLM = new("d4e5f6a7-0101-0001-0001-000000000004");

    // ──────────────────────────────────────────────
    //  T-02 Workflow IDs (4 — one per product)
    // ──────────────────────────────────────────────
    public static readonly Guid T02_RBT = new("d4e5f6a7-0102-0001-0001-000000000001");
    public static readonly Guid T02_RHN = new("d4e5f6a7-0102-0001-0001-000000000002");
    public static readonly Guid T02_WTQ = new("d4e5f6a7-0102-0001-0001-000000000003");
    public static readonly Guid T02_MLM = new("d4e5f6a7-0102-0001-0001-000000000004");

    // ──────────────────────────────────────────────
    //  T-03 Workflow IDs (6 — product × path)
    // ──────────────────────────────────────────────
    public static readonly Guid T03_RBT_PortalOnly = new("d4e5f6a7-0103-0001-0001-000000000001");
    public static readonly Guid T03_RBT_PortalAndApi = new("d4e5f6a7-0103-0001-0001-000000000002");
    public static readonly Guid T03_RHN_PortalOnly = new("d4e5f6a7-0103-0001-0001-000000000003");
    public static readonly Guid T03_RHN_PortalAndApi = new("d4e5f6a7-0103-0001-0001-000000000004");
    public static readonly Guid T03_WTQ_ApiOnly = new("d4e5f6a7-0103-0001-0001-000000000005");
    public static readonly Guid T03_MLM_ApiOnly = new("d4e5f6a7-0103-0001-0001-000000000006");

    // ──────────────────────────────────────────────
    //  T-04 Workflow IDs (4 — one per product)
    // ──────────────────────────────────────────────
    public static readonly Guid T04_RBT = new("d4e5f6a7-0104-0001-0001-000000000001");
    public static readonly Guid T04_RHN = new("d4e5f6a7-0104-0001-0001-000000000002");
    public static readonly Guid T04_WTQ = new("d4e5f6a7-0104-0001-0001-000000000003");
    public static readonly Guid T04_MLM = new("d4e5f6a7-0104-0001-0001-000000000004");

    // ──────────────────────────────────────────────
    //  Stage Definition GUIDs — deterministic, grouped by workflow
    // ──────────────────────────────────────────────

    // T-01 stages (4 stages × 4 products = 16 GUIDs)
    // Pattern: e5f6a7b8-01TT-PPPP-SSSS-000000000001
    //   TT = task type (01)
    //   PPPP = product index (0001-0004)
    //   SSSS = stage order (0001-0004)

    // T-01 RBT stages
    private static readonly Guid S_T01_RBT_1 = new("e5f6a7b8-0101-0001-0001-000000000001");
    private static readonly Guid S_T01_RBT_2 = new("e5f6a7b8-0101-0001-0002-000000000001");
    private static readonly Guid S_T01_RBT_3 = new("e5f6a7b8-0101-0001-0003-000000000001");
    private static readonly Guid S_T01_RBT_4 = new("e5f6a7b8-0101-0001-0004-000000000001");

    // T-01 RHN stages
    private static readonly Guid S_T01_RHN_1 = new("e5f6a7b8-0101-0002-0001-000000000001");
    private static readonly Guid S_T01_RHN_2 = new("e5f6a7b8-0101-0002-0002-000000000001");
    private static readonly Guid S_T01_RHN_3 = new("e5f6a7b8-0101-0002-0003-000000000001");
    private static readonly Guid S_T01_RHN_4 = new("e5f6a7b8-0101-0002-0004-000000000001");

    // T-01 WTQ stages
    private static readonly Guid S_T01_WTQ_1 = new("e5f6a7b8-0101-0003-0001-000000000001");
    private static readonly Guid S_T01_WTQ_2 = new("e5f6a7b8-0101-0003-0002-000000000001");
    private static readonly Guid S_T01_WTQ_3 = new("e5f6a7b8-0101-0003-0003-000000000001");
    private static readonly Guid S_T01_WTQ_4 = new("e5f6a7b8-0101-0003-0004-000000000001");

    // T-01 MLM stages
    private static readonly Guid S_T01_MLM_1 = new("e5f6a7b8-0101-0004-0001-000000000001");
    private static readonly Guid S_T01_MLM_2 = new("e5f6a7b8-0101-0004-0002-000000000001");
    private static readonly Guid S_T01_MLM_3 = new("e5f6a7b8-0101-0004-0003-000000000001");
    private static readonly Guid S_T01_MLM_4 = new("e5f6a7b8-0101-0004-0004-000000000001");

    // T-02 stages (5 stages × 4 products = 20 GUIDs)
    private static readonly Guid S_T02_RBT_1 = new("e5f6a7b8-0102-0001-0001-000000000001");
    private static readonly Guid S_T02_RBT_2 = new("e5f6a7b8-0102-0001-0002-000000000001");
    private static readonly Guid S_T02_RBT_3 = new("e5f6a7b8-0102-0001-0003-000000000001");
    private static readonly Guid S_T02_RBT_4 = new("e5f6a7b8-0102-0001-0004-000000000001");
    private static readonly Guid S_T02_RBT_5 = new("e5f6a7b8-0102-0001-0005-000000000001");

    private static readonly Guid S_T02_RHN_1 = new("e5f6a7b8-0102-0002-0001-000000000001");
    private static readonly Guid S_T02_RHN_2 = new("e5f6a7b8-0102-0002-0002-000000000001");
    private static readonly Guid S_T02_RHN_3 = new("e5f6a7b8-0102-0002-0003-000000000001");
    private static readonly Guid S_T02_RHN_4 = new("e5f6a7b8-0102-0002-0004-000000000001");
    private static readonly Guid S_T02_RHN_5 = new("e5f6a7b8-0102-0002-0005-000000000001");

    private static readonly Guid S_T02_WTQ_1 = new("e5f6a7b8-0102-0003-0001-000000000001");
    private static readonly Guid S_T02_WTQ_2 = new("e5f6a7b8-0102-0003-0002-000000000001");
    private static readonly Guid S_T02_WTQ_3 = new("e5f6a7b8-0102-0003-0003-000000000001");
    private static readonly Guid S_T02_WTQ_4 = new("e5f6a7b8-0102-0003-0004-000000000001");
    private static readonly Guid S_T02_WTQ_5 = new("e5f6a7b8-0102-0003-0005-000000000001");

    private static readonly Guid S_T02_MLM_1 = new("e5f6a7b8-0102-0004-0001-000000000001");
    private static readonly Guid S_T02_MLM_2 = new("e5f6a7b8-0102-0004-0002-000000000001");
    private static readonly Guid S_T02_MLM_3 = new("e5f6a7b8-0102-0004-0003-000000000001");
    private static readonly Guid S_T02_MLM_4 = new("e5f6a7b8-0102-0004-0004-000000000001");
    private static readonly Guid S_T02_MLM_5 = new("e5f6a7b8-0102-0004-0005-000000000001");

    // T-03 PortalOnly stages (4 stages × 2 products = 8 GUIDs)
    private static readonly Guid S_T03_RBT_PO_1 = new("e5f6a7b8-0103-0001-0001-000000000001");
    private static readonly Guid S_T03_RBT_PO_2 = new("e5f6a7b8-0103-0001-0002-000000000001");
    private static readonly Guid S_T03_RBT_PO_3 = new("e5f6a7b8-0103-0001-0003-000000000001");
    private static readonly Guid S_T03_RBT_PO_4 = new("e5f6a7b8-0103-0001-0004-000000000001");

    private static readonly Guid S_T03_RHN_PO_1 = new("e5f6a7b8-0103-0003-0001-000000000001");
    private static readonly Guid S_T03_RHN_PO_2 = new("e5f6a7b8-0103-0003-0002-000000000001");
    private static readonly Guid S_T03_RHN_PO_3 = new("e5f6a7b8-0103-0003-0003-000000000001");
    private static readonly Guid S_T03_RHN_PO_4 = new("e5f6a7b8-0103-0003-0004-000000000001");

    // T-03 PortalAndApi stages (5 stages × 2 products = 10 GUIDs)
    private static readonly Guid S_T03_RBT_PA_1 = new("e5f6a7b8-0103-0002-0001-000000000001");
    private static readonly Guid S_T03_RBT_PA_2 = new("e5f6a7b8-0103-0002-0002-000000000001");
    private static readonly Guid S_T03_RBT_PA_3 = new("e5f6a7b8-0103-0002-0003-000000000001");
    private static readonly Guid S_T03_RBT_PA_4 = new("e5f6a7b8-0103-0002-0004-000000000001");
    private static readonly Guid S_T03_RBT_PA_5 = new("e5f6a7b8-0103-0002-0005-000000000001");

    private static readonly Guid S_T03_RHN_PA_1 = new("e5f6a7b8-0103-0004-0001-000000000001");
    private static readonly Guid S_T03_RHN_PA_2 = new("e5f6a7b8-0103-0004-0002-000000000001");
    private static readonly Guid S_T03_RHN_PA_3 = new("e5f6a7b8-0103-0004-0003-000000000001");
    private static readonly Guid S_T03_RHN_PA_4 = new("e5f6a7b8-0103-0004-0004-000000000001");
    private static readonly Guid S_T03_RHN_PA_5 = new("e5f6a7b8-0103-0004-0005-000000000001");

    // T-03 ApiOnly stages (3 stages × 2 products = 6 GUIDs)
    private static readonly Guid S_T03_WTQ_AO_1 = new("e5f6a7b8-0103-0005-0001-000000000001");
    private static readonly Guid S_T03_WTQ_AO_2 = new("e5f6a7b8-0103-0005-0002-000000000001");
    private static readonly Guid S_T03_WTQ_AO_3 = new("e5f6a7b8-0103-0005-0003-000000000001");

    private static readonly Guid S_T03_MLM_AO_1 = new("e5f6a7b8-0103-0006-0001-000000000001");
    private static readonly Guid S_T03_MLM_AO_2 = new("e5f6a7b8-0103-0006-0002-000000000001");
    private static readonly Guid S_T03_MLM_AO_3 = new("e5f6a7b8-0103-0006-0003-000000000001");

    // T-04 stages (1 stage × 4 products = 4 GUIDs)
    private static readonly Guid S_T04_RBT_1 = new("e5f6a7b8-0104-0001-0001-000000000001");
    private static readonly Guid S_T04_RHN_1 = new("e5f6a7b8-0104-0002-0001-000000000001");
    private static readonly Guid S_T04_WTQ_1 = new("e5f6a7b8-0104-0003-0001-000000000001");
    private static readonly Guid S_T04_MLM_1 = new("e5f6a7b8-0104-0004-0001-000000000001");

    public static void Seed(ModelBuilder modelBuilder)
    {
        var now = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        SeedWorkflowDefinitions(modelBuilder, now);
        SeedT01Stages(modelBuilder);
        SeedT02Stages(modelBuilder);
        SeedT03Stages(modelBuilder);
        SeedT04Stages(modelBuilder);
    }

    private static void SeedWorkflowDefinitions(ModelBuilder modelBuilder, DateTime now)
    {
        modelBuilder.Entity<WorkflowDefinition>().HasData(
            // ── T-01: Agreement Validation & Sign-off (4 products) ──
            new WorkflowDefinition
            {
                Id = T01_RBT,
                ProductCode = ProductCode.RBT,
                TaskType = TaskType.T01,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            new WorkflowDefinition
            {
                Id = T01_RHN,
                ProductCode = ProductCode.RHN,
                TaskType = TaskType.T01,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            new WorkflowDefinition
            {
                Id = T01_WTQ,
                ProductCode = ProductCode.WTQ,
                TaskType = TaskType.T01,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            new WorkflowDefinition
            {
                Id = T01_MLM,
                ProductCode = ProductCode.MLM,
                TaskType = TaskType.T01,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },

            // ── T-02: UAT Access Creation (4 products) ──
            new WorkflowDefinition
            {
                Id = T02_RBT,
                ProductCode = ProductCode.RBT,
                TaskType = TaskType.T02,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            new WorkflowDefinition
            {
                Id = T02_RHN,
                ProductCode = ProductCode.RHN,
                TaskType = TaskType.T02,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            new WorkflowDefinition
            {
                Id = T02_WTQ,
                ProductCode = ProductCode.WTQ,
                TaskType = TaskType.T02,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            new WorkflowDefinition
            {
                Id = T02_MLM,
                ProductCode = ProductCode.MLM,
                TaskType = TaskType.T02,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },

            // ── T-03: Production Account Creation (6 workflows) ──
            // Rabet — PortalOnly
            new WorkflowDefinition
            {
                Id = T03_RBT_PortalOnly,
                ProductCode = ProductCode.RBT,
                TaskType = TaskType.T03,
                ProvisioningPath = ProvisioningPath.PortalOnly,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            // Rabet — PortalAndApi
            new WorkflowDefinition
            {
                Id = T03_RBT_PortalAndApi,
                ProductCode = ProductCode.RBT,
                TaskType = TaskType.T03,
                ProvisioningPath = ProvisioningPath.PortalAndApi,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            // Rhoon — PortalOnly
            new WorkflowDefinition
            {
                Id = T03_RHN_PortalOnly,
                ProductCode = ProductCode.RHN,
                TaskType = TaskType.T03,
                ProvisioningPath = ProvisioningPath.PortalOnly,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            // Rhoon — PortalAndApi
            new WorkflowDefinition
            {
                Id = T03_RHN_PortalAndApi,
                ProductCode = ProductCode.RHN,
                TaskType = TaskType.T03,
                ProvisioningPath = ProvisioningPath.PortalAndApi,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            // Wtheeq — ApiOnly
            new WorkflowDefinition
            {
                Id = T03_WTQ_ApiOnly,
                ProductCode = ProductCode.WTQ,
                TaskType = TaskType.T03,
                ProvisioningPath = ProvisioningPath.ApiOnly,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            // Mulem — ApiOnly
            new WorkflowDefinition
            {
                Id = T03_MLM_ApiOnly,
                ProductCode = ProductCode.MLM,
                TaskType = TaskType.T03,
                ProvisioningPath = ProvisioningPath.ApiOnly,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },

            // ── T-04: Access & Credential Support (4 products) ──
            new WorkflowDefinition
            {
                Id = T04_RBT,
                ProductCode = ProductCode.RBT,
                TaskType = TaskType.T04,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            new WorkflowDefinition
            {
                Id = T04_RHN,
                ProductCode = ProductCode.RHN,
                TaskType = TaskType.T04,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            new WorkflowDefinition
            {
                Id = T04_WTQ,
                ProductCode = ProductCode.WTQ,
                TaskType = TaskType.T04,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            },
            new WorkflowDefinition
            {
                Id = T04_MLM,
                ProductCode = ProductCode.MLM,
                TaskType = TaskType.T04,
                ProvisioningPath = null,
                Version = 1,
                IsActive = true,
                CreatedAt = now
            }
        );
    }

    private static void SeedT01Stages(ModelBuilder modelBuilder)
    {
        // T-01: Legal Review → Product Review → EA Sign-off → Completed
        modelBuilder.Entity<StageDefinition>().HasData(
            // ── RBT ──
            new StageDefinition { Id = S_T01_RBT_1, WorkflowDefinitionId = T01_RBT, StageOrder = 1, StageName = "Legal Review", StageType = StageType.Review, AssignedRole = UserRole.LegalTeam, SlaBusinessHours = 24 },
            new StageDefinition { Id = S_T01_RBT_2, WorkflowDefinitionId = T01_RBT, StageOrder = 2, StageName = "Product Review", StageType = StageType.Review, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 16 },
            new StageDefinition { Id = S_T01_RBT_3, WorkflowDefinitionId = T01_RBT, StageOrder = 3, StageName = "EA Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.ExecutiveAuthority, SlaBusinessHours = 8 },

            // ── RHN ──
            new StageDefinition { Id = S_T01_RHN_1, WorkflowDefinitionId = T01_RHN, StageOrder = 1, StageName = "Legal Review", StageType = StageType.Review, AssignedRole = UserRole.LegalTeam, SlaBusinessHours = 24 },
            new StageDefinition { Id = S_T01_RHN_2, WorkflowDefinitionId = T01_RHN, StageOrder = 2, StageName = "Product Review", StageType = StageType.Review, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 16 },
            new StageDefinition { Id = S_T01_RHN_3, WorkflowDefinitionId = T01_RHN, StageOrder = 3, StageName = "EA Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.ExecutiveAuthority, SlaBusinessHours = 8 },

            // ── WTQ ──
            new StageDefinition { Id = S_T01_WTQ_1, WorkflowDefinitionId = T01_WTQ, StageOrder = 1, StageName = "Legal Review", StageType = StageType.Review, AssignedRole = UserRole.LegalTeam, SlaBusinessHours = 24 },
            new StageDefinition { Id = S_T01_WTQ_2, WorkflowDefinitionId = T01_WTQ, StageOrder = 2, StageName = "Product Review", StageType = StageType.Review, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 16 },
            new StageDefinition { Id = S_T01_WTQ_3, WorkflowDefinitionId = T01_WTQ, StageOrder = 3, StageName = "EA Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.ExecutiveAuthority, SlaBusinessHours = 8 },

            // ── MLM ──
            new StageDefinition { Id = S_T01_MLM_1, WorkflowDefinitionId = T01_MLM, StageOrder = 1, StageName = "Legal Review", StageType = StageType.Review, AssignedRole = UserRole.LegalTeam, SlaBusinessHours = 24 },
            new StageDefinition { Id = S_T01_MLM_2, WorkflowDefinitionId = T01_MLM, StageOrder = 2, StageName = "Product Review", StageType = StageType.Review, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 16 },
            new StageDefinition { Id = S_T01_MLM_3, WorkflowDefinitionId = T01_MLM, StageOrder = 3, StageName = "EA Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.ExecutiveAuthority, SlaBusinessHours = 8 }
        );
    }

    private static void SeedT02Stages(ModelBuilder modelBuilder)
    {
        // T-02: Access Provisioning → API Credential Creation → Awaiting UAT Signal → UAT Sign-off
        // (Product Team Review removed — not needed for UAT access)
        modelBuilder.Entity<StageDefinition>().HasData(
            // ── RBT ──
            new StageDefinition { Id = S_T02_RBT_2, WorkflowDefinitionId = T02_RBT, StageOrder = 1, StageName = "Access Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T02_RBT_3, WorkflowDefinitionId = T02_RBT, StageOrder = 2, StageName = "API Credential Creation", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T02_RBT_4, WorkflowDefinitionId = T02_RBT, StageOrder = 3, StageName = "Awaiting UAT Signal", StageType = StageType.PhaseGate, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 0 },
            new StageDefinition { Id = S_T02_RBT_5, WorkflowDefinitionId = T02_RBT, StageOrder = 4, StageName = "UAT Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 8 },

            // ── RHN ──
            new StageDefinition { Id = S_T02_RHN_2, WorkflowDefinitionId = T02_RHN, StageOrder = 1, StageName = "Access Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T02_RHN_3, WorkflowDefinitionId = T02_RHN, StageOrder = 2, StageName = "API Credential Creation", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T02_RHN_4, WorkflowDefinitionId = T02_RHN, StageOrder = 3, StageName = "Awaiting UAT Signal", StageType = StageType.PhaseGate, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 0 },
            new StageDefinition { Id = S_T02_RHN_5, WorkflowDefinitionId = T02_RHN, StageOrder = 4, StageName = "UAT Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 8 },

            // ── WTQ ──
            new StageDefinition { Id = S_T02_WTQ_2, WorkflowDefinitionId = T02_WTQ, StageOrder = 1, StageName = "Access Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T02_WTQ_3, WorkflowDefinitionId = T02_WTQ, StageOrder = 2, StageName = "API Credential Creation", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T02_WTQ_4, WorkflowDefinitionId = T02_WTQ, StageOrder = 3, StageName = "Awaiting UAT Signal", StageType = StageType.PhaseGate, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 0 },
            new StageDefinition { Id = S_T02_WTQ_5, WorkflowDefinitionId = T02_WTQ, StageOrder = 4, StageName = "UAT Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 8 },

            // ── MLM ──
            new StageDefinition { Id = S_T02_MLM_2, WorkflowDefinitionId = T02_MLM, StageOrder = 1, StageName = "Access Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T02_MLM_3, WorkflowDefinitionId = T02_MLM, StageOrder = 2, StageName = "API Credential Creation", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T02_MLM_4, WorkflowDefinitionId = T02_MLM, StageOrder = 3, StageName = "Awaiting UAT Signal", StageType = StageType.PhaseGate, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 0 },
            new StageDefinition { Id = S_T02_MLM_5, WorkflowDefinitionId = T02_MLM, StageOrder = 4, StageName = "UAT Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 8 }
        );
    }

    private static void SeedT03Stages(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<StageDefinition>().HasData(
            // ═══════════════════════════════════════
            //  T-03 Portal Only (Rabet, Rhoon)
            //  4 stages: Partner Ops Review → Product Team Sign-off → Dev Provisioning → Business Provisioning
            // ═══════════════════════════════════════

            // ── RBT PortalOnly ──
            new StageDefinition { Id = S_T03_RBT_PO_1, WorkflowDefinitionId = T03_RBT_PortalOnly, StageOrder = 1, StageName = "Partner Ops Review", StageType = StageType.Review, AssignedRole = UserRole.PartnerOps, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_RBT_PO_2, WorkflowDefinitionId = T03_RBT_PortalOnly, StageOrder = 2, StageName = "Product Team Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_RBT_PO_3, WorkflowDefinitionId = T03_RBT_PortalOnly, StageOrder = 3, StageName = "Dev Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_RBT_PO_4, WorkflowDefinitionId = T03_RBT_PortalOnly, StageOrder = 4, StageName = "Business Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.BusinessTeam, SlaBusinessHours = 8 },

            // ── RHN PortalOnly ──
            new StageDefinition { Id = S_T03_RHN_PO_1, WorkflowDefinitionId = T03_RHN_PortalOnly, StageOrder = 1, StageName = "Partner Ops Review", StageType = StageType.Review, AssignedRole = UserRole.PartnerOps, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_RHN_PO_2, WorkflowDefinitionId = T03_RHN_PortalOnly, StageOrder = 2, StageName = "Product Team Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_RHN_PO_3, WorkflowDefinitionId = T03_RHN_PortalOnly, StageOrder = 3, StageName = "Dev Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_RHN_PO_4, WorkflowDefinitionId = T03_RHN_PortalOnly, StageOrder = 4, StageName = "Business Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.BusinessTeam, SlaBusinessHours = 8 },

            // ═══════════════════════════════════════
            //  T-03 Portal + API (Rabet, Rhoon)
            //  5 stages: Partner Ops Review → Product Team Sign-off → Dev Provisioning → Business Provisioning → API Provisioning
            // ═══════════════════════════════════════

            // ── RBT PortalAndApi ──
            new StageDefinition { Id = S_T03_RBT_PA_1, WorkflowDefinitionId = T03_RBT_PortalAndApi, StageOrder = 1, StageName = "Partner Ops Review", StageType = StageType.Review, AssignedRole = UserRole.PartnerOps, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_RBT_PA_2, WorkflowDefinitionId = T03_RBT_PortalAndApi, StageOrder = 2, StageName = "Product Team Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_RBT_PA_3, WorkflowDefinitionId = T03_RBT_PortalAndApi, StageOrder = 3, StageName = "Dev Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 24 },
            new StageDefinition { Id = S_T03_RBT_PA_4, WorkflowDefinitionId = T03_RBT_PortalAndApi, StageOrder = 4, StageName = "Business Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.BusinessTeam, SlaBusinessHours = 24 },
            new StageDefinition { Id = S_T03_RBT_PA_5, WorkflowDefinitionId = T03_RBT_PortalAndApi, StageOrder = 5, StageName = "API Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 24 },

            // ── RHN PortalAndApi ──
            new StageDefinition { Id = S_T03_RHN_PA_1, WorkflowDefinitionId = T03_RHN_PortalAndApi, StageOrder = 1, StageName = "Partner Ops Review", StageType = StageType.Review, AssignedRole = UserRole.PartnerOps, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_RHN_PA_2, WorkflowDefinitionId = T03_RHN_PortalAndApi, StageOrder = 2, StageName = "Product Team Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_RHN_PA_3, WorkflowDefinitionId = T03_RHN_PortalAndApi, StageOrder = 3, StageName = "Dev Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 24 },
            new StageDefinition { Id = S_T03_RHN_PA_4, WorkflowDefinitionId = T03_RHN_PortalAndApi, StageOrder = 4, StageName = "Business Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.BusinessTeam, SlaBusinessHours = 24 },
            new StageDefinition { Id = S_T03_RHN_PA_5, WorkflowDefinitionId = T03_RHN_PortalAndApi, StageOrder = 5, StageName = "API Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 24 },

            // ═══════════════════════════════════════
            //  T-03 API Only (Wtheeq, Mulem)
            //  3 stages: Partner Ops Review → Product Team Sign-off → API Provisioning
            // ═══════════════════════════════════════

            // ── WTQ ApiOnly ──
            new StageDefinition { Id = S_T03_WTQ_AO_1, WorkflowDefinitionId = T03_WTQ_ApiOnly, StageOrder = 1, StageName = "Partner Ops Review", StageType = StageType.Review, AssignedRole = UserRole.PartnerOps, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_WTQ_AO_2, WorkflowDefinitionId = T03_WTQ_ApiOnly, StageOrder = 2, StageName = "Product Team Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_WTQ_AO_3, WorkflowDefinitionId = T03_WTQ_ApiOnly, StageOrder = 3, StageName = "API Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 24 },

            // ── MLM ApiOnly ──
            new StageDefinition { Id = S_T03_MLM_AO_1, WorkflowDefinitionId = T03_MLM_ApiOnly, StageOrder = 1, StageName = "Partner Ops Review", StageType = StageType.Review, AssignedRole = UserRole.PartnerOps, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_MLM_AO_2, WorkflowDefinitionId = T03_MLM_ApiOnly, StageOrder = 2, StageName = "Product Team Sign-off", StageType = StageType.Approval, AssignedRole = UserRole.ProductTeam, SlaBusinessHours = 8 },
            new StageDefinition { Id = S_T03_MLM_AO_3, WorkflowDefinitionId = T03_MLM_ApiOnly, StageOrder = 3, StageName = "API Provisioning", StageType = StageType.Provisioning, AssignedRole = UserRole.IntegrationTeam, SlaBusinessHours = 24 }
        );
    }

    private static void SeedT04Stages(ModelBuilder modelBuilder)
    {
        // T-04: Verify & Resolve (1 stage per product)
        modelBuilder.Entity<StageDefinition>().HasData(
            new StageDefinition { Id = S_T04_RBT_1, WorkflowDefinitionId = T04_RBT, StageOrder = 1, StageName = "Verify & Resolve", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 2 },
            new StageDefinition { Id = S_T04_RHN_1, WorkflowDefinitionId = T04_RHN, StageOrder = 1, StageName = "Verify & Resolve", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 2 },
            new StageDefinition { Id = S_T04_WTQ_1, WorkflowDefinitionId = T04_WTQ, StageOrder = 1, StageName = "Verify & Resolve", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 2 },
            new StageDefinition { Id = S_T04_MLM_1, WorkflowDefinitionId = T04_MLM, StageOrder = 1, StageName = "Verify & Resolve", StageType = StageType.Provisioning, AssignedRole = UserRole.DevTeam, SlaBusinessHours = 2 }
        );
    }
}
