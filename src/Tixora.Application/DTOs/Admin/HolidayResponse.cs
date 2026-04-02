namespace Tixora.Application.DTOs.Admin;

public record HolidayResponse(string Id, string Date, string Name);

public record CreateHolidayRequest(string Date, string Name);
