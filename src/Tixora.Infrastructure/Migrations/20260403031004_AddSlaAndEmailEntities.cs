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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SlaPauses");

            migrationBuilder.DropTable(
                name: "SlaTrackers");

            migrationBuilder.DropTable(
                name: "Shipments");
        }
    }
}
