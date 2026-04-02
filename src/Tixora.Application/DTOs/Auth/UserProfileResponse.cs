// File: src/Tixora.Application/DTOs/Auth/UserProfileResponse.cs
namespace Tixora.Application.DTOs.Auth;

public record UserProfileResponse(Guid Id, string FullName, string Email, string Role);
