using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tixora.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CompanyCodeRequired : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "CompanyCode",
                table: "PartnerProducts",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.UpdateData(
                table: "PartnerProducts",
                keyColumn: "Id",
                keyValue: new Guid("c3d4e5f6-0003-0003-0003-000000000001"),
                column: "CompanyCode",
                value: "AAI-RBT");

            migrationBuilder.UpdateData(
                table: "PartnerProducts",
                keyColumn: "Id",
                keyValue: new Guid("c3d4e5f6-0003-0003-0003-000000000002"),
                column: "CompanyCode",
                value: "AAI-WTQ");

            migrationBuilder.UpdateData(
                table: "PartnerProducts",
                keyColumn: "Id",
                keyValue: new Guid("c3d4e5f6-0003-0003-0003-000000000003"),
                column: "CompanyCode",
                value: "DIB-RHN");

            migrationBuilder.UpdateData(
                table: "PartnerProducts",
                keyColumn: "Id",
                keyValue: new Guid("c3d4e5f6-0003-0003-0003-000000000004"),
                column: "CompanyCode",
                value: "DIB-MLM");

            migrationBuilder.UpdateData(
                table: "PartnerProducts",
                keyColumn: "Id",
                keyValue: new Guid("c3d4e5f6-0003-0003-0003-000000000005"),
                column: "CompanyCode",
                value: "EIC-RBT");

            migrationBuilder.UpdateData(
                table: "PartnerProducts",
                keyColumn: "Id",
                keyValue: new Guid("c3d4e5f6-0003-0003-0003-000000000006"),
                column: "CompanyCode",
                value: "EIC-RHN");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "CompanyCode",
                table: "PartnerProducts",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.UpdateData(
                table: "PartnerProducts",
                keyColumn: "Id",
                keyValue: new Guid("c3d4e5f6-0003-0003-0003-000000000001"),
                column: "CompanyCode",
                value: null);

            migrationBuilder.UpdateData(
                table: "PartnerProducts",
                keyColumn: "Id",
                keyValue: new Guid("c3d4e5f6-0003-0003-0003-000000000002"),
                column: "CompanyCode",
                value: null);

            migrationBuilder.UpdateData(
                table: "PartnerProducts",
                keyColumn: "Id",
                keyValue: new Guid("c3d4e5f6-0003-0003-0003-000000000003"),
                column: "CompanyCode",
                value: null);

            migrationBuilder.UpdateData(
                table: "PartnerProducts",
                keyColumn: "Id",
                keyValue: new Guid("c3d4e5f6-0003-0003-0003-000000000004"),
                column: "CompanyCode",
                value: null);

            migrationBuilder.UpdateData(
                table: "PartnerProducts",
                keyColumn: "Id",
                keyValue: new Guid("c3d4e5f6-0003-0003-0003-000000000005"),
                column: "CompanyCode",
                value: null);

            migrationBuilder.UpdateData(
                table: "PartnerProducts",
                keyColumn: "Id",
                keyValue: new Guid("c3d4e5f6-0003-0003-0003-000000000006"),
                column: "CompanyCode",
                value: null);
        }
    }
}
