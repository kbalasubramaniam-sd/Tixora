using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tixora.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPerformanceIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Tickets_CreatedByUserId_CreatedAt",
                table: "Tickets",
                columns: new[] { "CreatedByUserId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_Status_CurrentStageOrder",
                table: "Tickets",
                columns: new[] { "Status", "CurrentStageOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_RecipientUserId_IsRead_CreatedAt",
                table: "Notifications",
                columns: new[] { "RecipientUserId", "IsRead", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tickets_CreatedByUserId_CreatedAt",
                table: "Tickets");

            migrationBuilder.DropIndex(
                name: "IX_Tickets_Status_CurrentStageOrder",
                table: "Tickets");

            migrationBuilder.DropIndex(
                name: "IX_Notifications_RecipientUserId_IsRead_CreatedAt",
                table: "Notifications");
        }
    }
}
