using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tixora.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSlaAndEmailEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Shipments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TicketId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    TrackingNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    RecipientName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    RecipientCompany = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    RecipientPhone = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    AddressLine1 = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    AddressLine2 = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    StateProvince = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PostalCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    CountryCode = table.Column<string>(type: "nvarchar(2)", maxLength: 2, nullable: false),
                    WeightKg = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    ServiceType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    LabelPath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ShippedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Shipments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Shipments_Tickets_TicketId",
                        column: x => x.TicketId,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Shipments_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_CreatedByUserId",
                table: "Shipments",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_TicketId",
                table: "Shipments",
                column: "TicketId");

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_TrackingNumber",
                table: "Shipments",
                column: "TrackingNumber");

            migrationBuilder.CreateTable(
                name: "SlaTrackers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TicketId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    StageOrder = table.Column<int>(type: "int", nullable: false),
                    TargetBusinessHours = table.Column<int>(type: "int", nullable: false),
                    BusinessHoursElapsed = table.Column<double>(type: "float", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    StartedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Notified75 = table.Column<bool>(type: "bit", nullable: false),
                    Notified90 = table.Column<bool>(type: "bit", nullable: false),
                    NotifiedBreach = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SlaTrackers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SlaTrackers_Tickets_TicketId",
                        column: x => x.TicketId,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SlaTrackers_TicketId_StageOrder",
                table: "SlaTrackers",
                columns: new[] { "TicketId", "StageOrder" });

            migrationBuilder.CreateTable(
                name: "SlaPauses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SlaTrackerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PausedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ResumedAtUtc = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PausedBusinessHours = table.Column<double>(type: "float", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SlaPauses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SlaPauses_SlaTrackers_SlaTrackerId",
                        column: x => x.SlaTrackerId,
                        principalTable: "SlaTrackers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SlaPauses_SlaTrackerId",
                table: "SlaPauses",
                column: "SlaTrackerId");

            // --- Comments ---
            migrationBuilder.CreateTable(
                name: "Comments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TicketId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AuthorUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Content = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Comments", x => x.Id);
                    table.ForeignKey("FK_Comments_Tickets_TicketId", x => x.TicketId, "Tickets", "Id", onDelete: ReferentialAction.Cascade);
                    table.ForeignKey("FK_Comments_Users_AuthorUserId", x => x.AuthorUserId, "Users", "Id", onDelete: ReferentialAction.Restrict);
                });
            migrationBuilder.CreateIndex("IX_Comments_TicketId", "Comments", "TicketId");

            // --- Documents ---
            migrationBuilder.CreateTable(
                name: "Documents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TicketId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    SizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    StoragePath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    UploadedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Documents", x => x.Id);
                    table.ForeignKey("FK_Documents_Tickets_TicketId", x => x.TicketId, "Tickets", "Id", onDelete: ReferentialAction.Cascade);
                    table.ForeignKey("FK_Documents_Users_UploadedByUserId", x => x.UploadedByUserId, "Users", "Id", onDelete: ReferentialAction.Restrict);
                });
            migrationBuilder.CreateIndex("IX_Documents_TicketId", "Documents", "TicketId");

            // --- Notifications ---
            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RecipientUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Message = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    TicketId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    IsRead = table.Column<bool>(type: "bit", nullable: false),
                    ReadAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey("FK_Notifications_Users_RecipientUserId", x => x.RecipientUserId, "Users", "Id", onDelete: ReferentialAction.Cascade);
                    table.ForeignKey("FK_Notifications_Tickets_TicketId", x => x.TicketId, "Tickets", "Id", onDelete: ReferentialAction.SetNull);
                });
            migrationBuilder.CreateIndex("IX_Notifications_RecipientUserId", "Notifications", "RecipientUserId");
            migrationBuilder.CreateIndex("IX_Notifications_RecipientUserId_IsRead", "Notifications", new[] { "RecipientUserId", "IsRead" });

            // --- BusinessHoursConfigs ---
            migrationBuilder.CreateTable(
                name: "BusinessHoursConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DayOfWeek = table.Column<int>(type: "int", nullable: false),
                    IsWorkingDay = table.Column<bool>(type: "bit", nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessHoursConfigs", x => x.Id);
                });

            // --- Holidays ---
            migrationBuilder.CreateTable(
                name: "Holidays",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Holidays", x => x.Id);
                });

            // --- DelegateApprovers ---
            migrationBuilder.CreateTable(
                name: "DelegateApprovers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PrimaryUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DelegateUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ValidFrom = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ValidTo = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DelegateApprovers", x => x.Id);
                    table.ForeignKey("FK_DelegateApprovers_Users_PrimaryUserId", x => x.PrimaryUserId, "Users", "Id", onDelete: ReferentialAction.Restrict);
                    table.ForeignKey("FK_DelegateApprovers_Users_DelegateUserId", x => x.DelegateUserId, "Users", "Id", onDelete: ReferentialAction.Restrict);
                });
            migrationBuilder.CreateIndex("IX_DelegateApprovers_PrimaryUserId_DelegateUserId_IsActive", "DelegateApprovers", new[] { "PrimaryUserId", "DelegateUserId", "IsActive" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "DelegateApprovers");
            migrationBuilder.DropTable(name: "Holidays");
            migrationBuilder.DropTable(name: "BusinessHoursConfigs");
            migrationBuilder.DropTable(name: "Notifications");
            migrationBuilder.DropTable(name: "Documents");
            migrationBuilder.DropTable(name: "Comments");
            migrationBuilder.DropTable(name: "SlaPauses");
            migrationBuilder.DropTable(name: "SlaTrackers");
            migrationBuilder.DropTable(name: "Shipments");
        }
    }
}
