using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Tixora.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveT02ProductTeamReview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0001-0001-000000000001"));

            migrationBuilder.DeleteData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0002-0001-000000000001"));

            migrationBuilder.DeleteData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0003-0001-000000000001"));

            migrationBuilder.DeleteData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0004-0001-000000000001"));

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0001-0002-000000000001"),
                column: "StageOrder",
                value: 1);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0001-0003-000000000001"),
                column: "StageOrder",
                value: 2);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0001-0004-000000000001"),
                column: "StageOrder",
                value: 3);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0001-0005-000000000001"),
                column: "StageOrder",
                value: 4);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0002-0002-000000000001"),
                column: "StageOrder",
                value: 1);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0002-0003-000000000001"),
                column: "StageOrder",
                value: 2);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0002-0004-000000000001"),
                column: "StageOrder",
                value: 3);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0002-0005-000000000001"),
                column: "StageOrder",
                value: 4);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0003-0002-000000000001"),
                column: "StageOrder",
                value: 1);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0003-0003-000000000001"),
                column: "StageOrder",
                value: 2);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0003-0004-000000000001"),
                column: "StageOrder",
                value: 3);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0003-0005-000000000001"),
                column: "StageOrder",
                value: 4);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0004-0002-000000000001"),
                column: "StageOrder",
                value: 1);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0004-0003-000000000001"),
                column: "StageOrder",
                value: 2);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0004-0004-000000000001"),
                column: "StageOrder",
                value: 3);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0004-0005-000000000001"),
                column: "StageOrder",
                value: 4);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0001-0002-000000000001"),
                column: "StageOrder",
                value: 2);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0001-0003-000000000001"),
                column: "StageOrder",
                value: 3);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0001-0004-000000000001"),
                column: "StageOrder",
                value: 4);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0001-0005-000000000001"),
                column: "StageOrder",
                value: 5);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0002-0002-000000000001"),
                column: "StageOrder",
                value: 2);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0002-0003-000000000001"),
                column: "StageOrder",
                value: 3);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0002-0004-000000000001"),
                column: "StageOrder",
                value: 4);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0002-0005-000000000001"),
                column: "StageOrder",
                value: 5);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0003-0002-000000000001"),
                column: "StageOrder",
                value: 2);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0003-0003-000000000001"),
                column: "StageOrder",
                value: 3);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0003-0004-000000000001"),
                column: "StageOrder",
                value: 4);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0003-0005-000000000001"),
                column: "StageOrder",
                value: 5);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0004-0002-000000000001"),
                column: "StageOrder",
                value: 2);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0004-0003-000000000001"),
                column: "StageOrder",
                value: 3);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0004-0004-000000000001"),
                column: "StageOrder",
                value: 4);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0004-0005-000000000001"),
                column: "StageOrder",
                value: 5);

            migrationBuilder.InsertData(
                table: "StageDefinitions",
                columns: new[] { "Id", "AssignedRole", "SlaBusinessHours", "StageName", "StageOrder", "StageType", "WorkflowDefinitionId" },
                values: new object[,]
                {
                    { new Guid("e5f6a7b8-0102-0001-0001-000000000001"), 3, 8, "Product Team Review", 1, 0, new Guid("d4e5f6a7-0102-0001-0001-000000000001") },
                    { new Guid("e5f6a7b8-0102-0002-0001-000000000001"), 3, 8, "Product Team Review", 1, 0, new Guid("d4e5f6a7-0102-0001-0001-000000000002") },
                    { new Guid("e5f6a7b8-0102-0003-0001-000000000001"), 3, 8, "Product Team Review", 1, 0, new Guid("d4e5f6a7-0102-0001-0001-000000000003") },
                    { new Guid("e5f6a7b8-0102-0004-0001-000000000001"), 3, 8, "Product Team Review", 1, 0, new Guid("d4e5f6a7-0102-0001-0001-000000000004") }
                });
        }
    }
}
