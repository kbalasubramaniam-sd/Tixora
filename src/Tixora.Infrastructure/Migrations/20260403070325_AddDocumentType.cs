using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tixora.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DocumentType",
                table: "Documents",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_CreatedAt",
                table: "Tickets",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_SlaTrackers_IsActive",
                table: "SlaTrackers",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_SlaTrackers_IsActive_TicketId",
                table: "SlaTrackers",
                columns: new[] { "IsActive", "TicketId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tickets_CreatedAt",
                table: "Tickets");

            migrationBuilder.DropIndex(
                name: "IX_SlaTrackers_IsActive",
                table: "SlaTrackers");

            migrationBuilder.DropIndex(
                name: "IX_SlaTrackers_IsActive_TicketId",
                table: "SlaTrackers");

            migrationBuilder.DropColumn(
                name: "DocumentType",
                table: "Documents");
        }
    }
}
