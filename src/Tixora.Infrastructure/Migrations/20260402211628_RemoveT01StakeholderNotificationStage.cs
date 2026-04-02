using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Tixora.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveT01StakeholderNotificationStage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0101-0001-0004-000000000001"));

            migrationBuilder.DeleteData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0101-0002-0004-000000000001"));

            migrationBuilder.DeleteData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0101-0003-0004-000000000001"));

            migrationBuilder.DeleteData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0101-0004-0004-000000000001"));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "StageDefinitions",
                columns: new[] { "Id", "AssignedRole", "SlaBusinessHours", "StageName", "StageOrder", "StageType", "WorkflowDefinitionId" },
                values: new object[,]
                {
                    { new Guid("e5f6a7b8-0101-0001-0004-000000000001"), 1, 0, "Stakeholder Notification", 4, 0, new Guid("d4e5f6a7-0101-0001-0001-000000000001") },
                    { new Guid("e5f6a7b8-0101-0002-0004-000000000001"), 1, 0, "Stakeholder Notification", 4, 0, new Guid("d4e5f6a7-0101-0001-0001-000000000002") },
                    { new Guid("e5f6a7b8-0101-0003-0004-000000000001"), 1, 0, "Stakeholder Notification", 4, 0, new Guid("d4e5f6a7-0101-0001-0001-000000000003") },
                    { new Guid("e5f6a7b8-0101-0004-0004-000000000001"), 1, 0, "Stakeholder Notification", 4, 0, new Guid("d4e5f6a7-0101-0001-0001-000000000004") }
                });
        }
    }
}
