// File: src/Tixora.Application/Interfaces/IAuthService.cs
using Tixora.Application.DTOs.Auth;

namespace Tixora.Application.Interfaces;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
}
