using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tixora.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class T02UatSignalToIntegrationTeam : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0001-0004-000000000001"),
                column: "AssignedRole",
                value: 5);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0002-0004-000000000001"),
                column: "AssignedRole",
                value: 5);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0003-0004-000000000001"),
                column: "AssignedRole",
                value: 5);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0004-0004-000000000001"),
                column: "AssignedRole",
                value: 5);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0001-0004-000000000001"),
                column: "AssignedRole",
                value: 1);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0002-0004-000000000001"),
                column: "AssignedRole",
                value: 1);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0003-0004-000000000001"),
                column: "AssignedRole",
                value: 1);

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0102-0004-0004-000000000001"),
                column: "AssignedRole",
                value: 1);
        }
    }
}
