namespace Tixora.Application.DTOs.Admin;

public record DelegateResponse(
    string Id,
    string PrimaryUserName,
    string DelegateUserName,
    string? ValidFrom,
    string? ValidTo,
    bool IsActive
);

public record CreateDelegateRequest(Guid PrimaryUserId, Guid DelegateUserId, DateTime? ValidFrom, DateTime? ValidTo);
