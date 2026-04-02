using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Tixora.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Partners",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Alias = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Partners", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    Code = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ProductAccessMode = table.Column<int>(type: "int", nullable: false),
                    PortalType = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.Code);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Role = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WorkflowDefinitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductCode = table.Column<int>(type: "int", nullable: false),
                    TaskType = table.Column<int>(type: "int", nullable: false),
                    ProvisioningPath = table.Column<int>(type: "int", nullable: true),
                    Version = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkflowDefinitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PartnerProducts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PartnerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductCode = table.Column<int>(type: "int", nullable: false),
                    LifecycleState = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    CompanyCode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    StateChangedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PartnerProducts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PartnerProducts_Partners_PartnerId",
                        column: x => x.PartnerId,
                        principalTable: "Partners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PartnerProducts_Products_ProductCode",
                        column: x => x.ProductCode,
                        principalTable: "Products",
                        principalColumn: "Code",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StageDefinitions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    WorkflowDefinitionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StageOrder = table.Column<int>(type: "int", nullable: false),
                    StageName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    StageType = table.Column<int>(type: "int", nullable: false),
                    AssignedRole = table.Column<int>(type: "int", nullable: false),
                    SlaBusinessHours = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StageDefinitions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StageDefinitions_WorkflowDefinitions_WorkflowDefinitionId",
                        column: x => x.WorkflowDefinitionId,
                        principalTable: "WorkflowDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tickets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TicketId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PartnerProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TaskType = table.Column<int>(type: "int", nullable: false),
                    ProductCode = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CurrentStageOrder = table.Column<int>(type: "int", nullable: false),
                    ProvisioningPath = table.Column<int>(type: "int", nullable: true),
                    IssueType = table.Column<int>(type: "int", nullable: true),
                    FormData = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AssignedToUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    WorkflowDefinitionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RejectedTicketRef = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    CancellationReason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    SequenceNumber = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tickets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tickets_PartnerProducts_PartnerProductId",
                        column: x => x.PartnerProductId,
                        principalTable: "PartnerProducts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_Users_AssignedToUserId",
                        column: x => x.AssignedToUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Tickets_WorkflowDefinitions_WorkflowDefinitionId",
                        column: x => x.WorkflowDefinitionId,
                        principalTable: "WorkflowDefinitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AuditEntries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TicketId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ActorUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ActionType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Details = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TimestampUtc = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditEntries_Tickets_TicketId",
                        column: x => x.TicketId,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AuditEntries_Users_ActorUserId",
                        column: x => x.ActorUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "StageLogs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TicketId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StageOrder = table.Column<int>(type: "int", nullable: false),
                    StageName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Action = table.Column<int>(type: "int", nullable: false),
                    ActorUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Comments = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ReassignedToUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StageLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StageLogs_Tickets_TicketId",
                        column: x => x.TicketId,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StageLogs_Users_ActorUserId",
                        column: x => x.ActorUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StageLogs_Users_ReassignedToUserId",
                        column: x => x.ReassignedToUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "Partners",
                columns: new[] { "Id", "Alias", "CreatedAt", "Name" },
                values: new object[,]
                {
                    { new Guid("b2c3d4e5-0002-0002-0002-000000000001"), "AAI", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Al Ain Insurance" },
                    { new Guid("b2c3d4e5-0002-0002-0002-000000000002"), "DIB", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Dubai Islamic Bank" },
                    { new Guid("b2c3d4e5-0002-0002-0002-000000000003"), "EIC", new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Emirates Insurance" }
                });

            migrationBuilder.InsertData(
                table: "Products",
                columns: new[] { "Code", "Description", "Name", "PortalType", "ProductAccessMode" },
                values: new object[,]
                {
                    { 0, "Insurance data to ICP", "Rabet", 0, 0 },
                    { 1, "Mortgage transactions", "Rhoon", 0, 0 },
                    { 2, "Vehicle insurance data", "Wtheeq", 1, 0 },
                    { 3, "Motor insurance pricing", "Mulem", 1, 0 }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "FullName", "IsActive", "PasswordHash", "Role" },
                values: new object[,]
                {
                    { new Guid("a1b2c3d4-0001-0001-0001-000000000001"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "sarah.ahmad@tixora.ae", "Sarah Ahmad", true, "$2a$11$zg9xWkRLs/TGlMdtLiLQ7u9gkpe1uCLYqAJ/HZV5jLnpnmC//19w2", 0 },
                    { new Guid("a1b2c3d4-0001-0001-0001-000000000002"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "omar.khalid@tixora.ae", "Omar Khalid", true, "$2a$11$zg9xWkRLs/TGlMdtLiLQ7u9gkpe1uCLYqAJ/HZV5jLnpnmC//19w2", 1 },
                    { new Guid("a1b2c3d4-0001-0001-0001-000000000003"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "hannoun@tixora.ae", "Hannoun", true, "$2a$11$zg9xWkRLs/TGlMdtLiLQ7u9gkpe1uCLYqAJ/HZV5jLnpnmC//19w2", 2 },
                    { new Guid("a1b2c3d4-0001-0001-0001-000000000004"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "albaha@tixora.ae", "Albaha", true, "$2a$11$zg9xWkRLs/TGlMdtLiLQ7u9gkpe1uCLYqAJ/HZV5jLnpnmC//19w2", 2 },
                    { new Guid("a1b2c3d4-0001-0001-0001-000000000005"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "fatima.noor@tixora.ae", "Fatima Noor", true, "$2a$11$zg9xWkRLs/TGlMdtLiLQ7u9gkpe1uCLYqAJ/HZV5jLnpnmC//19w2", 3 },
                    { new Guid("a1b2c3d4-0001-0001-0001-000000000006"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "khalid.rashed@tixora.ae", "Khalid Rashed", true, "$2a$11$zg9xWkRLs/TGlMdtLiLQ7u9gkpe1uCLYqAJ/HZV5jLnpnmC//19w2", 4 },
                    { new Guid("a1b2c3d4-0001-0001-0001-000000000007"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "ahmed.tariq@tixora.ae", "Ahmed Tariq", true, "$2a$11$zg9xWkRLs/TGlMdtLiLQ7u9gkpe1uCLYqAJ/HZV5jLnpnmC//19w2", 5 },
                    { new Guid("a1b2c3d4-0001-0001-0001-000000000008"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "layla.hassan@tixora.ae", "Layla Hassan", true, "$2a$11$zg9xWkRLs/TGlMdtLiLQ7u9gkpe1uCLYqAJ/HZV5jLnpnmC//19w2", 6 },
                    { new Guid("a1b2c3d4-0001-0001-0001-000000000009"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "vilina.sequeira@tixora.ae", "Vilina Sequeira", true, "$2a$11$zg9xWkRLs/TGlMdtLiLQ7u9gkpe1uCLYqAJ/HZV5jLnpnmC//19w2", 7 },
                    { new Guid("a1b2c3d4-0001-0001-0001-00000000000a"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "sara.raeed@tixora.ae", "Sara Raeed", true, "$2a$11$zg9xWkRLs/TGlMdtLiLQ7u9gkpe1uCLYqAJ/HZV5jLnpnmC//19w2", 7 },
                    { new Guid("a1b2c3d4-0001-0001-0001-00000000000b"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "shayman.ali@tixora.ae", "Shayman Ali", true, "$2a$11$zg9xWkRLs/TGlMdtLiLQ7u9gkpe1uCLYqAJ/HZV5jLnpnmC//19w2", 7 },
                    { new Guid("a1b2c3d4-0001-0001-0001-00000000000c"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "admin@tixora.ae", "Admin User", true, "$2a$11$zg9xWkRLs/TGlMdtLiLQ7u9gkpe1uCLYqAJ/HZV5jLnpnmC//19w2", 8 }
                });

            migrationBuilder.InsertData(
                table: "WorkflowDefinitions",
                columns: new[] { "Id", "CreatedAt", "IsActive", "ProductCode", "ProvisioningPath", "TaskType", "Version" },
                values: new object[,]
                {
                    { new Guid("d4e5f6a7-0101-0001-0001-000000000001"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 0, null, 0, 1 },
                    { new Guid("d4e5f6a7-0101-0001-0001-000000000002"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 1, null, 0, 1 },
                    { new Guid("d4e5f6a7-0101-0001-0001-000000000003"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 2, null, 0, 1 },
                    { new Guid("d4e5f6a7-0101-0001-0001-000000000004"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 3, null, 0, 1 },
                    { new Guid("d4e5f6a7-0102-0001-0001-000000000001"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 0, null, 1, 1 },
                    { new Guid("d4e5f6a7-0102-0001-0001-000000000002"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 1, null, 1, 1 },
                    { new Guid("d4e5f6a7-0102-0001-0001-000000000003"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 2, null, 1, 1 },
                    { new Guid("d4e5f6a7-0102-0001-0001-000000000004"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 3, null, 1, 1 },
                    { new Guid("d4e5f6a7-0103-0001-0001-000000000001"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 0, 0, 2, 1 },
                    { new Guid("d4e5f6a7-0103-0001-0001-000000000002"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 0, 1, 2, 1 },
                    { new Guid("d4e5f6a7-0103-0001-0001-000000000003"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 1, 0, 2, 1 },
                    { new Guid("d4e5f6a7-0103-0001-0001-000000000004"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 1, 1, 2, 1 },
                    { new Guid("d4e5f6a7-0103-0001-0001-000000000005"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 2, 2, 2, 1 },
                    { new Guid("d4e5f6a7-0103-0001-0001-000000000006"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 3, 2, 2, 1 },
                    { new Guid("d4e5f6a7-0104-0001-0001-000000000001"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 0, null, 3, 1 },
                    { new Guid("d4e5f6a7-0104-0001-0001-000000000002"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 1, null, 3, 1 },
                    { new Guid("d4e5f6a7-0104-0001-0001-000000000003"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 2, null, 3, 1 },
                    { new Guid("d4e5f6a7-0104-0001-0001-000000000004"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), true, 3, null, 3, 1 }
                });

            migrationBuilder.InsertData(
                table: "PartnerProducts",
                columns: new[] { "Id", "CompanyCode", "CreatedAt", "PartnerId", "ProductCode", "StateChangedAt" },
                values: new object[,]
                {
                    { new Guid("c3d4e5f6-0003-0003-0003-000000000001"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("b2c3d4e5-0002-0002-0002-000000000001"), 0, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("c3d4e5f6-0003-0003-0003-000000000002"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("b2c3d4e5-0002-0002-0002-000000000001"), 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("c3d4e5f6-0003-0003-0003-000000000003"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("b2c3d4e5-0002-0002-0002-000000000002"), 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("c3d4e5f6-0003-0003-0003-000000000004"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("b2c3d4e5-0002-0002-0002-000000000002"), 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("c3d4e5f6-0003-0003-0003-000000000005"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("b2c3d4e5-0002-0002-0002-000000000003"), 0, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) },
                    { new Guid("c3d4e5f6-0003-0003-0003-000000000006"), null, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), new Guid("b2c3d4e5-0002-0002-0002-000000000003"), 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc) }
                });

            migrationBuilder.InsertData(
                table: "StageDefinitions",
                columns: new[] { "Id", "AssignedRole", "SlaBusinessHours", "StageName", "StageOrder", "StageType", "WorkflowDefinitionId" },
                values: new object[,]
                {
                    { new Guid("e5f6a7b8-0101-0001-0001-000000000001"), 1, 24, "Legal Review", 1, 0, new Guid("d4e5f6a7-0101-0001-0001-000000000001") },
                    { new Guid("e5f6a7b8-0101-0001-0002-000000000001"), 2, 16, "Product Review", 2, 0, new Guid("d4e5f6a7-0101-0001-0001-000000000001") },
                    { new Guid("e5f6a7b8-0101-0001-0003-000000000001"), 3, 8, "EA Sign-off", 3, 1, new Guid("d4e5f6a7-0101-0001-0001-000000000001") },
                    { new Guid("e5f6a7b8-0101-0001-0004-000000000001"), 0, 0, "Stakeholder Notification", 4, 0, new Guid("d4e5f6a7-0101-0001-0001-000000000001") },
                    { new Guid("e5f6a7b8-0101-0002-0001-000000000001"), 1, 24, "Legal Review", 1, 0, new Guid("d4e5f6a7-0101-0001-0001-000000000002") },
                    { new Guid("e5f6a7b8-0101-0002-0002-000000000001"), 2, 16, "Product Review", 2, 0, new Guid("d4e5f6a7-0101-0001-0001-000000000002") },
                    { new Guid("e5f6a7b8-0101-0002-0003-000000000001"), 3, 8, "EA Sign-off", 3, 1, new Guid("d4e5f6a7-0101-0001-0001-000000000002") },
                    { new Guid("e5f6a7b8-0101-0002-0004-000000000001"), 0, 0, "Stakeholder Notification", 4, 0, new Guid("d4e5f6a7-0101-0001-0001-000000000002") },
                    { new Guid("e5f6a7b8-0101-0003-0001-000000000001"), 1, 24, "Legal Review", 1, 0, new Guid("d4e5f6a7-0101-0001-0001-000000000003") },
                    { new Guid("e5f6a7b8-0101-0003-0002-000000000001"), 2, 16, "Product Review", 2, 0, new Guid("d4e5f6a7-0101-0001-0001-000000000003") },
                    { new Guid("e5f6a7b8-0101-0003-0003-000000000001"), 3, 8, "EA Sign-off", 3, 1, new Guid("d4e5f6a7-0101-0001-0001-000000000003") },
                    { new Guid("e5f6a7b8-0101-0003-0004-000000000001"), 0, 0, "Stakeholder Notification", 4, 0, new Guid("d4e5f6a7-0101-0001-0001-000000000003") },
                    { new Guid("e5f6a7b8-0101-0004-0001-000000000001"), 1, 24, "Legal Review", 1, 0, new Guid("d4e5f6a7-0101-0001-0001-000000000004") },
                    { new Guid("e5f6a7b8-0101-0004-0002-000000000001"), 2, 16, "Product Review", 2, 0, new Guid("d4e5f6a7-0101-0001-0001-000000000004") },
                    { new Guid("e5f6a7b8-0101-0004-0003-000000000001"), 3, 8, "EA Sign-off", 3, 1, new Guid("d4e5f6a7-0101-0001-0001-000000000004") },
                    { new Guid("e5f6a7b8-0101-0004-0004-000000000001"), 0, 0, "Stakeholder Notification", 4, 0, new Guid("d4e5f6a7-0101-0001-0001-000000000004") },
                    { new Guid("e5f6a7b8-0102-0001-0001-000000000001"), 2, 8, "Product Team Review", 1, 0, new Guid("d4e5f6a7-0102-0001-0001-000000000001") },
                    { new Guid("e5f6a7b8-0102-0001-0002-000000000001"), 4, 8, "Access Provisioning", 2, 2, new Guid("d4e5f6a7-0102-0001-0001-000000000001") },
                    { new Guid("e5f6a7b8-0102-0001-0003-000000000001"), 5, 8, "API Credential Creation", 3, 2, new Guid("d4e5f6a7-0102-0001-0001-000000000001") },
                    { new Guid("e5f6a7b8-0102-0001-0004-000000000001"), 0, 0, "Awaiting UAT Signal", 4, 3, new Guid("d4e5f6a7-0102-0001-0001-000000000001") },
                    { new Guid("e5f6a7b8-0102-0001-0005-000000000001"), 4, 8, "UAT Sign-off", 5, 1, new Guid("d4e5f6a7-0102-0001-0001-000000000001") },
                    { new Guid("e5f6a7b8-0102-0002-0001-000000000001"), 2, 8, "Product Team Review", 1, 0, new Guid("d4e5f6a7-0102-0001-0001-000000000002") },
                    { new Guid("e5f6a7b8-0102-0002-0002-000000000001"), 4, 8, "Access Provisioning", 2, 2, new Guid("d4e5f6a7-0102-0001-0001-000000000002") },
                    { new Guid("e5f6a7b8-0102-0002-0003-000000000001"), 5, 8, "API Credential Creation", 3, 2, new Guid("d4e5f6a7-0102-0001-0001-000000000002") },
                    { new Guid("e5f6a7b8-0102-0002-0004-000000000001"), 0, 0, "Awaiting UAT Signal", 4, 3, new Guid("d4e5f6a7-0102-0001-0001-000000000002") },
                    { new Guid("e5f6a7b8-0102-0002-0005-000000000001"), 4, 8, "UAT Sign-off", 5, 1, new Guid("d4e5f6a7-0102-0001-0001-000000000002") },
                    { new Guid("e5f6a7b8-0102-0003-0001-000000000001"), 2, 8, "Product Team Review", 1, 0, new Guid("d4e5f6a7-0102-0001-0001-000000000003") },
                    { new Guid("e5f6a7b8-0102-0003-0002-000000000001"), 4, 8, "Access Provisioning", 2, 2, new Guid("d4e5f6a7-0102-0001-0001-000000000003") },
                    { new Guid("e5f6a7b8-0102-0003-0003-000000000001"), 5, 8, "API Credential Creation", 3, 2, new Guid("d4e5f6a7-0102-0001-0001-000000000003") },
                    { new Guid("e5f6a7b8-0102-0003-0004-000000000001"), 0, 0, "Awaiting UAT Signal", 4, 3, new Guid("d4e5f6a7-0102-0001-0001-000000000003") },
                    { new Guid("e5f6a7b8-0102-0003-0005-000000000001"), 4, 8, "UAT Sign-off", 5, 1, new Guid("d4e5f6a7-0102-0001-0001-000000000003") },
                    { new Guid("e5f6a7b8-0102-0004-0001-000000000001"), 2, 8, "Product Team Review", 1, 0, new Guid("d4e5f6a7-0102-0001-0001-000000000004") },
                    { new Guid("e5f6a7b8-0102-0004-0002-000000000001"), 4, 8, "Access Provisioning", 2, 2, new Guid("d4e5f6a7-0102-0001-0001-000000000004") },
                    { new Guid("e5f6a7b8-0102-0004-0003-000000000001"), 5, 8, "API Credential Creation", 3, 2, new Guid("d4e5f6a7-0102-0001-0001-000000000004") },
                    { new Guid("e5f6a7b8-0102-0004-0004-000000000001"), 0, 0, "Awaiting UAT Signal", 4, 3, new Guid("d4e5f6a7-0102-0001-0001-000000000004") },
                    { new Guid("e5f6a7b8-0102-0004-0005-000000000001"), 4, 8, "UAT Sign-off", 5, 1, new Guid("d4e5f6a7-0102-0001-0001-000000000004") },
                    { new Guid("e5f6a7b8-0103-0001-0001-000000000001"), 7, 8, "Partner Ops Review", 1, 0, new Guid("d4e5f6a7-0103-0001-0001-000000000001") },
                    { new Guid("e5f6a7b8-0103-0001-0002-000000000001"), 2, 8, "Product Team Sign-off", 2, 1, new Guid("d4e5f6a7-0103-0001-0001-000000000001") },
                    { new Guid("e5f6a7b8-0103-0001-0003-000000000001"), 5, 8, "Dev Provisioning", 3, 2, new Guid("d4e5f6a7-0103-0001-0001-000000000001") },
                    { new Guid("e5f6a7b8-0103-0001-0004-000000000001"), 6, 8, "Business Provisioning", 4, 2, new Guid("d4e5f6a7-0103-0001-0001-000000000001") },
                    { new Guid("e5f6a7b8-0103-0002-0001-000000000001"), 7, 8, "Partner Ops Review", 1, 0, new Guid("d4e5f6a7-0103-0001-0001-000000000002") },
                    { new Guid("e5f6a7b8-0103-0002-0002-000000000001"), 2, 8, "Product Team Sign-off", 2, 1, new Guid("d4e5f6a7-0103-0001-0001-000000000002") },
                    { new Guid("e5f6a7b8-0103-0002-0003-000000000001"), 5, 24, "Dev Provisioning", 3, 2, new Guid("d4e5f6a7-0103-0001-0001-000000000002") },
                    { new Guid("e5f6a7b8-0103-0002-0004-000000000001"), 6, 24, "Business Provisioning", 4, 2, new Guid("d4e5f6a7-0103-0001-0001-000000000002") },
                    { new Guid("e5f6a7b8-0103-0002-0005-000000000001"), 4, 24, "API Provisioning", 5, 2, new Guid("d4e5f6a7-0103-0001-0001-000000000002") },
                    { new Guid("e5f6a7b8-0103-0003-0001-000000000001"), 7, 8, "Partner Ops Review", 1, 0, new Guid("d4e5f6a7-0103-0001-0001-000000000003") },
                    { new Guid("e5f6a7b8-0103-0003-0002-000000000001"), 2, 8, "Product Team Sign-off", 2, 1, new Guid("d4e5f6a7-0103-0001-0001-000000000003") },
                    { new Guid("e5f6a7b8-0103-0003-0003-000000000001"), 5, 8, "Dev Provisioning", 3, 2, new Guid("d4e5f6a7-0103-0001-0001-000000000003") },
                    { new Guid("e5f6a7b8-0103-0003-0004-000000000001"), 6, 8, "Business Provisioning", 4, 2, new Guid("d4e5f6a7-0103-0001-0001-000000000003") },
                    { new Guid("e5f6a7b8-0103-0004-0001-000000000001"), 7, 8, "Partner Ops Review", 1, 0, new Guid("d4e5f6a7-0103-0001-0001-000000000004") },
                    { new Guid("e5f6a7b8-0103-0004-0002-000000000001"), 2, 8, "Product Team Sign-off", 2, 1, new Guid("d4e5f6a7-0103-0001-0001-000000000004") },
                    { new Guid("e5f6a7b8-0103-0004-0003-000000000001"), 5, 24, "Dev Provisioning", 3, 2, new Guid("d4e5f6a7-0103-0001-0001-000000000004") },
                    { new Guid("e5f6a7b8-0103-0004-0004-000000000001"), 6, 24, "Business Provisioning", 4, 2, new Guid("d4e5f6a7-0103-0001-0001-000000000004") },
                    { new Guid("e5f6a7b8-0103-0004-0005-000000000001"), 4, 24, "API Provisioning", 5, 2, new Guid("d4e5f6a7-0103-0001-0001-000000000004") },
                    { new Guid("e5f6a7b8-0103-0005-0001-000000000001"), 7, 8, "Partner Ops Review", 1, 0, new Guid("d4e5f6a7-0103-0001-0001-000000000005") },
                    { new Guid("e5f6a7b8-0103-0005-0002-000000000001"), 2, 8, "Product Team Sign-off", 2, 1, new Guid("d4e5f6a7-0103-0001-0001-000000000005") },
                    { new Guid("e5f6a7b8-0103-0005-0003-000000000001"), 4, 24, "API Provisioning", 3, 2, new Guid("d4e5f6a7-0103-0001-0001-000000000005") },
                    { new Guid("e5f6a7b8-0103-0006-0001-000000000001"), 7, 8, "Partner Ops Review", 1, 0, new Guid("d4e5f6a7-0103-0001-0001-000000000006") },
                    { new Guid("e5f6a7b8-0103-0006-0002-000000000001"), 2, 8, "Product Team Sign-off", 2, 1, new Guid("d4e5f6a7-0103-0001-0001-000000000006") },
                    { new Guid("e5f6a7b8-0103-0006-0003-000000000001"), 4, 24, "API Provisioning", 3, 2, new Guid("d4e5f6a7-0103-0001-0001-000000000006") },
                    { new Guid("e5f6a7b8-0104-0001-0001-000000000001"), 5, 2, "Verify & Resolve", 1, 2, new Guid("d4e5f6a7-0104-0001-0001-000000000001") },
                    { new Guid("e5f6a7b8-0104-0002-0001-000000000001"), 5, 2, "Verify & Resolve", 1, 2, new Guid("d4e5f6a7-0104-0001-0001-000000000002") },
                    { new Guid("e5f6a7b8-0104-0003-0001-000000000001"), 5, 2, "Verify & Resolve", 1, 2, new Guid("d4e5f6a7-0104-0001-0001-000000000003") },
                    { new Guid("e5f6a7b8-0104-0004-0001-000000000001"), 5, 2, "Verify & Resolve", 1, 2, new Guid("d4e5f6a7-0104-0001-0001-000000000004") }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AuditEntries_ActorUserId",
                table: "AuditEntries",
                column: "ActorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditEntries_TicketId",
                table: "AuditEntries",
                column: "TicketId");

            migrationBuilder.CreateIndex(
                name: "IX_PartnerProducts_PartnerId_ProductCode",
                table: "PartnerProducts",
                columns: new[] { "PartnerId", "ProductCode" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PartnerProducts_ProductCode",
                table: "PartnerProducts",
                column: "ProductCode");

            migrationBuilder.CreateIndex(
                name: "IX_StageDefinitions_WorkflowDefinitionId_StageOrder",
                table: "StageDefinitions",
                columns: new[] { "WorkflowDefinitionId", "StageOrder" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_StageLogs_ActorUserId",
                table: "StageLogs",
                column: "ActorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StageLogs_ReassignedToUserId",
                table: "StageLogs",
                column: "ReassignedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StageLogs_TicketId",
                table: "StageLogs",
                column: "TicketId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_AssignedToUserId",
                table: "Tickets",
                column: "AssignedToUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_CreatedByUserId",
                table: "Tickets",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_PartnerProductId",
                table: "Tickets",
                column: "PartnerProductId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_Status",
                table: "Tickets",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_TicketId",
                table: "Tickets",
                column: "TicketId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_WorkflowDefinitionId",
                table: "Tickets",
                column: "WorkflowDefinitionId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkflowDefinitions_ProductCode_TaskType_ProvisioningPath",
                table: "WorkflowDefinitions",
                columns: new[] { "ProductCode", "TaskType", "ProvisioningPath" },
                unique: true,
                filter: "[IsActive] = 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AuditEntries");

            migrationBuilder.DropTable(
                name: "StageDefinitions");

            migrationBuilder.DropTable(
                name: "StageLogs");

            migrationBuilder.DropTable(
                name: "Tickets");

            migrationBuilder.DropTable(
                name: "PartnerProducts");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "WorkflowDefinitions");

            migrationBuilder.DropTable(
                name: "Partners");

            migrationBuilder.DropTable(
                name: "Products");
        }
    }
}
