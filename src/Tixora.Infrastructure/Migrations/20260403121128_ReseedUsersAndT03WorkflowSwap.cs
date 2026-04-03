using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Tixora.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ReseedUsersAndT03WorkflowSwap : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0001-0001-0001-000000000003"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0001-0001-0001-00000000000a"));

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0001-0001-0001-00000000000b"));

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0103-0001-0001-000000000001"),
                columns: new[] { "AssignedRole", "StageName" },
                values: new object[] { 1, "Partnership Review" });

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0103-0002-0001-000000000001"),
                columns: new[] { "AssignedRole", "StageName" },
                values: new object[] { 1, "Partnership Review" });

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0103-0003-0001-000000000001"),
                columns: new[] { "AssignedRole", "StageName" },
                values: new object[] { 1, "Partnership Review" });

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0103-0004-0001-000000000001"),
                columns: new[] { "AssignedRole", "StageName" },
                values: new object[] { 1, "Partnership Review" });

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0103-0005-0001-000000000001"),
                columns: new[] { "AssignedRole", "StageName" },
                values: new object[] { 1, "Partnership Review" });

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0103-0006-0001-000000000001"),
                columns: new[] { "AssignedRole", "StageName" },
                values: new object[] { 1, "Partnership Review" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0001-0001-0001-000000000002"),
                columns: new[] { "Email", "FullName" },
                values: new object[] { "bahnas@tixora.ae", "Bahnas" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0001-0001-0001-000000000005"),
                columns: new[] { "Email", "FullName" },
                values: new object[] { "leena@tixora.ae", "Leena" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0001-0001-0001-000000000006"),
                columns: new[] { "Email", "FullName" },
                values: new object[] { "faiz@tixora.ae", "Faiz Siddiqui" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0001-0001-0001-000000000007"),
                columns: new[] { "Email", "FullName" },
                values: new object[] { "karthik@tixora.ae", "Karthik" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0001-0001-0001-000000000008"),
                columns: new[] { "Email", "FullName" },
                values: new object[] { "fares@tixora.ae", "Fares Alotaibi" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0001-0001-0001-000000000009"),
                columns: new[] { "Email", "FullName" },
                values: new object[] { "vileena@tixora.ae", "Vileena" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0001-0001-0001-00000000000c"),
                column: "FullName",
                value: "Admin");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0103-0001-0001-000000000001"),
                columns: new[] { "AssignedRole", "StageName" },
                values: new object[] { 8, "Partner Ops Review" });

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0103-0002-0001-000000000001"),
                columns: new[] { "AssignedRole", "StageName" },
                values: new object[] { 8, "Partner Ops Review" });

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0103-0003-0001-000000000001"),
                columns: new[] { "AssignedRole", "StageName" },
                values: new object[] { 8, "Partner Ops Review" });

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0103-0004-0001-000000000001"),
                columns: new[] { "AssignedRole", "StageName" },
                values: new object[] { 8, "Partner Ops Review" });

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0103-0005-0001-000000000001"),
                columns: new[] { "AssignedRole", "StageName" },
                values: new object[] { 8, "Partner Ops Review" });

            migrationBuilder.UpdateData(
                table: "StageDefinitions",
                keyColumn: "Id",
                keyValue: new Guid("e5f6a7b8-0103-0006-0001-000000000001"),
                columns: new[] { "AssignedRole", "StageName" },
                values: new object[] { 8, "Partner Ops Review" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0001-0001-0001-000000000002"),
                columns: new[] { "Email", "FullName" },
                values: new object[] { "omar.khalid@tixora.ae", "Omar Khalid" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0001-0001-0001-000000000005"),
                columns: new[] { "Email", "FullName" },
                values: new object[] { "fatima.noor@tixora.ae", "Fatima Noor" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0001-0001-0001-000000000006"),
                columns: new[] { "Email", "FullName" },
                values: new object[] { "khalid.rashed@tixora.ae", "Khalid Rashed" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0001-0001-0001-000000000007"),
                columns: new[] { "Email", "FullName" },
                values: new object[] { "ahmed.tariq@tixora.ae", "Ahmed Tariq" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0001-0001-0001-000000000008"),
                columns: new[] { "Email", "FullName" },
                values: new object[] { "layla.hassan@tixora.ae", "Layla Hassan" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0001-0001-0001-000000000009"),
                columns: new[] { "Email", "FullName" },
                values: new object[] { "vilina.sequeira@tixora.ae", "Vilina Sequeira" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("a1b2c3d4-0001-0001-0001-00000000000c"),
                column: "FullName",
                value: "Admin User");

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "FullName", "IsActive", "PasswordHash", "Role" },
                values: new object[,]
                {
                    { new Guid("a1b2c3d4-0001-0001-0001-000000000003"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "hannoun@tixora.ae", "Hannoun", true, "$2a$11$zg9xWkRLs/TGlMdtLiLQ7u9gkpe1uCLYqAJ/HZV5jLnpnmC//19w2", 3 },
                    { new Guid("a1b2c3d4-0001-0001-0001-00000000000a"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "sara.raeed@tixora.ae", "Sara Raeed", true, "$2a$11$zg9xWkRLs/TGlMdtLiLQ7u9gkpe1uCLYqAJ/HZV5jLnpnmC//19w2", 8 },
                    { new Guid("a1b2c3d4-0001-0001-0001-00000000000b"), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "shayman.ali@tixora.ae", "Shayman Ali", true, "$2a$11$zg9xWkRLs/TGlMdtLiLQ7u9gkpe1uCLYqAJ/HZV5jLnpnmC//19w2", 8 }
                });
        }
    }
}
