// File: src/Tixora.Application/DTOs/Auth/LoginResponse.cs
namespace Tixora.Application.DTOs.Auth;

public record LoginResponse(string Token, UserProfileResponse User);
